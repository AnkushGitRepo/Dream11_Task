import { describe, expect, it } from 'vitest';
import type { TimelineEvent } from '../types';
import { ballData } from './ballData';
import { cricketAdapter } from './adapter';
import { normalizeCricsheet } from './normalize';
import { getCricketStateAt, getInningsStateAfter } from './position';
import { bowlerFigures } from './state';
import { innings, match, type D, type Raw } from './testRaw';

// Hand-built Cricsheet-shaped input -> normalize -> engine. Each test pins one cricket rule.

const one = (overs: D[][], info?: Raw) => normalizeCricsheet(match([innings('Alpha', overs)], info));
const dots = (n: number, extra: D = {}): D[] => Array.from({ length: n }, () => ({ ...extra }));
const data = (e: TimelineEvent) => ballData(e);

describe('normalize: ball numbering and legality', () => {
  it('a wide then a legal ball share the ball number; the wide is not legal', () => {
    const tl = one([[{ runs: 1 }, { ex: { wides: 1 } }, { runs: 0 }]]);
    expect(tl.events.map((e) => e.clock)).toEqual(['0.1', '0.1', '0.2']);
    expect(tl.events.map((e) => data(e).legal)).toEqual([true, false, true]);
    expect(tl.events.map((e) => e.kind)).toEqual(['run', 'wide', 'dot']);
    expect(tl.events.map((e) => e.seq)).toEqual([0, 1, 2]);
    const s = getInningsStateAfter(tl, 1, 3);
    expect([s.score, s.legalBalls, s.overs]).toEqual([2, 2, '0.2']);
    expect(s.scorecard.batters.find((b) => b.name === 'A Bat')).toMatchObject({ runs: 1, balls: 2 });
  });

  it('no-ball + boundary: bat runs to batter, not legal, next ball is a free hit', () => {
    const tl = one([[{ runs: 4, ex: { noballs: 1 } }, { runs: 1 }]]);
    const nb = tl.events[0] as TimelineEvent;
    expect([nb.kind, nb.tone, data(nb).legal, data(nb).runsBat, data(nb).score]).toEqual([
      'noball',
      'good',
      false,
      4,
      5,
    ]);
    expect(data(tl.events[1] as TimelineEvent).freeHit).toBe(true);
    const s = getInningsStateAfter(tl, 1, 1);
    expect(s.freeHitNext).toBe(true);
    expect(s.scorecard.batters.find((b) => b.name === 'A Bat')).toMatchObject({
      runs: 4,
      balls: 1,
      fours: 1,
    });
    expect(s.scorecard.bowlers[0]).toMatchObject({ runs: 5, legalBalls: 0 });
    expect(s.scorecard.extras).toMatchObject({ noballs: 1, total: 1 });
  });
});

describe('extras and wickets are charged correctly', () => {
  it('byes and leg-byes are team runs, not batter runs, not bowler runs', () => {
    const tl = one([[{ ex: { byes: 2 } }, { ex: { legbyes: 1 } }, { runs: 1 }]]);
    const s = getInningsStateAfter(tl, 1, 3);
    expect(s.score).toBe(4);
    expect(s.scorecard.batters.find((b) => b.name === 'A Bat')).toMatchObject({ runs: 1, balls: 3 });
    expect(s.scorecard.bowlers[0]).toMatchObject({ runs: 1, legalBalls: 3 });
    expect(s.scorecard.extras).toMatchObject({ byes: 2, legbyes: 1, total: 3 });
    expect(tl.events.map((e) => e.kind)).toEqual(['bye', 'legbye', 'run']);
  });

  it('a no-ball carrying byes charges only the no-ball to the bowler', () => {
    const tl = one([[{ ex: { noballs: 1, byes: 2 } }]]);
    const s = getInningsStateAfter(tl, 1, 1);
    expect(s.score).toBe(3);
    expect(s.scorecard.bowlers[0]).toMatchObject({ runs: 1 });
    expect(s.scorecard.extras).toMatchObject({ noballs: 1, byes: 2, total: 3 });
  });

  it('a run-out is a team wicket but never the bowler wicket', () => {
    const tl = one([
      [{ out: { who: 'B Bat', kind: 'run out', by: 'F Field' } }, { out: { who: 'A Bat', kind: 'bowled' } }],
    ]);
    const run = tl.events[0] as TimelineEvent;
    expect(run.kind).toBe('wicket');
    expect(run.tone).toBe('major');
    expect(data(run).wicket).toMatchObject({ kind: 'run out', bowlerCredited: false, fielder: 'F Field' });
    expect(run.text).toBe('WICKET! Bat run out (Field)');
    const s = getInningsStateAfter(tl, 1, 2);
    expect([s.wkts, s.scorecard.bowlers[0]?.wkts]).toEqual([2, 1]);
    expect(s.scorecard.fow.map((f) => [f.wkt, f.batter])).toEqual([
      [1, 'B Bat'],
      [2, 'A Bat'],
    ]);
  });

  it('retired hurt does not add a team wicket, a fall of wicket or a bowler wicket', () => {
    const tl = one([[{ out: { who: 'B Bat', kind: 'retired hurt' } }, { runs: 1 }]]);
    const e = tl.events[0] as TimelineEvent;
    expect(data(e).wicket).toMatchObject({ kind: 'retired hurt', bowlerCredited: false });
    expect(data(e).wkts).toBe(0);
    const s = getInningsStateAfter(tl, 1, 2);
    expect([s.wkts, s.scorecard.fow.length, s.scorecard.bowlers[0]?.wkts]).toEqual([0, 0, 0]);
    expect(s.scorecard.batters.find((b) => b.name === 'B Bat')?.out).toBe('retired hurt');
  });

  it('stumped, lbw and caught-and-bowled read naturally', () => {
    const tl = one([
      [
        { out: { who: 'A Bat', kind: 'stumped', by: 'K Keeper' } },
        { out: { who: 'C Bat', kind: 'lbw' } },
        { out: { who: 'D Bat', kind: 'caught and bowled' } },
      ],
    ]);
    expect(tl.events.map((e) => e.text)).toEqual([
      'WICKET! Bat st Keeper b Bowl',
      'WICKET! Bat lbw b Bowl',
      'WICKET! Bat c & b Bowl',
    ]);
  });
});

describe('maidens', () => {
  it('six legal dots (byes allowed) is a maiden; a wide or a run breaks it', () => {
    const maidenOver = [...dots(4), { ex: { byes: 1 } }, ...dots(1)];
    const wideOver = [{ ex: { wides: 1 } }, ...dots(6)];
    const runOver = [{ runs: 1 }, ...dots(5)];
    const tl = one([maidenOver, wideOver, runOver]);
    const s = getInningsStateAfter(tl, 1, tl.events.length);
    expect(s.scorecard.bowlers[0]).toMatchObject({ legalBalls: 18, maidens: 1, runs: 2 });
    expect(bowlerFigures(s.scorecard.bowlers[0] as never)).toBe('3-1-2-0');
  });

  it('an unfinished over is never a maiden', () => {
    const tl = one([dots(5)]);
    expect(getInningsStateAfter(tl, 1, 5).scorecard.bowlers[0]?.maidens).toBe(0);
  });
});

describe('free hit', () => {
  it('survives a wide and ends on the first legal delivery', () => {
    const tl = one([[{ ex: { noballs: 1 } }, { ex: { wides: 1 } }, {}, {}]]);
    expect(tl.events.map((e) => data(e).freeHit)).toEqual([false, true, true, false]);
    expect(getInningsStateAfter(tl, 1, 2).freeHitNext).toBe(true);
    expect(getInningsStateAfter(tl, 1, 3).freeHitNext).toBe(false);
  });

  it('carries into the next over; only run-out style dismissals count on it', () => {
    const tl = one([
      [...dots(5), { ex: { noballs: 1 } }],
      [
        { out: { who: 'A Bat', kind: 'bowled' } },
        { ex: { noballs: 1 } },
        { out: { who: 'A Bat', kind: 'caught', by: 'F Field' } },
        { out: { who: 'B Bat', kind: 'run out', by: 'F Field' } },
        { out: { who: 'A Bat', kind: 'bowled' } },
      ],
    ]);
    const e = tl.events;
    expect(data(e[6] as TimelineEvent).freeHit).toBe(true);
    expect(data(e[6] as TimelineEvent).wicket).toBeUndefined();
    expect(e[6]?.kind).toBe('dot');
    expect(data(e[6] as TimelineEvent).wkts).toBe(0);
    expect(data(e[8] as TimelineEvent).freeHit).toBe(true);
    expect(data(e[8] as TimelineEvent).wicket).toBeUndefined();
    expect(data(e[9] as TimelineEvent).wkts).toBe(1);
    expect(data(e[10] as TimelineEvent)).toMatchObject({ freeHit: false, wkts: 2 });
  });
});

describe('last-ball finish and the chase', () => {
  const chase = (lastRuns: number) =>
    normalizeCricsheet(
      match(
        [
          innings('Alpha', [[{ runs: 4 }, { runs: 4 }, ...dots(4)]]),
          innings('Beta', [[...dots(5), { runs: lastRuns }]], { target: { overs: 1, runs: 9 } }),
        ],
        { overs: 1, outcome: { winner: 'Beta', by: { wickets: 10 } } },
      ),
    );

  it('target comes from the raw data; result from meta; finished on the last ball', () => {
    const tl = chase(4);
    expect(tl.events.filter((e) => e.period === 2).every((e) => data(e).target === 9)).toBe(true);
    const before = getCricketStateAt(tl, tl.events.length - 1);
    expect([before.need, before.ballsLeft, before.finished, before.rrr]).toEqual([9, 1, false, 54]);
    const s = getCricketStateAt(tl, tl.events.length);
    expect([s.score, s.need, s.finished, s.ballsLeft]).toEqual([4, 5, true, 0]);
    expect(s.result).toBe('Beta won by 10 wickets');
  });

  it('chase lost on the last ball: finished with no required rate', () => {
    const tl = chase(1);
    const s = getCricketStateAt(tl, tl.events.length);
    expect([s.finished, s.need, s.rrr]).toEqual([true, 8, null]);
  });
});

describe('unsupported shapes', () => {
  it('ignores a 3rd innings and super overs without throwing', () => {
    const tl = normalizeCricsheet(
      match([
        innings('Alpha', [dots(6, { runs: 1 })]),
        innings('Beta', [dots(6)], { target: { overs: 20, runs: 7 } }),
        innings('Alpha', [dots(6, { runs: 6 })], { super_over: true }),
        innings('Beta', [dots(6, { runs: 6 })]),
      ]),
    );
    expect(tl.events).toHaveLength(12);
    expect(new Set(tl.events.map((e) => e.period))).toEqual(new Set([1, 2]));
  });

  it('throws a clear error on malformed raw data', () => {
    const bad: unknown[] = [
      null,
      {},
      { info: {}, innings: [] },
      { info: { dates: ['2024-01-01'] }, innings: 'x' },
      match([{ team: 'A', overs: [{ over: 0, deliveries: [{ batter: 'a' }] }] }]),
      match([innings('A', [[{ runs: -1 }]])]),
      match([{ team: '', overs: [] }]),
    ];
    for (const raw of bad) expect(() => normalizeCricsheet(raw)).toThrow(/cricket normalize:/);
    expect(() => cricketAdapter.normalize(42)).toThrow(/cricket normalize:/);
  });
});
