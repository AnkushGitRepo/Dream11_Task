import type { Fact, MatchTimeline, TimelineEvent } from '../types.ts';
import { ballData } from './ballData.ts';
import { cricketLabelAll } from './labels.ts';
import { getCricketStateAt } from './position.ts';
import { getCricketState } from './state.ts';
import type { CricketBaseline } from './stateTypes.ts';

interface NeedPoint {
  readonly need: number | null;
  readonly ballsLeft: number;
}

export interface WindowCounts {
  readonly balls: number;
  readonly runs: number;
  readonly wkts: number;
  readonly fours: number;
  readonly sixes: number;
}

/** Plain counts over a run of deliveries. Wickets exclude retired hurt (no team wicket). */
export function countWindow(events: readonly TimelineEvent[]): WindowCounts {
  let balls = 0;
  let runs = 0;
  let wkts = 0;
  let fours = 0;
  let sixes = 0;
  for (const e of events) {
    const b = ballData(e);
    if (b.legal) balls += 1;
    runs += b.runsBat + b.extras;
    if (b.wicket && b.wicket.kind !== 'retired hurt') wkts += 1;
    if (e.kind === 'four') fours += 1;
    if (e.kind === 'six') sixes += 1;
  }
  return { balls, runs, wkts, fours, sixes };
}

const num = (key: string, value: number, en: string, hi: string, gu: string, hinglish = en): Fact => ({
  key,
  value,
  label: { en, hinglish, hi, gu },
});

/** FactStrip items for a window. `needFrom`/`needTo` are given only when both ends are in one chase. */
export function windowItems(c: WindowCounts, needFrom: NeedPoint | null, needTo: NeedPoint | null): Fact[] {
  const items: Fact[] = [
    num('balls', c.balls, `${c.balls} balls`, `${c.balls} गेंद`, `${c.balls} બોલ`),
    num('runs', c.runs, `+${c.runs} runs`, `+${c.runs} रन`, `+${c.runs} રન`),
    num('wkts', c.wkts, `${c.wkts} wkt`, `${c.wkts} विकेट`, `${c.wkts} વિકેટ`),
  ];
  const six = `${c.sixes}×6`;
  const four = `${c.fours}×4`;
  if (c.sixes > 0) items.push(num('sixes', c.sixes, six, six, six));
  if (c.fours > 0) items.push(num('fours', c.fours, four, four, four));
  if (needFrom && needTo && needFrom.need !== null && needTo.need !== null) {
    const label = cricketLabelAll('needShift', {
      a: needFrom.need,
      b: needFrom.ballsLeft,
      c: needTo.need,
      d: needTo.ballsLeft,
    });
    items.push({ key: 'need', value: label.en, label });
  }
  return items;
}

/** Computed facts for a replay window [fromPosition, toPosition). Drives the FactStrip. */
export function windowFacts(
  timeline: MatchTimeline,
  fromPosition: number,
  toPosition: number,
  baseline: CricketBaseline,
): Fact[] {
  const from = getCricketState(timeline, fromPosition, baseline);
  const to = getCricketState(timeline, toPosition, baseline);
  const events = timeline.events.slice(Math.max(0, fromPosition), Math.max(0, toPosition));
  return windowItems(countWindow(events), from, to);
}

/** Innings-aware variant (no baseline needed): works across the innings break and on real data. */
export function windowFactsAt(timeline: MatchTimeline, fromPosition: number, toPosition: number): Fact[] {
  const lo = Math.max(0, fromPosition);
  const events = timeline.events.slice(lo, Math.max(0, toPosition));
  const from = getCricketStateAt(timeline, lo);
  const to = getCricketStateAt(timeline, Math.max(lo, toPosition));
  const sameChase = from.period === to.period;
  return windowItems(countWindow(events), sameChase ? from : null, sameChase ? to : null);
}
