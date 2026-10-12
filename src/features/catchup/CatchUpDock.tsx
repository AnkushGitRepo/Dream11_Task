import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { format, useStrings } from '@/i18n/useStrings';
import { QUICK_WINDOWS } from './config';
import styles from './CatchUpDock.module.scss';

export interface CatchUpDockProps {
  /** Nothing new since the last recap. */
  readonly caughtUp: boolean;
  readonly onCatchUp: () => void;
  readonly onQuick: (events: number) => void;
}

/** Catch up action area: fixed above the safe area on mobile, inline in the right column on desktop. */
export function CatchUpDock({ caughtUp, onCatchUp, onQuick }: CatchUpDockProps) {
  const { t } = useStrings();
  return (
    <div className={styles.dock}>
      <div className={styles.inner}>
        <ul className={styles.chips} aria-label={t.catchupQuickLabel}>
          {QUICK_WINDOWS.map((n) => (
            <li key={n}>
              <Chip onClick={() => onQuick(n)}>{format(t.catchupLastN, { n })}</Chip>
            </li>
          ))}
        </ul>
        <Button fullWidth disabled={caughtUp} onClick={onCatchUp}>
          {caughtUp ? t.catchupButtonDone : t.catchupButton}
        </Button>
      </div>
    </div>
  );
}
