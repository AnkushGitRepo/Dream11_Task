import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { MatchTimeline } from '@shared/sports/types';
import type { ReplayStore } from '@/features/replay';
import { useSettings } from '@/features/settings/settingsStore';
import { GlossarySheet } from './GlossarySheet';
import { LearnCard } from './LearnCard';
import { LearnContext, type LearnContextValue } from './LearnContext';
import { useLearnState } from './learnStore';
import { useLearnTrigger } from './useLearnTrigger';
import cardStyles from './LearnCard.module.scss';

export interface LearnProviderProps {
  readonly timeline: MatchTimeline;
  readonly store: ReplayStore;
  /** "More": ask the match to explain this term further. */
  readonly onAskMore: (term: string) => void;
  readonly children: ReactNode;
}

/** Wires Learn mode into a match room: trigger queue, teachable context, card and glossary. */
export function LearnProvider({ timeline, store, onAskMore, children }: LearnProviderProps) {
  const { on, learned } = useLearnState();
  const { autoRead } = useSettings();
  const sport = timeline.meta.sport;
  const trigger = useLearnTrigger({ timeline, store, enabled: on });
  const [glossary, setGlossary] = useState(false);
  const { teachablesAt, explain, current } = trigger;

  const value = useMemo<LearnContextValue>(
    () => ({ on, sport, teachablesAt, explain }),
    [on, sport, teachablesAt, explain],
  );
  const learnedCount = learned.filter((k) => k.startsWith(`${sport}:`)).length;

  return (
    <LearnContext.Provider value={value}>
      {children}
      {on && current
        ? createPortal(
            <div className={cardStyles.dock}>
              <LearnCard
                item={current}
                sport={sport}
                matchId={timeline.meta.id}
                queued={trigger.queued}
                learnedCount={learnedCount}
                autoRead={autoRead}
                onGotIt={trigger.gotIt}
                onClose={trigger.dismiss}
                onMore={(term) => {
                  trigger.dismiss();
                  onAskMore(term);
                }}
                onOpenGlossary={() => setGlossary(true)}
              />
            </div>,
            document.body,
          )
        : null}
      <GlossarySheet open={glossary} onClose={() => setGlossary(false)} sport={sport} />
    </LearnContext.Provider>
  );
}
