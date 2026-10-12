import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { useInView } from '@/hooks/useInView';

const QUERY = '(prefers-reduced-motion: reduce)';

function readReduced(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(QUERY).matches
    : false;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readReduced);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(QUERY);
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

export interface DemoLoop<T extends Element> {
  readonly ref: RefObject<T | null>;
  /** Index into `durations`. Under reduced motion it is pinned to the last (complete) step. */
  readonly step: number;
  readonly playing: boolean;
}

/**
 * Steps through `durations` (ms per step) and loops. Pauses while the element is off-screen
 * and never advances under prefers-reduced-motion (shows the final, complete frame instead).
 */
export function useDemoLoop<T extends Element>(durations: readonly number[]): DemoLoop<T> {
  const [ref, inView] = useInView<T>();
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  const last = Math.max(0, durations.length - 1);
  const playing = inView && !reduced && durations.length > 1;

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => setStep((s) => (s >= last ? 0 : s + 1)), durations[step] ?? 0);
    return () => clearTimeout(id);
  }, [playing, step, durations, last]);

  return { ref, step: reduced ? last : Math.min(step, last), playing };
}
