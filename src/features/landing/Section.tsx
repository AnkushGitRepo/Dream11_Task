import type { ReactNode } from 'react';
import styles from './Section.module.scss';

export interface SectionProps {
  readonly id?: string;
  /** id of the heading inside; names the landmark. */
  readonly labelledBy: string;
  readonly children: ReactNode;
  readonly className?: string;
}

/** Page section with the shared vertical rhythm and max-width container. */
export function Section({ id, labelledBy, children, className }: SectionProps) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`${styles.section} ${className ?? ''}`.trim()}>
      <div className={styles.inner}>{children}</div>
    </section>
  );
}

export function SectionTitle({ id, children }: { readonly id: string; readonly children: ReactNode }) {
  return (
    <h2 id={id} className={styles.title}>
      {children}
    </h2>
  );
}
