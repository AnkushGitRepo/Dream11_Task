import type { EventTone, Fact, MatchTimeline, TimelineEvent } from '../types';

// Pure scoreboard maths for a cricket chase. Every number the UI shows comes from here.
// `position` = number of events played (0..n), see src/features/replay/replayStore.ts.

export const BALLS_PER_OVER = 6;
export const WICKETS_IN_INNINGS = 10;

export interface BatterLine {
  readonly name: string;
  readonly runs: number;
  readonly balls: number;
  readonly fours: number;
  readonly sixes: number;
}
export interface BowlerLine {
  readonly name: string;
  readonly legalBalls: number;
  readonly maidens: number;
  readonly runs: number;
  readonly wkts: number;
}

/** State of the innings before event 0 (lets a replay start mid-innings). */
export interface CricketBaseline {
  readonly battingTeam: string; // team code, e.g. 'IND'
  readonly clock: string; // '17.0'
  readonly score: number;
  readonly wkts: number;
  readonly legalBalls: number;
  readonly target: number | null;
  readonly maxBalls: number;
  readonly batters: Readonly<Record<string, Omit<BatterLine, 'name'>>>;
  readonly bowlers: Readonly<Record<string, Omit<BowlerLine, 'name'>>>;
  readonly partnership: { readonly runs: number; readonly balls: number };
  readonly striker: string;
  readonly nonStriker: string;
  readonly bowler: string;
}

export interface BallView {
  readonly seq: number;
  readonly over: number; // 0-based over index, used for the strip separator
  readonly label: string; // '•' '1' '2' '3' '4' '6' 'W' 'wd' 'nb' 'b' 'lb'
  readonly tone: EventTone;
  readonly freeHit: boolean;
  readonly a11y: string;
}

export interface CricketState {
  readonly battingTeam: string;
  readonly score: number;
  readonly wkts: number;
  readonly legalBalls: number;
  readonly overs: string; // '19.0'
  readonly target: number | null;
  readonly need: number | null;
  readonly ballsLeft: number;
  readonly crr: number | null;
  readonly rrr: number | null;
  readonly partnership: { readonly runs: number; readonly balls: number };
  readonly striker: BatterLine;
  readonly nonStriker: BatterLine;
  readonly bowler: BowlerLine;
  readonly recent: readonly BallView[];
  readonly freeHitNext: boolean;
  readonly lastWicketSeq: number | null;
  readonly finished: boolean;
  readonly result: string | null;
}

interface Ball {
  readonly over: number;
  readonly batter: string;
  readonly bowler: string;
  readonly nonStriker: string;
  readonly runsBat: number;
  readonly extras: number;
  readonly extraType: string | null;
  readonly legal: boolean;
  readonly freeHit: boolean;
  readonly wicket: boolean;
  readonly score: number;
  readonly wkts: number;
}

function readBall(event: TimelineEvent): Ball {
  const d = event.data;
  const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
  const num = (v: unknown) => (typeof v === 'number' ? v : 0);
  return {
    over: num(d.over),
    batter: str(d.batter),
    bowler: str(d.bowler),
    nonStriker: str(d.nonStriker),
    runsBat: num(d.runsBat),
    extras: num(d.extras),
    extraType: typeof d.extraType === 'string' ? d.extraType : null,
    legal: d.legal === true,
    freeHit: d.freeHit === true,
    wicket: typeof d.wicket === 'object' && d.wicket !== null,
    score: num(d.score),
    wkts: num(d.wkts),
  };
}

export function formatOvers(legalBalls: number): string {
  return `${Math.floor(legalBalls / BALLS_PER_OVER)}.${legalBalls % BALLS_PER_OVER}`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const EXTRA_LABEL: Record<string, string> = { wide: 'wd', noball: 'nb', bye: 'b', legbye: 'lb' };

export function ballView(event: TimelineEvent): BallView {
  const b = readBall(event);
  let label: string;
  if (b.wicket) label = 'W';
  else if (b.extraType) label = EXTRA_LABEL[b.extraType] ?? 'x';
  else label = b.runsBat === 0 ? '•' : String(b.runsBat);
  return {
    seq: event.seq,
    over: b.over,
    label,
    tone: event.tone,
    freeHit: b.freeHit,
    a11y: `Over ${event.clock}${b.freeHit ? ', free hit' : ''}: ${event.text}`,
  };
}

function batterLine(name: string, tally: ReadonlyMap<string, Omit<BatterLine, 'name'>>): BatterLine {
  const t = tally.get(name);
  return { name, runs: t?.runs ?? 0, balls: t?.balls ?? 0, fours: t?.fours ?? 0, sixes: t?.sixes ?? 0 };
}

function bowlerLine(name: string, tally: ReadonlyMap<string, Omit<BowlerLine, 'name'>>): BowlerLine {
  const t = tally.get(name);
  return {
    name,
    legalBalls: t?.legalBalls ?? 0,
    maidens: t?.maidens ?? 0,
    runs: t?.runs ?? 0,
    wkts: t?.wkts ?? 0,
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

  const batters = new Map<string, Omit<BatterLine, 'name'>>(Object.entries(baseline.batters));
  const bowlers = new Map<string, Omit<BowlerLine, 'name'>>(Object.entries(baseline.bowlers));
  let { score, wkts, legalBalls } = baseline;
  let partnership = baseline.partnership;
  let lastWicketSeq: number | null = null;

  for (const event of played) {
    const b = readBall(event);
    const bat = batterLine(b.batter, batters);
    const faced = b.extraType === 'wide' ? 0 : 1;
    batters.set(b.batter, {
      runs: bat.runs + b.runsBat,
      balls: bat.balls + faced,
      fours: bat.fours + (b.runsBat === 4 ? 1 : 0),
      sixes: bat.sixes + (b.runsBat === 6 ? 1 : 0),
    });
    const bowl = bowlerLine(b.bowler, bowlers);
    const conceded = b.runsBat + (b.extraType === 'wide' || b.extraType === 'noball' ? b.extras : 0);
    bowlers.set(b.bowler, {
      legalBalls: bowl.legalBalls + (b.legal ? 1 : 0),
      maidens: bowl.maidens,
      runs: bowl.runs + conceded,
      wkts: bowl.wkts + (b.wicket && !b.freeHit ? 1 : 0),
    });
    score = b.score;
    wkts = b.wkts;
    if (b.legal) legalBalls += 1;
    if (b.wicket) {
      partnership = { runs: 0, balls: 0 };
      lastWicketSeq = event.seq;
    } else {
      partnership = {
        runs: partnership.runs + b.runsBat + b.extras,
        balls: partnership.balls + (b.legal ? 1 : 0),
      };
    }
  }

  const last = played.length > 0 ? readBall(played[played.length - 1] as TimelineEvent) : null;
  const next = upcoming ? readBall(upcoming) : null;
  const strikerName = next?.batter ?? last?.batter ?? baseline.striker;
  const nonStrikerName = next?.nonStriker ?? last?.nonStriker ?? baseline.nonStriker;
  const bowlerName = next?.bowler ?? last?.bowler ?? baseline.bowler;

  const ballsLeft = Math.max(0, baseline.maxBalls - legalBalls);
  const need = baseline.target === null ? null : Math.max(0, baseline.target - score);
  const finished =
    played.length >= total || (need === 0 && baseline.target !== null) || wkts >= WICKETS_IN_INNINGS;
  const won = baseline.target !== null && score >= baseline.target;
  const freeHitPersists = last !== null && !last.legal && last.extraType === 'wide' && last.freeHit;
  const freeHitNext = next ? next.freeHit : last !== null && (last.extraType === 'noball' || freeHitPersists);

  return {
    battingTeam: baseline.battingTeam,
    score,
    wkts,
    legalBalls,
    overs: formatOvers(legalBalls),
    target: baseline.target,
    need,
    ballsLeft,
    crr: legalBalls > 0 ? round2((score * BALLS_PER_OVER) / legalBalls) : null,
    rrr: need !== null && need > 0 && ballsLeft > 0 ? round2((need * BALLS_PER_OVER) / ballsLeft) : null,
    partnership,
    striker: batterLine(strikerName, batters),
    nonStriker: batterLine(nonStrikerName, batters),
    bowler: bowlerLine(bowlerName, bowlers),
    recent: played.slice(-recentCount).map(ballView),
    freeHitNext: freeHitNext && !finished,
    lastWicketSeq,
    finished,
    result:
      finished && played.length >= total && won
        ? `${baseline.battingTeam} won by ${WICKETS_IN_INNINGS - wkts} wickets`
        : null,
  };
}

/** Legal balls bowled between two replay positions (for the "You missed N balls" banner). */
export function countLegalBalls(timeline: MatchTimeline, fromPosition: number, toPosition: number): number {
  return timeline.events
    .slice(Math.max(0, fromPosition), Math.max(0, toPosition))
    .filter((event) => event.data.legal === true).length;
}

export function bowlerFigures(b: BowlerLine): string {
  const overs =
    b.legalBalls % BALLS_PER_OVER === 0 ? String(b.legalBalls / BALLS_PER_OVER) : formatOvers(b.legalBalls);
  return `${overs}-${b.maidens}-${b.runs}-${b.wkts}`;
}

/** 'V Kohli' -> 'Kohli', 'Mohammad Nawaz' -> 'Nawaz'. */
export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? name;
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
    const text = `Need ${from.need} off ${from.ballsLeft} → ${to.need} off ${to.ballsLeft}`;
    items.push({ key: 'need', value: text, label: { en: text, hinglish: text, hi: text, gu: text } });
  }
  return items;
}
