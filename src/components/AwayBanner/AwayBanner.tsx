import { X } from 'lucide-react';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import styles from './AwayBanner.module.scss';

export interface AwayBannerProps {
  /** What was missed, e.g. "12 balls · 2 overs". */
  readonly label: string;
  readonly onCatchUp: () => void;
  readonly onDismiss: () => void;
}

export function AwayBanner({ label, onCatchUp, onDismiss }: AwayBannerProps) {
  return (
    <div className={styles.banner} role="status">
      <p className={styles.text}>
        You missed <strong>{label}</strong>
      </p>
      <Button size="sm" className={styles.cta} onClick={onCatchUp}>
        Catch me up
      </Button>
      <IconButton label="Dismiss" onClick={onDismiss} icon={<X size={22} strokeWidth={1.75} />} />
    </div>
  );
}
