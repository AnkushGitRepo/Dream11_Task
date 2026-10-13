import { memo } from 'react';
import { Chip } from '@/components/Chip';
import { Button } from '@/components/Button';
import { useTeachable } from '@/features/learn';
import type { TimelineEvent } from '@shared/sports/types';
import styles from './MomentItem.module.scss';

export interface MomentItemProps {
  readonly event: TimelineEvent;
  /** Localised label for the event kind (already resolved, with fallback). */
  readonly kindLabel: string;
  readonly recapLabel: string;
  readonly recapAria: string;
  /** Must be referentially stable so rows skip re-render on replay ticks. */
  readonly onRecapFrom: (seq: number) => void;
}

function MomentItemBase({ event, kindLabel, recapLabel, recapAria, onRecapFrom }: MomentItemProps) {
  const teach = useTeachable(event.seq);
  return (
    <li className={styles.row} data-tone={event.tone}>
      <span className={styles.clock}>{event.clock}</span>
      {teach ? (
        <Chip
          tone={event.tone}
          className={styles.teachable}
          onClick={teach.onLearn}
          label={`${kindLabel} — ${teach.ariaHint}`}
        >
          {kindLabel}
          <span className={styles.dot} aria-hidden="true" />
        </Chip>
      ) : (
        <Chip tone={event.tone}>{kindLabel}</Chip>
      )}
      <p className={styles.text}>{event.text}</p>
      <Button
        variant="ghost"
        size="sm"
        className={styles.recap}
        aria-label={recapAria}
        onClick={() => onRecapFrom(event.seq)}
      >
        {recapLabel}
      </Button>
    </li>
  );
}

export const MomentItem = memo(MomentItemBase);
