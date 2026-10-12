import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lang, MatchTimeline } from '@shared/sports/types';
import { getSettings } from '@/features/settings/settingsStore';
import { mockRecap } from '@/services/mockApi';
import type { SportUi } from '@/sports/types';
import type { RecapEntry } from './types';

export interface CatchUpApi {
  /** Newest first. */
  readonly entries: readonly RecapEntry[];
  readonly request: (fromPosition: number, toPosition: number) => void;
  readonly retry: (id: number) => void;
}

export function useCatchUp(
  timeline: MatchTimeline,
  baseline: unknown,
  sportUi: SportUi,
  lang: Lang,
): CatchUpApi {
  const [entries, setEntries] = useState<readonly RecapEntry[]>([]);
  const nextId = useRef(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const patch = useCallback((id: number, change: Partial<RecapEntry>) => {
    if (!alive.current) return;
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...change } : e)));
  }, []);

  const load = useCallback(
    (entry: RecapEntry) => {
      mockRecap({
        matchId: timeline.meta.id,
        fromSeq: entry.fromPosition,
        toSeq: Math.max(entry.fromPosition, entry.toPosition - 1),
        lang: entry.lang,
        facts: [...entry.facts],
      }).then(
        (res) =>
          patch(entry.id, {
            status: 'ready',
            speakOnArrival: getSettings().autoRead,
            recap: { lead: res.lead, body: res.body, source: res.source },
          }),
        () => patch(entry.id, { status: 'error' }),
      );
    },
    [timeline, patch],
  );

  const request = useCallback(
    (fromPosition: number, toPosition: number) => {
      if (toPosition <= fromPosition) return;
      const entry: RecapEntry = {
        id: nextId.current++,
        lang,
        fromPosition,
        toPosition,
        clock:
          fromPosition === 0
            ? sportUi.startClock(baseline)
            : (timeline.events[fromPosition - 1]?.clock ?? ''),
        label: sportUi.gap(timeline, fromPosition, toPosition).label,
        facts: sportUi.facts(timeline, fromPosition, toPosition, baseline),
        speakOnArrival: false,
        status: 'loading',
      };
      setEntries((prev) => [entry, ...prev]);
      load(entry);
    },
    [timeline, baseline, sportUi, load, lang],
  );

  const retry = useCallback(
    (id: number) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;
      patch(id, { status: 'loading' });
      load({ ...entry, status: 'loading' });
    },
    [entries, patch, load],
  );

  return { entries, request, retry };
}
