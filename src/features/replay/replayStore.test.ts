import { describe, expect, it, vi } from 'vitest';
import { BALL_MS, computePosition, createReplayStore, nextSpeed } from './replayStore';

function setup(total = 22) {
  let t = 0;
  const store = createReplayStore(total, () => t);
  return { store, advance: (ms: number) => (t += ms) };
}

describe('computePosition', () => {
  const anchor = { basePosition: 2, startedAt: 1000, speed: 5 as const, playing: true };
  it('advances one ball per BALL_MS / speed', () => {
    expect(computePosition(anchor, 22, 1000)).toBe(2);
    expect(computePosition(anchor, 22, 1000 + BALL_MS / 5)).toBe(3);
    expect(computePosition(anchor, 22, 1000 + BALL_MS)).toBe(7);
  });
  it('clamps to total and holds while paused', () => {
    expect(computePosition(anchor, 22, 1e9)).toBe(22);
    expect(computePosition({ ...anchor, playing: false }, 22, 1e9)).toBe(2);
  });
});

describe('replay store', () => {
  it('starts paused at position 0 with a stable snapshot', () => {
    const { store } = setup();
    expect(store.getSnapshot()).toMatchObject({ position: 0, playing: false, speed: 1, finished: false });
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it('plays at real pace and notifies only on change', () => {
    const { store, advance } = setup();
    const listener = vi.fn();
    store.subscribe(listener);
    store.play();
    listener.mockClear();
    advance(BALL_MS - 1);
    store.tick();
    expect(listener).not.toHaveBeenCalled();
    advance(1);
    store.tick();
    expect(store.getSnapshot().position).toBe(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('changing speed re-anchors without jumping', () => {
    const { store, advance } = setup();
    store.play();
    advance(BALL_MS * 2);
    store.tick();
    store.setSpeed(20);
    expect(store.getSnapshot().position).toBe(2);
    advance(BALL_MS / 20);
    store.tick();
    expect(store.getSnapshot().position).toBe(3);
  });

  it('pauses, seeks, clamps and finishes', () => {
    const { store, advance } = setup(10);
    store.play();
    advance(BALL_MS * 3);
    store.pause();
    advance(BALL_MS * 10);
    store.tick();
    expect(store.getSnapshot().position).toBe(3);
    store.seekTo(999);
    expect(store.getSnapshot()).toMatchObject({ position: 10, finished: true, playing: false });
    store.play();
    expect(store.getSnapshot().playing).toBe(false);
  });

  it('auto-pauses at the end while playing', () => {
    const { store, advance } = setup(3);
    store.play();
    advance(BALL_MS * 10);
    store.tick();
    expect(store.getSnapshot()).toMatchObject({ position: 3, playing: false, finished: true });
  });

  it('restart rewinds and plays; cycleSpeed loops', () => {
    const { store } = setup();
    store.seekTo(9);
    store.restart();
    expect(store.getSnapshot()).toMatchObject({ position: 0, playing: true });
    expect(nextSpeed(20)).toBe(1);
    store.cycleSpeed();
    expect(store.getSnapshot().speed).toBe(5);
  });
});
