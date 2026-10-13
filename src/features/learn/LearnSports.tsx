import { useState } from 'react';
import type { SportId } from '@shared/sports/types';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { format, useStrings } from '@/i18n/useStrings';
import { GlossarySheet } from './GlossarySheet';
import styles from './LearnSports.module.scss';

const SOON_SPORTS: readonly SportId[] = ['football', 'kabaddi'];

/**
 * Football and Kabaddi have no match data yet, but their rulebooks ship now: each card opens the
 * glossary for that sport so a new fan can learn the game before the matches arrive.
 */
export function LearnSports() {
  const { t, langAttr } = useStrings();
  const [open, setOpen] = useState<SportId | null>(null);
  const names: Readonly<Record<string, string>> = {
    football: t.sportFootball,
    kabaddi: t.sportKabaddi,
  };

  return (
    <section className={styles.section} aria-labelledby="more-sports-h">
      <h2 id="more-sports-h" className={styles.h2} lang={langAttr}>
        {t.moreSports}
      </h2>
      <ul className={styles.list}>
        {SOON_SPORTS.map((sport) => {
          const name = names[sport] ?? sport;
          return (
            <li key={sport} className={styles.card}>
              <span className={styles.name} lang={langAttr}>
                {name}
              </span>
              <Chip>
                <span lang={langAttr}>{t.comingSoonChip}</span>
              </Chip>
              <Button
                variant="secondary"
                size="sm"
                className={styles.action}
                aria-label={format(t.learnTheRulesAria, { sport: name })}
                onClick={() => setOpen(sport)}
              >
                {t.learnTheRules}
              </Button>
            </li>
          );
        })}
      </ul>
      {open ? <GlossarySheet open onClose={() => setOpen(null)} sport={open} /> : null}
    </section>
  );
}
