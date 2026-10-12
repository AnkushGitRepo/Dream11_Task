import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { format, useStrings } from '@/i18n/useStrings';
import type { MatchTimeline } from '@shared/sports/types';
import { MomentItem } from './MomentItem';
import type { MomentFilter } from './types';
import styles from './MomentsTab.module.scss';

export interface MomentsTabProps {
  readonly timeline: MatchTimeline;
  /** Events played so far (0..n). Only events with index < position are listed. */
  readonly position: number;
  /** Already localised filter chips. First one is selected initially. */
  readonly filters: readonly MomentFilter[];
  /** Localised labels per event kind; unknown kinds fall back to the raw kind. */
  readonly kindLabels?: Readonly<Record<string, string>>;
  /** Runs catch-up from this event (its seq). */
  readonly onRecapFrom: (position: number) => void;
}

/** Newest-first timeline of played events, filtered by tone. */
export function MomentsTab({ timeline, position, filters, kindLabels, onRecapFrom }: MomentsTabProps) {
  const { t, langAttr } = useStrings();
  const [selectedId, setSelectedId] = useState<string | undefined>(filters[0]?.id);
  const active = filters.find((f) => f.id === selectedId) ?? filters[0];

  // Stable handler so memoised rows don't re-render when the parent re-renders per tick.
  const latest = useRef(onRecapFrom);
  useEffect(() => {
    latest.current = onRecapFrom;
  }, [onRecapFrom]);
  const handleRecap = useCallback((seq: number) => latest.current(seq), []);

  const rows = useMemo(() => {
    const played = timeline.events.slice(0, Math.max(0, position));
    const allowed = active?.tones;
    const visible = allowed ? played.filter((e) => allowed.includes(e.tone)) : played;
    return visible.reverse();
  }, [timeline.events, position, active]);

  const played = position > 0;
  return (
    <section className={styles.root} aria-labelledby="moments-heading" lang={langAttr}>
      <h2 id="moments-heading" className={styles.heading}>
        {t.momentsTitle}
      </h2>
      {filters.length > 1 ? (
        <div role="group" aria-label={t.momentsFilterLabel} className={styles.filters}>
          {filters.map((f) => (
            <Chip key={f.id} selected={f.id === active?.id} onClick={() => setSelectedId(f.id)}>
              {f.label}
            </Chip>
          ))}
        </div>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState title={played ? t.momentsEmptyFiltered : t.momentsEmpty} role="status" />
      ) : (
        <ol className={styles.list}>
          {rows.map((e) => (
            <MomentItem
              key={e.seq}
              event={e}
              kindLabel={kindLabels?.[e.kind] ?? e.kind}
              recapLabel={t.momentsRecapFrom}
              recapAria={format(t.momentsRecapFromAria, { clock: e.clock })}
              onRecapFrom={handleRecap}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
