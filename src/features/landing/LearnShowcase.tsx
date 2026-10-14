import { LEARN_COPY } from './content';
import { LearnDemoCard } from './LearnDemoCard';
import { LearnSportChips } from './LearnSportChips';
import { Section, SectionTitle } from './Section';
import styles from './LearnShowcase.module.scss';

/** Headline feature: Learn mode. Full-width, right after "How it works". */
export function LearnShowcase() {
  return (
    <Section id="learn" labelledBy="learn-title" className={styles.section}>
      <div className={styles.row}>
        <div className={styles.copy}>
          <p className={styles.overline}>New · Learn mode</p>
          <SectionTitle id="learn-title">New to a sport? Turn on Learn.</SectionTitle>
          {LEARN_COPY.map((line) => (
            <p key={line} className={styles.text}>
              {line}
            </p>
          ))}
        </div>
        <LearnDemoCard />
      </div>
      <h3 className={styles.chipsTitle}>Try the rulebooks, in your language</h3>
      <LearnSportChips />
    </Section>
  );
}
