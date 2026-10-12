import { useStrings } from '@/i18n/useStrings';
import type { MatchIndexEntry } from '@/mocks/matches.mock';
import { FeaturedCard } from './FeaturedCard';
import { MatchRow } from './MatchRow';
import styles from './MatchesSections.module.scss';

export function LiveNow() {
  const { t, langAttr } = useStrings();
  return (
    <section className={styles.section} aria-labelledby="live-now-h">
      <h2 id="live-now-h" className={styles.h2} lang={langAttr}>
        {t.liveNow}
      </h2>
      <p className={styles.empty} lang={langAttr}>
        {t.liveNowEmpty}
      </p>
    </section>
  );
}

export function Featured({ matches }: { readonly matches: readonly MatchIndexEntry[] }) {
  const { t, langAttr } = useStrings();
  const featured = matches.filter((m) => m.featured);
  return (
    <section className={styles.section} aria-labelledby="featured-h">
      <h2 id="featured-h" className={styles.h2} lang={langAttr}>
        {t.featuredReplays}
      </h2>
      <ul className={styles.carousel}>
        {featured.map((entry, index) => (
          <li key={entry.meta.id} className={styles.slide}>
            <FeaturedCard entry={entry} accent={index === 0} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AllReplays({ matches }: { readonly matches: readonly MatchIndexEntry[] }) {
  const { t, langAttr } = useStrings();
  return (
    <section className={styles.section} aria-labelledby="all-h">
      <h2 id="all-h" className={styles.h2} lang={langAttr}>
        {t.allReplays}
      </h2>
      <ul className={styles.list}>
        {matches.map((entry) => (
          <li key={entry.meta.id}>
            <MatchRow entry={entry} />
          </li>
        ))}
      </ul>
    </section>
  );
}
