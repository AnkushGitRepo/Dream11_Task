import { useCricketText } from './useLabels';
import styles from './ChaseBar.module.scss';

export interface ChaseBarProps {
  readonly score: number;
  readonly target: number;
}

export function ChaseBar({ score, target }: ChaseBarProps) {
  const { text } = useCricketText();
  const pct = target > 0 ? Math.min(100, Math.max(0, (score / target) * 100)) : 0;
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label={text('chaseProgress')}
      aria-valuemin={0}
      aria-valuemax={target}
      aria-valuenow={Math.min(score, target)}
    >
      <div className={styles.fill} style={{ '--progress': `${pct}%` } as React.CSSProperties} />
    </div>
  );
}
