import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { MatchTimeline } from '@shared/sports/types';
import { createReplayStore } from '@/features/replay';
import type { SportUi } from '@/sports/types';
import { useAwayDetector } from './useAwayDetector';

afterEach(cleanup);

const timeline = { meta: {}, events: new Array(40).fill(null) } as unknown as MatchTimeline;
const sportUi = {
  minGap: 6,
  gap: (_t: MatchTimeline, from: number, to: number) => ({ count: to - from, label: `${to - from} units` }),
  positionAfterGap: (_t: MatchTimeline, from: number, count: number) => from + count,
} as unknown as SportUi;

describe('useAwayDetector', () => {
  it('simulate jumps the replay and exposes the missed window', () => {
    const store = createReplayStore(40);
    store.seekTo(3);
    const { result } = renderHook(() => useAwayDetector(store, timeline, sportUi));
    expect(result.current.missed).toBeNull();
    act(() => result.current.simulate());
    expect(store.getSnapshot().position).toBe(15);
    expect(result.current.missed).toEqual({ fromPosition: 3, toPosition: 15, label: '12 units', count: 12 });
    act(() => result.current.dismiss());
    expect(result.current.missed).toBeNull();
  });
});
