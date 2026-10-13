import type { CSSProperties } from 'react';
import { MessageCircle, Share2 } from 'lucide-react';
import { LANG_ATTR } from '@shared/i18n/strings';
import { Button } from '@/components/Button';
import { FactStrip } from '@/components/FactStrip';
import { useToast } from '@/components/Toast';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { SpeakButton } from '@/features/voice';
import { format, useStrings } from '@/i18n/useStrings';
import type { RecapEntry } from './types';
import styles from './RecapCard.module.scss';

export interface RecapCardProps {
  readonly entry: RecapEntry;
  readonly onAsk: () => void;
  /** Read the recap aloud once on mount (settings.autoRead). Only pass for the newest recap. */
  readonly autoPlay?: boolean;
}

const line = (i: number) => ({ '--i': i }) as CSSProperties;

export function RecapCard({ entry, onAsk, autoPlay = false }: RecapCardProps) {
  const { t } = useStrings();
  const toast = useToast();
  const { recap } = entry;
  if (!recap) return null;
  const attr = LANG_ATTR[entry.lang];
  const spoken = [recap.lead, recap.body].filter(Boolean).join(' ');

  return (
    <article className={styles.card} aria-label={t.recapAria}>
      <header className={`${styles.header} ${styles.line}`} style={line(0)}>
        <p className={styles.overline}>{format(t.recapSince, { clock: entry.clock, label: entry.label })}</p>
        <VerifiedBadge variant={recap.source === 'ai' ? 'verified' : 'template'} />
      </header>
      <p className={`${styles.lead} ${styles.line}`} style={line(1)} lang={attr}>
        {recap.lead}
      </p>
      {recap.body ? (
        <p className={`${styles.body} ${styles.line}`} style={line(2)} lang={attr}>
          {recap.body}
        </p>
      ) : null}
      <div className={styles.line} style={line(3)}>
        <FactStrip facts={entry.facts} lang={entry.lang} />
      </div>
      <div className={`${styles.actions} ${styles.line}`} style={line(4)}>
        <SpeakButton
          text={spoken}
          lang={entry.lang}
          source={recap.id ? { kind: 'recap', id: recap.id } : undefined}
          autoPlay={autoPlay}
        />
        <Button variant="ghost" size="sm" onClick={() => toast.show(t.catchupComingSoon)}>
          <Share2 size={18} strokeWidth={1.75} aria-hidden="true" />
          {t.catchupShare}
        </Button>
        <Button variant="secondary" size="sm" onClick={onAsk}>
          <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" />
          {t.catchupAsk}
        </Button>
      </div>
    </article>
  );
}
