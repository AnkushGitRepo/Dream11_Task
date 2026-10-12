import styles from './TypingDots.module.scss';

/** Three dots; they bounce unless the user prefers reduced motion (then static). */
export function TypingDots({ label }: { readonly label: string }) {
  return (
    <span className={styles.dots} role="status" aria-label={label}>
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </span>
  );
}
