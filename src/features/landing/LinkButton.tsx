import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './LinkButton.module.scss';

export interface LinkButtonProps {
  readonly to: string;
  readonly variant?: 'primary' | 'ghost';
  readonly children: ReactNode;
  readonly compact?: boolean;
}

/** Router link styled like Button (Button itself renders a <button>, wrong for navigation). */
export function LinkButton({ to, variant = 'primary', compact = false, children }: LinkButtonProps) {
  const cls = [styles.link, styles[variant], compact ? styles.compact : ''].filter(Boolean).join(' ');
  return (
    <Link to={to} className={cls}>
      {children}
    </Link>
  );
}
