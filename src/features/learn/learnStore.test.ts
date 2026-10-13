import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const KEY = 'kya-hua:learn:v1';

async function freshStore() {
  vi.resetModules();
  return import('./learnStore');
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('learnStore', () => {
  it('starts off with nothing learned', async () => {
    const s = await freshStore();
    expect(s.getLearnState()).toEqual({ on: false, learned: [], introSeen: false });
  });

  it('persists on/off and learned rules, and restores them', async () => {
    const s = await freshStore();
    s.setLearnOn(true);
    s.markLearned('cricket', 'free-hit');
    s.markLearned('cricket', 'free-hit'); // idempotent
    expect(s.isLearned('cricket', 'free-hit')).toBe(true);
    expect(s.isLearned('football', 'free-hit')).toBe(false);
    const again = await freshStore();
    expect(again.getLearnState().on).toBe(true);
    expect(again.getLearnState().learned).toEqual(['cricket:free-hit']);
  });

  it('notifies subscribers', async () => {
    const s = await freshStore();
    const fn = vi.fn();
    const off = s.subscribeLearn(fn);
    s.setLearnOn(true);
    expect(fn).toHaveBeenCalledTimes(1);
    off();
    s.setLearnOn(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('survives corrupt storage', async () => {
    localStorage.setItem(KEY, '{not json');
    const s = await freshStore();
    expect(s.getLearnState().on).toBe(false);
    localStorage.setItem(KEY, JSON.stringify({ on: 'yes', learned: [1, 'cricket:wide', null] }));
    const t = await freshStore();
    expect(t.getLearnState()).toEqual({ on: false, learned: ['cricket:wide'], introSeen: false });
  });

  it('keeps working in memory when storage throws', async () => {
    const s = await freshStore();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => s.markLearned('cricket', 'wide')).not.toThrow();
    expect(s.isLearned('cricket', 'wide')).toBe(true);
  });

  it('survives storage that throws on read', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const s = await freshStore();
    expect(s.getLearnState().learned).toEqual([]);
  });
});
