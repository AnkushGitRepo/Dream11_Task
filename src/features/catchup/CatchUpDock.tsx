import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
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
  return (
    <div className={styles.dock}>
      <div className={styles.inner}>
        <ul className={styles.chips} aria-label="Quick recap windows">
          {QUICK_WINDOWS.map((n) => (
            <li key={n}>
              <Chip onClick={() => onQuick(n)}>Last {n} events</Chip>
            </li>
          ))}
        </ul>
        <Button fullWidth disabled={caughtUp} onClick={onCatchUp}>
          {caughtUp ? 'All caught up' : 'Catch me up'}
        </Button>
      </div>
    </div>
  );
}
