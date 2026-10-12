import { BottomSheet } from '@/components/BottomSheet';
import { useStrings } from '@/i18n/useStrings';
import styles from './VerifiedInfoSheet.module.scss';

export interface VerifiedInfoSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

/** "Numbers by code. Words by AI." with the 4-step pipeline as a semantic ordered list. */
export function VerifiedInfoSheet({ open, onClose }: VerifiedInfoSheetProps) {
  const { t } = useStrings();
  const steps = [t.verifiedStep1, t.verifiedStep2, t.verifiedStep3, t.verifiedStep4];

  return (
    <BottomSheet open={open} onClose={onClose} title={t.verifiedTitle}>
      <ol className={styles.flow} aria-label={t.verifiedFlowLabel}>
        {steps.map((step, i) => (
          <li key={step} className={styles.step}>
            <span className={styles.index} aria-hidden="true">
              {i + 1}
            </span>
            <span className={styles.text}>{step}</span>
            {i < steps.length - 1 ? (
              <span className={styles.arrow} aria-hidden="true">
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <p className={styles.note}>{t.verifiedFallback}</p>
    </BottomSheet>
  );
}
