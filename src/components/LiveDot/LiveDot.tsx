import styles from './LiveDot.module.scss';

export interface LiveDotProps {
  readonly label: 'REPLAY' | 'LIVE';
  /** Stops the pulse (e.g. replay paused). */
  readonly paused?: boolean;
}

export function LiveDot({ label, paused = false }: LiveDotProps) {
  return (
    <span className={`${styles.root} ${paused ? styles.paused : ''}`.trim()}>
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </span>
  );
}
