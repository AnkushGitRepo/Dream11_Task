import { Mic } from 'lucide-react';
import { useStrings } from '@/i18n/useStrings';
import styles from './MicListening.module.scss';

export interface MicListeningProps {
  readonly transcript: string;
  readonly onStop: () => void;
}

/** Replaces the composer row while recognising: pulsing ring, live transcript, "Tap to stop". */
export function MicListening({ transcript, onStop }: MicListeningProps) {
  const { t, langAttr } = useStrings();
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
