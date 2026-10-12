import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import styles from './CatchUpEmpty.module.scss';

export interface CatchUpEmptyProps {
  readonly onSimulate: () => void;
}

export function CatchUpEmpty({ onSimulate }: CatchUpEmptyProps) {
  return (
    <div>
      <EmptyState
        title="Stepped away?"
        text="Tap Catch me up when you're back. We'll tell you only what you missed."
      />
      <aside className={styles.tip} aria-label="Tip">
        <p className={styles.tipText}>
          Tip: switch apps or lock your phone — when you return we&apos;ll know what you missed.
        </p>
        <Button variant="ghost" size="sm" onClick={onSimulate}>
          Simulate stepping away
        </Button>
      </aside>
    </div>
  );
}
