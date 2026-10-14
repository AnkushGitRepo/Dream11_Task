import { describe, expect, it } from 'vitest';
import type { Facts, Lang, MatchTimeline } from '../types.js';
import { cricketAdapter } from './adapter.js';
import { clockToLegalBalls, shortName } from './format.js';
import { numbersInText } from './numbers.js';
import { getCricketStateAt, inningsStartPosition, matchMarkers, positionAtClock } from './position.js';
import { windowFactsAt } from './facts.js';

const files = import.meta.glob(
  ['../../../data/matches/pak-ind-2022-t20wc-mcg.json', '../../../data/matches/ind-sa-2024-t20wc-final.json'],
  { eager: true, import: 'default' },
) as Record<string, MatchTimeline>;
const byId = Object.fromEntries(Object.values(files).map((tl) => [tl.meta.id, tl]));
const pakInd = byId['pak-ind-2022-t20wc-mcg'] as MatchTimeline;
const final = byId['ind-sa-2024-t20wc-final'] as MatchTimeline;
const LANGS: Lang[] = ['en', 'hinglish', 'hi', 'gu'];

/** Every numeric token a reader could see in the facts (values, labels in all languages, highlights). */
function visibleNumbers(f: Facts): number[] {
  const texts = [...f.highlights];
  for (const item of f.items) {
    texts.push(String(item.value));
    for (const lang of LANGS) texts.push(item.label[lang]);
  }
  return texts.flatMap(numbersInText);
}

describe('summarize: numbers allow-list', () => {
  const windows: [string, MatchTimeline, number, number][] = [
    ['first over', pakInd, 0, 5],
    ['single ball', pakInd, 10, 10],
    ['wicket + aftermath', pakInd, 120, 140],
    ['across the innings break', pakInd, 120, 135],
    ['last three overs of the chase', pakInd, 229, 250],
    ['whole match', final, 0, 250],
    ['final over of the final', final, 235, 250],
    ['powerplay of the chase', final, 127, 163],
  ];
  for (const [name, tl, from, to] of windows) {
    it(`${name}: every visible number is in numbers[]`, () => {
      const f = cricketAdapter.summarize(tl, from, to);
      const allowed = new Set(f.numbers);
      const missing = visibleNumbers(f).filter((n) => !allowed.has(n));
      expect(missing).toEqual([]);
      expect(f.items.length).toBeGreaterThan(3);
      expect(f.window.fromSeq).toBe(from);
      expect(f.window.toSeq).toBe(to);
    });
  }

  it('last three overs: runs, wickets, highlights and over decimals', () => {
    const f = cricketAdapter.summarize(pakInd, 229, 250);
    const get = (k: string) => f.items.find((i) => i.key === k)?.value;
    expect([get('balls'), get('runs'), get('wkts'), get('score')]).toEqual([18, 48, 2, '160/6']);
    expect(f.highlights.some((h) => h.startsWith('Pandya c Babar b Nawaz 40 (37), 144/5 at 19.1'))).toBe(
      true,
    );
    expect(f.highlights).toContain('India won by 4 wickets');
    expect(f.numbers).toEqual(expect.arrayContaining([19.1, 112, 144, 160, 48, 18, 40, 37]));
    expect(f.items.find((i) => i.key === 'batter:Kohli')?.value).toBe(
      f.items.find((i) => i.key === 'batter:Kohli')?.value,
    );
  });

  it('batters and bowlers in the window use window-only figures', () => {
    const f = cricketAdapter.summarize(pakInd, 229, 250);
    const kohli = f.items.find((i) => i.key === 'batter:Kohli');
    expect(kohli?.label.en).toBe('Kohli scored 36 off 11 balls');
    const nawaz = f.items.find((i) => i.key === 'bowler:Nawaz');
    expect(nawaz?.value).toBe('Nawaz: 1-0-13-2');
  });

  it('clamps out-of-range windows and handles an empty timeline', () => {
    const f = cricketAdapter.summarize(pakInd, -5, 9999);
    expect([f.window.fromSeq, f.window.toSeq]).toEqual([0, 250]);
    const empty = cricketAdapter.summarize({ meta: pakInd.meta, events: [] }, 0, 3);
    expect(empty.items).toEqual([]);
  });
});

describe('askContext', () => {
  it('19.0 scorecard facts and numbers', () => {
    const seq = positionAtClock(pakInd, 2, '19.0') - 1;
    const f = cricketAdapter.askContext(pakInd, seq);
    const get = (k: string) => f.items.find((i) => i.key === k);
    expect(get('score')?.value).toBe('144/4');
    expect(get('target')?.value).toBe(160);
    expect(get('card:bat:Kohli')?.label.en).toBe('Kohli 74 (50) not out');
    expect(get('card:bowl:Nawaz')?.value).toBe('3-0-29-0');
    expect(get('card:bowl:Rauf')?.value).toBe('4-0-36-2');
    expect(get('firstInnings')?.label.en).toBe('PAK 159/8 in 20.0 overs');
    expect(get('fow')?.label.en).toContain('4-');
    const allowed = new Set(f.numbers);
    expect(visibleNumbers(f).filter((n) => !allowed.has(n))).toEqual([]);
    expect(allowed.has(16) && allowed.has(113) && allowed.has(7.58)).toBe(true);
  });

  it('works before the first ball and at the end', () => {
    expect(cricketAdapter.askContext(final, -1).items.length).toBeGreaterThan(0);
    const end = cricketAdapter.askContext(final, 250);
    expect(end.highlights).toContain('India won by 7 runs');
    const allowed = new Set(end.numbers);
    expect(visibleNumbers(end).filter((n) => !allowed.has(n))).toEqual([]);
  });
});

describe('getState / isMeaningfulGap', () => {
  it('seq -1 is the start; seq n is the state after event n', () => {
    const start = cricketAdapter.getState(pakInd, -1);
    expect([start.period, start.score, start.legalBalls]).toEqual([1, 0, 0]);
    const s = cricketAdapter.getState(pakInd, 1);
    expect(s).toEqual(getCricketStateAt(pakInd, 2));
  });

  it('needs at least 6 legal balls (inclusive window)', () => {
    // seq 0..5 in the PAK-IND innings 1: contains a wicket on ball 2 (seq 8 is 1.1); check by count.
    const legalIn = (a: number, b: number) =>
      pakInd.events.slice(a, b + 1).filter((e) => e.data.legal === true).length;
    let end = 0;
    while (legalIn(0, end) < 6) end += 1;
    expect(cricketAdapter.isMeaningfulGap(pakInd, 0, end)).toBe(true);
    expect(cricketAdapter.isMeaningfulGap(pakInd, 0, end - 1)).toBe(false);
    expect(cricketAdapter.isMeaningfulGap(pakInd, 0, 2)).toBe(false);
    expect(cricketAdapter.isMeaningfulGap(pakInd, 100, 99)).toBe(false);
  });
});

describe('suggestedQuestions', () => {
  const stateAtClock = (clock: string) => getCricketStateAt(pakInd, positionAtClock(pakInd, 2, clock));
  const cases: [string, ReturnType<typeof stateAtClock>][] = [
    ['chase', stateAtClock('17.0')],
    ['first innings', getCricketStateAt(pakInd, 40)],
    ['wicket just fell', getCricketStateAt(pakInd, 8)],
    [
      'free hit next',
      getCricketStateAt(
        pakInd,
        pakInd.events.findIndex((e) => e.data.freeHit === true),
      ),
    ],
    ['finished', getCricketStateAt(pakInd, pakInd.events.length)],
  ];
  for (const [name, state] of cases) {
    it(`${name}: exactly 4 distinct non-empty questions in every language`, () => {
      for (const lang of LANGS) {
        const q = cricketAdapter.suggestedQuestions(lang, state);
        expect(q).toHaveLength(4);
        expect(new Set(q).size).toBe(4);
        expect(q.every((x) => x.trim().length > 0)).toBe(true);
      }
    });
  }

  it('is context aware', () => {
    const en = (s: (typeof cases)[number][1]) => cricketAdapter.suggestedQuestions('en', s);
    expect(en(cases[0]![1])).toContain('How many runs are needed?');
    expect(en(cases[1]![1])).toContain('What is the current run rate?');
    expect(en(cases[2]![1])[0]).toBe('Who got out and how?');
    expect(en(cases[4]![1])).toContain('Who won and how?');
    const fh = pakInd.events.findIndex((e) => e.data.freeHit === true);
    expect(en(getCricketStateAt(pakInd, fh))).toContain('What is a free hit?');
  });
});

describe('innings helpers', () => {
  it('positionAtClock: 17.0 of the chase is 102 legal balls and equals defaultStartSeq', () => {
    expect(clockToLegalBalls('17.0')).toBe(102);
    const p = positionAtClock(pakInd, 2, '17.0');
    expect(p).toBe(229);
    expect(getCricketStateAt(pakInd, p)).toMatchObject({ score: 112, wkts: 4, overs: '17.0', need: 48 });
    expect(positionAtClock(pakInd, 2, '0.0')).toBe(inningsStartPosition(pakInd, 2));
    expect(positionAtClock(pakInd, 2, '20.0')).toBe(pakInd.events.length);
    expect(() => positionAtClock(pakInd, 2, 'x')).toThrow();
  });

  it('getCricketStateAt switches innings at the boundary and resets counts', () => {
    const start2 = inningsStartPosition(pakInd, 2);
    expect(start2).toBe(126);
    const before = getCricketStateAt(pakInd, start2 - 1);
    const at = getCricketStateAt(pakInd, start2);
    expect([before.period, before.battingTeam, before.target]).toEqual([1, 'PAK', null]);
    expect([at.period, at.battingTeam, at.score, at.wkts, at.target, at.need]).toEqual([
      2,
      'IND',
      0,
      0,
      160,
      160,
    ]);
    expect(at.recent).toHaveLength(0);
  });

  it('matchMarkers', () => {
    const m = matchMarkers(pakInd);
    expect(m.innings).toEqual([
      { period: 1, startPosition: 0, team: 'PAK' },
      { period: 2, startPosition: 126, team: 'IND' },
    ]);
    expect(m.lastOversStart).toBe(229);
    expect(m.wickets).toHaveLength(14);
    expect(m.wickets.every((p) => p > 0 && p <= pakInd.events.length)).toBe(true);
    expect(matchMarkers(final).wickets).toHaveLength(15);
  });

  it('windowFactsAt gives the chase need shift within one innings only', () => {
    const inside = windowFactsAt(pakInd, 229, 251).find((f) => f.key === 'need');
    expect(inside?.label.en).toBe('Need 48 off 18 → 0 off 0');
    expect(windowFactsAt(pakInd, 120, 135).find((f) => f.key === 'need')).toBeUndefined();
  });

  it('shortName handles particles and known display names', () => {
    expect(shortName('Q de Kock')).toBe('de Kock');
    expect(shortName('Mohammad Nawaz')).toBe('Nawaz');
    expect(shortName('Babar Azam')).toBe('Babar');
    expect(shortName('SA Yadav')).toBe('Suryakumar');
  });
});
