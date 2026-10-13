import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLearnMoment, ruleFor } from './learnService';

const req = { matchId: 'pak-ind-2022-t20wc-mcg', seq: 247, ruleId: 'free-hit', lang: 'en' as const };

afterEach(() => vi.unstubAllGlobals());

const respond = (body: unknown, ok = true) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok, json: async () => body })),
  );

describe('fetchLearnMoment', () => {
  it('posts only ids and the language, and returns a valid moment', async () => {
    respond({ id: 'abcdefgh12345678', title: 't', short: 's', moment: 'M', speak: 'S', source: 'ai' });
    await expect(fetchLearnMoment(req)).resolves.toEqual({
      id: 'abcdefgh12345678',
      moment: 'M',
      speak: 'S',
      source: 'ai',
    });
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/learn');
    expect(JSON.parse(String(init.body))).toEqual({
      matchId: req.matchId,
      seq: 247,
      ruleId: 'free-hit',
      lang: 'en',
    });
  });

  it.each([
    ['non-ok status', { id: 'abcdefgh12345678', moment: 'M', speak: 'S', source: 'ai' }, false],
    ['bad id', { id: 'x', moment: 'M', speak: 'S', source: 'ai' }, true],
    ['empty moment', { id: 'abcdefgh12345678', moment: ' ', speak: 'S', source: 'ai' }, true],
    ['unknown source', { id: 'abcdefgh12345678', moment: 'M', speak: 'S', source: 'x' }, true],
    ['not an object', 'nope', true],
  ])('returns null for %s', async (_n, body, ok) => {
    respond(body, ok);
    await expect(fetchLearnMoment(req)).resolves.toBeNull();
  });

  it('returns null when the network fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('offline'))),
    );
    await expect(fetchLearnMoment(req)).resolves.toBeNull();
  });
});

describe('ruleFor', () => {
  it('reads the bundled rulebook', () => {
    expect(ruleFor('cricket', 'free-hit')?.term.en).toBe('Free hit');
    expect(ruleFor('cricket', 'nope')).toBeNull();
  });
});
