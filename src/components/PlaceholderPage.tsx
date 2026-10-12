import { Link } from 'react-router-dom';
import styles from './PlaceholderPage.module.scss';

const LINKS = [
  { to: '/', label: 'Landing' },
  { to: '/matches', label: 'Matches' },
  { to: '/match/demo', label: 'Match room' },
  { to: '/nope', label: 'Not found' },
] as const;

interface PlaceholderPageProps {
  readonly title: string;
  readonly note: string;
}

export default function PlaceholderPage({ title, note }: PlaceholderPageProps) {
  return (
    <main className={styles.page}>
      <p className={styles.overline}>Placeholder</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.note}>{note}</p>
      <nav aria-label="Routes" className={styles.nav}>
        {LINKS.map((link) => (
          <Link key={link.to} to={link.to} className={styles.link}>
            {link.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
