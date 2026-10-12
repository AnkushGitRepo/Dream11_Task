import type { Lang } from '@shared/sports/types';

/** Recap language. Fixed until the language sheet lands; change in one place. */
export const RECAP_LANG: Lang = 'hinglish';

/** Quick "Last N" windows, counted in timeline events. */
export const QUICK_WINDOWS = [6, 12, 30] as const;
