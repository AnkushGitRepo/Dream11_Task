import type { MatchTimeline, TimelineEvent } from '../types.ts';
import { ballData } from './ballData.ts';
import { clockToLegalBalls, BALLS_PER_OVER } from './format.ts';
import { getCricketState } from './state.ts';
import type { CricketBaseline, CricketState, Scorecard } from './stateTypes.ts';

// Innings-aware helpers. `position` = number of events played (0..n); latest seq = position - 1.

export type DetailedCricketState = CricketState & { readonly period: number; readonly scorecard: Scorecard };

interface InningsSlice {
  readonly period: number;
  readonly start: number; // global index of the first event
  readonly events: readonly TimelineEvent[];
}

const cache = new WeakMap<MatchTimeline, readonly InningsSlice[]>();

/** Contiguous innings blocks in play order (cached per timeline object). */
function slices(timeline: MatchTimeline): readonly InningsSlice[] {
  const hit = cache.get(timeline);
  if (hit) return hit;
  const out: InningsSlice[] = [];
  timeline.events.forEach((e, i) => {
    const last = out[out.length - 1];
    if (last && last.period === e.period) (last.events as TimelineEvent[]).push(e);
    else out.push({ period: e.period, start: i, events: [e] });
  });
  cache.set(timeline, out);
  return out;
}

function zeroBaseline(first: TimelineEvent, period: number): CricketBaseline {
  const d = ballData(first);
  return {
    battingTeam: d.team,
    clock: '0.0',
    score: 0,
    wkts: 0,
    legalBalls: 0,
    target: d.target ?? null,
    maxBalls: d.maxBalls ?? 20 * BALLS_PER_OVER,
    batters: {},
    bowlers: {},
    partnership: { runs: 0, balls: 0 },
    striker: d.batter,
    nonStriker: d.nonStriker,
    bowler: d.bowler,
    period,
  };
}

const zeroExtras = { wides: 0, noballs: 0, byes: 0, legbyes: 0, penalty: 0, total: 0 };

const emptyState = (): DetailedCricketState => ({
  battingTeam: '',
  score: 0,
  wkts: 0,
  legalBalls: 0,
  overs: '0.0',
  target: null,
  need: null,
  ballsLeft: 0,
  crr: null,
  rrr: null,
  partnership: { runs: 0, balls: 0 },
  striker: { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 },
  nonStriker: { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 },
  bowler: { name: '', legalBalls: 0, maidens: 0, runs: 0, wkts: 0 },
  recent: [],
  freeHitNext: false,
  lastWicketSeq: null,
  finished: false,
  result: null,
  period: 1,
  scorecard: { batters: [], bowlers: [], extras: zeroExtras, fow: [] },
});

/**
 * State of one innings after `deliveries` of ITS deliveries (0 = before its first ball). Unlike
 * getCricketStateAt this can show the final state of innings 1. Unknown period -> empty state.
 */
export function getInningsStateAfter(
  timeline: MatchTimeline,
  period: number,
  deliveries: number,
): DetailedCricketState {
  const slice = slices(timeline).find((s) => s.period === period);
  if (!slice) return emptyState();
  const sub: MatchTimeline = { meta: timeline.meta, events: slice.events as TimelineEvent[] };
  const local = Math.max(0, Math.min(deliveries, slice.events.length));
  const base = zeroBaseline(slice.events[0] as TimelineEvent, slice.period);
  const s = getCricketState(sub, local, base);
  const isMatchEnd = slice.start + local >= timeline.events.length;
  const result = s.finished && isMatchEnd ? (timeline.meta.result ?? s.result) : s.result;
  return { ...s, result, period: slice.period, scorecard: s.scorecard as Scorecard };
}

/**
 * Scoreboard after `position` events. The innings is the one of the NEXT event (so at the exact
 * end of innings 1 you already see innings 2 at 0/0 with its target), or the last event's innings
 * once everything is played. Counts reset per innings; `result` comes from meta when finished.
 */
export function getCricketStateAt(timeline: MatchTimeline, position: number): DetailedCricketState {
  const n = timeline.events.length;
  if (n === 0) return emptyState();
  const pos = Math.max(0, Math.min(position, n));
  const anchor = timeline.events[Math.min(pos, n - 1)] as TimelineEvent;
  const slice = slices(timeline).find((s) => s.period === anchor.period) as InningsSlice;
  return getInningsStateAfter(timeline, slice.period, pos - slice.start);
}

/** Position (events played) at which innings `period` begins; the end position if it never starts. */
export function inningsStartPosition(timeline: MatchTimeline, period: number): number {
  const s = slices(timeline).find((x) => x.period === period);
  return s ? s.start : timeline.events.length;
}

/**
 * Position right after N legal balls of innings `period`, where N is parsed from an overs clock:
 * '17.0' = 102 legal balls, '19.3' = 117. '0.0' = innings start. Clamped to the innings end.
 * Throws on a malformed clock.
 */
export function positionAtClock(timeline: MatchTimeline, period: number, clock: string): number {
  const wanted = clockToLegalBalls(clock);
  if (wanted === null) throw new Error(`positionAtClock: malformed clock "${clock}"`);
  const s = slices(timeline).find((x) => x.period === period);
  if (!s) return timeline.events.length;
  if (wanted === 0) return s.start;
  let legal = 0;
  for (let i = 0; i < s.events.length; i += 1) {
    if ((s.events[i] as TimelineEvent).data.legal === true) legal += 1;
    if (legal === wanted) return s.start + i + 1;
  }
  return s.start + s.events.length;
}

export interface MatchMarkers {
  readonly innings: readonly { period: number; startPosition: number; team: string }[];
  /** Start of the last three overs of the final innings (17.0 in a T20). */
  readonly lastOversStart: number;
  /** Positions just AFTER each team wicket ball (retired hurt excluded). */
  readonly wickets: readonly number[];
}

export function matchMarkers(timeline: MatchTimeline): MatchMarkers {
  const all = slices(timeline);
  const innings = all.map((s) => ({
    period: s.period,
    startPosition: s.start,
    team: ballData(s.events[0] as TimelineEvent).team,
  }));
  const final = all[all.length - 1];
  let lastOversStart = timeline.events.length;
  if (final) {
    const maxBalls = ballData(final.events[0] as TimelineEvent).maxBalls ?? 20 * BALLS_PER_OVER;
    const lastOvers = Math.max(0, maxBalls / BALLS_PER_OVER - 3);
    lastOversStart = positionAtClock(timeline, final.period, `${lastOvers}.0`);
  }
  const wickets = timeline.events
    .map((e, i) => ({ w: ballData(e).wicket, i }))
    .filter((x) => x.w !== undefined && x.w.kind !== 'retired hurt')
    .map((x) => x.i + 1);
  return { innings, lastOversStart, wickets };
}
