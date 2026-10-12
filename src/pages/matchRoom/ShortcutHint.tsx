import { useStrings } from '@/i18n/useStrings';
import styles from './ShortcutHint.module.scss';

/** Desktop-only footer hint for keyboard shortcuts (hidden below 900px). */
export function ShortcutHint() {
  const { t, langAttr } = useStrings();
  return (
    <p className={styles.hint} lang={langAttr}>
      {t.shortcutHint}
    </p>
  );
}
