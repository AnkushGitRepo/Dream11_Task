import { Link } from 'react-router-dom';
import { Wordmark } from '@/components/AppBar/Wordmark';
import { DEMO_PATH } from './content';
import { LinkButton } from './LinkButton';
import styles from './Nav.module.scss';

export function Nav() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main">
        <Link to="/" className={styles.brand} aria-label="kya hua? home">
          <Wordmark />
        </Link>
        <div className={styles.right}>
          <a href="#how" className={styles.anchor}>
            How it works
          </a>
          <LinkButton to={DEMO_PATH} compact>
            Try the demo
          </LinkButton>
        </div>
      </nav>
    </header>
  );
}
