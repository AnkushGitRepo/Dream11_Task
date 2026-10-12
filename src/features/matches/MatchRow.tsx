import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Chip } from '@/components/Chip';
import { useStrings } from '@/i18n/useStrings';
import type { MatchIndexEntry } from '@/mocks/matches.mock';
import { formatMatchDate } from './formatMatchDate';
import { Monogram } from './Monogram';
import styles from './MatchRow.module.scss';

export function MatchRow({ entry }: { readonly entry: MatchIndexEntry }) {
  const { t, langAttr } = useStrings();
  const meta = `${entry.competitionShort} · ${entry.venueShort} · ${formatMatchDate(entry.meta.date)}`;

  const content: ReactNode = (
    <>
      <span className={styles.monos}>
        <Monogram code={entry.rowTeams[0]} />
        <Monogram code={entry.rowTeams[1]} />
      </span>
      <span className={styles.text} lang="en">
        <span className={styles.title}>{entry.rowTitle}</span>
        <span className={styles.meta}>{meta}</span>
        {entry.meta.result ? <span className={styles.result}>{entry.meta.result}</span> : null}
      </span>
      <span className={styles.end}>
        <Chip>{entry.meta.format}</Chip>
        {entry.playable ? (
          <ChevronRight size={22} strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Chip>
            <span lang={langAttr}>{t.comingSoonChip}</span>
          </Chip>
        )}
      </span>
    </>
  );

  if (entry.playable) {
    return (
      <Link to={`/match/${entry.meta.id}`} className={styles.row}>
        {content}
      </Link>
    );
  }
  return (
    <div
      role="group"
      aria-disabled="true"
      aria-label={`${entry.rowTitle}, ${t.comingSoonChip}`}
      className={`${styles.row} ${styles.soon}`}
    >
      {content}
    </div>
  );
}
