import type { MatchTimeline } from '@shared/sports/types';
import type { SportUi } from '@/sports/types';

export interface MissedWindow {
  readonly fromPosition: number;
  readonly toPosition: number;
  readonly label: string;
  readonly count: number;
}

/** Pure: the window the fan missed, or null when it is below the sport's meaningful-gap threshold. */
export function computeMissed(
  sportUi: Pick<SportUi, 'gap' | 'minGap'>,
  timeline: MatchTimeline,
  fromPosition: number,
  toPosition: number,
): MissedWindow | null {
  if (toPosition <= fromPosition) return null;
  const { count, label } = sportUi.gap(timeline, fromPosition, toPosition);
  if (count < sportUi.minGap) return null;
  return { fromPosition, toPosition, label, count };
}
