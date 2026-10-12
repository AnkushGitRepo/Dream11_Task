import { useCallback, useMemo, useState } from 'react';
import type { MatchTimeline } from '@shared/sports/types';
import { AppBar } from '@/components/AppBar';
import { AwayBanner } from '@/components/AwayBanner';
import { EmptyState } from '@/components/EmptyState';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useAwayDetector } from '@/features/away';
import { CatchUpDock, CatchUpTab, RECAP_LANG, useCatchUp } from '@/features/catchup';
import { createReplayStore, ReplayControl, useReplayClock } from '@/features/replay';
import { useInView } from '@/hooks/useInView';
import { MOCK_BASELINE } from '@/mocks/match.mock';
import type { SportUi } from '@/sports/types';
import { StickyScoreBar } from './StickyScoreBar';
import { useMatchShortcuts } from './useMatchShortcuts';
import styles from './MatchRoomView.module.scss';

type TabId = 'catchup' | 'ask' | 'moments';
const TABS = [
  { value: 'catchup', label: 'Catch up' },
  { value: 'ask', label: 'Ask' },
  { value: 'moments', label: 'Moments' },
] as const;

interface MatchRoomViewProps {
  readonly timeline: MatchTimeline;
  readonly sportUi: SportUi;
}

export function MatchRoomView({ timeline, sportUi }: MatchRoomViewProps) {
  const { meta } = timeline;
  const store = useMemo(() => createReplayStore(timeline.events.length), [timeline]);
  const snapshot = useReplayClock(store);
  const away = useAwayDetector(store, timeline, sportUi);
  const catchUp = useCatchUp(timeline, MOCK_BASELINE, sportUi, RECAP_LANG);
  const [tab, setTab] = useState<TabId>('catchup');
  const [lastCaughtUp, setLastCaughtUp] = useState(0);
  const [heroRef, heroInView] = useInView<HTMLDivElement>();
  const { position } = snapshot;
  const baseFrom = Math.min(lastCaughtUp, position);
  const caughtUp = position <= baseFrom;

  const recapFrom = useCallback(
    (from: number) => {
      const now = store.getSnapshot().position;
      if (now <= from) return;
      catchUp.request(from, now);
      setLastCaughtUp(now);
      setTab('catchup');
      away.dismiss();
    },
    [store, catchUp, away],
  );
  const onCatchUp = useCallback(
    () => recapFrom(Math.min(lastCaughtUp, store.getSnapshot().position)),
    [recapFrom, lastCaughtUp, store],
  );
  const onTogglePlay = useCallback(
    () => (store.getSnapshot().finished ? store.restart() : store.toggle()),
    [store],
  );
  useMatchShortcuts({ onTogglePlay, onCatchUp });

  const score = { timeline, position, baseline: MOCK_BASELINE };
  const title = meta.teams.map((t) => t.code).join(' vs ');
  const subtitle = meta.subtitle.split('·')[0]?.trim();

  return (
    <div className={styles.page}>
      <AppBar backTo="/matches" backLabel="Back to matches" title={title} subtitle={subtitle} />
      <StickyScoreBar sportUi={sportUi} visible={!heroInView} {...score} />
      <main className={styles.layout}>
        <div className={styles.hero}>
          <div ref={heroRef}>
            <sportUi.ScoreHero {...score} replay={<ReplayControl store={store} snapshot={snapshot} />} />
          </div>
        </div>
        <div className={styles.content}>
          {away.missed ? (
            <AwayBanner
              label={away.missed.label}
              onCatchUp={() => recapFrom(away.missed?.fromPosition ?? baseFrom)}
              onDismiss={away.dismiss}
            />
          ) : null}
          <div className={styles.tabs}>
            <SegmentedControl label="Match sections" options={TABS} value={tab} onChange={setTab} />
          </div>
          <div className={styles.panel} hidden={tab !== 'catchup'} role="tabpanel">
            <CatchUpTab
              entries={catchUp.entries}
              lang={RECAP_LANG}
              caughtUp={caughtUp}
              onRetry={catchUp.retry}
              onSimulate={away.simulate}
              onAsk={() => setTab('ask')}
            />
          </div>
          <div className={styles.panel} hidden={tab !== 'ask'} role="tabpanel">
            <EmptyState title="Ask the match." text="Coming next: ask anything about what just happened." />
          </div>
          <div className={styles.panel} hidden={tab !== 'moments'} role="tabpanel">
            <EmptyState title="Moments" text="Coming next: every wicket and boundary on one timeline." />
          </div>
          {tab === 'catchup' ? (
            <CatchUpDock
              caughtUp={caughtUp}
              onCatchUp={onCatchUp}
              onQuick={(n) => recapFrom(Math.max(0, store.getSnapshot().position - n))}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
