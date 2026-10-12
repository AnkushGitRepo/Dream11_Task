import { STEPS } from './content';
import { Section, SectionTitle } from './Section';
import styles from './HowItWorks.module.scss';

export function HowItWorks() {
  return (
    <Section id="how" labelledBy="how-title">
      <SectionTitle id="how-title">How it works</SectionTitle>
      <ol className={styles.list} role="list">
        {STEPS.map((step, i) => (
          <li key={step.title} className={styles.item}>
            <span className={styles.numeral} aria-hidden="true">
              {i + 1}
            </span>
            <h3 className={styles.heading}>{step.title}</h3>
            <p className={styles.text}>{step.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
