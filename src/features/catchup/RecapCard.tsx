import type { CSSProperties } from 'react';
import { MessageCircle, Share2, Volume2 } from 'lucide-react';
import type { Lang } from '@shared/sports/types';
import { Button } from '@/components/Button';
import { FactStrip } from '@/components/FactStrip';
import { useToast } from '@/components/Toast';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { LANG_ATTR } from './config';
import type { RecapEntry } from './types';
import styles from './RecapCard.module.scss';

export interface RecapCardProps {
  readonly entry: RecapEntry;
  readonly lang: Lang;
  readonly onAsk: () => void;
}

const line = (i: number) => ({ '--i': i }) as CSSProperties;

export function RecapCard({ entry, lang, onAsk }: RecapCardProps) {
  const toast = useToast();
  const { recap } = entry;
  if (!recap) return null;
  const comingSoon = () => toast.show('Coming soon');

  return (
    <article className={styles.card} aria-label="Recap">
      <header className={`${styles.header} ${styles.line}`} style={line(0)}>
        <p className={styles.overline}>
          Since {entry.clock} · {entry.label}
        </p>
        <VerifiedBadge variant={recap.source === 'ai' ? 'verified' : 'template'} />
      </header>
      <p className={`${styles.lead} ${styles.line}`} style={line(1)} lang={LANG_ATTR[lang]}>
        {recap.lead}
      </p>
      {recap.body ? (
        <p className={`${styles.body} ${styles.line}`} style={line(2)} lang={LANG_ATTR[lang]}>
          {recap.body}
        </p>
      ) : null}
      <div className={styles.line} style={line(3)}>
        <FactStrip facts={entry.facts} lang={lang} />
      </div>
      <div className={`${styles.actions} ${styles.line}`} style={line(4)}>
        <Button variant="ghost" size="sm" onClick={comingSoon}>
          <Volume2 size={18} strokeWidth={1.75} aria-hidden="true" />
          Listen
        </Button>
        <Button variant="ghost" size="sm" onClick={comingSoon}>
          <Share2 size={18} strokeWidth={1.75} aria-hidden="true" />
          Share
        </Button>
        <Button variant="secondary" size="sm" onClick={onAsk}>
          <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" />
          Ask about this
        </Button>
      </div>
    </article>
  );
}
