import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { SportId } from '@shared/sports/types';
import { Button } from '@/components/Button';
import { SpeakButton } from '@/features/voice';
import { format, useStrings } from '@/i18n/useStrings';
import { fetchLearnMoment, ruleFor, type LearnMoment } from './learnService';
import type { LearnItem } from './learnQueue';
import styles from './LearnCard.module.scss';

export interface LearnCardProps {
  readonly item: LearnItem;
  readonly sport: SportId;
  readonly matchId: string;
  readonly queued: number;
  readonly learnedCount: number;
  readonly autoRead: boolean;
  readonly onGotIt: () => void;
  readonly onClose: () => void;
  readonly onMore: (term: string) => void;
  readonly onOpenGlossary: () => void;
}

interface Settled {
  readonly key: string;
  readonly moment: LearnMoment | null;
}

/**
 * One rule explained at one moment. The title and rule line come from the bundled rulebook and
 * show immediately; the "in this match" line arrives from /api/learn (skeleton until then, and
 * simply absent when offline).
 */
export function LearnCard(props: LearnCardProps) {
  const { item, sport, matchId, queued, learnedCount, autoRead } = props;
  const { lang, langAttr, t } = useStrings();
  const rule = ruleFor(sport, item.ruleId);
  const key = `${matchId}:${item.seq}:${item.ruleId}:${lang}`;
  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchLearnMoment({
      matchId,
      seq: item.seq,
      ruleId: item.ruleId,
      lang,
      signal: controller.signal,
    }).then((moment) => {
      if (!controller.signal.aborted) setSettled({ key, moment });
    });
    return () => controller.abort();
  }, [matchId, item.seq, item.ruleId, lang, key]);

  if (!rule) return null;
  const term = rule.term[lang];
  const short = rule.short[lang];
  const loading = settled?.key !== key;
  const moment = loading ? null : (settled?.moment ?? null);
  const fallbackText = [term, short, moment?.moment].filter(Boolean).join('. ');

  return (
    <section className={styles.card} aria-label={`${t.learnToggleLabel}: ${term}`} lang={langAttr}>
      <header className={styles.header}>
        <p className={styles.overline}>{format(t.learnOverline, { term })}</p>
        <button type="button" className={styles.close} aria-label={t.learnClose} onClick={props.onClose}>
          <X size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </header>
      <h2 className={styles.title}>{term}</h2>
      <p className={styles.rule}>{short}</p>
      {loading ? (
        <div className={styles.skeleton} role="status" aria-label={t.learnLoadingMoment} />
      ) : moment ? (
        <p className={styles.moment}>
          <span className={styles.momentLabel}>{t.learnInThisMatch}</span> {moment.moment}
        </p>
      ) : null}
      <div className={styles.actions}>
        {loading ? null : (
          <SpeakButton
            text={moment?.speak || fallbackText}
            lang={lang}
            source={moment ? { kind: 'learn', id: moment.id } : undefined}
            autoPlay={autoRead}
            compact
          />
        )}
        <Button size="sm" onClick={props.onGotIt}>
          {t.learnGotIt}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => props.onMore(term)}>
          {t.learnMore}
        </Button>
      </div>
      <footer className={styles.footer}>
        {queued > 0 ? <span className={styles.queue}>{format(t.learnQueued, { n: queued })}</span> : null}
        {learnedCount > 0 ? (
          <button type="button" className={styles.learned} onClick={props.onOpenGlossary}>
            {format(t.learnedCount, { n: learnedCount })}
          </button>
        ) : null}
      </footer>
    </section>
  );
}
