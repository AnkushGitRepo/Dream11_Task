import { useCallback, useMemo, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import type { MatchTimeline } from '@shared/sports/types';
import { AppBar } from '@/components/AppBar';
import { AwayBanner } from '@/components/AwayBanner';
import { IconButton } from '@/components/IconButton';
import { LangChip } from '@/components/LangChip';
import { SegmentedControl } from '@/components/SegmentedControl';
import { VerifiedInfoContext } from '@/components/VerifiedBadge';
import { AskTab } from '@/features/ask';
import { useAwayDetector } from '@/features/away';
import { CatchUpDock, CatchUpTab, useCatchUp } from '@/features/catchup';
import { MomentsTab } from '@/features/moments';
import { pickLabels } from '@/features/moments/types';
import { createReplayStore, ReplayControl, useReplayClock } from '@/features/replay';
import { useInView } from '@/hooks/useInView';
import { useLangEffects } from '@/i18n/useLangEffects';
import { useStrings } from '@/i18n/useStrings';
import { MOCK_BASELINE } from '@/mocks/match.mock';
import type { SportUi } from '@/sports/types';
import { MatchSheets, type SheetId } from './MatchSheets';
import { ShortcutHint } from './ShortcutHint';
import { StickyScoreBar } from './StickyScoreBar';
import { useMatchShortcuts } from './useMatchShortcuts';
import { useOnlineToast } from './useOnlineToast';
import styles from './MatchRoomView.module.scss';

type TabId = 'catchup' | 'ask' | 'moments';

interface MatchRoomViewProps {
  readonly timeline: MatchTimeline;
  readonly sportUi: SportUi;
}

export function MatchRoomView({ timeline, sportUi }: MatchRoomViewProps) {
  const { meta } = timeline;
  useLangEffects();
  useOnlineToast();
  const { lang, t } = useStrings();
  const store = useMemo(() => createReplayStore(timeline.events.length), [timeline]);
  const snapshot = useReplayClock(store);
  const away = useAwayDetector(store, timeline, sportUi);
  const catchUp = useCatchUp(timeline, MOCK_BASELINE, sportUi, lang);
  const [tab, setTab] = useState<TabId>('catchup');
  const [lastCaughtUp, setLastCaughtUp] = useState(0);
  const [sheet, setSheet] = useState<SheetId>(null);
  const askInput = useRef<HTMLInputElement>(null);
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
  const focusAsk = useCallback(() => {
    setTab('ask');
    requestAnimationFrame(() => askInput.current?.focus());
  }, []);
  useMatchShortcuts({
    onTogglePlay,
    onCatchUp,
    onFocusAsk: focusAsk,
    onOpenLanguage: () => setSheet('language'),
  });

  const tabs = [
    { value: 'catchup', label: t.tabCatchUp },
    { value: 'ask', label: t.tabAsk },
    { value: 'moments', label: t.tabMoments },
  ] as const;
  const markers = useMemo(
    () =>
      timeline.events.filter((e) => e.tone === 'major').map((e) => ({ position: e.seq + 1, tone: e.tone })),
    [timeline],
  );
  const labelAt = useCallback(
    (p: number) => (p <= 0 ? sportUi.startClock(MOCK_BASELINE) : (timeline.events[p - 1]?.clock ?? '')),
    [timeline, sportUi],
  );
  const filters = sportUi.momentFilters.map((f) => ({ id: f.id, label: f.label[lang], tones: f.tones }));
  const getAskContext = () => {
    const p = store.getSnapshot().position;
    return { seq: p - 1, facts: sportUi.snapshot(timeline, p, MOCK_BASELINE) };
  };

  const score = { timeline, position, baseline: MOCK_BASELINE };
  const title = meta.teams.map((t) => t.code).join(' vs ');
  const subtitle = meta.subtitle.split('·')[0]?.trim();

  return (
    <VerifiedInfoContext.Provider value={() => setSheet('verified')}>
      <div className={styles.page}>
        <AppBar
          backTo="/matches"
          backLabel={t.backToMatches}
          title={title}
          subtitle={subtitle}
          right={
            <>
              <LangChip onClick={() => setSheet('language')} />
              <IconButton
                label={t.settings}
                onClick={() => setSheet('settings')}
                icon={<Settings size={22} strokeWidth={1.75} />}
              />
            </>
          }
        />
        <StickyScoreBar sportUi={sportUi} visible={!heroInView} {...score} />
        <main className={styles.layout}>
          <div className={styles.hero}>
            <div ref={heroRef}>
              <sportUi.ScoreHero
                {...score}
                replay={
                  <ReplayControl
                    store={store}
                    snapshot={snapshot}
                    onLongPressSpeed={() => setSheet('scrubber')}
                  />
                }
              />
            </div>
          </div>
          <div className={styles.content}>
            {away.missed ? (
              <AwayBanner
                label={away.missed.labels?.[lang] ?? away.missed.label}
                onCatchUp={() => recapFrom(away.missed?.fromPosition ?? baseFrom)}
                onDismiss={away.dismiss}
              />
            ) : null}
            <div className={styles.tabs}>
              <SegmentedControl label={t.tabsLabel} options={tabs} value={tab} onChange={setTab} />
            </div>
            <div className={styles.panel} hidden={tab !== 'catchup'} role="tabpanel">
              <CatchUpTab
                entries={catchUp.entries}
                lang={lang}
                caughtUp={caughtUp}
                onRetry={catchUp.retry}
                onSimulate={away.simulate}
                onAsk={() => setTab('ask')}
              />
            </div>
            <div className={styles.panel} hidden={tab !== 'ask'} role="tabpanel">
              <AskTab matchId={meta.id} getContext={getAskContext} inputRef={askInput} />
            </div>
            <div className={styles.panel} hidden={tab !== 'moments'} role="tabpanel">
              <MomentsTab
                timeline={timeline}
                position={position}
                filters={filters}
                kindLabels={pickLabels(sportUi.momentKindLabels, lang)}
                onRecapFrom={recapFrom}
              />
            </div>
            {tab === 'catchup' ? (
              <CatchUpDock
                caughtUp={caughtUp}
                onCatchUp={onCatchUp}
                onQuick={(n) => recapFrom(Math.max(0, store.getSnapshot().position - n))}
              />
            ) : null}
            <ShortcutHint />
          </div>
        </main>
        <MatchSheets
          open={sheet}
          onClose={() => setSheet(null)}
          store={store}
          snapshot={snapshot}
          markers={markers}
          labelAt={labelAt}
          onRestart={() => {
            store.restart();
            setLastCaughtUp(0);
          }}
        />
      </div>
    </VerifiedInfoContext.Provider>
  );
}
