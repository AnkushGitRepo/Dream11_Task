import type { Lang } from '../sports/types.js';

/** Hinglish is shown in Latin script but voiced from its Hindi (Devanagari) wording. */
export const spokenLang = (lang: Lang): Lang => (lang === 'hinglish' ? 'hi' : lang);
