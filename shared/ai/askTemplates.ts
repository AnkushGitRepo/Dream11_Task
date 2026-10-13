import type { Fact, Facts, Lang } from '../sports/types.ts';
import { findBanned } from './guard.ts';
import { spokenLang } from './lang.ts';

// Deterministic Ask fallback (re-exported from templates.ts). A rule question is answered with the
// rulebook text verbatim; a match question maps to an intent whose facts are read out; anything
// else is an honest "I don't have that". Numbers only ever come from fact values.

export type AskIntent = 'need' | 'bowler' | 'batting' | 'score';

export interface AnswerText {
  readonly answer: string;
  readonly speak: string;
  /** 'unknown' = nothing in the facts answers the question. */
  readonly source: 'template' | 'unknown';
}

const KEYWORDS: ReadonlyArray<readonly [AskIntent, readonly string[]]> = [
  ['need', ['need', 'required', 'target', 'chahiye', 'chahie', 'चाहिए', 'चाहिये', 'જોઈએ']],
  ['bowler', ['bowler', 'bowling', 'bowled', 'figure', 'over', 'गेंदबाज', 'बॉलर', 'બોલર', 'બોલિંગ']],
  ['batting', ['batting', 'batter', 'batsman', 'scorer', 'who', 'kaun', 'बल्लेबाज', 'बैट', 'કોણ', 'બેટિંગ']],
  ['score', ['score', 'run', 'total', 'skor', 'स्कोर', 'रन', 'સ્કોર', 'રન']],
];

/** Fact keys (in order) that answer each intent. */
const INTENT_FACTS: Readonly<Record<AskIntent, readonly string[]>> = {
  need: ['need', 'rrr'],
  bowler: ['bowler'],
  batting: ['striker', 'nonStriker', 'partnership'],
  score: ['score', 'overs', 'crr'],
};

const UNKNOWN: Readonly<Record<Lang, string>> = {
  en: "I don't have that yet. I can only look at this match's data.",
  hinglish: 'Ye info abhi mere paas nahi hai. Main sirf is match ka data dekh sakta hoon.',
  hi: 'यह जानकारी अभी मेरे पास नहीं है। मैं सिर्फ़ इस मैच का डेटा देख सकता हूँ।',
  gu: 'આ માહિતી હજી મારી પાસે નથી. હું ફક્ત આ મેચનો ડેટા જોઈ શકું છું.',
};

export function detectIntent(question: string): AskIntent | null {
  const q = question.toLowerCase();
  for (const [intent, words] of KEYWORDS) {
    if (words.some((w) => q.includes(w))) return intent;
  }
  return null;
}

const byKey = (facts: Facts, key: string): Fact | undefined => facts.items.find((f) => f.key === key);
const text = (f: Fact | undefined): string => (f === undefined ? '' : String(f.value));
/** Ends a sentence with the full stop of the script it is written in (Hinglish display is Latin). */
const endSentence = (s: string, lang: Lang): string =>
  /[.!?।]$/.test(s) ? s : `${s}${lang === 'hi' ? '।' : '.'}`;

// ---- spoken phrases (en / hi / gu; Hinglish uses hi) -------------------------------------------

interface Spoken {
  need(n: number, balls: number): string;
  rrr(r: string): string;
  score(runs: string, wkts: string, overs: string): string;
  crr(r: string): string;
  batter(name: string, runs: string, balls: string): string;
  both(a: string, b: string): string;
  partnership(runs: string, balls: string): string;
  bowler(name: string, overs: string, maidens: string, runs: string, wkts: string): string;
}

const SPOKEN: Readonly<Record<'en' | 'hi' | 'gu', Spoken>> = {
  en: {
    need: (n, b) => (n === 0 ? 'The target has been reached.' : `${n} runs needed off ${b} balls.`),
    rrr: (r) => `The required run rate is ${r}.`,
    score: (r, w, o) => `The score is ${r} for ${w} after ${o} overs.`,
    crr: (r) => `The run rate is ${r}.`,
    batter: (n, r, b) => `${n} is on ${r} off ${b} balls`,
    both: (a, b) => `${a}, and ${b}.`,
    partnership: (r, b) => `The partnership is ${r} runs from ${b} balls.`,
    bowler: (n, o, m, r, w) => `${n} has bowled ${o} overs, with ${m} maidens, ${r} runs and ${w} wickets.`,
  },
  hi: {
    need: (n, b) => (n === 0 ? 'लक्ष्य पूरा हो गया है।' : `${b} गेंद में ${n} रन चाहिए।`),
    rrr: (r) => `आवश्यक रन रेट ${r} है।`,
    score: (r, w, o) => `${o} ओवर के बाद स्कोर ${r} पर ${w} विकेट है।`,
    crr: (r) => `रन रेट ${r} है।`,
    batter: (n, r, b) => `${n} ${b} गेंद में ${r} रन पर हैं`,
    both: (a, b) => `${a}, और ${b}।`,
    partnership: (r, b) => `साझेदारी ${b} गेंद में ${r} रन की है।`,
    bowler: (n, o, m, r, w) => `${n} ने ${o} ओवर डाले हैं, ${m} मेडन, ${r} रन देकर ${w} विकेट।`,
  },
  gu: {
    need: (n, b) => (n === 0 ? 'લક્ષ્ય પૂરું થઈ ગયું છે.' : `${b} બોલમાં ${n} રન જોઈએ.`),
    rrr: (r) => `જરૂરી રન રેટ ${r} છે.`,
    score: (r, w, o) => `${o} ઓવર પછી સ્કોર ${r} પર ${w} વિકેટ છે.`,
    crr: (r) => `રન રેટ ${r} છે.`,
    batter: (n, r, b) => `${n} ${b} બોલમાં ${r} રન પર છે`,
    both: (a, b) => `${a}, અને ${b}.`,
    partnership: (r, b) => `ભાગીદારી ${b} બોલમાં ${r} રનની છે.`,
    bowler: (n, o, m, r, w) => `${n} એ ${o} ઓવર ફેંકી છે, ${m} મેડન, ${r} રન આપીને ${w} વિકેટ.`,
  },
};

const CARD = /^(.+?)\s+(\d+)\s*\((\d+)\)$/;
const FIGURES = /^(.+?)\s+(\d+(?:\.\d)?)-(\d+)-(\d+)-(\d+)$/;
const PAIR = /^(\d+)\s*\((\d+)\)$/;
const SCORE = /^(\d+)\/(\d+)$/;

function spokenFor(intent: AskIntent, facts: Facts, lang: Lang): string | null {
  const s = SPOKEN[spokenLang(lang) as 'en' | 'hi' | 'gu'];
  const parts: string[] = [];
  if (intent === 'need') {
    const need = byKey(facts, 'need');
    const left = byKey(facts, 'ballsLeft');
    if (!need || typeof need.value !== 'number') return null;
    parts.push(s.need(need.value, Number(left?.value ?? 0)));
    const rrr = byKey(facts, 'rrr');
    if (rrr && need.value > 0) parts.push(s.rrr(Number(rrr.value).toFixed(2)));
  } else if (intent === 'score') {
    const m = SCORE.exec(text(byKey(facts, 'score')));
    const overs = text(byKey(facts, 'overs'));
    if (!m || !overs) return null;
    parts.push(s.score(m[1] ?? '', m[2] ?? '', overs));
    const crr = byKey(facts, 'crr');
    if (crr) parts.push(s.crr(Number(crr.value).toFixed(2)));
  } else if (intent === 'batting') {
    const cards = ['striker', 'nonStriker']
      .map((k) => CARD.exec(text(byKey(facts, k))))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => s.batter(m[1] ?? '', m[2] ?? '', m[3] ?? ''));
    if (cards.length === 0) return null;
    parts.push(cards.length === 2 ? s.both(cards[0] ?? '', cards[1] ?? '') : `${cards[0]}.`);
    const p = PAIR.exec(text(byKey(facts, 'partnership')));
    if (p) parts.push(s.partnership(p[1] ?? '', p[2] ?? ''));
  } else {
    const m = FIGURES.exec(text(byKey(facts, 'bowler')));
    if (!m) return null;
    parts.push(s.bowler(m[1] ?? '', m[2] ?? '', m[3] ?? '', m[4] ?? '', m[5] ?? ''));
  }
  return parts.join(' ');
}

function ruleAnswer(facts: Facts, lang: Lang): AnswerText | null {
  const pick = (key: string, l: Lang) => byKey(facts, key)?.label[l]?.trim() ?? '';
  const short = pick('ruleShort', lang);
  if (!short) return null;
  const build = (l: Lang) =>
    [pick('ruleTerm', l) && `${pick('ruleTerm', l)}:`, pick('ruleShort', l), pick('ruleDetail', l)]
      .filter(Boolean)
      .join(' ');
  return { answer: build(lang), speak: build(spokenLang(lang)), source: 'template' };
}

/** The answer shown when the model cannot (or may not) write it. Pure and deterministic. */
export function askTemplate(question: string, facts: Facts, lang: Lang): AnswerText {
  const rule = ruleAnswer(facts, lang);
  if (rule) return rule;
  // A prediction / betting question is never answered from the facts, whatever keyword it has.
  const intent = findBanned(question).length > 0 ? null : detectIntent(question);
  const labels =
    intent === null
      ? []
      : INTENT_FACTS[intent]
          .map((key) => byKey(facts, key)?.label[lang]?.trim())
          .filter((l): l is string => typeof l === 'string' && l.length > 0);
  if (intent === null || labels.length === 0) {
    return { answer: UNKNOWN[lang], speak: UNKNOWN[spokenLang(lang)], source: 'unknown' };
  }
  const spoken = spokenFor(intent, facts, lang);
  const fallbackSpoken = INTENT_FACTS[intent]
    .map((key) => byKey(facts, key)?.label[spokenLang(lang)]?.trim())
    .filter((l): l is string => typeof l === 'string' && l.length > 0)
    .map((l) => endSentence(l, spokenLang(lang)))
    .join(' ');
  return {
    answer: endSentence(labels.join(' · '), lang),
    speak: spoken ?? fallbackSpoken,
    source: 'template',
  };
}
