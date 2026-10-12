import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReplayControl } from './ReplayControl';
import { createReplayStore } from './replayStore';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function setup(onLongPressSpeed?: () => void) {
  const store = createReplayStore(20);
  render(<ReplayControl store={store} snapshot={store.getSnapshot()} onLongPressSpeed={onLongPressSpeed} />);
  return { store, chip: screen.getByRole('button', { name: /Replay speed/ }) };
}

describe('ReplayControl speed chip', () => {
  it('a normal tap cycles the speed', () => {
    const onLong = vi.fn();
    const { store, chip } = setup(onLong);
    fireEvent.pointerDown(chip, { clientX: 5, clientY: 5 });
    act(() => void vi.advanceTimersByTime(120));
    fireEvent.pointerUp(chip);
    fireEvent.click(chip);
    expect(store.getSnapshot().speed).toBe(5);
    expect(onLong).not.toHaveBeenCalled();
  });

  it('a 500 ms press fires onLongPressSpeed and does not cycle', () => {
    const onLong = vi.fn();
    const { store, chip } = setup(onLong);
    fireEvent.pointerDown(chip, { clientX: 5, clientY: 5 });
    act(() => void vi.advanceTimersByTime(499));
    expect(onLong).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(1));
    expect(onLong).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(chip);
    fireEvent.click(chip);
    expect(store.getSnapshot().speed).toBe(1);
    // The next ordinary tap works again.
    fireEvent.click(chip);
    expect(store.getSnapshot().speed).toBe(5);
  });

  it('cancels when the pointer moves away or leaves', () => {
    const onLong = vi.fn();
    const { chip } = setup(onLong);
    fireEvent.pointerDown(chip, { clientX: 5, clientY: 5 });
    fireEvent.pointerMove(chip, { clientX: 40, clientY: 5 });
    act(() => void vi.advanceTimersByTime(800));
    fireEvent.pointerDown(chip, { clientX: 5, clientY: 5 });
    fireEvent.pointerLeave(chip.parentElement as HTMLElement);
    act(() => void vi.advanceTimersByTime(800));
    expect(onLong).not.toHaveBeenCalled();
  });

  it('supports Shift+Enter as the keyboard equivalent', () => {
    const onLong = vi.fn();
    const { chip } = setup(onLong);
    fireEvent.keyDown(chip, { key: 'Enter', shiftKey: true });
    expect(onLong).toHaveBeenCalledTimes(1);
  });

  it('without the prop a long press is just a tap', () => {
    const { store, chip } = setup();
    fireEvent.pointerDown(chip, { clientX: 5, clientY: 5 });
    act(() => void vi.advanceTimersByTime(900));
    fireEvent.click(chip);
    expect(store.getSnapshot().speed).toBe(5);
  });
});
