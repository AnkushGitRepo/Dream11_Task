import { describe, expect, it } from 'vitest';
import { adapters, getAdapter } from '../registry.js';
import { footballAdapter, type FootballFeed } from './adapter.js';

const feed: FootballFeed = {
  match: {
    id: 'aaa-bbb-2026-01-01',
    date: '2026-01-01',
    venue: 'Test Stadium',
    home: { code: 'AAA', name: 'Alpha FC' },
    away: { code: 'BBB', name: 'Beta FC' },
  },
  events: [
    { minute: 12, type: 'shot', team: 'home', player: 'Ten' },
    { minute: 23, type: 'goal', team: 'home', player: 'Ten' },
    { minute: 40, type: 'yellow', team: 'away', player: 'Back' },
    { minute: 55, type: 'goal', team: 'away', player: 'Nine' },
    { minute: 61, type: 'red', team: 'home', player: 'Mid' },
    { minute: 77, type: 'goal', team: 'away', player: 'Nine' },
  ],
};
const tl = footballAdapter.normalize(feed);

describe('football adapter (stub)', () => {
  it('normalizes goals as major events with running tallies', () => {
    expect(tl.events).toHaveLength(6);
    expect(tl.events.map((e) => e.seq)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(tl.events[1]).toMatchObject({ kind: 'goal', tone: 'major', clock: "23'", period: 1 });
    expect(tl.events[3]).toMatchObject({ period: 2, text: 'GOAL! Nine (BBB)' });
    expect(tl.meta).toMatchObject({ sport: 'football', title: 'Alpha FC vs Beta FC' });
  });

  it('getState: score, minute and cards after an event; seq -1 is kick-off', () => {
    const s = footballAdapter.getState(tl, 4);
    expect([s.home.goals, s.away.goals, s.minute, s.home.red, s.away.yellow]).toEqual([1, 1, 61, 1, 1]);
    expect(footballAdapter.getState(tl, -1)).toMatchObject({ minute: 0, home: { goals: 0 } });
  });

  it('summarize counts goals, shots and cards in the inclusive window', () => {
    const f = footballAdapter.summarize(tl, 0, 4);
    const get = (k: string) => f.items.find((i) => i.key === k)?.value;
    expect([get('goals'), get('shots'), get('cards'), get('score')]).toEqual([2, 1, 2, '1-1']);
    expect(f.highlights).toEqual(["GOAL! Ten (AAA) at 23'", "GOAL! Nine (BBB) at 55'"]);
    expect(f.numbers).toEqual(expect.arrayContaining([1, 2, 23, 55]));
  });

  it('isMeaningfulGap is false below 5 events', () => {
    expect(footballAdapter.isMeaningfulGap(tl, 0, 3)).toBe(false);
    expect(footballAdapter.isMeaningfulGap(tl, 0, 4)).toBe(true);
  });

  it('askContext and suggestedQuestions work', () => {
    expect(footballAdapter.askContext(tl, 5).items[0]?.value).toBe('1-2');
    for (const lang of ['en', 'hinglish', 'hi', 'gu'] as const) {
      expect(footballAdapter.suggestedQuestions(lang, footballAdapter.getState(tl, 0))).toHaveLength(4);
    }
  });

  it('rejects malformed feeds', () => {
    expect(() => footballAdapter.normalize({})).toThrow(/football normalize/);
    expect(() =>
      footballAdapter.normalize({ ...feed, events: [{ minute: 1, type: 'x', team: 'home' }] }),
    ).toThrow();
  });

  it('teaches cards and nothing else in the stub feed', () => {
    const tl = footballAdapter.normalize(feed);
    const ids = tl.events.map((e) => footballAdapter.teachables(tl, e.seq));
    expect(ids.flat().every((id) => id === 'yellow-card' || id === 'red-card')).toBe(true);
    expect(footballAdapter.teachables(tl, 9999)).toEqual([]);
  });

  it('registry exposes both adapters', () => {
    expect(adapters.football).toBe(footballAdapter);
    expect(getAdapter('cricket')?.id).toBe('cricket');
    expect(getAdapter('football')?.id).toBe('football');
    expect(getAdapter('kabaddi')).toBeNull();
  });
});
