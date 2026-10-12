import { Skeleton } from '@/components/Skeleton';
import { useStrings } from '@/i18n/useStrings';
import styles from './RecapCard.module.scss';

const PILL_WIDTHS = ['var(--s-20)', 'var(--s-14)', 'var(--s-20)', 'var(--s-14)'] as const;

/** Mirrors the RecapCard shape: overline, 2 thick + 2 thin lines, 4 pills. */
export function RecapSkeleton() {
  const { t } = useStrings();
  return (
    <div className={styles.card} role="status" aria-label={t.recapWriting}>
      <Skeleton width="55%" height="var(--s-3)" />
      <div className={styles.skLines}>
        <Skeleton width="100%" height="var(--s-5)" />
        <Skeleton width="80%" height="var(--s-5)" />
        <Skeleton width="100%" height="var(--s-4)" />
        <Skeleton width="65%" height="var(--s-4)" />
      </div>
      <div className={styles.skPills}>
        {PILL_WIDTHS.map((w, i) => (
          <Skeleton key={i} width={w} height="var(--s-8)" radius="var(--r-pill)" />
        ))}
      </div>
    </div>
  );
}
