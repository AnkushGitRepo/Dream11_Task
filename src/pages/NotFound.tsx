import { Link } from 'react-router-dom';
import { useLangEffects } from '@/i18n/useLangEffects';
import { useStrings } from '@/i18n/useStrings';
import styles from './NotFound.module.scss';

export default function NotFound() {
  useLangEffects();
  const { t, langAttr } = useStrings();
  return (
    <main className={styles.page} lang={langAttr}>
      <h1 className={styles.out}>{t.notFoundOut}</h1>
      <p className={styles.text}>{t.notFoundCaught}</p>
      <Link to="/matches" className={styles.cta}>
        {t.notFoundBack}
      </Link>
    </main>
  );
}
