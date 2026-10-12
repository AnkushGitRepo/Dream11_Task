import { Pause, Play } from 'lucide-react';
import { Chip } from '@/components/Chip';
import { IconButton } from '@/components/IconButton';
import { format, useStrings } from '@/i18n/useStrings';
import type { ReplaySnapshot, ReplayStore } from './replayStore';
import { useLongPress } from './useLongPress';
import styles from './ReplayControl.module.scss';

export interface ReplayControlProps {
  readonly store: ReplayStore;
  readonly snapshot: ReplaySnapshot;
  /** Long-press (>= 500 ms) or Shift+Enter on the speed chip, e.g. to open the scrubber sheet. */
  readonly onLongPressSpeed?: () => void;
}

export function ReplayControl({ store, snapshot, onLongPressSpeed }: ReplayControlProps) {
  const { t } = useStrings();
  const { playing, finished, speed } = snapshot;
  const label = finished ? t.replayAgain : playing ? t.replayPause : t.replayPlay;
  const onToggle = () => (finished ? store.restart() : store.toggle());
  const press = useLongPress(onLongPressSpeed);

  return (
    <div className={styles.pill}>
      <IconButton
        label={label}
        onClick={onToggle}
        icon={playing ? <Pause size={22} strokeWidth={1.75} /> : <Play size={22} strokeWidth={1.75} />}
      />
      <span className={styles.speed} {...press}>
        <Chip onClick={() => store.cycleSpeed()} label={format(t.replaySpeedLabel, { n: speed })}>
          {speed}×
        </Chip>
      </span>
    </div>
  );
}
