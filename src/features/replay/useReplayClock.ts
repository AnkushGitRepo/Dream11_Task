import { useEffect, useSyncExternalStore } from 'react';
import type { ReplaySnapshot, ReplayStore } from './replayStore';

/**
 * Drives the store while playing (rAF) and re-syncs on tab return, so a throttled
 * hidden tab still lands on the correct ball. Returns the current snapshot.
 */
export function useReplayClock(store: ReplayStore): ReplaySnapshot {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') store.tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [store]);

  useEffect(() => {
    if (!snapshot.playing) return;
    let frame = requestAnimationFrame(function loop() {
      store.tick();
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [store, snapshot.playing]);

  return snapshot;
}
