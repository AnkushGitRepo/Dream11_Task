// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { TranscribeError, type Transcriber } from '../shared/ai/transcribe.js';
import { createDailyBudget } from './_lib/dailyBudget.js';
import { createRateLimiter } from './_lib/rateLimit.js';
import { callHandler } from './_lib/testHttp.js';
import { handleTranscribe, type TranscribeDeps } from './transcribe.js';

const AUDIO = Buffer.from('x'.repeat(2000)).toString('base64');

const transcriber = (impl?: Transcriber['transcribe']) => ({
  id: 'gemini' as const,
  transcribe: vi.fn(impl ?? (async () => 'what is the score')),
});

const deps = (t: Transcriber | null, over: Partial<TranscribeDeps> = {}): TranscribeDeps => ({
  getTranscriber: () => t,
  limiter: createRateLimiter({ perMinute: 600, burst: 100 }),
  budget: createDailyBudget({ limit: 100 }),
  timeoutMs: 100,
  ...over,
});

const body = (o: Record<string, unknown> = {}) =>
  JSON.stringify({ lang: 'en', mimeType: 'audio/webm;codecs=opus', durationMs: 3000, audio: AUDIO, ...o });

const call = (d: TranscribeDeps, opts: Parameters<typeof callHandler>[2] = { body: body() }) =>
  callHandler(handleTranscribe, d, opts);

describe('POST /api/transcribe', () => {
  it('returns the transcript and strips codec parameters from the mime type', async () => {
    const t = transcriber();
    const r = await call(deps(t));
    expect(r.status).toBe(200);
    expect(r.json).toEqual({ text: 'what is the score', source: 'ai' });
    expect(r.headers['Cache-Control']).toBe('no-store');
    expect(t.transcribe).toHaveBeenCalledWith(
      expect.objectContaining({ mimeType: 'audio/webm', lang: 'en', audioBase64: AUDIO }),
    );
  });

  it('answers 200 with empty text when nothing intelligible was said', async () => {
    const r = await call(deps(transcriber(async () => '')));
    expect(r.status).toBe(200);
    expect(r.json).toEqual({ text: '', source: 'ai' });
  });

  it.each([
    ['unknown language', body({ lang: 'fr' })],
    ['non-audio mime type', body({ mimeType: 'text/html' })],
    ['over 15 seconds', body({ durationMs: 15_001 })],
    ['zero duration', body({ durationMs: 0 })],
    ['not base64', body({ audio: `${'!'.repeat(200)}` })],
    ['missing audio', JSON.stringify({ lang: 'en', mimeType: 'audio/webm', durationMs: 1000 })],
    ['not json', '{nope'],
  ])('400 for %s, without calling the model', async (_name, payload) => {
    const t = transcriber();
    expect((await call(deps(t), { body: payload })).status).toBe(400);
    expect(t.transcribe).not.toHaveBeenCalled();
  });

  it('413 over the 1.5 MB body cap, 405 for GET, 415 for a wrong content type', async () => {
    const t = transcriber();
    const huge = JSON.stringify({ pad: 'x'.repeat(1.6 * 1024 * 1024) });
    expect((await call(deps(t), { body: huge })).status).toBe(413);
    expect((await call(deps(t), { method: 'GET' })).status).toBe(405);
    expect((await call(deps(t), { body: body(), contentType: 'text/plain' })).status).toBe(415);
    expect(t.transcribe).not.toHaveBeenCalled();
  });

  it('shares the rate limiter and enforces the daily budget', async () => {
    const limited = deps(transcriber(), { limiter: createRateLimiter({ perMinute: 1, burst: 1 }) });
    expect((await call(limited, { body: body(), ip: '8.8.8.8' })).status).toBe(200);
    const second = await call(limited, { body: body(), ip: '8.8.8.8' });
    expect(second.status).toBe(429);
    expect(Number(second.headers['Retry-After'])).toBeGreaterThan(0);

    const t = transcriber();
    const capped = deps(t, { budget: createDailyBudget({ limit: 1 }) });
    expect((await call(capped)).status).toBe(200);
    const over = await call(capped, { body: body(), ip: '7.7.7.7' });
    expect(over.status).toBe(429);
    expect(t.transcribe).toHaveBeenCalledTimes(1);
  });

  it('503 without a provider; 502 with a generic body when the provider fails', async () => {
    expect((await call(deps(null))).status).toBe(503);
    const failing = transcriber(async () => {
      throw new TranscribeError('PROVIDER_ERROR', 'secret provider detail');
    });
    const r = await call(deps(failing));
    expect(r.status).toBe(502);
    expect(JSON.stringify(r.json)).not.toContain('secret provider detail');
  });

  it('aborts a slow provider at the timeout and answers 502', async () => {
    const slow = transcriber(
      ({ signal }) =>
        new Promise((_, reject) => {
          signal?.addEventListener('abort', () => reject(new TranscribeError('TIMEOUT', 'aborted')));
        }),
    );
    expect((await call(deps(slow, { timeoutMs: 20 }))).status).toBe(502);
  });
});
