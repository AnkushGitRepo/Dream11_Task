import { useState } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { BottomSheet } from '@/components/BottomSheet';
import styles from './VerifiedBadge.module.scss';

export interface VerifiedBadgeProps {
  /** "Template" when the number guard fell back to safe template text. */
  readonly variant?: 'verified' | 'template';
}

const COPY = {
  verified: {
    label: 'Verified stats',
    text: 'Every number here was computed from the ball-by-ball data, not written by AI.',
  },
  template: {
    label: 'Template',
    text: "The AI text didn't pass our number check, so we used a safe template. Every number still comes from the data.",
  },
} as const;

export function VerifiedBadge({ variant = 'verified' }: VerifiedBadgeProps) {
  const [open, setOpen] = useState(false);
  const Icon = variant === 'verified' ? ShieldCheck : ShieldAlert;
  const copy = COPY[variant];

  return (
    <>
      <button type="button" className={styles.badge} onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
        <span>{copy.label}</span>
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Numbers by code. Words by AI.">
        <p className={styles.sheetText}>{copy.text}</p>
        <p className={styles.sheetText}>
          If the AI writes a number that isn&apos;t in the stats, we replace its text with a safe template.
        </p>
      </BottomSheet>
    </>
  );
}
