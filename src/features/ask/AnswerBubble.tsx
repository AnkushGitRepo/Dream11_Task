import { SpeakButton } from '@/features/voice';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { LANG_ATTR } from '@shared/i18n/strings';
import { useStrings } from '@/i18n/useStrings';
import type { AskTurn } from './types';
import { TypingDots } from './TypingDots';
import styles from './AskThread.module.scss';

/** The answer side of a turn: typing dots while pending, text (fades in) once done. */
export function AnswerBubble({ turn }: { readonly turn: AskTurn }) {
  const { t } = useStrings();
  if (turn.status === 'pending') {
    return (
      <div className={`${styles.bubble} ${styles.answer}`}>
        <TypingDots label={t.askThinking} />
      </div>
    );
  }
  if (turn.status !== 'done' || turn.answer === undefined) return null;
  const known = turn.source !== 'unknown';
  return (
    <div className={`${styles.bubble} ${styles.answer} ${styles.reveal}`}>
      <span className={styles.srOnly}>{t.askAnswerLabel}: </span>
      <p className={styles.text} lang={LANG_ATTR[turn.lang]}>
        {turn.answer}
      </p>
      <div className={styles.meta}>
        {known ? <VerifiedBadge /> : null}
        <SpeakButton
          text={turn.answer}
          lang={turn.lang}
          source={
            turn.answerId && turn.answerToken
              ? { kind: 'answer', id: turn.answerId, token: turn.answerToken }
              : undefined
          }
          compact
        />
      </div>
    </div>
  );
}
