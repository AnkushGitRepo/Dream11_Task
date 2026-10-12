import type { Lang } from '@shared/sports/types';
import { ErrorState } from '@/components/ErrorState';
import { FactStrip } from '@/components/FactStrip';
import { CatchUpEmpty } from './CatchUpEmpty';
import { RecapCard } from './RecapCard';
import { RecapHistory } from './RecapHistory';
import { RecapSkeleton } from './RecapSkeleton';
import type { RecapEntry } from './types';
import styles from './CatchUpTab.module.scss';

export interface CatchUpTabProps {
  /** Newest first. */
  readonly entries: readonly RecapEntry[];
  readonly lang: Lang;
  /** Nothing new since the newest recap. */
  readonly caughtUp: boolean;
  readonly onRetry: (id: number) => void;
  readonly onSimulate: () => void;
  readonly onAsk: () => void;
}

export function CatchUpTab({ entries, lang, caughtUp, onRetry, onSimulate, onAsk }: CatchUpTabProps) {
  const [latest, ...older] = entries;
  if (!latest) return <CatchUpEmpty onSimulate={onSimulate} />;

  return (
    <div className={styles.stack}>
      {caughtUp && latest.status === 'ready' ? (
        <p className={styles.caughtUp} role="status">
          You&apos;re all caught up.
        </p>
      ) : null}
      {latest.status === 'loading' ? <RecapSkeleton /> : null}
      {latest.status === 'ready' ? <RecapCard entry={latest} lang={lang} onAsk={onAsk} /> : null}
      {latest.status === 'error' ? (
        <div>
          <ErrorState
            title="Couldn't write the recap"
            text="The stats are fine, the words didn't load. Try again."
            actionLabel="Retry"
            onAction={() => onRetry(latest.id)}
          />
          <FactStrip facts={latest.facts} lang={lang} />
        </div>
      ) : null}
      <RecapHistory entries={older} lang={lang} onAsk={onAsk} />
    </div>
  );
}
