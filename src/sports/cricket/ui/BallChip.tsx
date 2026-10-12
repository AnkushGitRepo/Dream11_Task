import type { BallView } from '@shared/sports/cricket/state';
import styles from './BallChip.module.scss';

export interface BallChipProps {
  readonly ball: BallView;
  /** Newest chip only: plays the spring pop-in. */
  readonly isNew?: boolean;
}

const WICKET_LABEL = 'W';

export function BallChip({ ball, isNew = false }: BallChipProps) {
  const isWicket = ball.label === WICKET_LABEL;
  const cls = [styles.chip, isWicket ? styles.wicket : styles[ball.tone], isNew ? styles.pop : '']
    .filter(Boolean)
    .join(' ');
  return (
    <span className={styles.wrap}>
      <span className={cls} role="img" aria-label={ball.a11y}>
        {ball.label}
      </span>
      {ball.freeHit ? (
        <span className={styles.fh} aria-hidden="true">
          FH
        </span>
      ) : null}
    </span>
  );
}
