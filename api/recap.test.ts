// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TextProvider } from '../shared/ai/provider.js';
import { recapTemplate } from '../shared/ai/templates.js';
import { cricketAdapter } from '../shared/sports/cricket/adapter.js';
import { LruCache } from './_lib/cache.js';
import { loadTimeline } from './_lib/matchStore.js';
import { createRateLimiter } from './_lib/rateLimit.js';
import { lookupSpeakable } from './_lib/speakRegistry.js';
import { callHandler } from './_lib/testHttp.js';
import { handleRecap, recapId, type RecapDeps, type RecapResponse } from './recap.js';

const MATCH = 'pak-ind-2022-t20wc-mcg';
const BASE = 229; // real seq of the client's seq 0 (ball 17.1)

const provider = (reply: string | Error): TextProvider & { generate: ReturnType<typeof vi.fn> } => ({
  id: 'gemini',
  generate: vi.fn(async () => {
    if (reply instanceof Error) throw reply;
    return reply;
  }),
});

const deps = (over: Partial<RecapDeps> = {}): RecapDeps => ({
  getProvider: () => null,
  loadTimeline,
  cache: new LruCache<RecapResponse>(20),
  limiter: createRateLimiter({ perMinute: 600, burst: 100 }),
  timeoutMs: 300,
  ...over,
});

const body = (o: Record<string, unknown> = {}) =>
  JSON.stringify({ matchId: MATCH, fromSeq: 0, toSeq: 11, seqBase: BASE, lang: 'en', ...o });

const call = (d: RecapDeps, opts: Parameters<typeof callHandler>[2] = { body: body() }) =>
  callHandler(handleRecap, d, opts);

const aiReply = JSON.stringify({
  lead: '26 runs came off 11 balls, with a six and 3 fours.',
  body: 'India need 22 off 7 balls at 138/4.',
  speak: 'Okay, 26 runs came off 11 balls. India need 22 runs from 7 balls.',
});

afterEach(() => vi.restoreAllMocks());

describe('POST /api/recap: validation', () => {
  it('405 / 415', async () => {
    const m = await call(deps(), { method: 'GET' });
    expect([m.status, m.headers.Allow]).toEqual([405, 'POST']);
    expect((await call(deps(), { body: body(), contentType: 'text/plain' })).status).toBe(415);
  });

  it.each([
    ['not json', 'nope'],
    ['unknown lang', body({ lang: 'fr' })],
    ['toSeq before fromSeq', body({ fromSeq: 9, toSeq: 3 })],
    ['window over 120 events', body({ fromSeq: 0, toSeq: 120, seqBase: 0 })],
    ['negative seq', body({ fromSeq: -1 })],
    ['path-like match id', body({ matchId: '../index' })],
    ['missing lang', JSON.stringify({ matchId: MATCH, fromSeq: 0, toSeq: 1 })],
  ])('400 for %s', async (_n, payload) => {
    const r = await call(deps(), { body: payload });
    expect(r.status).toBe(400);
    expect(r.json.code).toBe('BAD_REQUEST');
  });

  it('accepts exactly 120 events', async () => {
    const r = await call(deps(), { body: body({ fromSeq: 0, toSeq: 119, seqBase: 0 }) });
    expect(r.status).toBe(200);
  });

  it('413 over 1 KB', async () => {
    expect((await call(deps(), { body: body({ pad: 'x'.repeat(1100) }) })).status).toBe(413);
  });

  it('429 with Retry-After', async () => {
    const d = deps({ limiter: createRateLimiter({ perMinute: 1, burst: 1 }) });
    expect((await call(d)).status).toBe(200);
    const r = await call(d);
    expect(r.status).toBe(429);
    expect(Number(r.headers['Retry-After'])).toBeGreaterThan(0);
  });

  it('404 for an unknown match and 400 for a window outside the match', async () => {
    expect((await call(deps(), { body: body({ matchId: 'no-such-match' }) })).status).toBe(404);
    const r = await call(deps(), { body: body({ fromSeq: 10, toSeq: 40 }) }); // 229+40 > 250
    expect(r.status).toBe(400);
  });
});

describe('POST /api/recap: success', () => {
  const tl = loadTimeline(MATCH);
  const expected = tl ? recapTemplate(cricketAdapter.summarize(tl, BASE, BASE + 11), 'en') : null;

  it('without a provider: the engine template for the offset window, source "template"', async () => {
    const r = await call(deps());
    expect(r.status).toBe(200);
    const out = r.json as unknown as RecapResponse;
    expect(out.source).toBe('template');
    expect(out.lead).toBe(expected?.lead);
    expect(out.body).toBe(expected?.body);
    expect(out.window).toEqual({ fromSeq: 0, toSeq: 11 }); // client coordinates, not real seqs
    expect(out.id).toBe(recapId(MATCH, BASE, BASE + 11, 'en'));
    expect(r.headers['Cache-Control']).toBe('no-store');
    expect(Object.keys(out).sort()).toEqual(['body', 'id', 'lead', 'source', 'window']);
  });

  it('registers the spoken text under kind "recap" for /api/speak', async () => {
    const out = (await call(deps())).json as unknown as RecapResponse;
    expect(lookupSpeakable('recap', out.id)).toEqual({ text: expected?.speak, lang: 'en' });
  });

  it('Hinglish: Latin on screen, Devanagari registered for the voice', async () => {
    const r = await call(deps(), { body: body({ lang: 'hinglish' }) });
    const out = r.json as unknown as RecapResponse;
    expect(/[ऀ-ॿ]/.test(out.lead + out.body)).toBe(false);
    const spoken = lookupSpeakable('recap', out.id);
    expect(/[ऀ-ॿ]/.test(spoken?.text ?? '')).toBe(true);
    expect(spoken?.lang).toBe('hinglish');
  });

  it('uses a guarded model answer and serves repeats from cache', async () => {
    const p = provider(aiReply);
    const d = deps({ getProvider: () => p });
    const first = (await call(d)).json as unknown as RecapResponse;
    const again = (await call(d)).json as unknown as RecapResponse;
    expect(first.source).toBe('ai');
    expect(first.lead).toContain('26 runs');
    expect(again).toEqual(first);
    expect(p.generate).toHaveBeenCalledTimes(1);
  });

  it('refuses an invented number: template, and the refusal is cached', async () => {
    const p = provider(JSON.stringify({ lead: '83 runs came off 11 balls.', body: 'b 22', speak: 's 22' }));
    const d = deps({ getProvider: () => p });
    const r = (await call(d)).json as unknown as RecapResponse;
    expect(r.source).toBe('template');
    expect(r.lead).toBe(expected?.lead);
    await call(d);
    expect(p.generate).toHaveBeenCalledTimes(1);
  });

  it('a provider outage serves the template without leaking it, and is not cached', async () => {
    const p = provider(new Error('503 secret-key-123'));
    const d = deps({ getProvider: () => p });
    const r = await call(d);
    expect(r.status).toBe(200);
    expect(r.body).not.toMatch(/secret/);
    expect((r.json as unknown as RecapResponse).source).toBe('template');
    await call(d);
    expect(p.generate.mock.calls.length).toBeGreaterThanOrEqual(2); // retried on the next request
  });

  it('logs method, route, status, latency and source only', async () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    await call(deps({ getProvider: () => provider(aiReply) }));
    const line = String(spy.mock.calls.at(-1)?.[0]);
    expect(line).toMatch(/^\[api\/recap\] POST 200 \d+ms ai$/);
  });
});
