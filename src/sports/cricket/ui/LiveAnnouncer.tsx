import type { CricketState } from '@shared/sports/cricket/state';
import { useAnnouncement } from './useAnnouncement';
import styles from './LiveAnnouncer.module.scss';

/** Visually hidden polite live region: wickets, boundaries and end of over only. */
export function LiveAnnouncer({ state }: { readonly state: CricketState }) {
  const message = useAnnouncement(state);
  return (
    <p className={styles.region} aria-live="polite" aria-atomic="true">
      {message}
    </p>
  );
}
