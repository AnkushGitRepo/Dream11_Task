import { SPORTS } from './content';
import { Section, SectionTitle } from './Section';
import styles from './SportsRow.module.scss';

export function SportsRow() {
  return (
    <Section labelledBy="sports-title">
      <SectionTitle id="sports-title">Every sport, next.</SectionTitle>
      <ul className={styles.list}>
        {SPORTS.map((sport) => (
          <li key={sport.name} className={`${styles.chip} ${sport.live ? styles.live : ''}`.trim()}>
            {sport.name}
            <span className={styles.state}>{sport.live ? 'Live' : 'Soon'}</span>
          </li>
        ))}
      </ul>
      <p className={styles.note}>One engine, any sport: each sport is a plug-in.</p>
    </Section>
  );
}
