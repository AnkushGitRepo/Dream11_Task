import { useSyncExternalStore } from 'react';
import type { SportId } from '@shared/sports/types';

// Learn mode state (on/off + which rules the fan has already learned). A tiny external store like
// settingsStore: plain localStorage, always in try/catch, in-memory when storage is unavailable.

export interface LearnState {
  readonly on: boolean;
  /** `${sport}:${ruleId}` for every rule the fan tapped "Got it" on. */
  readonly learned: readonly string[];
  /** The "Learn mode on" toast has been shown once. */
  readonly introSeen: boolean;
}

const KEY = 'kya-hua:learn:v1';
const MAX_LEARNED = 200;
const DEFAULT_STATE: LearnState = { on: false, learned: [], introSeen: false };

export const ruleKey = (sport: SportId, ruleId: string): string => `${sport}:${ruleId}`;

function load(): LearnState {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (typeof raw !== 'object' || raw === null) return DEFAULT_STATE;
    const r = raw as Record<string, unknown>;
    const learned = Array.isArray(r.learned)
      ? r.learned.filter((x): x is string => typeof x === 'string').slice(0, MAX_LEARNED)
      : [];
    return { on: r.on === true, learned, introSeen: r.introSeen === true };
  } catch {
    return DEFAULT_STATE;
  }
}

let current: LearnState = load();
const listeners = new Set<() => void>();

function commit(next: LearnState): void {
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: keep the in-memory value */
  }
  listeners.forEach((l) => l());
}

export const getLearnState = (): LearnState => current;

export const setLearnOn = (on: boolean): void => commit({ ...current, on });

export const markIntroSeen = (): void => {
  if (!current.introSeen) commit({ ...current, introSeen: true });
};

export function markLearned(sport: SportId, ruleId: string): void {
  const key = ruleKey(sport, ruleId);
  if (current.learned.includes(key)) return;
  commit({ ...current, learned: [...current.learned, key].slice(-MAX_LEARNED) });
}

export const isLearned = (sport: SportId, ruleId: string): boolean =>
  current.learned.includes(ruleKey(sport, ruleId));

/** Test helper / "reset" action: back to defaults. */
export const resetLearnState = (): void => commit(DEFAULT_STATE);

export function subscribeLearn(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLearnState(): LearnState {
  return useSyncExternalStore(subscribeLearn, getLearnState, getLearnState);
}
