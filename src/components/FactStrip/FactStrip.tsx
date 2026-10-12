import type { Fact, Lang } from '@shared/sports/types';
import { Chip } from '@/components/Chip';
import styles from './FactStrip.module.scss';

export interface FactStripProps {
  readonly facts: readonly Fact[];
  readonly lang: Lang;
}

/** Compact chips built from engine facts. Rendered even when the AI text fails. */
export function FactStrip({ facts, lang }: FactStripProps) {
  if (facts.length === 0) return null;
  return (
    <ul className={styles.strip} aria-label="Key facts">
      {facts.map((fact) => (
        <li key={fact.key}>
          <Chip>{fact.label[lang]}</Chip>
        </li>
      ))}
    </ul>
  );
}
