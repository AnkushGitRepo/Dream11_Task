import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Chip } from '@/components/Chip';
import { useStrings } from '@/i18n/useStrings';
import type { MatchIndexEntry } from '@/mocks/matches.mock';
import { Monogram } from './Monogram';
import styles from './FeaturedCard.module.scss';

export interface FeaturedCardProps {
  readonly entry: MatchIndexEntry;
  /** Solid accent background: the page's single bold red moment. */
  readonly accent?: boolean;
}

export function FeaturedCard({ entry, accent = false }: FeaturedCardProps) {
  const { t, langAttr } = useStrings();
  const classes = `${styles.card} ${accent ? styles.accent : ''}`.trim();
  const name = `${entry.scores[0].code} v ${entry.scores[1].code}`;

  const body = (
    <>
      <span className={styles.overline} lang="en">
        {entry.competition}
      </span>
      <span className={styles.teams} lang="en">
        {entry.scores.map((side) => (
          <span key={side.code} className={styles.team}>
            <Monogram code={side.code} />
            <span className={styles.score}>{side.score}</span>
            <span className={styles.srOnly}>{side.code}</span>
          </span>
        ))}
      </span>
      <span className={styles.foot}>
        <span className={styles.hook} lang="en">
          {entry.hook}
        </span>
        {entry.playable ? (
          <span className={styles.pill} lang={langAttr}>
            {t.replayCta}
            <Play size={14} strokeWidth={1.75} fill="currentColor" aria-hidden="true" />
          </span>
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
      <Link
        to={`/match/${entry.meta.id}`}
        className={classes}
        aria-label={`${name}, ${entry.hook}. ${t.replayCta}`}
      >
        {body}
      </Link>
    );
  }
  return (
    <div
      role="group"
      aria-disabled="true"
      aria-label={`${name}, ${t.comingSoonChip}`}
      className={`${classes} ${styles.soon}`}
    >
      {body}
    </div>
  );
}
