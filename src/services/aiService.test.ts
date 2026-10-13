import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AI_TIMEOUT_MS, AiError, askMatch, getRecap } from './aiService';

const prefetch = vi.hoisted(() => vi.fn());
vi.mock('@/features/voice', () => ({ prefetchSpeech: prefetch }));

const recapReq = {
  matchId: 'pak-ind-2022-t20wc-mcg',
  fromSeq: 0,
  toSeq: 11,
  seqBase: 229,
  lang: 'hinglish' as const,
};
const askReq = {
  matchId: 'pak-ind-2022-t20wc-mcg',
  seq: 11,
  seqBase: 229,
  question: 'kitne run chahiye?',
  lang: 'hinglish' as const,
};
const RECAP_OK = {
  id: 'rcp_abcdefgh1234',
  lead: 'L',
  body: 'B',
  source: 'ai',
  window: { fromSeq: 9, toSeq: 9 },
};
const ASK_OK = { id: 'ans_abcdefgh1234', answer: 'A', source: 'template' };

const reply = (status: number, json: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => json,
});
const stubFetch = (impl: (url: string, init: RequestInit) => Promise<unknown>) => {
  const fn = vi.fn(impl);
  vi.stubGlobal('fetch', fn);
  return fn;
};

beforeEach(() => {
  vi.stubEnv('VITE_USE_MOCK_API', 'false');
  prefetch.mockClear();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('getRecap (real API)', () => {
  it('posts only ids, positions and language, and maps the response to the client window', async () => {
    const fetchFn = stubFetch(async () => reply(200, RECAP_OK));
    const out = await getRecap({
      ...recapReq,
      facts: [{ key: 'runs', value: 99, label: { en: 'x', hinglish: 'x', hi: 'x', gu: 'x' } }],
    });
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/recap');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual(recapReq); // no facts, no numbers from the client
    expect(out).toEqual({
      id: RECAP_OK.id,
      lead: 'L',
      body: 'B',
      source: 'ai',
      window: { fromSeq: 0, toSeq: 11 },
    });
  });

  it('pre-fetches the natural voice as soon as the recap arrives', async () => {
    stubFetch(async () => reply(200, RECAP_OK));
    await getRecap(recapReq);
    expect(prefetch).toHaveBeenCalledWith({ kind: 'recap', id: RECAP_OK.id });
  });

  it.each([
    ['429', () => reply(429, {}), 'RATE_LIMITED'],
    ['500', () => reply(500, {}), 'FAILED'],
    ['404', () => reply(404, {}), 'FAILED'],
    ['a malformed body', () => reply(200, { nope: true }), 'FAILED'],
    ['a bad id', () => reply(200, { ...RECAP_OK, id: 'x' }), 'FAILED'],
    ['an unknown source', () => reply(200, { ...RECAP_OK, source: 'magic' }), 'FAILED'],
  ])('maps %s to AiError(%s)', async (_n, make, code) => {
    stubFetch(async () => make());
    await expect(getRecap(recapReq)).rejects.toMatchObject({ name: 'AiError', code });
    expect(prefetch).not.toHaveBeenCalled();
  });

  it('maps a network failure to AiError(FAILED)', async () => {
    stubFetch(async () => Promise.reject(new TypeError('offline')));
    await expect(getRecap(recapReq)).rejects.toBeInstanceOf(AiError);
  });

  it('gives up after the client timeout', async () => {
    vi.useFakeTimers();
    stubFetch(
      (_u, init) =>
        new Promise((_, reject) =>
          init.signal?.addEventListener('abort', () => reject(new Error('aborted'))),
        ),
    );
    const p = getRecap(recapReq);
    const assertion = expect(p).rejects.toMatchObject({ code: 'FAILED' });
    await vi.advanceTimersByTimeAsync(AI_TIMEOUT_MS + 10);
    await assertion;
  });
});

describe('askMatch (real API)', () => {
  it('posts the question, never facts, and pre-fetches the answer audio', async () => {
    const fetchFn = stubFetch(async () => reply(200, ASK_OK));
    const out = await askMatch({ ...askReq, facts: [] });
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/ask');
    expect(JSON.parse(String(init.body))).toEqual(askReq);
    expect(out).toEqual(ASK_OK);
    expect(prefetch).toHaveBeenCalledWith({ kind: 'answer', id: ASK_OK.id });
  });

  it('keeps the rate-limit code the UI reads', async () => {
    stubFetch(async () => reply(429, {}));
    await expect(askMatch(askReq)).rejects.toMatchObject({ code: 'RATE_LIMITED' });
  });

  it('rejects an empty answer', async () => {
    stubFetch(async () => reply(200, { ...ASK_OK, answer: '  ' }));
    await expect(askMatch(askReq)).rejects.toMatchObject({ code: 'FAILED' });
  });
});

describe('mock mode (VITE_USE_MOCK_API=true)', () => {
  beforeEach(() => vi.stubEnv('VITE_USE_MOCK_API', 'true'));

  it('never touches the network or the voice endpoint', async () => {
    const fetchFn = stubFetch(async () => reply(200, {}));
    const out = await getRecap({ ...recapReq, facts: [] });
    expect(out.lead.length).toBeGreaterThan(0);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(prefetch).not.toHaveBeenCalled();
  });

  it('answers rule questions from the rulebook in the mock too', async () => {
    const out = await askMatch({ ...askReq, question: 'free hit kya hota hai', facts: [] });
    expect(out.answer).toMatch(/Free hit/);
    expect(out.source).toBe('template');
  });
});
