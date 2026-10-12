import { SOURCES } from './content';
import styles from './Footer.module.scss';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.row}>
          <span>Prototype by Ankush</span>
          <span>Ball-by-ball data: Cricsheet (ODC-BY)</span>
          <span>No login. Nothing stored.</span>
        </p>
        <section aria-labelledby="sources-title">
          <h2 id="sources-title" className={styles.heading}>
            Sources
          </h2>
          <ul className={styles.sources}>
            {SOURCES.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      </div>
    </footer>
  );
}
