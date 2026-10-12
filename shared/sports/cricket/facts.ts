import type { Fact, MatchTimeline } from '../types';
import { cricketLabelAll } from './labels';
import { getCricketState, type CricketBaseline } from './state';

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
  const balls = to.legalBalls - from.legalBalls;
  const sixes = events.filter((e) => e.kind === 'six').length;
  const fours = events.filter((e) => e.kind === 'four').length;
  const runs = to.score - from.score;
  const wkts = to.wkts - from.wkts;
  const items: Fact[] = [
    {
      key: 'balls',
      value: balls,
      label: { en: `${balls} balls`, hinglish: `${balls} balls`, hi: `${balls} गेंद`, gu: `${balls} બોલ` },
    },
    {
      key: 'runs',
      value: runs,
      label: { en: `+${runs} runs`, hinglish: `+${runs} runs`, hi: `+${runs} रन`, gu: `+${runs} રન` },
    },
    {
      key: 'wkts',
      value: wkts,
      label: { en: `${wkts} wkt`, hinglish: `${wkts} wkt`, hi: `${wkts} विकेट`, gu: `${wkts} વિકેટ` },
    },
  ];
  if (sixes > 0)
    items.push({
      key: 'sixes',
      value: sixes,
      label: { en: `${sixes}×6`, hinglish: `${sixes}×6`, hi: `${sixes}×6`, gu: `${sixes}×6` },
    });
  if (fours > 0)
    items.push({
      key: 'fours',
      value: fours,
      label: { en: `${fours}×4`, hinglish: `${fours}×4`, hi: `${fours}×4`, gu: `${fours}×4` },
    });
  if (from.need !== null && to.need !== null) {
    const label = cricketLabelAll('needShift', {
      a: from.need,
      b: from.ballsLeft,
      c: to.need,
      d: to.ballsLeft,
    });
    items.push({ key: 'need', value: label.en, label });
  }
  return items;
}
