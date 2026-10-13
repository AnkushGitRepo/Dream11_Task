import { CRICKET_RULES } from './cricket/rules.ts';
import { FOOTBALL_RULES } from './football/rules.ts';
import { KABADDI_RULES } from './kabaddi/rules.ts';
import type { Facts, Fact, Lang, RuleEntry, SportId } from './types.ts';

// Rulebooks are plain data, so they work for every sport (kabaddi has no adapter yet) and can be
// imported by the client without pulling in any engine or AI code.

export const RULE_LIMITS = { shortWords: 25, detailSentences: 3, termWords: 6 } as const;

const BOOKS: Readonly<Record<SportId, readonly RuleEntry[]>> = {
  cricket: CRICKET_RULES,
  football: FOOTBALL_RULES,
  kabaddi: KABADDI_RULES,
};

export function getRulebook(sport: SportId): readonly RuleEntry[] {
  return BOOKS[sport];
}

export function getRule(sport: SportId, id: string): RuleEntry | null {
  return BOOKS[sport].find((r) => r.id === id) ?? null;
}

// ---- "what is X" lookup -------------------------------------------------------------------------

/** Extra spellings fans type that are not the displayed term. Lowercase, space separated. */
const ALIASES: Readonly<Record<string, readonly string[]>> = {
  'no-ball': ['noball', 'no ball', 'नो बॉल', 'નો બોલ'],
  'free-hit': ['freehit', 'free hit', 'फ्री हिट', 'ફ્રી હિટ'],
  'free-hit-bowled-not-out': ['free hit bowled', 'bowled on a free hit', 'free hit par bowled'],
  'leg-bye': ['legbye', 'leg bye', 'लेग बाई', 'લેગ બાય'],
  'run-out': ['runout', 'run out', 'रन आउट', 'રન આઉટ'],
  lbw: ['leg before wicket', 'leg before', 'एलबीडब्ल्यू', 'એલબીડબ્લ્યુ'],
  drs: ['review', 'decision review system', 'डीआरएस', 'ડીઆરએસ'],
  maiden: ['maiden over', 'maiden', 'मेडन', 'મેડન'],
  powerplay: ['power play', 'पावरप्ले', 'પાવરપ્લે'],
  'required-rate': ['required run rate', 'rrr', 'required rate', 'आवश्यक रन रेट', 'જરૂરી રન રેટ'],
  var: ['video assistant referee', 'वीएआर', 'વીએઆર'],
  'yellow-card': ['yellow card', 'yellow', 'येलो कार्ड', 'યલો કાર્ડ'],
  'red-card': ['red card', 'red', 'रेड कार्ड', 'રેડ કાર્ડ'],
  'free-kick': ['free kick', 'फ्री किक', 'ફ્રી કિક'],
  'stoppage-time': ['stoppage time', 'injury time', 'added time'],
  'extra-time': ['extra time', 'एक्स्ट्रा टाइम', 'એક્સ્ટ્રા ટાઇમ'],
  'bonus-line': ['bonus line', 'bonus', 'बोनस लाइन', 'બોનસ લાઇન'],
  'baulk-line': ['baulk line', 'balk line', 'bonus baulk', 'बॉक लाइन', 'બોક લાઇન'],
  'super-tackle': ['super tackle', 'सुपर टैकल', 'સુપર ટેકલ'],
  'all-out': ['all out', 'allout', 'ऑल आउट', 'ઓલ આઉટ'],
  'do-or-die-raid': ['do or die raid', 'do or die', 'डू ऑर डाई', 'ડુ ઓર ડાઇ'],
  'super-raid': ['super raid', 'सुपर रेड', 'સુપર રેડ'],
};

// A question only counts as a rule question when it carries one of these frames. This keeps
// "how many wides has he bowled?" or "who is batting?" out of the rulebook.
const FRAMES: readonly RegExp[] = [
  /\bwhat\s*(?:is|'s|s|are)\b/,
  /\bwhat\s+does\b.*\bmean\b/,
  /\bexplain\b/,
  /\bmeaning of\b/,
  /\bkya\s+(?:hota|hoti|hai|hota hai)\b/,
  /\bkya\s+hai\b/,
  /\bshu\s+(?:che|chhe|hoy|thay)\b/,
  /क्या\s+(?:होता|होती|है)/,
  /क्या\s+मतलब/,
  /શું\s+(?:છે|હોય|થાય)/,
  /\bsamjhao\b|\bsamjha\b|\bsamjhaiye\b/,
  /समझा/,
  /સમજાવ/,
];

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[()'’"?!.,;:]/g, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function termsOf(rule: RuleEntry): string[] {
  const own = (['en', 'hinglish', 'hi', 'gu'] as const).map((l) => normalize(rule.term[l]));
  const stripped = own.map((t) => t.replace(/ (leg before wicket|review|video assistant referee)$/, ''));
  const alias = (ALIASES[rule.id] ?? []).map(normalize);
  return [...new Set([...own, ...stripped, ...alias, normalize(rule.id)])].filter((t) => t.length > 1);
}

function containsPhrase(haystack: string, phrase: string): boolean {
  const padded = ` ${haystack} `;
  return padded.includes(` ${phrase} `);
}

/**
 * The rule a "what is X" / "X kya hota hai" / "X shu che" question is about, or null.
 * The longest matching term wins, so "free hit bowled not out" beats "free hit".
 */
export function lookupRule(question: string, sport: SportId): RuleEntry | null {
  const lower = question.toLowerCase();
  if (!FRAMES.some((f) => f.test(lower))) return null;
  const q = normalize(question);
  let best: { rule: RuleEntry; len: number } | null = null;
  for (const rule of BOOKS[sport]) {
    for (const term of termsOf(rule)) {
      if (containsPhrase(q, term) && (!best || term.length > best.len)) best = { rule, len: term.length };
    }
  }
  return best?.rule ?? null;
}

// ---- Ask integration ----------------------------------------------------------------------------

const NUMBER_TOKEN = /\d+(?:\.\d+)?/g;

function numbersIn(rule: RuleEntry): number[] {
  const out = new Set<number>();
  for (const field of [rule.term, rule.short, rule.detail] as const) {
    for (const lang of Object.keys(field) as Lang[]) {
      for (const m of field[lang].match(NUMBER_TOKEN) ?? []) out.add(Number(m));
    }
  }
  return [...out];
}

/** A matched rule as facts (term, short, detail) in every language. */
export function ruleFacts(rule: RuleEntry): Fact[] {
  return [
    { key: 'ruleTerm', value: rule.term.en, label: rule.term },
    { key: 'ruleShort', value: rule.short.en, label: rule.short },
    { key: 'ruleDetail', value: rule.detail.en, label: rule.detail },
  ];
}

/** Adds a matched rule to the ask context as facts; the answer must quote it, never invent. */
export function askContextWithRule(base: Facts, rule: RuleEntry | null): Facts {
  if (!rule) return base;
  return {
    ...base,
    items: [...base.items, ...ruleFacts(rule)],
    numbers: [...new Set([...base.numbers, ...numbersIn(rule)])],
  };
}
