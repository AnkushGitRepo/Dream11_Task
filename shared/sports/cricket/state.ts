import type { MatchTimeline, TimelineEvent } from '../types.ts';
import { ballData } from './ballData.ts';
import {
  BALLS_PER_OVER,
  WICKETS_IN_INNINGS,
  bowlingOvers,
  formatOvers,
  round2,
  runRate,
  shortName,
} from './format.ts';
import type {
  BallView,
  BatterLine,
  BowlerLine,
  CricketBaseline,
  CricketState,
  Scorecard,
} from './stateTypes.ts';
import { tallyEvents, type Tally } from './tally.ts';

// Pure scoreboard maths. Every number the UI shows comes from here.
// `position` = number of events played (0..n), see src/features/replay/replayStore.ts.

export { BALLS_PER_OVER, WICKETS_IN_INNINGS, formatOvers, shortName };
export type {
  BallView,
  BatterLine,
  BowlerLine,
  CricketBaseline,
  CricketState,
  ExtrasLine,
  FallOfWicket,
  Scorecard,
} from './stateTypes.ts';

const EXTRA_LABEL: Record<string, string> = { wide: 'wd', noball: 'nb', bye: 'b', legbye: 'lb' };

export function ballView(event: TimelineEvent): BallView {
  const b = ballData(event);
  let label: string;
  if (b.wicket) label = 'W';
  else if (b.extraType) label = EXTRA_LABEL[b.extraType] ?? 'x';
  else label = b.runsBat === 0 ? '•' : String(b.runsBat);
  return {
    seq: event.seq,
    clock: event.clock,
    over: b.over,
    label,
    tone: event.tone,
    freeHit: b.freeHit,
    a11y: `Over ${event.clock}${b.freeHit ? ', free hit' : ''}: ${event.text}`,
  };
}

function batterLine(name: string, tally: Tally): BatterLine {
  const t = tally.batters.get(name);
  return {
    name,
    runs: t?.runs ?? 0,
    balls: t?.balls ?? 0,
    fours: t?.fours ?? 0,
    sixes: t?.sixes ?? 0,
    ...(t?.out ? { out: t.out } : {}),
  };
}

function bowlerLine(name: string, tally: Tally): BowlerLine {
  const t = tally.bowlers.get(name);
  return {
    name,
    legalBalls: t?.legalBalls ?? 0,
    maidens: t?.maidens ?? 0,
    runs: t?.runs ?? 0,
    wkts: t?.wkts ?? 0,
  };
}

function scorecardOf(tally: Tally): Scorecard {
  return {
    batters: [...tally.batters.keys()].map((n) => batterLine(n, tally)),
    bowlers: [...tally.bowlers.keys()].map((n) => bowlerLine(n, tally)),
    extras: tally.extras,
    fow: tally.fow,
  };
}

export function getCricketState(
  timeline: MatchTimeline,
  position: number,
  baseline: CricketBaseline,
  recentCount = 12,
): CricketState {
  const total = timeline.events.length;
  const played = timeline.events.slice(0, Math.max(0, Math.min(position, total)));
  const upcoming = timeline.events[played.length];
  const t = tallyEvents(played, baseline);

  const last = played.length > 0 ? ballData(played[played.length - 1] as TimelineEvent) : null;
  const next = upcoming ? ballData(upcoming) : null;
  const strikerName = next?.batter ?? last?.batter ?? baseline.striker;
  const nonStrikerName = next?.nonStriker ?? last?.nonStriker ?? baseline.nonStriker;
  const bowlerName = next?.bowler ?? last?.bowler ?? baseline.bowler;

  const ballsLeft = Math.max(0, baseline.maxBalls - t.legalBalls);
  const need = baseline.target === null ? null : Math.max(0, baseline.target - t.score);
  const finished =
    played.length >= total || (need === 0 && baseline.target !== null) || t.wkts >= WICKETS_IN_INNINGS;
  const won = baseline.target !== null && t.score >= baseline.target;
  const freeHitPersists = last !== null && !last.legal && last.extraType === 'wide' && last.freeHit;
  const freeHitNext = next ? next.freeHit : last !== null && (last.extraType === 'noball' || freeHitPersists);
  const lastEvent = played[played.length - 1];

  return {
    battingTeam: baseline.battingTeam,
    score: t.score,
    wkts: t.wkts,
    legalBalls: t.legalBalls,
    overs: formatOvers(t.legalBalls),
    target: baseline.target,
    need,
    ballsLeft,
    crr: runRate(t.score, t.legalBalls),
    rrr: need !== null && need > 0 && ballsLeft > 0 ? round2((need * BALLS_PER_OVER) / ballsLeft) : null,
    partnership: t.partnership,
    striker: batterLine(strikerName, t),
    nonStriker: batterLine(nonStrikerName, t),
    bowler: bowlerLine(bowlerName, t),
    recent: played.slice(-recentCount).map(ballView),
    freeHitNext: freeHitNext && !finished,
    lastWicketSeq: t.lastWicketSeq,
    finished,
    result:
      finished && played.length >= total && won
        ? `${baseline.battingTeam} won by ${WICKETS_IN_INNINGS - t.wkts} wickets`
        : null,
    period: baseline.period ?? lastEvent?.period ?? upcoming?.period ?? 1,
    scorecard: scorecardOf(t),
  };
}

/** Legal balls bowled between two replay positions (for the "You missed N balls" banner). */
export function countLegalBalls(timeline: MatchTimeline, fromPosition: number, toPosition: number): number {
  return timeline.events
    .slice(Math.max(0, fromPosition), Math.max(0, toPosition))
    .filter((event) => event.data.legal === true).length;
}

export function bowlerFigures(b: BowlerLine): string {
  return `${bowlingOvers(b.legalBalls)}-${b.maidens}-${b.runs}-${b.wkts}`;
}
