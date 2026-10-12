import type { Lang } from '@shared/sports/types';

/** BCP-47 locale tags a language may be spoken with, most preferred first. */
const EXACT: Readonly<Partial<Record<Lang, readonly string[]>>> = {
  hinglish: ['en-in'],
  hi: ['hi-in'],
  gu: ['gu-in'],
};

const norm = (tag: string): string => tag.toLowerCase().replace('_', '-');

/**
 * Pick the voice for a language, or null. Never falls back to a voice of another language:
 * an English voice reading Gujarati is worse than a hidden Listen button.
 */
export function pickVoice<V extends { readonly lang: string }>(lang: Lang, voices: readonly V[]): V | null {
  const exact = EXACT[lang];
  if (exact) {
    for (const tag of exact) {
      const hit = voices.find((v) => norm(v.lang) === tag);
      if (hit) return hit;
    }
    return null;
  }
  const english = voices.filter((v) => norm(v.lang).startsWith('en-'));
  return english.find((v) => norm(v.lang) === 'en-in') ?? english[0] ?? null;
}

/** Recognition locale per app language (Hinglish is spoken English-India). */
export const LISTEN_LOCALE: Readonly<Record<Lang, string>> = {
  en: 'en-IN',
  hinglish: 'en-IN',
  hi: 'hi-IN',
  gu: 'gu-IN',
};
