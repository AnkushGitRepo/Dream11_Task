import { useCallback, useEffect, useRef, useState } from 'react';
import type { MatchTimeline } from '@shared/sports/types';
import type { ReplayStore } from '@/features/replay';
import type { SportUi } from '@/sports/types';
import { computeMissed } from './computeMissed';
import type { MissedWindow } from './computeMissed';

/** Units "Simulate stepping away" jumps forward (sport-defined: cricket = legal balls). */
export const SIMULATED_GAP = 12;

export interface AwayDetector {
  readonly missed: MissedWindow | null;
  readonly dismiss: () => void;
  readonly simulate: () => void;
}

export function useAwayDetector(store: ReplayStore, timeline: MatchTimeline, sportUi: SportUi): AwayDetector {
  const [missed, setMissed] = useState<MissedWindow | null>(null);
  const hiddenAt = useRef<number | null>(null);

  useEffect(() => {
    const onChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = store.getSnapshot().position;
        return;
      }
      const from = hiddenAt.current;
      hiddenAt.current = null;
      if (from === null) return;
      store.tick();
      const found = computeMissed(sportUi, timeline, from, store.getSnapshot().position);
      if (found) setMissed(found);
    };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, [store, timeline, sportUi]);

  const dismiss = useCallback(() => setMissed(null), []);

  const simulate = useCallback(() => {
    const from = store.getSnapshot().position;
    const to = sportUi.positionAfterGap(timeline, from, SIMULATED_GAP);
    if (to <= from) return;
    store.seekTo(to);
    setMissed(computeMissed({ ...sportUi, minGap: 1 }, timeline, from, to));
  }, [store, timeline, sportUi]);

  return { missed, dismiss, simulate };
}
