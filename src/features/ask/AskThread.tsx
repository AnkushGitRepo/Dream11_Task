import { useEffect, useRef } from 'react';
import { useStrings } from '@/i18n/useStrings';
import { AnswerBubble } from './AnswerBubble';
import type { AskTurn } from './types';
import styles from './AskThread.module.scss';

export interface AskThreadProps {
  /** Oldest first. */
  readonly turns: readonly AskTurn[];
  readonly onRetry: (id: number) => void;
}

export function AskThread({ turns, onRetry }: AskThreadProps) {
  const { t } = useStrings();
  const end = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (turns.length > 0) end.current?.scrollIntoView?.({ block: 'end' });
  }, [turns]);

  return (
    <ol className={styles.thread} aria-label={t.askThreadLabel}>
      {turns.map((turn) => (
        <li key={turn.id} className={styles.turn}>
          <div className={`${styles.bubble} ${styles.fan}`}>
            <span className={styles.srOnly}>{t.askYouLabel}: </span>
            <p className={styles.text}>{turn.question}</p>
          </div>
          <AnswerBubble turn={turn} />
          {turn.status === 'error' ? (
            <p className={styles.error} role="alert">
              <span>{turn.failure === 'rateLimited' ? t.askRateLimited : t.askError}</span>{' '}
              <button type="button" className={styles.retry} onClick={() => onRetry(turn.id)}>
                {t.askRetry}
              </button>
            </p>
          ) : null}
        </li>
      ))}
      <li ref={end} aria-hidden="true" className={styles.end} />
    </ol>
  );
}
