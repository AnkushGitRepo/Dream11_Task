import { useState } from 'react';
import styles from './ScoreRoll.module.scss';

export interface ScoreRollProps {
  /** The score string, e.g. "144/4". */
  readonly value: string;
  /** Latest wicket seq (null = none yet). A new, higher value triggers the accent bar. */
  readonly wicketSeq: number | null;
}

/** Characters (right-aligned) that differ from the previous value. */
function changedIndexes(prev: string, cur: string): ReadonlySet<number> {
  const out = new Set<number>();
  for (let i = 1; i <= cur.length; i += 1) {
    if (prev.at(-i) !== cur.at(-i)) out.add(cur.length - i);
  }
  return out;
}

export function ScoreRoll({ value, wicketSeq }: ScoreRollProps) {
  // Derived-state pattern (no ref reads in render): remember the previous value / wicket.
  const [valueTrack, setValueTrack] = useState({ cur: value, prev: value });
  if (valueTrack.cur !== value) setValueTrack({ cur: value, prev: valueTrack.cur });
  const [wicketTrack, setWicketTrack] = useState<{ seen: number | null; flash: number | null }>({
    seen: wicketSeq,
    flash: null,
  });
  if (wicketTrack.seen !== wicketSeq) {
    const isNew = wicketSeq !== null && wicketSeq > (wicketTrack.seen ?? -1);
    setWicketTrack({ seen: wicketSeq, flash: isNew ? wicketSeq : null });
  }

  const changed = changedIndexes(valueTrack.prev, value);
  const chars = Array.from(value);
  return (
    <span className={styles.root}>
      <span className={styles.visuallyHidden}>{value}</span>
      <span className={styles.score} aria-hidden="true">
        {chars.map((ch, i) => (
          <span key={`${chars.length - i}-${ch}`} className={changed.has(i) ? styles.roll : undefined}>
            {ch}
          </span>
        ))}
      </span>
      {wicketTrack.flash !== null ? (
        <span key={wicketTrack.flash} className={styles.bar} aria-hidden="true" />
      ) : null}
    </span>
  );
}
