import type { TimelineEvent } from '../types.js';

// Cricket-specific payload of TimelineEvent.data. Typed here so the sport-agnostic core never sees it.

export type ExtraType = 'wide' | 'noball' | 'bye' | 'legbye' | 'penalty';

export interface WicketData {
  readonly playerOut: string;
  readonly kind: string;
  readonly fielder: string | null;
  /** False for run out / retired / obstructing the field: never the bowler's wicket. */
  readonly bowlerCredited: boolean;
}

/** Extras on one delivery split by type (a no-ball can carry byes). */
export interface ExtrasDetail {
  readonly wides: number;
  readonly noballs: number;
  readonly byes: number;
  readonly legbyes: number;
  readonly penalty: number;
}

export interface CricketBallData {
  readonly inn: number; // 1 | 2
  readonly over: number; // 0-based over index
  /** Legal balls completed in the over AFTER this delivery (illegal balls reuse the previous value). */
  readonly ball: number;
  readonly batter: string;
  readonly bowler: string;
  readonly nonStriker: string;
  readonly runsBat: number;
  readonly extras: number; // total extras on the delivery
  readonly extrasBowler: number; // wides + no-ball runs: the part charged to the bowler
  readonly extraType: ExtraType | null;
  readonly extrasDetail: ExtrasDetail;
  readonly legal: boolean;
  readonly freeHit: boolean;
  readonly wicket?: WicketData;
  readonly score: number; // innings total after the delivery
  readonly wkts: number; // innings wickets after the delivery
  readonly team: string; // batting team code
  readonly target?: number; // innings 2 only
  readonly maxBalls?: number; // legal balls available in this innings (120 in a full T20)
}

const EXTRA_TYPES: readonly string[] = ['wide', 'noball', 'bye', 'legbye', 'penalty'];

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

function readWicket(v: unknown): WicketData | undefined {
  if (typeof v !== 'object' || v === null) return undefined;
  const w = v as Record<string, unknown>;
  const kind = str(w.kind);
  return {
    playerOut: str(w.playerOut),
    kind,
    fielder: typeof w.fielder === 'string' ? w.fielder : null,
    // Older hand-written events carry no flag: treat them as the bowler's wicket unless run out.
    bowlerCredited: typeof w.bowlerCredited === 'boolean' ? w.bowlerCredited : kind !== 'run out',
  };
}

function readDetail(v: unknown, type: ExtraType | null, extras: number): ExtrasDetail {
  if (typeof v === 'object' && v !== null) {
    const o = v as Record<string, unknown>;
    return {
      wides: num(o.wides),
      noballs: num(o.noballs),
      byes: num(o.byes),
      legbyes: num(o.legbyes),
      penalty: num(o.penalty),
    };
  }
  return {
    wides: type === 'wide' ? extras : 0,
    noballs: type === 'noball' ? extras : 0,
    byes: type === 'bye' ? extras : 0,
    legbyes: type === 'legbye' ? extras : 0,
    penalty: type === 'penalty' ? extras : 0,
  };
}

/** Defensive reader: events from any producer (adapter, legacy mock) become one typed shape. */
export function ballData(event: TimelineEvent): CricketBallData {
  const d = event.data;
  const extraType = typeof d.extraType === 'string' && EXTRA_TYPES.includes(d.extraType) ? d.extraType : null;
  const extras = num(d.extras);
  const wicket = readWicket(d.wicket);
  const extrasBowler =
    typeof d.extrasBowler === 'number'
      ? d.extrasBowler
      : extraType === 'wide' || extraType === 'noball'
        ? extras
        : 0;
  return {
    inn: num(d.inn, event.period),
    over: num(d.over),
    ball: num(d.ball),
    batter: str(d.batter),
    bowler: str(d.bowler),
    nonStriker: str(d.nonStriker),
    runsBat: num(d.runsBat),
    extras,
    extrasBowler,
    extraType: extraType as ExtraType | null,
    extrasDetail: readDetail(d.extrasDetail, extraType as ExtraType | null, extras),
    legal: d.legal === true,
    freeHit: d.freeHit === true,
    ...(wicket ? { wicket } : {}),
    score: num(d.score),
    wkts: num(d.wkts),
    team: str(d.team),
    ...(typeof d.target === 'number' ? { target: d.target } : {}),
    ...(typeof d.maxBalls === 'number' ? { maxBalls: d.maxBalls } : {}),
  };
}
