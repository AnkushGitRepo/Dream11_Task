import styles from './TeamMonogram.module.scss';

/** 40px circle with the team short code. No logos or crests (DESIGN.md §2). */
export function TeamMonogram({ code }: { readonly code: string }) {
  return (
    <span className={styles.root} aria-hidden="true">
      {code}
    </span>
  );
}
