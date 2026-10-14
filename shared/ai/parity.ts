import type { Lang } from '../sports/types.js';
import { extractNumbers } from './guard.js';

// SERVER-ONLY. Ask answers and Learn cards must SPEAK everything they SHOW: a voice that drops
// "17 overs" or "target 160" while the screen has them is misleading (only recaps are allowed a
// shorter spoken version). Two helpers: put numbers into spoken form, and check nothing was lost.

const FOR: Readonly<Record<Lang, string>> = { en: 'for', hinglish: 'पर', hi: 'पर', gu: 'પર' };

/** "17.0" -> "17" and "112/4" -> "112 for 4" (language-appropriate joiner); nothing else changes. */
export function spokenForm(text: string, lang: Lang): string {
  return text
    .replace(/\b(\d+)\.0\b/g, '$1')
    .replace(/\b(\d+)\s*\/\s*(\d+)\b/g, `$1 ${FOR[lang]} $2`);
}

/** Numbers that the display text has and the spoken text lacks (compared by value). */
export function numbersMissingFromSpeak(display: string, speak: string): number[] {
  const spoken = new Set(extractNumbers(spokenForm(speak, 'en')));
  return [...new Set(extractNumbers(display))].filter((n) => !spoken.has(n));
}
