import type { Lang } from '@shared/sports/types';
import { ErrorState } from '@/components/ErrorState';
import { FactStrip } from '@/components/FactStrip';
import { useStrings } from '@/i18n/useStrings';
import { CatchUpEmpty } from './CatchUpEmpty';
import { RecapCard } from './RecapCard';
import { RecapHistory } from './RecapHistory';
import { RecapSkeleton } from './RecapSkeleton';
import type { RecapEntry } from './types';
import styles from './CatchUpTab.module.scss';

export interface CatchUpTabProps {
  /** Newest first. */
  readonly entries: readonly RecapEntry[];
  /** Current UI language (facts of a failed recap render in it). Recaps keep their own language. */
  readonly lang: Lang;
  /** Nothing new since the newest recap. */
  readonly caughtUp: boolean;
  readonly onRetry: (id: number) => void;
  readonly onSimulate: () => void;
  readonly onAsk: () => void;
}

export function CatchUpTab({ entries, lang, caughtUp, onRetry, onSimulate, onAsk }: CatchUpTabProps) {
  const { t } = useStrings();
  const [latest, ...older] = entries;
  if (!latest) return <CatchUpEmpty onSimulate={onSimulate} />;

  return (
    <div className={styles.stack}>
      {caughtUp && latest.status === 'ready' ? (
        <p className={styles.caughtUp} role="status">
          {t.catchupCaughtUp}
        </p>
      ) : null}
      {latest.status === 'loading' ? <RecapSkeleton /> : null}
      {latest.status === 'ready' ? (
        <RecapCard entry={latest} onAsk={onAsk} autoPlay={latest.speakOnArrival} />
      ) : null}
      {latest.status === 'error' ? (
        <div>
          <ErrorState
            title={t.catchupErrorTitle}
            text={t.catchupErrorText}
            actionLabel={t.catchupRetry}
            onAction={() => onRetry(latest.id)}
          />
          <FactStrip facts={latest.facts} lang={lang} />
        </div>
      ) : null}
      <RecapHistory entries={older} onAsk={onAsk} />
    </div>
  );
}
