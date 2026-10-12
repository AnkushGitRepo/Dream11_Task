import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MatchTimeline } from '@shared/sports/types';
import { computeMissed } from './computeMissed';

afterEach(() => vi.restoreAllMocks());

const timeline = { meta: {}, events: [] } as unknown as MatchTimeline;
const ui = {
  minGap: 6,
  gap: (_t: MatchTimeline, from: number, to: number) => ({ count: to - from, label: `${to - from} units` }),
};

describe('computeMissed', () => {
  it('returns the window when the gap reaches minGap', () => {
    expect(computeMissed(ui, timeline, 3, 9)).toEqual({
      fromPosition: 3,
      toPosition: 9,
      label: '6 units',
      count: 6,
    });
  });

  it('returns null below the threshold', () => {
    expect(computeMissed(ui, timeline, 3, 8)).toBeNull();
  });

  it('returns null when nothing advanced', () => {
    const gap = vi.fn(ui.gap);
    expect(computeMissed({ ...ui, gap }, timeline, 9, 9)).toBeNull();
    expect(gap).not.toHaveBeenCalled();
  });
});
