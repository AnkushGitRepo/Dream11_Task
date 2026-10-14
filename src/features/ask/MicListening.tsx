import { Mic } from 'lucide-react';
import { useStrings } from '@/i18n/useStrings';
import styles from './MicListening.module.scss';

export interface MicListeningProps {
  readonly transcript: string;
  /** Recording is over; the words are being worked out. Not tappable. */
  readonly transcribing?: boolean;
  readonly onStop: () => void;
}

/** Replaces the composer row while recognising: pulsing ring, live transcript, "Tap to stop". */
export function MicListening({ transcript, transcribing = false, onStop }: MicListeningProps) {
  const { t, langAttr } = useStrings();
  if (transcribing) {
    return (
      <div className={`${styles.listening} ${styles.busy}`} role="status" aria-live="polite">
        <Mic size={22} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
        <span className={styles.body}>
          <span className={styles.transcript}>{t.askTranscribing}</span>
        </span>
      </div>
    );
  }
  return (
    <button type="button" className={styles.listening} onClick={onStop}>
      <span className={styles.ring} aria-hidden="true" />
      <Mic size={22} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
      <span className={styles.body}>
        <span className={styles.transcript} aria-live="polite" lang={langAttr}>
          {transcript === '' ? t.askListening : transcript}
        </span>
        <span className={styles.hint}>{t.askTapToStop}</span>
      </span>
    </button>
  );
}
