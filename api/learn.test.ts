// @vitest-environment node
import { EventEmitter } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import type { TextProvider } from '../shared/ai/provider';
import { getRule } from '../shared/sports/rules';
import { LruCache } from './_lib/cache';
import { loadTimeline } from './_lib/matchStore';
import { createRateLimiter } from './_lib/rateLimit';
import { lookupSpeakable } from './_lib/speakRegistry';
import { handleLearn, type LearnDeps, type LearnResponse } from './learn';

const MATCH = 'pak-ind-2022-t20wc-mcg';
const FREE_HIT_BYE_SEQ = 247; // 19.4: bowled on a free hit, 3 byes
const NO_BALL_SEQ = 245;
const ORDINARY_SEQ = 20;

interface Captured {
  status: number;
  headers: Record<string, string | number>;
  body: string;
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
      'x-forwarded-for': opts.ip ?? '2.2.2.2',
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
  const captured: Captured = { status: 0, headers: {}, body: '' };
  const res = {
    writeHead(status: number, headers: Record<string, string | number>) {
      captured.status = status;
      captured.headers = headers;
    },
    end(data?: string | Buffer) {
      captured.body = Buffer.from(data ?? '').toString('utf8');
    },
  } as unknown as ServerResponse;
  return { res, captured };
}

const provider = (reply: string | Error): TextProvider => ({
  id: 'gemini',
  generate: vi.fn(async () => {
    if (reply instanceof Error) throw reply;
    return reply;
  }),
});

const makeDeps = (over: Partial<LearnDeps> = {}): LearnDeps => ({
  getProvider: () => null,
  loadTimeline,
  cache: new LruCache<LearnResponse>(20),
  limiter: createRateLimiter({ perMinute: 600, burst: 100 }),
  timeoutMs: 500,
  ...over,
});

const body = (o: Record<string, unknown> = {}) =>
  JSON.stringify({
    matchId: MATCH,
    seq: FREE_HIT_BYE_SEQ,
    ruleId: 'free-hit-bowled-not-out',
    lang: 'en',
    ...o,
  });

async function call(deps: LearnDeps, opts: Parameters<typeof makeReq>[0] = { body: body() }) {
  const { res, captured } = makeRes();
  await handleLearn(makeReq(opts), res, deps);
  const json = captured.body ? (JSON.parse(captured.body) as Record<string, unknown>) : {};
  return { ...captured, json };
}

describe('POST /api/learn: request validation', () => {
  it('405 for non-POST', async () => {
    const r = await call(makeDeps(), { method: 'GET' });
    expect(r.status).toBe(405);
    expect(r.headers.Allow).toBe('POST');
  });

  it('415 for a non-JSON content type', async () => {
    expect((await call(makeDeps(), { body: body(), contentType: 'text/plain' })).status).toBe(415);
  });

  it.each([
    ['not json', 'nope'],
    ['missing lang', JSON.stringify({ matchId: MATCH, seq: 1, ruleId: 'free-hit' })],
    ['bad lang', body({ lang: 'fr' })],
    ['negative seq', body({ seq: -1 })],
    ['fractional seq', body({ seq: 1.5 })],
    ['string seq', body({ seq: '1' })],
    ['path traversal match id', body({ matchId: '../index' })],
    ['uppercase rule id', body({ ruleId: 'FREE_HIT' })],
  ])('400 for %s', async (_name, payload) => {
    const r = await call(makeDeps(), { body: payload });
    expect(r.status).toBe(400);
    expect(r.json.code).toBe('BAD_REQUEST');
  });

  it('413 when the body is over the cap', async () => {
    const r = await call(makeDeps(), { body: body({ pad: 'x'.repeat(1000) }) });
    expect(r.status).toBe(413);
  });

  it('429 with Retry-After once the limiter is empty', async () => {
    const limiter = createRateLimiter({ perMinute: 1, burst: 1 });
    const deps = makeDeps({ limiter });
    expect((await call(deps)).status).toBe(200);
    const r = await call(deps);
    expect(r.status).toBe(429);
    expect(Number(r.headers['Retry-After'])).toBeGreaterThan(0);
  });
});

describe('POST /api/learn: not found', () => {
  it('404 for an unknown match', async () => {
    expect((await call(makeDeps(), { body: body({ matchId: 'no-such-match' }) })).status).toBe(404);
  });

  it('404 for an unknown rule', async () => {
    expect((await call(makeDeps(), { body: body({ ruleId: 'offside' }) })).status).toBe(404);
  });

  it('404 when the rule is not teachable at that moment', async () => {
    const r = await call(makeDeps(), { body: body({ seq: ORDINARY_SEQ, ruleId: 'free-hit' }) });
    expect(r.status).toBe(404);
  });

  it('404 for a seq past the end of the match', async () => {
    expect((await call(makeDeps(), { body: body({ seq: 99999 }) })).status).toBe(404);
  });
});

describe('POST /api/learn: success', () => {
  it('without a provider: rulebook text + template moment, registered for /api/speak', async () => {
    const r = await call(makeDeps());
    expect(r.status).toBe(200);
    const rule = getRule('cricket', 'free-hit-bowled-not-out');
    const out = r.json as unknown as LearnResponse;
    expect(out.title).toBe(rule?.term.en);
    expect(out.short).toBe(rule?.short.en);
    expect(out.source).toBe('template');
    expect(out.moment).toMatch(/bowled on the free hit/i);
    expect(out.id).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(r.headers['Cache-Control']).toBe('no-store');
    expect(lookupSpeakable('learn', out.id)).toEqual({ text: out.speak, lang: 'en' });
  });

  it('copies title and short from the rulebook in every language', async () => {
    for (const lang of ['en', 'hinglish', 'hi', 'gu'] as const) {
      const out = (await call(makeDeps(), { body: body({ lang }) })).json as unknown as LearnResponse;
      const rule = getRule('cricket', 'free-hit-bowled-not-out');
      expect(out.title).toBe(rule?.term[lang]);
      expect(out.short).toBe(rule?.short[lang]);
    }
  });

  it('Hinglish: Latin moment on screen, Devanagari to the voice', async () => {
    const out = (await call(makeDeps(), { body: body({ lang: 'hinglish' }) }))
      .json as unknown as LearnResponse;
    expect(/[ऀ-ॿ]/.test(out.moment)).toBe(false);
    expect(/[ऀ-ॿ]/.test(out.speak)).toBe(true);
    expect(lookupSpeakable('learn', out.id)?.lang).toBe('hinglish');
  });

  it('uses the model sentence when its numbers are all engine numbers', async () => {
    const p = provider(
      JSON.stringify({ moment: 'Kohli was bowled, but on a free hit, so the 3 byes counted.' }),
    );
    const r = await call(makeDeps({ getProvider: () => p }));
    expect((r.json as unknown as LearnResponse).source).toBe('ai');
    expect(r.json.moment).toBe('Kohli was bowled, but on a free hit, so the 3 byes counted.');
    expect(p.generate).toHaveBeenCalledTimes(1);
  });

  it('never lets the model change the rule text', async () => {
    const p = provider(JSON.stringify({ moment: 'Fine.', short: 'HACKED', title: 'HACKED' }));
    const out = (await call(makeDeps({ getProvider: () => p }))).json as unknown as LearnResponse;
    expect(out.short).not.toMatch(/HACKED/);
    expect(out.title).not.toMatch(/HACKED/);
  });

  it('falls back to the template when the guard rejects an invented number', async () => {
    const p = provider(JSON.stringify({ moment: 'He was bowled and they ran 7 byes.' }));
    const out = (await call(makeDeps({ getProvider: () => p }))).json as unknown as LearnResponse;
    expect(out.source).toBe('template');
    expect(out.moment).not.toMatch(/\b7\b/);
  });

  it('falls back when the model fails, times out or returns junk', async () => {
    for (const reply of [
      new Error('503 upstream secret'),
      'not json at all',
      JSON.stringify({ moment: '' }),
    ]) {
      const out = (await call(makeDeps({ getProvider: () => provider(reply) })))
        .json as unknown as LearnResponse;
      expect(out.source).toBe('template');
      expect(JSON.stringify(out)).not.toMatch(/secret/);
    }
  });

  it('serves repeats from cache without calling the model again', async () => {
    const p = provider(JSON.stringify({ moment: 'Free hit, so not out.' }));
    const deps = makeDeps({ getProvider: () => p });
    await call(deps);
    const again = await call(deps);
    expect(again.status).toBe(200);
    expect(p.generate).toHaveBeenCalledTimes(1);
  });

  it('teaches the no-ball a few balls earlier at its own seq', async () => {
    const r = await call(makeDeps(), { body: body({ seq: NO_BALL_SEQ, ruleId: 'no-ball' }) });
    expect(r.status).toBe(200);
    expect(r.json.moment).toMatch(/Nawaz/);
  });
});
