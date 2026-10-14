import { useState } from 'react';
import { getRule } from '@shared/sports/rules';
import type { SportId } from '@shared/sports/types';
import { GlossarySheet } from '@/features/learn/GlossarySheet';
import { LEARN_SPORTS } from './content';
import styles from './LearnSportChips.module.scss';

/** "LBW (leg before wicket)" -> "LBW": the chip shows the name, the glossary has the expansion. */
const shortTerm = (term: string): string => term.split(' (')[0] ?? term;

/** One chip per sport with two example rules; each opens that sport's glossary (rulebooks ship today). */
export function LearnSportChips() {
  const [open, setOpen] = useState<SportId | null>(null);
  return (
    <>
      <ul className={styles.list}>
        {LEARN_SPORTS.map(({ sport, name, ruleIds }) => (
          <li key={sport} className={styles.item}>
            <button
              type="button"
              className={styles.chip}
              aria-label={`Open the ${name} rules glossary`}
              onClick={() => setOpen(sport)}
            >
              <span className={styles.name}>{name}</span>
              <span className={styles.examples}>
                {ruleIds.map((id) => (
                  <span key={id} className={styles.example}>
                    {shortTerm(getRule(sport, id)?.term.en ?? id)}
                  </span>
                ))}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open ? <GlossarySheet open onClose={() => setOpen(null)} sport={open} /> : null}
    </>
  );
}
