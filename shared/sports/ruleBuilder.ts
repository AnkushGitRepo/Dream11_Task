import type { Lang, RuleEntry } from './types.ts';

// Rulebook entries are written as [en, hinglish (Latin), hi (Devanagari), gu (Gujarati)] tuples
// so each rule reads as one block and a missing language is a compile error.
export type FourLangs = readonly [string, string, string, string];

const LANG_ORDER: readonly Lang[] = ['en', 'hinglish', 'hi', 'gu'];

function toRecord(values: FourLangs): Record<Lang, string> {
  return {
    en: values[0],
    hinglish: values[1],
    hi: values[2],
    gu: values[3],
  };
}

export function rule(
  id: string,
  term: FourLangs,
  short: FourLangs,
  detail: FourLangs,
  related: readonly string[] = [],
): RuleEntry {
  return {
    id,
    term: toRecord(term),
    short: toRecord(short),
    detail: toRecord(detail),
    related: [...related],
  };
}

export { LANG_ORDER };
