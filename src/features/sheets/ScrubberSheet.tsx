import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { EventTone } from '@shared/sports/types';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { useStrings } from '@/i18n/useStrings';
import styles from './ScrubberSheet.module.scss';

export interface ScrubberMarker {
  /** Replay position (0..total) the tick sits at. */
  readonly position: number;
  readonly tone: EventTone;
}

export interface ScrubberSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /** Number of positions; the slider spans 0..total. */
  readonly total: number;
  /** Where the replay is right now (the slider starts here each time the sheet opens). */
  readonly position: number;
  readonly markers: readonly ScrubberMarker[];
  /** Clock label for a position, e.g. "16.3". */
  readonly labelAt: (position: number) => string;
  readonly onJump: (position: number) => void;
}

type BodyProps = Omit<ScrubberSheetProps, 'open'>;

function ScrubberBody({ onClose, total, position, markers, labelAt, onJump }: BodyProps) {
  const { t } = useStrings();
  const [value, setValue] = useState(Math.min(Math.max(position, 0), total));
  const at = (p: number) => ({ '--at': total > 0 ? p / total : 0 }) as CSSProperties;

  return (
    <>
      <p className={styles.clock} aria-hidden="true">
        {labelAt(value)}
      </p>
      <div className={styles.track}>
        <div className={styles.ticks} aria-hidden="true">
          {markers.map((m, i) => (
            <span
              key={`${m.position}-${i}`}
              className={`${styles.tick} ${styles[m.tone]}`}
              style={at(m.position)}
            />
          ))}
        </div>
        <input
          type="range"
          className={styles.range}
          min={0}
          max={total}
          step={1}
          value={value}
          aria-label={t.scrubberLabel}
          aria-valuetext={labelAt(value)}
          onChange={(e) => setValue(Number(e.target.value))}
        />
      </div>
      <Button
        fullWidth
        onClick={() => {
          onJump(value);
          onClose();
        }}
      >
        {t.scrubberJump}
      </Button>
    </>
  );
}

/** Slider over the whole replay with event ticks; "Jump" seeks there and closes. */
export function ScrubberSheet({ open, ...body }: ScrubberSheetProps) {
  const { t } = useStrings();
  return (
    <BottomSheet open={open} onClose={body.onClose} title={t.scrubberTitle}>
      <ScrubberBody {...body} />
    </BottomSheet>
  );
}
