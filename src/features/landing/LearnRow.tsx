import { getRule } from '@shared/sports/rules';
import { LEARN_MOCK } from './content';
import { Section, SectionTitle } from './Section';
import styles from './LearnRow.module.scss';

/** Feature row: Learn mode. The mock card reads its rule line from the real rulebook. */
export function LearnRow() {
  const rule = getRule('cricket', LEARN_MOCK.ruleId);
  if (!rule) return null;
  return (
    <Section labelledBy="learn-title">
      <div className={styles.row}>
        <div className={styles.copy}>
          <SectionTitle id="learn-title">New to a sport? Turn on Learn.</SectionTitle>
          <p className={styles.text}>{LEARN_MOCK.copy}</p>
        </div>
        <div className={styles.card} role="img" aria-label={LEARN_MOCK.aria}>
          <p className={styles.overline}>LEARN · {rule.term.en}</p>
          <p className={styles.title}>{rule.term.en}</p>
          <p className={styles.rule}>{rule.short.en}</p>
          <p className={styles.moment}>
            <span className={styles.label}>In this match</span> {LEARN_MOCK.moment}
          </p>
        </div>
      </div>
    </Section>
  );
}
