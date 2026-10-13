import { describe, expect, it } from 'vitest';
import type { MatchTimeline } from '../types';
import { getCricketStateAt, getInningsStateAfter, inningsStartPosition, positionAtClock } from './position';
import { bowlerFigures, shortName } from './state';

// The fixture is produced by scripts/golden-checkpoints.mjs straight from the raw Cricsheet files
// with an independent scorer (no shared/ imports). Here the ENGINE must reproduce every number.

interface Checkpoint {
  label: string;
  afterDelivery: number;
  score: number;
  wkts: number;
  overs: string;
  legalBalls: number;
  batters: Record<string, [number, number]>;
  bowlers: Record<string, string>;
  extras: number;
  crr: number | null;
  target: number | null;
  need: number | null;
  ballsLeft: number | null;
  rrr: number | null;
  partnership: { runs: number; balls: number };
}
type Fixtures = Record<
  string,
  { cricsheetId: string; innings: { period: number; checkpoints: Checkpoint[] }[] }
>;

const fixtures = Object.values(
  import.meta.glob('./golden.fixtures.json', { eager: true, import: 'default' }),
)[0] as Fixtures;
const files = import.meta.glob(
  ['../../../data/matches/pak-ind-2022-t20wc-mcg.json', '../../../data/matches/ind-sa-2024-t20wc-final.json'],
  { eager: true, import: 'default' },
) as Record<string, MatchTimeline>;
const timelines: Record<string, MatchTimeline> = Object.fromEntries(
  Object.entries(files).map(([path, tl]) => [tl.meta.id ?? path, tl]),
);

describe('golden checkpoints: engine vs independent raw scorer', () => {
  for (const [slug, fx] of Object.entries(fixtures)) {
    const tl = timelines[slug];
    it(`${slug}: timeline present`, () => {
      expect(tl).toBeDefined();
    });
    if (!tl) continue;
    for (const inn of fx.innings) {
      for (const c of inn.checkpoints) {
        it(`${slug} inn ${inn.period} @ ${c.label}`, () => {
          const s = getInningsStateAfter(tl, inn.period, c.afterDelivery);
          expect(s.period).toBe(inn.period);
          const pos = inningsStartPosition(tl, inn.period) + c.afterDelivery;
          if (pos < tl.events.length && (tl.events[pos]?.period ?? inn.period) === inn.period) {
            expect(getCricketStateAt(tl, pos)).toEqual(s);
          }
          expect([s.score, s.wkts, s.overs, s.legalBalls]).toEqual([c.score, c.wkts, c.overs, c.legalBalls]);
          expect(s.scorecard.extras.total).toBe(c.extras);
          expect(s.crr).toBe(c.crr);
          expect(s.target).toBe(c.target);
          expect(s.partnership).toEqual(c.partnership);
          if (c.target !== null) {
            expect([s.need, s.ballsLeft, s.rrr]).toEqual([c.need, c.ballsLeft, c.rrr]);
          }
          const bats = Object.fromEntries(
            s.scorecard.batters
              .filter((b) => b.balls > 0 || b.runs > 0)
              .map((b) => [b.name, [b.runs, b.balls]]),
          );
          expect(bats).toEqual(c.batters);
          const bowls = Object.fromEntries(s.scorecard.bowlers.map((b) => [b.name, bowlerFigures(b)]));
          expect(bowls).toEqual(c.bowlers);
        });
      }
    }
  }
});

describe('STATE.md hand-checked checkpoints (1298150, India chase)', () => {
  const tl = timelines['pak-ind-2022-t20wc-mcg'] as MatchTimeline;
  const batter = (s: ReturnType<typeof getCricketStateAt>, name: string) =>
    s.scorecard.batters.find((b) => b.name === name);

  it('19.0: 144/4, need 16 off 6, Kohli 74 (50), Pandya 40 (36), partnership 113', () => {
    const s = getCricketStateAt(tl, positionAtClock(tl, 2, '19.0'));
    expect([s.score, s.wkts, s.need, s.ballsLeft, s.target]).toEqual([144, 4, 16, 6, 160]);
    expect(s.partnership.runs).toBe(113);
    expect([batter(s, 'V Kohli')?.runs, batter(s, 'V Kohli')?.balls]).toEqual([74, 50]);
    expect([batter(s, 'HH Pandya')?.runs, batter(s, 'HH Pandya')?.balls]).toEqual([40, 36]);
    const fig = Object.fromEntries(s.scorecard.bowlers.map((b) => [shortName(b.name), bowlerFigures(b)]));
    expect(fig.Nawaz).toBe('3-0-29-0');
    expect(fig.Rauf).toBe('4-0-36-2');
  });

  it('final: 160/6, Kohli 82* (53), India won by 4 wickets', () => {
    const s = getCricketStateAt(tl, tl.events.length);
    expect([s.score, s.wkts, s.finished]).toEqual([160, 6, true]);
    expect([batter(s, 'V Kohli')?.runs, batter(s, 'V Kohli')?.balls]).toEqual([82, 53]);
    expect(batter(s, 'V Kohli')?.out).toBeUndefined();
    expect(s.result).toBe('India won by 4 wickets');
  });

  it('first innings finished 159/8', () => {
    const s = getCricketStateAt(tl, inningsStartPosition(tl, 2));
    expect(s.period).toBe(2);
    expect([s.score, s.wkts, s.target]).toEqual([0, 0, 160]);
    const first = getInningsStateAfter(tl, 1, 999);
    expect([first.score, first.wkts]).toEqual([159, 8]);
  });
});

describe('1415755 final (IND 176/7, SA 169/8, India won by 7 runs)', () => {
  const tl = timelines['ind-sa-2024-t20wc-final'] as MatchTimeline;
  it('totals, target and result', () => {
    const end1 = getInningsStateAfter(tl, 1, 999);
    expect([end1.score, end1.wkts]).toEqual([176, 7]);
    const end = getCricketStateAt(tl, tl.events.length);
    expect([end.score, end.wkts, end.target, end.result]).toEqual([169, 8, 177, 'India won by 7 runs']);
  });

  it('well-known bowling figures: Bumrah 4-0-18-2, Arshdeep 4-0-20-2, Pandya 3-0-20-3', () => {
    const s = getCricketStateAt(tl, tl.events.length);
    const fig = Object.fromEntries(s.scorecard.bowlers.map((b) => [shortName(b.name), bowlerFigures(b)]));
    expect(fig.Bumrah).toBe('4-0-18-2');
    expect(fig.Arshdeep).toBe('4-0-20-2');
    expect(fig.Pandya).toBe('3-0-20-3');
  });
});
