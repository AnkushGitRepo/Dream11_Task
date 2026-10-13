import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getRulebook } from '@shared/sports/rules';
import type { SportId } from '@shared/sports/types';
import { BottomSheet } from '@/components/BottomSheet';
import { SpeakButton } from '@/features/voice';
import { format, useStrings } from '@/i18n/useStrings';
import { isLearned, useLearnState } from './learnStore';
import styles from './GlossarySheet.module.scss';

export interface GlossarySheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly sport: SportId;
}

/**
 * Every rule of a sport: learned ones first, then the rest. Works with no match data at all, so
 * Football and Kabaddi cards can open it too. Listen uses the basic browser voice here (these
 * texts are not server-registered for natural voice).
 */
export function GlossarySheet({ open, onClose, sport }: GlossarySheetProps) {
  const { lang, langAttr, t } = useStrings();
  useLearnState(); // re-render when a rule is marked learned
  const [expanded, setExpanded] = useState<string | null>(null);
  const rules = getRulebook(sport);
  const learned = rules.filter((r) => isLearned(sport, r.id));
  const rest = rules.filter((r) => !isLearned(sport, r.id));

  const renderGroup = (title: string, group: typeof rules) =>
    group.length === 0 ? null : (
      <section className={styles.group}>
        <h3 className={styles.groupTitle}>{title}</h3>
        <ul className={styles.list}>
          {group.map((rule) => {
            const term = rule.term[lang];
            const isOpen = expanded === rule.id;
            return (
              <li key={rule.id} className={styles.item} lang={langAttr}>
                <button
                  type="button"
                  className={styles.row}
                  aria-expanded={isOpen}
                  aria-label={format(isOpen ? t.glossaryDetailHide : t.glossaryDetailShow, { term })}
                  onClick={() => setExpanded(isOpen ? null : rule.id)}
                >
                  <span className={styles.term}>{term}</span>
                  <ChevronDown size={18} strokeWidth={1.75} aria-hidden="true" className={styles.chev} />
                </button>
                <p className={styles.short}>{rule.short[lang]}</p>
                {isOpen ? (
                  <div className={styles.detail}>
                    <p>{rule.detail[lang]}</p>
                    <SpeakButton
                      text={`${term}. ${rule.short[lang]} ${rule.detail[lang]}`}
                      lang={lang}
                      compact
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    );

  return (
    <BottomSheet open={open} onClose={onClose} title={t.glossaryTitle}>
      {renderGroup(t.glossaryLearned, learned)}
      {renderGroup(t.glossaryNotYet, rest)}
    </BottomSheet>
  );
}
