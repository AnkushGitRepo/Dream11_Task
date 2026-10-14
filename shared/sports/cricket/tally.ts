import type { TimelineEvent } from '../types.js';
import { ballData, type CricketBallData, type WicketData } from './ballData.js';
import { BALLS_PER_OVER, dismissalText } from './format.js';
import type { CricketBaseline, ExtrasLine, FallOfWicket } from './stateTypes.js';

// The single place where deliveries are folded into scorecard numbers.
// Everything (state, facts, askContext, golden tests) reads from this tally.

export interface BatterAcc {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out?: string;
}
export interface BowlerAcc {
  legalBalls: number;
  maidens: number;
  runs: number;
  wkts: number;
}
export interface Tally {
  score: number;
  wkts: number;
  legalBalls: number;
  partnership: { runs: number; balls: number };
  lastWicketSeq: number | null;
  batters: Map<string, BatterAcc>; // insertion order = order of appearance
  bowlers: Map<string, BowlerAcc>;
  extras: ExtrasLine;
  fow: FallOfWicket[];
}

function seedBatters(baseline: CricketBaseline): Map<string, BatterAcc> {
  const m = new Map<string, BatterAcc>();
  for (const [name, b] of Object.entries(baseline.batters)) m.set(name, { ...b });
  return m;
}

const blank = (): BatterAcc => ({ runs: 0, balls: 0, fours: 0, sixes: 0 });

function applyBatting(batters: Map<string, BatterAcc>, b: CricketBallData): void {
  const bat = batters.get(b.batter) ?? blank();
  batters.set(b.batter, {
    ...bat,
    runs: bat.runs + b.runsBat,
    balls: bat.balls + (b.extraType === 'wide' ? 0 : 1),
    fours: bat.fours + (b.runsBat === 4 ? 1 : 0),
    sixes: bat.sixes + (b.runsBat === 6 ? 1 : 0),
  });
  if (b.nonStriker && !batters.has(b.nonStriker)) batters.set(b.nonStriker, blank());
}

type OverTally = Map<string, { legal: number; conceded: number }>;

/** Bowler figures. Runs charged = bat runs + wides + no-ball runs (byes/leg-byes excluded). */
function applyBowling(bowlers: Map<string, BowlerAcc>, overs: OverTally, b: CricketBallData): void {
  const conceded = b.runsBat + b.extrasBowler;
  const bowl = bowlers.get(b.bowler) ?? { legalBalls: 0, maidens: 0, runs: 0, wkts: 0 };
  const key = `${b.over}|${b.bowler}`;
  const ov = overs.get(key) ?? { legal: 0, conceded: 0 };
  ov.conceded += conceded;
  if (b.legal) ov.legal += 1;
  overs.set(key, ov);
  const maiden = b.legal && ov.legal === BALLS_PER_OVER && ov.conceded === 0;
  bowlers.set(b.bowler, {
    legalBalls: bowl.legalBalls + (b.legal ? 1 : 0),
    maidens: bowl.maidens + (maiden ? 1 : 0),
    runs: bowl.runs + conceded,
    wkts: bowl.wkts + (b.wicket?.bowlerCredited ? 1 : 0),
  });
}

function applyWicket(t: Tally, b: CricketBallData, event: TimelineEvent): void {
  const w = b.wicket as WicketData;
  const out = t.batters.get(w.playerOut) ?? blank();
  const how = dismissalText(w.kind, w.fielder, b.bowler, w.bowlerCredited);
  t.batters.set(w.playerOut, { ...out, out: how });
  t.partnership = { runs: 0, balls: 0 };
  t.lastWicketSeq = event.seq;
  if (w.kind !== 'retired hurt') {
    t.fow.push({ wkt: b.wkts, score: b.score, batter: w.playerOut, clock: event.clock, seq: event.seq });
  }
}

/** Fold `events` (in order) on top of `baseline`. Pure: inputs are not modified. */
export function tallyEvents(events: readonly TimelineEvent[], baseline: CricketBaseline): Tally {
  const bowlers = new Map<string, BowlerAcc>();
  for (const [name, b] of Object.entries(baseline.bowlers)) bowlers.set(name, { ...b });
  const overs: OverTally = new Map();
  const x = { wides: 0, noballs: 0, byes: 0, legbyes: 0, penalty: 0 };
  const t: Tally = {
    score: baseline.score,
    wkts: baseline.wkts,
    legalBalls: baseline.legalBalls,
    partnership: { ...baseline.partnership },
    lastWicketSeq: null,
    batters: seedBatters(baseline),
    bowlers,
    extras: { ...x, total: 0 },
    fow: [],
  };

  for (const event of events) {
    const b = ballData(event);
    applyBatting(t.batters, b);
    applyBowling(bowlers, overs, b);
    x.wides += b.extrasDetail.wides;
    x.noballs += b.extrasDetail.noballs;
    x.byes += b.extrasDetail.byes;
    x.legbyes += b.extrasDetail.legbyes;
    x.penalty += b.extrasDetail.penalty;
    t.score = b.score;
    t.wkts = b.wkts;
    if (b.legal) t.legalBalls += 1;
    if (b.wicket) applyWicket(t, b, event);
    else {
      t.partnership = {
        runs: t.partnership.runs + b.runsBat + b.extras,
        balls: t.partnership.balls + (b.legal ? 1 : 0),
      };
    }
  }
  return { ...t, extras: { ...x, total: x.wides + x.noballs + x.byes + x.legbyes + x.penalty } };
}

/** Zero state: lets a slice of events be tallied on its own (window figures). */
export const EMPTY_BASELINE: CricketBaseline = {
  battingTeam: '',
  clock: '0.0',
  score: 0,
  wkts: 0,
  legalBalls: 0,
  target: null,
  maxBalls: 120,
  batters: {},
  bowlers: {},
  partnership: { runs: 0, balls: 0 },
  striker: '',
  nonStriker: '',
  bowler: '',
};
