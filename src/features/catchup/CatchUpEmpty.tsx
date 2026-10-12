import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useStrings } from '@/i18n/useStrings';
import styles from './CatchUpEmpty.module.scss';

export interface CatchUpEmptyProps {
  readonly onSimulate: () => void;
}

export function CatchUpEmpty({ onSimulate }: CatchUpEmptyProps) {
  const { t } = useStrings();
  return (
    <div>
      <EmptyState title={t.catchupEmptyTitle} text={t.catchupEmptyText} />
      <aside className={styles.tip} aria-label={t.catchupTipLabel}>
        <p className={styles.tipText}>{t.catchupTip}</p>
        <Button variant="ghost" size="sm" onClick={onSimulate}>
          {t.catchupSimulate}
        </Button>
      </aside>
    </div>
  );
}
