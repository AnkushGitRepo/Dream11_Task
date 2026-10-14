import type { MatchTimeline, TimelineEvent } from '../types.js';
import { ballData, type CricketBallData } from './ballData.js';

// Which rules are worth explaining at a delivery. Pure: depends only on the timeline up to `seq`.
// Ids match shared/sports/cricket/rules.ts. Most specific rule first, so a one-card-at-a-time UI
// shows "bowled on a free hit" before the generic "bye".

const CURATED_FREE_HIT_BOWLED = 'bowled-on-free-hit';
const BALLS_IN_OVER = 6;
const T20_MAX_BALLS = 120;

const DISMISSAL_RULE: Readonly<Record<string, string>> = {
  'run out': 'run-out',
  stumped: 'stumped',
  lbw: 'lbw',
  caught: 'caught',
  'caught and bowled': 'caught',
  bowled: 'bowled',
};

const EXTRA_RULE: Readonly<Record<string, string>> = {
  noball: 'no-ball',
  wide: 'wide',
  bye: 'bye',
  legbye: 'leg-bye',
};

const isFirstOfInnings = (events: readonly TimelineEvent[], seq: number): boolean => {
  const cur = events[seq];
  const prev = events[seq - 1];
  return Boolean(cur) && (!prev || prev.period !== cur?.period);
};

function isT20(tl: MatchTimeline, d: CricketBallData): boolean {
  return d.maxBalls === T20_MAX_BALLS || /t20/i.test(tl.meta.format);
}

/** True when this delivery closes an over of six legal balls on which the bowler conceded nothing. */
function isMaiden(events: readonly TimelineEvent[], seq: number, d: CricketBallData): boolean {
  if (!d.legal || d.ball !== BALLS_IN_OVER) return false;
  let conceded = 0;
  let legal = 0;
  for (let i = seq; i >= 0; i -= 1) {
    const e = events[i];
    if (!e) break;
    const x = ballData(e);
    if (x.inn !== d.inn || x.over !== d.over) break;
    conceded += x.runsBat + x.extrasBowler;
    if (x.legal) legal += 1;
  }
  return legal === BALLS_IN_OVER && conceded === 0;
}

export function cricketTeachables(tl: MatchTimeline, seq: number): string[] {
  const event = tl.events[seq];
  if (!event) return [];
  const d = ballData(event);
  const prev = seq > 0 ? tl.events[seq - 1] : undefined;
  const prevSameInnings = prev && prev.period === event.period ? ballData(prev) : null;
  const ids: string[] = [];
  const add = (id: string | undefined) => {
    if (id && !ids.includes(id)) ids.push(id);
  };

  // Curated annotation (scripts/preprocess-cricsheet.ts): the data cannot show a dismissal that
  // did not count, so this is only ever set by a human-checked list.
  if (d.freeHit && event.data.annotation === CURATED_FREE_HIT_BOWLED) add('free-hit-bowled-not-out');

  if (d.wicket) add(DISMISSAL_RULE[d.wicket.kind]);
  if (d.extraType) add(EXTRA_RULE[d.extraType]);
  if (d.freeHit && !(prevSameInnings?.freeHit ?? false)) add('free-hit');
  if (isMaiden(tl.events, seq, d)) add('maiden');

  if (isFirstOfInnings(tl.events, seq)) {
    if (isT20(tl, d)) add('powerplay');
    if (d.target !== undefined) add('required-rate');
  }
  return ids;
}
