import { useEffect, useState } from 'react';
import { LANG_ATTR } from '@shared/i18n/strings';
import type { Lang } from '@shared/sports/types';
import { FactStrip } from '@/components/FactStrip';
import { SegmentedControl } from '@/components/SegmentedControl';
import { loadIndicFont } from '@/i18n/loadIndicFont';
import { demoRecapText, getDemoModel } from './demoModel';
import { Section, SectionTitle } from './Section';
import styles from './LanguageShowcase.module.scss';

const OPTIONS: readonly { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'hinglish', label: 'Hing' },
  { value: 'hi', label: 'हिं' },
  { value: 'gu', label: 'ગુ' },
];

export function LanguageShowcase() {
  const [lang, setLang] = useState<Lang>('en');
  const { window } = getDemoModel();
  const { lead, body } = demoRecapText(window.facts, lang);

  useEffect(() => {
    loadIndicFont(lang);
  }, [lang]);

  return (
    <Section labelledBy="lang-title">
      <SectionTitle id="lang-title">One recap. Your language.</SectionTitle>
      <div className={styles.control}>
        <SegmentedControl options={OPTIONS} value={lang} onChange={setLang} label="Recap language" />
      </div>
      <div
        className={styles.panel}
        role="tabpanel"
        aria-live="polite"
        aria-label="Recap preview"
        data-testid="showcase-text"
        lang={LANG_ATTR[lang]}
      >
        <p className={styles.lead}>{lead}</p>
        {body ? <p className={styles.body}>{body}</p> : null}
        <FactStrip facts={window.facts} lang={lang} />
      </div>
    </Section>
  );
}
