import { useState } from 'react';
import type { BallView } from '@shared/sports/cricket/state';
import { useCricketText } from './useLabels';
import { BallChip } from './BallChip';
import styles from './OverStrip.module.scss';

export interface OverStripProps {
  readonly balls: readonly BallView[];
  readonly max?: number;
}

export function OverStrip({ balls, max = 12 }: OverStripProps) {
  const { text } = useCricketText();
  const shown = balls.slice(-max);
  const newest = shown[shown.length - 1]?.seq ?? null;
  // Derived-state pattern: only a chip arriving after first paint pops in.
  const [track, setTrack] = useState<{ cur: number | null; prev: number | null }>({
    cur: newest,
    prev: newest,
  });
  if (track.cur !== newest) setTrack({ cur: newest, prev: track.cur });
  const popSeq = newest !== null && track.prev !== null && newest > track.prev ? newest : null;

  return (
    <ol className={styles.strip} role="list" aria-label={text('recentBalls')}>
      {shown.map((ball, i) => {
        const prev = shown[i - 1];
        return (
          <li key={ball.seq} className={styles.item}>
            {prev && prev.over !== ball.over ? (
              <span className={styles.sep} aria-hidden="true">
                |
              </span>
            ) : null}
            <BallChip ball={ball} isNew={ball.seq === popSeq} />
          </li>
        );
      })}
    </ol>
  );
}
