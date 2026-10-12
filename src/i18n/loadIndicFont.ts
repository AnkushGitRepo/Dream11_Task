import type { Lang } from '@shared/sports/types';

const FAMILY: Partial<Record<Lang, { id: string; family: string }>> = {
  hi: { id: 'indic-font-hi', family: 'Noto+Sans+Devanagari' },
  gu: { id: 'indic-font-gu', family: 'Noto+Sans+Gujarati' },
};

/**
 * Injects the Google Fonts stylesheet for Devanagari / Gujarati the first time that language
 * is selected. Nothing is loaded for en / hinglish. Safe to call repeatedly (once per font).
 */
export function loadIndicFont(lang: Lang): void {
  const font = FAMILY[lang];
  if (!font || typeof document === 'undefined') return;
  if (document.getElementById(font.id)) return;
  const link = document.createElement('link');
  link.id = font.id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.family}:wght@400;600;700&display=swap`;
  document.head.appendChild(link);
}
