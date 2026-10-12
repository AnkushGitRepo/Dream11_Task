import type { Lang } from '@shared/sports/types';

/** Recap language. Fixed until the language sheet lands; change in one place. */
export const RECAP_LANG: Lang = 'hinglish';

/** BCP-47 tag for the `lang` attribute (Hinglish = Latin script Indian English). */
export const LANG_ATTR: Record<Lang, string> = {
  en: 'en',
  hinglish: 'en-IN',
  hi: 'hi',
  gu: 'gu',
};

/** Quick "Last N" windows, counted in timeline events. */
export const QUICK_WINDOWS = [6, 12, 30] as const;
