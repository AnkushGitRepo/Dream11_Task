import { useEffect, useRef, type Ref } from 'react';
import type { SportId } from '@shared/sports/types';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { useStrings } from '@/i18n/useStrings';
import { AskThread } from './AskThread';
import { Composer } from './Composer';
import type { AskContext } from './types';
import { useAsk } from './useAsk';
import styles from './AskTab.module.scss';

export interface AskTabProps {
  readonly matchId: string;
  /**
   * Called at send/retry time. Return the latest played seq and the engine snapshot facts
   * (`sportUi.snapshot(...)`). Read lazily so the tab does not re-render on every ball.
   */
  readonly getContext: () => AskContext;
  /** Focus target for the '/' shortcut. */
  readonly inputRef?: Ref<HTMLInputElement>;
  /** Sport whose rulebook answers "what is X" questions. */
  readonly sport?: SportId;
  /** Ask this question once per new `id` (Learn card "More"). */
  readonly request?: { readonly id: number; readonly text: string } | null;
}

export function AskTab({ matchId, getContext, inputRef, sport, request }: AskTabProps) {
  const { t, lang } = useStrings();
  const { turns, send, retry } = useAsk(matchId, lang, getContext, sport);
  const suggestions = [t.askSuggestNeed, t.askSuggestScore, t.askSuggestBatting, t.askSuggestBowler];
  const handled = useRef<number | null>(null);
  useEffect(() => {
    if (!request || handled.current === request.id) return;
    handled.current = request.id;
    send(request.text);
  }, [request, send]);

  return (
    <div className={styles.tab}>
      {turns.length === 0 ? (
        <>
          <EmptyState title={t.askEmptyTitle} text={t.askEmptyText} />
          <ul className={styles.chips} aria-label={t.askSuggestionsLabel}>
            {suggestions.map((q) => (
              <li key={q}>
                <Chip onClick={() => send(q)}>{q}</Chip>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <AskThread turns={turns} onRetry={retry} />
      )}
      <Composer onSend={send} inputRef={inputRef} />
    </div>
  );
}
