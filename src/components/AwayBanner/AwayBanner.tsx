import { X } from 'lucide-react';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { useStrings } from '@/i18n/useStrings';
import styles from './AwayBanner.module.scss';

export interface AwayBannerProps {
  /** What was missed, already localised, e.g. "12 balls · 2 overs". */
  readonly label: string;
  readonly onCatchUp: () => void;
  readonly onDismiss: () => void;
}

const SLOT = '{label}';

export function AwayBanner({ label, onCatchUp, onDismiss }: AwayBannerProps) {
  const { t, langAttr } = useStrings();
  // The label is bold wherever the translation puts it (word order differs per language).
  const [before = '', after = ''] = t.awayMissed.split(SLOT);
  return (
    <div className={styles.banner} role="status" lang={langAttr}>
      <p className={styles.text}>
        {before}
        <strong>{label}</strong>
        {after}
      </p>
      <Button size="sm" className={styles.cta} onClick={onCatchUp}>
        {t.awayCatchUp}
      </Button>
      <IconButton label={t.dismiss} onClick={onDismiss} icon={<X size={22} strokeWidth={1.75} />} />
    </div>
  );
}
