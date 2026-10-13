import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAdapter } from '@shared/sports/registry';
import type { MatchTimeline } from '@shared/sports/types';
import type { ReplayStore } from '@/features/replay';
import { collectNew, enqueue, promote, type LearnItem } from './learnQueue';
import { isLearned, markLearned } from './learnStore';

export interface LearnTrigger {
  /** The card to show now (one at a time), or null. */
  readonly current: LearnItem | null;
  /** Cards waiting behind the current one. */
  readonly queued: number;
  readonly gotIt: () => void;
  readonly dismiss: () => void;
  /** Rule ids the sport engine says are worth explaining at `seq` (cached). */
  readonly teachablesAt: (seq: number) => readonly string[];
  /** Tapped chip / moment: show that rule's card now, even if already learned. */
  readonly explain: (seq: number) => void;
}

interface Options {
  readonly timeline: MatchTimeline;
  readonly store: ReplayStore;
  readonly enabled: boolean;
}

const NONE: readonly string[] = [];

// Teachables are pure per (timeline, seq), so they are cached outside React, per timeline.
const CACHES = new WeakMap<MatchTimeline, Map<number, readonly string[]>>();

function cachedTeachables(
  adapter: NonNullable<ReturnType<typeof getAdapter>>,
  timeline: MatchTimeline,
  seq: number,
): readonly string[] {
  let cache = CACHES.get(timeline);
  if (!cache) {
    cache = new Map();
    CACHES.set(timeline, cache);
  }
  const hit = cache.get(seq);
  if (hit) return hit;
  const ids = adapter.teachables(timeline, seq);
  cache.set(seq, ids);
  return ids;
}

/**
 * Watches the replay clock and queues a LearnCard for each new teachable event. Learned rules and
 * rules dismissed this session are skipped. Nothing is queued while Learn is off, and jumps back
 * in time raise nothing.
 */
export function useLearnTrigger({ timeline, store, enabled }: Options): LearnTrigger {
  const sport = timeline.meta.sport;
  const adapter = useMemo(() => getAdapter(sport), [sport]);
  const [queue, setQueue] = useState<readonly LearnItem[]>([]);
  const dismissed = useRef(new Set<string>());
  const prev = useRef(store.getSnapshot().position);
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const teachablesAt = useCallback(
    (seq: number): readonly string[] => {
      return adapter ? cachedTeachables(adapter, timeline, seq) : NONE;
    },
    [adapter, timeline],
  );

  useEffect(
    () =>
      store.subscribe(() => {
        const position = store.getSnapshot().position;
        const from = prev.current;
        prev.current = position;
        if (!enabledRef.current) {
          setQueue((q) => (q.length > 0 ? [] : q));
          return;
        }
        const items = collectNew(from, position, teachablesAt);
        if (items.length === 0) return;
        setQueue((q) =>
          enqueue(q, items, (id) => isLearned(sport, id) || dismissed.current.has(`${sport}:${id}`)),
        );
      }),
    [store, teachablesAt, sport],
  );

  const visible = enabled ? queue : [];
  const current = visible[0] ?? null;

  const gotIt = useCallback(() => {
    setQueue((q) => {
      const head = q[0];
      if (head) markLearned(sport, head.ruleId);
      return q.slice(1);
    });
  }, [sport]);

  const dismiss = useCallback(() => {
    setQueue((q) => {
      const head = q[0];
      if (head) dismissed.current.add(`${sport}:${head.ruleId}`);
      return q.slice(1);
    });
  }, [sport]);

  const explain = useCallback(
    (seq: number) => {
      const ruleId = teachablesAt(seq)[0];
      if (ruleId) setQueue((q) => promote(q, { seq, ruleId }));
    },
    [teachablesAt],
  );

  return { current, queued: Math.max(0, visible.length - 1), gotIt, dismiss, teachablesAt, explain };
}
