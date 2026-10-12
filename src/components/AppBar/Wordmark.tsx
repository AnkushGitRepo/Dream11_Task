import styles from './AppBar.module.scss';

export function Wordmark() {
  return (
    <span className={styles.wordmark}>
      kya hua<span className={styles.mark}>?</span>
    </span>
  );
}
