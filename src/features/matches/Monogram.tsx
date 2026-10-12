import styles from './Monogram.module.scss';

/** Team short code in a circle. Text only: no official logos or crests. */
export function Monogram({ code }: { readonly code: string }) {
  return (
    <span className={styles.mono} lang="en" aria-hidden="true">
      {code}
    </span>
  );
}
