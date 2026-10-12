import type { Lang } from '../sports/types';
import { askStrings } from './ask';
import { catchupStrings } from './catchup';
import { chromeStrings } from './chrome';
import { momentsStrings } from './moments';
import { sheetsStrings } from './sheets';

// UI strings for en, hinglish (Hindi in Latin script), hi, gu. One module per area so
// features can add keys without editing each other's files. Cricket labels live in
// shared/sports/cricket/ (core strings stay sport-neutral).
const AREAS = [chromeStrings, sheetsStrings, catchupStrings, askStrings, momentsStrings] as const;

function merge(lang: Lang) {
  return Object.assign({}, ...AREAS.map((area) => area[lang])) as UnionToIntersection<
    (typeof AREAS)[number][Lang]
  >;
}

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

export type Strings = ReturnType<typeof merge>;
export type StringKey = keyof Strings;

export const STRINGS: Readonly<Record<Lang, Strings>> = {
  en: merge('en'),
  hinglish: merge('hinglish'),
  hi: merge('hi'),
  gu: merge('gu'),
};

export const LANGS: readonly Lang[] = ['en', 'hinglish', 'hi', 'gu'];

/** BCP-47 tag for the `lang` attribute on rendered text. Hinglish is Latin-script Hindi: en-IN. */
export const LANG_ATTR: Readonly<Record<Lang, string>> = {
  en: 'en',
  hinglish: 'en-IN',
  hi: 'hi',
  gu: 'gu',
};
