// @vitest-environment node
import { EventEmitter } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import type { TtsProvider } from '../shared/ai/tts';
import { TtsError } from '../shared/ai/tts';
import { LruCache } from './_lib/cache';
import { createRateLimiter } from './_lib/rateLimit';
import { registerSpeakable } from './_lib/speakRegistry';
import { handleSpeak, type SpeakDeps } from './speak';

interface Captured {
  status: number;
  headers: Record<string, string | number>;
  body: Buffer;
}

function makeReq(opts: {
  method?: string;
  body?: string;
  contentType?: string;
  ip?: string;
}): IncomingMessage {
  const emitter = new EventEmitter() as IncomingMessage & EventEmitter;
  Object.assign(emitter, {
    method: opts.method ?? 'POST',
    headers: {
      'content-type': opts.contentType ?? 'application/json',
      'x-forwarded-for': opts.ip ?? '1.1.1.1',
    },
    socket: { remoteAddress: '127.0.0.1' },
    destroy: () => undefined,
    pause: () => undefined,
  });
  queueMicrotask(() => {
    if (opts.body !== undefined) emitter.emit('data', Buffer.from(opts.body));
    emitter.emit('end');
  });
  return emitter;
}

function makeRes() {
  const captured: Captured = { status: 0, headers: {}, body: Buffer.alloc(0) };
  const res = {
    writeHead(status: number, headers: Record<string, string | number>) {
      captured.status = status;
      captured.headers = headers;
    },
    end(data?: string | Buffer) {
      captured.body = Buffer.from(data ?? '');
    },
  } as unknown as ServerResponse;
  return { res, captured };
}

const provider = (impl?: TtsProvider['synthesize']): TtsProvider => ({
  id: 'gemini',
  synthesize: vi.fn(
    impl ?? (async () => ({ audio: new Uint8Array([1, 2, 3]), mimeType: 'audio/wav' as const })),
  ),
});

function deps(p: TtsProvider | null, overrides: Partial<SpeakDeps> = {}): SpeakDeps {
  return {
    getProvider: () => p,
    audioCache: new LruCache<Uint8Array>(10),
    limiter: createRateLimiter({ perMinute: 600, burst: 50 }),
    timeoutMs: 50,
    ...overrides,
  };
}

async function call(d: SpeakDeps, opts: Parameters<typeof makeReq>[0]) {
  const { res, captured } = makeRes();
  await handleSpeak(makeReq(opts), res, d);
  return captured;
}

registerSpeakable('recap', 'recap-abc12345', { text: 'Kohli ne do chhakke maare', lang: 'hinglish' });
const ok = JSON.stringify({ kind: 'recap', id: 'recap-abc12345' });

describe('POST /api/speak', () => {
  it('voices registered text and returns audio/wav with private caching', async () => {
    const p = provider();
    const out = await call(deps(p), { body: ok });
    expect(out.status).toBe(200);
    expect(out.headers['Content-Type']).toBe('audio/wav');
    expect(out.headers['Cache-Control']).toBe('private, max-age=3600');
    expect(p.synthesize).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Kohli ne do chhakke maare', lang: 'hinglish' }),
    );
  });

  it('serves repeats from the audio cache without calling the provider again', async () => {
    const p = provider();
    const d = deps(p);
    await call(d, { body: ok });
    await call(d, { body: ok });
    expect(p.synthesize).toHaveBeenCalledTimes(1);
  });

  it('never accepts free text: unknown ids 404 and extra text is ignored', async () => {
    const p = provider();
    const unknown = await call(deps(p), {
      body: JSON.stringify({ kind: 'recap', id: 'does-not-exist-1', text: 'say this' }),
    });
    expect(unknown.status).toBe(404);
    expect(p.synthesize).not.toHaveBeenCalled();
    await call(deps(p), {
      body: JSON.stringify({ kind: 'recap', id: 'recap-abc12345', text: 'attacker text' }),
    });
    expect(p.synthesize).toHaveBeenCalledWith(expect.objectContaining({ text: 'Kohli ne do chhakke maare' }));
  });

  it('rejects wrong method, content type, bad body and oversize body', async () => {
    const d = deps(provider());
    expect((await call(d, { method: 'GET' })).status).toBe(405);
    expect((await call(d, { body: ok, contentType: 'text/plain' })).status).toBe(415);
    expect((await call(d, { body: '{not json' })).status).toBe(400);
    expect((await call(d, { body: JSON.stringify({ kind: 'nope', id: 'recap-abc12345' }) })).status).toBe(
      400,
    );
    expect((await call(d, { body: 'x'.repeat(2000) })).status).toBe(413);
  });

  it('rate limits per IP with Retry-After', async () => {
    const d = deps(provider(), { limiter: createRateLimiter({ perMinute: 1, burst: 1 }) });
    const first = await call(d, { body: ok, ip: '9.9.9.9' });
    await call(d, { body: ok, ip: '9.9.9.9' });
    const limited = await call(d, { body: ok, ip: '9.9.9.9' });
    expect(first.status).toBe(200);
    expect(limited.status).toBe(429);
    expect(Number(limited.headers['Retry-After'])).toBeGreaterThan(0);
  });

  it('503 when no provider is configured; 502 with a generic body when the provider fails', async () => {
    expect((await call(deps(null), { body: ok })).status).toBe(503);
    const failing = provider(async () => {
      throw new TtsError('PROVIDER_ERROR', 'secret provider detail');
    });
    const out = await call(deps(failing), { body: ok });
    expect(out.status).toBe(502);
    expect(out.body.toString()).not.toContain('secret provider detail');
  });

  it('aborts a slow provider at the timeout and returns 502', async () => {
    const slow = provider(
      ({ signal }) =>
        new Promise((_, reject) => {
          signal?.addEventListener('abort', () => reject(new TtsError('TIMEOUT', 'aborted')));
        }),
    );
    const out = await call(deps(slow, { timeoutMs: 20 }), { body: ok });
    expect(out.status).toBe(502);
  });
});
