import { useContext, useState } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { BottomSheet } from '@/components/BottomSheet';
import { useStrings } from '@/i18n/useStrings';
import { VerifiedInfoContext } from './VerifiedInfoContext';
import styles from './VerifiedBadge.module.scss';

export interface VerifiedBadgeProps {
  /** "Template" when the number guard fell back to safe template text. */
  readonly variant?: 'verified' | 'template';
}

export function VerifiedBadge({ variant = 'verified' }: VerifiedBadgeProps) {
  const [open, setOpen] = useState(false);
  const openShared = useContext(VerifiedInfoContext);
  const Icon = variant === 'verified' ? ShieldCheck : ShieldAlert;
  const { t } = useStrings();
  const copy =
    variant === 'verified'
      ? { label: t.verifiedLabel, text: t.verifiedText }
      : { label: t.templateLabel, text: t.templateText };

  return (
    <>
      <button
        type="button"
        className={styles.badge}
        onClick={() => (openShared ? openShared() : setOpen(true))}
        aria-haspopup="dialog"
      >
        <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
        <span>{copy.label}</span>
      </button>
      <BottomSheet open={open && !openShared} onClose={() => setOpen(false)} title={t.verifiedTitle}>
        <p className={styles.sheetText}>{copy.text}</p>
        <p className={styles.sheetText}>{t.verifiedFallback}</p>
      </BottomSheet>
    </>
  );
}
