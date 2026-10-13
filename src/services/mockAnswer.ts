import type { Fact, Lang } from '@shared/sports/types';
import type { MockAskResponse } from './mockApi';

// Keyword intents for the mock Ask. Answers are assembled ONLY from fact labels, so no number can
// disagree with the engine. The real LLM arrives in Phase 2; this keeps the UI honest meanwhile.

type Intent = 'need' | 'bowler' | 'batting' | 'score';

const KEYWORDS: ReadonlyArray<readonly [Intent, readonly string[]]> = [
  ['need', ['need', 'required', 'target', 'chahiye', 'chahie', 'चाहिए', 'चाहिये', 'જોઈએ']],
  ['bowler', ['bowler', 'bowling', 'bowled', 'figure', 'over', 'गेंदबाज', 'बॉलर', 'બોલર', 'બોલિંગ']],
  ['batting', ['batting', 'batter', 'batsman', 'scorer', 'who', 'kaun', 'बल्लेबाज', 'बैट', 'કોણ', 'બેટિંગ']],
  ['score', ['score', 'run', 'total', 'skor', 'स्कोर', 'रन', 'સ્કોર', 'રન']],
];

/** Fact keys (in order) that answer each intent. */
const INTENT_FACTS: Readonly<Record<Intent, readonly string[]>> = {
  need: ['need', 'rrr'],
  bowler: ['bowler'],
  batting: ['striker', 'nonStriker', 'partnership'],
  score: ['score', 'overs', 'crr'],
};

const UNKNOWN: Record<Lang, string> = {
  en: "I don't have that yet — I can only look at this match's data.",
  hinglish: 'Ye info abhi mere paas nahi hai — main sirf is match ka data dekh sakta hoon.',
  hi: 'यह जानकारी अभी मेरे पास नहीं है — मैं सिर्फ़ इस मैच का डेटा देख सकता हूँ।',
  gu: 'આ માહિતી હજી મારી પાસે નથી — હું ફક્ત આ મેચનો ડેટા જોઈ શકું છું.',
};

/** A rule question was matched upstream: answer with the rulebook text, verbatim. */
function ruleAnswer(facts: readonly Fact[], lang: Lang): string | null {
  const get = (key: string) => facts.find((f) => f.key === key)?.label[lang];
  const term = get('ruleTerm');
  const short = get('ruleShort');
  if (!term || !short) return null;
  const detail = get('ruleDetail');
  return detail ? `${term}: ${short} ${detail}` : `${term}: ${short}`;
}

export function detectIntent(question: string): Intent | null {
  const q = question.toLowerCase();
  for (const [intent, words] of KEYWORDS) {
    if (words.some((w) => q.includes(w))) return intent;
  }
  return null;
}

export function answerFromFacts(
  question: string,
  facts: readonly Fact[],
  lang: Lang,
): Omit<MockAskResponse, 'id'> {
  const rule = ruleAnswer(facts, lang);
  if (rule) return { answer: rule, source: 'template' };
  const intent = detectIntent(question);
  const labels =
    intent === null
      ? []
      : INTENT_FACTS[intent]
          .map((key) => facts.find((f) => f.key === key)?.label[lang])
          .filter((l): l is string => typeof l === 'string' && l.length > 0);
  if (labels.length === 0) return { answer: UNKNOWN[lang], source: 'unknown' };
  return { answer: labels.join(' · '), source: 'template' };
}
