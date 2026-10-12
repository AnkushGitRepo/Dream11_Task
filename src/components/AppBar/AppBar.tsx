import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInView } from '@/hooks/useInView';
import { Wordmark } from './Wordmark';
import styles from './AppBar.module.scss';

export interface AppBarProps {
  /** Present => back chevron linking here; absent => wordmark. */
  readonly backTo?: string;
  readonly backLabel?: string;
  readonly title?: string;
  readonly subtitle?: string;
  /** Right slot (language chip, settings...). */
  readonly right?: ReactNode;
}

export function AppBar({ backTo, backLabel = 'Back', title, subtitle, right }: AppBarProps) {
  // The sentinel sits at the very top of the page; once it leaves the viewport we are scrolled.
  const [sentinelRef, atTop] = useInView<HTMLDivElement>();
  const left = backTo ? (
    <Link to={backTo} className={styles.back} aria-label={backLabel}>
      <ChevronLeft size={22} strokeWidth={1.75} aria-hidden="true" />
    </Link>
  ) : (
    <Wordmark />
  );

  return (
    <>
      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      <header className={`${styles.bar} ${atTop ? '' : styles.scrolled}`.trim()}>
        <div className={styles.inner}>
          <div className={styles.left}>{left}</div>
          {title ? (
            <div className={styles.centre}>
              <h1 className={styles.title}>{title}</h1>
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>
          ) : (
            <div className={styles.centre} />
          )}
          <div className={styles.right}>{right}</div>
        </div>
      </header>
    </>
  );
}
