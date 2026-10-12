import { Pause, Play } from 'lucide-react';
import { Chip } from '@/components/Chip';
import { IconButton } from '@/components/IconButton';
import type { ReplaySnapshot, ReplayStore } from './replayStore';
import styles from './ReplayControl.module.scss';

interface ReplayControlProps {
  readonly store: ReplayStore;
  readonly snapshot: ReplaySnapshot;
}

export function ReplayControl({ store, snapshot }: ReplayControlProps) {
  const { playing, finished, speed } = snapshot;
  const label = finished ? 'Replay again' : playing ? 'Pause replay' : 'Play replay';
  const onToggle = () => (finished ? store.restart() : store.toggle());

  return (
    <div className={styles.pill}>
      <IconButton
        label={label}
        onClick={onToggle}
        icon={playing ? <Pause size={22} strokeWidth={1.75} /> : <Play size={22} strokeWidth={1.75} />}
      />
      <Chip onClick={() => store.cycleSpeed()} label={`Replay speed ${speed}x, tap to change`}>
        {speed}×
      </Chip>
    </div>
  );
}
