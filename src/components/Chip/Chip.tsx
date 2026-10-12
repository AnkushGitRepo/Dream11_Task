import type { MouseEventHandler, ReactNode } from 'react';
import type { EventTone } from '@shared/sports/types';
import styles from './Chip.module.scss';

export interface ChipProps {
  readonly children: ReactNode;
  /** Present => rendered as a toggle button. */
  readonly onClick?: MouseEventHandler<HTMLButtonElement>;
  /** Pass to make the chip a toggle (sets aria-pressed). Omit for plain action chips. */
  readonly selected?: boolean;
  /** Accessible name when the visible text isn't enough. */
  readonly label?: string;
  readonly tone?: EventTone;
  readonly className?: string;
}

export function Chip({ children, onClick, selected, tone, className, label }: ChipProps) {
  const classes = [
    styles.chip,
    tone ? styles[tone] : '',
    selected === true ? styles.selected : '',
    onClick ? styles.interactive : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} aria-pressed={selected} aria-label={label}>
        {children}
      </button>
    );
  }
  return (
    <span className={classes} aria-label={label}>
      {children}
    </span>
  );
}
