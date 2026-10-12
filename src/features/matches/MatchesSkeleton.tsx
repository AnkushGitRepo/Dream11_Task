import { Skeleton } from '@/components/Skeleton';
import { useStrings } from '@/i18n/useStrings';
import styles from './MatchesSkeleton.module.scss';

/** Same shapes as the final carousel + list so nothing jumps when data arrives. */
export function MatchesSkeleton() {
  const { t } = useStrings();
  return (
    <div className={styles.root} role="status" aria-label={t.matchesLoading}>
      <div className={styles.cards}>
        <Skeleton width="280px" height="168px" radius="var(--r-xl)" />
        <Skeleton width="280px" height="168px" radius="var(--r-xl)" />
      </div>
      <div className={styles.rows}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} width="100%" height="var(--s-20)" radius="var(--r-lg)" />
        ))}
      </div>
    </div>
  );
}
