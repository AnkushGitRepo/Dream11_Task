import '@testing-library/jest-dom/vitest';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDemoLoop } from './useDemoLoop';

const DURATIONS = [100, 100, 100] as const;
let observerCb: ((entries: { isIntersecting: boolean }[]) => void) | null = null;
let steps: number[] = [];

function Probe() {
  const { ref, step } = useDemoLoop<HTMLDivElement>(DURATIONS);
  steps.push(step);
  return <div ref={ref} data-step={step} />;
}

function mockMatchMedia(reduced: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduced,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
}

const current = () => steps[steps.length - 1];

beforeEach(() => {
  vi.useFakeTimers();
  steps = [];
  observerCb = null;
  globalThis.IntersectionObserver = class {
    constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
      observerCb = cb;
    }
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useDemoLoop', () => {
  it('advances and loops while visible', () => {
    mockMatchMedia(false);
    render(<Probe />);
    act(() => void vi.advanceTimersByTime(100));
    expect(current()).toBe(1);
    act(() => void vi.advanceTimersByTime(100));
    expect(current()).toBe(2);
    act(() => void vi.advanceTimersByTime(100));
    expect(current()).toBe(0);
  });

  it('pauses when off-screen and resumes when back in view', () => {
    mockMatchMedia(false);
    render(<Probe />);
    act(() => observerCb?.([{ isIntersecting: false }]));
    act(() => void vi.advanceTimersByTime(1000));
    expect(current()).toBe(0);
    act(() => observerCb?.([{ isIntersecting: true }]));
    act(() => void vi.advanceTimersByTime(100));
    expect(current()).toBe(1);
  });

  it('shows the final frame and never advances under reduced motion', () => {
    mockMatchMedia(true);
    render(<Probe />);
    expect(current()).toBe(DURATIONS.length - 1);
    act(() => void vi.advanceTimersByTime(1000));
    expect(current()).toBe(DURATIONS.length - 1);
  });
});
