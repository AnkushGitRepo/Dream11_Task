// SERVER-ONLY number guard (AGENTS.md rule 1): every number in AI-written text must come from the
// engine. Numbers are read in ASCII, Devanagari and Gujarati digits and as English words, so an
// answer cannot smuggle in a figure by changing script.

export interface GuardResult {
  readonly ok: boolean;
  /** Offending numbers as they would be read in ASCII digits. */
  readonly offending: readonly string[];
}

const DIGIT_BASES: readonly number[] = [0x0966, 0x0ae6]; // Devanagari, Gujarati

const WORDS: Readonly<Record<string, number>> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  hundred: 100,
};

const TOKEN = /\d+(?:\.\d+)?|[a-z]+/gi;
const FORMAT_NAME = /\bT\s?\d{2}\b/gi; // "T20" names the format, it is not a figure

function toAsciiDigits(text: string): string {
  let out = '';
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    const base = DIGIT_BASES.find((b) => code >= b && code <= b + 9);
    out += base === undefined ? ch : String(code - base);
  }
  return out;
}

export function extractNumbers(text: string): number[] {
  const cleaned = toAsciiDigits(text).replace(FORMAT_NAME, ' ');
  const found: number[] = [];
  for (const token of cleaned.match(TOKEN) ?? []) {
    if (/^\d/.test(token)) found.push(Number(token));
    else {
      const word = WORDS[token.toLowerCase()];
      if (word !== undefined) found.push(word);
    }
  }
  return found;
}

// Gujarati / Hindi number words are not in WORDS: they are caught indirectly because the model is
// asked for digits, and a spelled-out figure in those scripts is rare enough to leave to the prompt.

export function checkNumbers(text: string, allowed: readonly number[]): GuardResult {
  const ok = new Set(allowed);
  const offending = extractNumbers(text).filter((n) => !ok.has(n));
  return { ok: offending.length === 0, offending: offending.map(String) };
}
