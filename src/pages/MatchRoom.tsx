import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MOCK_MATCH_ID, MOCK_START, mockTimeline } from '@/mocks/match.mock';
import { ReplayControl } from '@/features/replay/ReplayControl';
import { createReplayStore } from '@/features/replay/replayStore';
import { useReplayClock } from '@/features/replay/useReplayClock';
import styles from './MatchRoom.module.scss';

// Raw debug view (Phase 1, chunk 1): proves the replay clock + mock data. Final UI replaces this.
export default function MatchRoom() {
  const { matchId } = useParams();
  const events = mockTimeline.events;
  const store = useMemo(() => createReplayStore(events.length), [events.length]);
  const snapshot = useReplayClock(store);

  if (matchId !== MOCK_MATCH_ID) {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Unknown match</h1>
        <p className={styles.muted}>Try /match/{MOCK_MATCH_ID}</p>
      </main>
    );
  }

  const latest = snapshot.position > 0 ? events[snapshot.position - 1] : undefined;
  const score = latest ? (latest.data.score as number) : MOCK_START.score;
  const wkts = latest ? (latest.data.wkts as number) : MOCK_START.wkts;
  const clock = latest ? latest.clock : MOCK_START.clock;
  const need = MOCK_START.target - score;

  return (
    <main className={styles.page}>
      <p className={styles.muted}>{mockTimeline.meta.subtitle}</p>
      <ReplayControl store={store} snapshot={snapshot} />
      <p className={styles.score} aria-live="off">
        {score}/{wkts} <span className={styles.overs}>{clock} ov</span>
      </p>
      <p className={styles.muted}>
        {need > 0 ? `Need ${need} to win` : mockTimeline.meta.result} · seq {snapshot.position - 1} of{' '}
        {snapshot.total - 1} · {snapshot.speed}× · {snapshot.playing ? 'playing' : 'paused'}
      </p>
      <pre className={styles.event}>
        {latest ? `${latest.clock}  ${latest.tone}  ${latest.text}` : 'before first ball'}
      </pre>
    </main>
  );
}
