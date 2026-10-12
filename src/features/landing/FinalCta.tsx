import { DEMO_PATH } from './content';
import { LinkButton } from './LinkButton';
import { Section } from './Section';
import styles from './FinalCta.module.scss';

export function FinalCta() {
  return (
    <Section labelledBy="cta-title" className={styles.band}>
      <h2 id="cta-title" className={styles.title}>
        The match won’t wait. <span className={styles.accent}>Your catch-up can.</span>
      </h2>
      <LinkButton to={DEMO_PATH}>Open live demo →</LinkButton>
    </Section>
  );
}
