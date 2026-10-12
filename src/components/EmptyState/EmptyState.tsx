import type { ReactNode } from 'react';
import styles from './EmptyState.module.scss';

export interface EmptyStateProps {
  /** Big Archivo line. */
  readonly title: string;
  readonly text?: string;
  /** One action (Button). */
  readonly action?: ReactNode;
  readonly role?: 'status' | 'alert';
  readonly className?: string;
}

export function EmptyState({ title, text, action, role, className }: EmptyStateProps) {
  return (
    <div className={`${styles.root} ${className ?? ''}`.trim()} role={role}>
      <h2 className={styles.title}>{title}</h2>
      {text ? <p className={styles.text}>{text}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
