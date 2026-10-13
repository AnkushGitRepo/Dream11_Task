import type { EventTone } from '../types.ts';
import type { ExtraType, ExtrasDetail, WicketData } from './ballData.ts';
import { dismissalText, shortName } from './format.ts';

/** One parsed Cricsheet delivery (already validated). */
export interface Delivery {
  readonly over: number;
  readonly batter: string;
  readonly bowler: string;
  readonly nonStriker: string;
  readonly runsBat: number;
  readonly extras: ExtrasDetail;
  readonly extrasTotal: number;
  readonly wickets: readonly WicketData[];
}

export function extraTypeOf(x: ExtrasDetail, runsBat: number): ExtraType | null {
  if (x.wides > 0) return 'wide';
  if (x.noballs > 0) return 'noball';
  if (x.byes > 0) return 'bye';
  if (x.legbyes > 0) return 'legbye';
  if (x.penalty > 0 && runsBat === 0) return 'penalty';
  return null;
}

export function kindAndTone(
  d: Delivery,
  type: ExtraType | null,
  wicket: WicketData | undefined,
): { kind: string; tone: EventTone } {
  const runsTone: EventTone = d.runsBat === 6 ? 'big' : d.runsBat === 4 ? 'good' : 'none';
  if (wicket) return { kind: 'wicket', tone: 'major' };
  if (type) return { kind: type, tone: runsTone === 'none' ? 'minor' : runsTone };
  if (d.runsBat === 0) return { kind: 'dot', tone: 'none' };
  if (d.runsBat === 4) return { kind: 'four', tone: 'good' };
  if (d.runsBat === 6) return { kind: 'six', tone: 'big' };
  return { kind: 'run', tone: 'none' };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function describe(d: Delivery, type: ExtraType | null, wicket: WicketData | undefined): string {
  const bat = shortName(d.batter);
  const bowl = shortName(d.bowler);
  if (wicket) {
    const how = dismissalText(wicket.kind, wicket.fielder, d.bowler, wicket.bowlerCredited);
    return `WICKET! ${shortName(wicket.playerOut)} ${how}`;
  }
  if (type === 'wide') {
    return d.extrasTotal > 1 ? `Wide from ${bowl}, ${d.extrasTotal} runs` : `Wide from ${bowl}`;
  }
  if (type === 'noball') {
    const off = d.runsBat === 4 ? ', FOUR' : d.runsBat === 6 ? ', SIX' : '';
    const other = off === '' && d.runsBat > 0 ? `, ${plural(d.runsBat, 'run', 'runs')} off the bat` : '';
    return `No ball from ${bowl}${off}${other}`;
  }
  if (type === 'bye') return `${plural(d.extras.byes, 'bye', 'byes')} off ${bowl}`;
  if (type === 'legbye') return `${plural(d.extras.legbyes, 'leg bye', 'leg byes')} off ${bowl}`;
  if (type === 'penalty') return `${plural(d.extras.penalty, 'penalty run', 'penalty runs')}`;
  if (d.runsBat === 0) return `Dot ball: ${bowl} to ${bat}`;
  if (d.runsBat === 4) return `FOUR! ${bat} off ${bowl}`;
  if (d.runsBat === 6) return `SIX! ${bat} off ${bowl}`;
  return `${bat} takes ${d.runsBat} off ${bowl}`;
}
