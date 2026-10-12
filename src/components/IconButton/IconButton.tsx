import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './IconButton.module.scss';

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'children'
> {
  /** Accessible name (required). */
  readonly label: string;
  readonly icon: ReactNode;
  readonly active?: boolean;
}

export function IconButton({
  label,
  icon,
  active = false,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const classes = [styles.iconButton, active ? styles.active : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <button {...rest} type={type} aria-label={label} className={classes}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}
