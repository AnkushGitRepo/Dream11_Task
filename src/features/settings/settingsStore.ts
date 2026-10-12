import { useSyncExternalStore } from 'react';
import type { Lang } from '@shared/sports/types';

export type Theme = 'system' | 'dark' | 'light';
export type VoiceRate = 0.8 | 1 | 1.2;

export interface Settings {
  readonly lang: Lang;
  readonly theme: Theme;
  readonly autoRead: boolean;
  readonly voiceRate: VoiceRate;
}

export const DEFAULT_SETTINGS: Settings = {
  lang: 'hinglish',
  theme: 'dark',
  autoRead: false,
  voiceRate: 1,
};

const KEY = 'kya-hua:settings:v1';
const LANGS: readonly Lang[] = ['en', 'hinglish', 'hi', 'gu'];

function load(): Settings {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (typeof raw !== 'object' || raw === null) return DEFAULT_SETTINGS;
    const r = raw as Record<string, unknown>;
    return {
      lang: LANGS.includes(r.lang as Lang) ? (r.lang as Lang) : DEFAULT_SETTINGS.lang,
      theme:
        r.theme === 'dark' || r.theme === 'light' || r.theme === 'system' ? r.theme : DEFAULT_SETTINGS.theme,
      autoRead: r.autoRead === true,
      voiceRate: r.voiceRate === 0.8 || r.voiceRate === 1.2 ? r.voiceRate : 1,
    };
  } catch {
    return DEFAULT_SETTINGS; // storage blocked or corrupt: fall back to defaults
  }
}

let current: Settings = load();
const listeners = new Set<() => void>();

export function getSettings(): Settings {
  return current;
}

export function updateSettings(patch: Partial<Settings>): void {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* storage unavailable: keep in-memory value only */
  }
  listeners.forEach((l) => l());
}

export function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribeSettings, getSettings, getSettings);
}
