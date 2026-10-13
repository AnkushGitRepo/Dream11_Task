import type { Lang } from '../types.ts';
import type { CricketState } from './stateTypes.ts';

type QKey =
  | 'whoOut'
  | 'freeHit'
  | 'need'
  | 'rrr'
  | 'chaseChances'
  | 'crr'
  | 'partnership'
  | 'bowler'
  | 'batters'
  | 'lastOver'
  | 'summary'
  | 'result'
  | 'topScorer'
  | 'bestBowler'
  | 'finalScore';

const Q: Record<QKey, Record<Lang, string>> = {
  whoOut: {
    en: 'Who got out and how?',
    hinglish: 'Kaun out hua aur kaise?',
    hi: 'कौन आउट हुआ और कैसे?',
    gu: 'કોણ આઉટ થયું અને કેવી રીતે?',
  },
  freeHit: {
    en: 'What is a free hit?',
    hinglish: 'Free hit kya hota hai?',
    hi: 'फ्री हिट क्या होता है?',
    gu: 'ફ્રી હિટ એટલે શું?',
  },
  need: {
    en: 'How many runs are needed?',
    hinglish: 'Kitne runs chahiye?',
    hi: 'कितने रन चाहिए?',
    gu: 'કેટલા રન જોઈએ?',
  },
  rrr: {
    en: 'What is the required run rate?',
    hinglish: 'Required run rate kitna hai?',
    hi: 'रिक्वायर्ड रन रेट कितना है?',
    gu: 'રિક્વાયર્ડ રન રેટ કેટલો છે?',
  },
  chaseChances: {
    en: 'How is the chase going?',
    hinglish: 'Chase kaisa chal raha hai?',
    hi: 'चेज़ कैसा चल रहा है?',
    gu: 'ચેઝ કેવો ચાલી રહ્યો છે?',
  },
  crr: {
    en: 'What is the current run rate?',
    hinglish: 'Current run rate kitna hai?',
    hi: 'करंट रन रेट कितना है?',
    gu: 'કરંટ રન રેટ કેટલો છે?',
  },
  partnership: {
    en: 'How big is the partnership?',
    hinglish: 'Partnership kitni badi hai?',
    hi: 'साझेदारी कितनी बड़ी है?',
    gu: 'ભાગીદારી કેટલી મોટી છે?',
  },
  bowler: {
    en: 'How is the current bowler doing?',
    hinglish: 'Abhi ka bowler kaisa kar raha hai?',
    hi: 'अभी का गेंदबाज़ कैसा कर रहा है?',
    gu: 'અત્યારનો બોલર કેવું કરી રહ્યો છે?',
  },
  batters: {
    en: 'Who is batting well?',
    hinglish: 'Kaun achha khel raha hai?',
    hi: 'कौन अच्छा खेल रहा है?',
    gu: 'કોણ સારું રમી રહ્યું છે?',
  },
  lastOver: {
    en: 'What happened in the last over?',
    hinglish: 'Pichhle over mein kya hua?',
    hi: 'पिछले ओवर में क्या हुआ?',
    gu: 'છેલ્લી ઓવરમાં શું થયું?',
  },
  summary: {
    en: 'Give me a quick summary of the innings',
    hinglish: 'Innings ka quick summary do',
    hi: 'पारी का छोटा सा सारांश दो',
    gu: 'ઇનિંગ્સનો ટૂંકો સારાંશ આપો',
  },
  result: {
    en: 'Who won and how?',
    hinglish: 'Kaun jeeta aur kaise?',
    hi: 'कौन जीता और कैसे?',
    gu: 'કોણ જીત્યું અને કેવી રીતે?',
  },
  topScorer: {
    en: 'Who scored the most runs?',
    hinglish: 'Sabse zyada runs kisne banaye?',
    hi: 'सबसे ज़्यादा रन किसने बनाए?',
    gu: 'સૌથી વધુ રન કોણે બનાવ્યા?',
  },
  bestBowler: {
    en: 'Who bowled best?',
    hinglish: 'Sabse achhi bowling kisne ki?',
    hi: 'सबसे अच्छी गेंदबाज़ी किसने की?',
    gu: 'સૌથી સારી બોલિંગ કોણે કરી?',
  },
  finalScore: {
    en: 'What was the final score?',
    hinglish: 'Final score kya tha?',
    hi: 'फाइनल स्कोर क्या था?',
    gu: 'ફાઇનલ સ્કોર શું હતો?',
  },
};

const FINISHED: readonly QKey[] = ['result', 'finalScore', 'topScorer', 'bestBowler'];
const CHASE: readonly QKey[] = [
  'need',
  'rrr',
  'chaseChances',
  'partnership',
  'bowler',
  'batters',
  'lastOver',
];
const FIRST: readonly QKey[] = ['crr', 'batters', 'bowler', 'partnership', 'lastOver', 'summary'];

/** Exactly four questions, most relevant first: a wicket just fell, a free hit is next, then the situation. */
export function suggestedCricketQuestions(lang: Lang, state: CricketState): string[] {
  const keys: QKey[] = [];
  const lastBall = state.recent[state.recent.length - 1];
  if (state.finished) keys.push(...FINISHED);
  else {
    if (lastBall?.label === 'W') keys.push('whoOut');
    if (state.freeHitNext) keys.push('freeHit');
    keys.push(...(state.target !== null ? CHASE : FIRST));
  }
  const unique = [...new Set(keys)].slice(0, 4);
  return unique.map((k) => Q[k][lang]);
}
