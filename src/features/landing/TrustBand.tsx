import { GUARD_SENTENCE, PIPELINE } from './content';
import { Section, SectionTitle } from './Section';
import styles from './TrustBand.module.scss';

export function TrustBand() {
  return (
    <div data-theme="dark" className={styles.band}>
      <Section labelledBy="trust-title">
        <SectionTitle id="trust-title">Numbers by code. Words by AI.</SectionTitle>
        <ol className={styles.pipeline}>
          {PIPELINE.map((node) => (
            <li key={node.title} className={`${styles.node} ${node.ai ? styles.ai : ''}`.trim()}>
              <span className={styles.tag}>{node.tag}</span>
              <span className={styles.name}>{node.title}</span>
            </li>
          ))}
        </ol>
        <p className={styles.guard}>{GUARD_SENTENCE}</p>
      </Section>
    </div>
  );
}
