import { format } from '../../i18n/format';
import type { Lang } from '../types';

// Cricket-specific UI wording in en, hinglish (Hindi in Latin script), hi, gu.
// Core strings (shared/i18n/*) must stay sport-neutral; cricket words live here.
// `satisfies` makes a missing translation a type error.
const en = {
  needOff: 'Need {n} off {m}',
  ballsLeft: '{n} balls left',
  inningsComplete: 'Innings complete',
  resultWon: '{team} won by {n} wickets',
  chasing: 'chasing {n}',
  overs: '{n} ov',
  freeHit: 'FREE HIT',
  freeHitTag: 'FH',
  crr: 'CRR {n}',
  rrr: 'RRR {n}',
  partnership: "P'ship {n}",
  bowler: 'Bowler',
  onStrike: 'On strike',
  batters: 'Batters',
  matchRates: 'Match rates',
  scoreboard: 'Scoreboard',
  recentBalls: 'Recent balls',
  chaseProgress: 'Chase progress',
  gapBalls: '{n} balls',
  gapBallsOvers: '{n} balls · {m} overs',
  ballOver: 'Over {clock}',
  ballFreeHit: 'free hit',
  outDot: 'dot ball',
  outRun: '1 run',
  outRuns: '{n} runs',
  outFour: 'four',
  outSix: 'six',
  outWicket: 'wicket',
  outWide: 'wide',
  outNoBall: 'no ball',
  outBye: 'bye',
  outLegBye: 'leg bye',
  endOfOver: 'End of over {n}. {score}/{wkts}.',
  needShift: 'Need {a} off {b} → {c} off {d}',
} as const;

type Keys = keyof typeof en;
export type CricketLabelKey = Keys;

export const cricketLabels = {
  en,
  hinglish: {
    needOff: '{m} gend mein {n} run chahiye',
    ballsLeft: '{n} gend baaki',
    inningsComplete: 'Innings khatam',
    resultWon: '{team} {n} wickets se jeeta',
    chasing: '{n} ka peecha kar rahe',
    overs: '{n} ov',
    freeHit: 'FREE HIT',
    freeHitTag: 'FH',
    crr: 'CRR {n}',
    rrr: 'RRR {n}',
    partnership: 'Partnership {n}',
    bowler: 'Bowler',
    onStrike: 'Strike par',
    batters: 'Batters',
    matchRates: 'Match rates',
    scoreboard: 'Scoreboard',
    recentBalls: 'Haal ki balls',
    chaseProgress: 'Chase ki progress',
    gapBalls: '{n} balls',
    gapBallsOvers: '{n} balls · {m} overs',
    ballOver: 'Over {clock}',
    ballFreeHit: 'free hit',
    outDot: 'dot ball',
    outRun: '1 run',
    outRuns: '{n} runs',
    outFour: 'chauka',
    outSix: 'chhakka',
    outWicket: 'wicket',
    outWide: 'wide',
    outNoBall: 'no ball',
    outBye: 'bye',
    outLegBye: 'leg bye',
    endOfOver: '{n} over khatam. {score}/{wkts}.',
    needShift: 'Chahiye {a} run, {b} gend → {c} run, {d} gend',
  },
  hi: {
    needOff: '{m} गेंद में {n} रन चाहिए',
    ballsLeft: '{n} गेंद बाकी',
    inningsComplete: 'पारी समाप्त',
    resultWon: '{team} {n} विकेट से जीता',
    chasing: '{n} का पीछा',
    overs: '{n} ओवर',
    freeHit: 'फ्री हिट',
    freeHitTag: 'फ्री',
    crr: 'CRR {n}',
    rrr: 'RRR {n}',
    partnership: 'साझेदारी {n}',
    bowler: 'गेंदबाज़',
    onStrike: 'स्ट्राइक पर',
    batters: 'बल्लेबाज़',
    matchRates: 'मैच रेट',
    scoreboard: 'स्कोरबोर्ड',
    recentBalls: 'हाल की गेंदें',
    chaseProgress: 'चेज़ की प्रगति',
    gapBalls: '{n} गेंद',
    gapBallsOvers: '{n} गेंद · {m} ओवर',
    ballOver: 'ओवर {clock}',
    ballFreeHit: 'फ्री हिट',
    outDot: 'डॉट बॉल',
    outRun: '1 रन',
    outRuns: '{n} रन',
    outFour: 'चौका',
    outSix: 'छक्का',
    outWicket: 'विकेट',
    outWide: 'वाइड',
    outNoBall: 'नो बॉल',
    outBye: 'बाई',
    outLegBye: 'लेग बाई',
    endOfOver: '{n} ओवर समाप्त। {score}/{wkts}।',
    needShift: 'चाहिए {a} रन, {b} गेंद → {c} रन, {d} गेंद',
  },
  gu: {
    needOff: '{m} બોલમાં {n} રન જોઈએ',
    ballsLeft: '{n} બોલ બાકી',
    inningsComplete: 'ઇનિંગ્સ પૂરી',
    resultWon: '{team} {n} વિકેટથી જીત્યું',
    chasing: '{n} નો પીછો',
    overs: '{n} ઓવર',
    freeHit: 'ફ્રી હિટ',
    freeHitTag: 'ફ્રી',
    crr: 'CRR {n}',
    rrr: 'RRR {n}',
    partnership: 'ભાગીદારી {n}',
    bowler: 'બોલર',
    onStrike: 'સ્ટ્રાઇક પર',
    batters: 'બેટર',
    matchRates: 'મેચ રેટ',
    scoreboard: 'સ્કોરબોર્ડ',
    recentBalls: 'તાજેતરના બોલ',
    chaseProgress: 'ચેઝની પ્રગતિ',
    gapBalls: '{n} બોલ',
    gapBallsOvers: '{n} બોલ · {m} ઓવર',
    ballOver: 'ઓવર {clock}',
    ballFreeHit: 'ફ્રી હિટ',
    outDot: 'ડોટ બોલ',
    outRun: '1 રન',
    outRuns: '{n} રન',
    outFour: 'ચોગ્ગો',
    outSix: 'છગ્ગો',
    outWicket: 'વિકેટ',
    outWide: 'વાઇડ',
    outNoBall: 'નો બોલ',
    outBye: 'બાય',
    outLegBye: 'લેગ બાય',
    endOfOver: '{n} ઓવર પૂરી. {score}/{wkts}.',
    needShift: 'જોઈએ {a} રન, {b} બોલ → {c} રન, {d} બોલ',
  },
} satisfies Record<Lang, Record<Keys, string>>;

export function cricketLabel(
  lang: Lang,
  key: Keys,
  values?: Readonly<Record<string, string | number>>,
): string {
  return format(cricketLabels[lang][key], values);
}

/** Same label in all four languages (for engine facts that carry Record<Lang, string>). */
export function cricketLabelAll(
  key: Keys,
  values?: Readonly<Record<string, string | number>>,
): Record<Lang, string> {
  return {
    en: cricketLabel('en', key, values),
    hinglish: cricketLabel('hinglish', key, values),
    hi: cricketLabel('hi', key, values),
    gu: cricketLabel('gu', key, values),
  };
}

const OUTCOME_BY_LABEL: Readonly<Record<string, Keys>> = {
  '•': 'outDot',
  '1': 'outRun',
  '4': 'outFour',
  '6': 'outSix',
  W: 'outWicket',
  wd: 'outWide',
  nb: 'outNoBall',
  b: 'outBye',
  lb: 'outLegBye',
};

/** Screen-reader text for a ball chip: "Over 18.2, free hit: four". `null` => caller falls back. */
export function ballA11y(
  lang: Lang,
  ball: { readonly label: string; readonly clock: string; readonly freeHit: boolean },
): string | null {
  const key = OUTCOME_BY_LABEL[ball.label];
  const outcome = key
    ? cricketLabel(lang, key)
    : /^\d+$/.test(ball.label)
      ? cricketLabel(lang, 'outRuns', { n: ball.label })
      : null;
  if (outcome === null) return null;
  const over = cricketLabel(lang, 'ballOver', { clock: ball.clock });
  const fh = ball.freeHit ? `, ${cricketLabel(lang, 'ballFreeHit')}` : '';
  return `${over}${fh}: ${outcome}`;
}
