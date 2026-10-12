import { PROBLEM_STATS } from './content';
import { Section } from './Section';
import styles from './ProblemStrip.module.scss';

export function ProblemStrip() {
  return (
    <Section labelledBy="problem-title" className={styles.band}>
      <h2 id="problem-title" className={styles.visuallyHidden}>
        The problem
      </h2>
      <ul className={styles.list}>
        {PROBLEM_STATS.map((stat) => (
          <li key={stat.big} className={styles.item}>
            <p className={styles.big}>{stat.big}</p>
            <p className={styles.caption}>{stat.caption}</p>
            <p className={styles.source}>Source: {stat.source}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
