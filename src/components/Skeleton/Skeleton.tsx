import type { CSSProperties } from 'react';
import styles from './Skeleton.module.scss';

export interface SkeletonProps {
  /** Any CSS length, e.g. '100%' or 'var(--s-10)'. */
  readonly width?: string;
  readonly height?: string;
  readonly radius?: string;
  readonly className?: string;
}

export function Skeleton({ width, height, radius, className }: SkeletonProps) {
  const vars: Record<string, string> = {};
  if (width) vars['--sk-w'] = width;
  if (height) vars['--sk-h'] = height;
  if (radius) vars['--sk-r'] = radius;
  return (
    <span
      className={`${styles.skeleton} ${className ?? ''}`.trim()}
      style={vars as CSSProperties}
      aria-hidden="true"
    />
  );
}
