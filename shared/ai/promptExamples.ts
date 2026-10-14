import type { Facts, Lang } from '../sports/types.js';

// Few-shot examples for the recap and ask prompts: two per language. Every number in an example's
// output appears in its own facts, and prompts.test.ts runs each one through the number guard, the
// banned-language check and the spoken-style check, so a bad example fails the build.

export interface RecapExample {
  readonly facts: Facts;
  readonly output: { readonly lead: string; readonly body: string; readonly speak: string };
}

export interface AskExample {
  readonly question: string;
  readonly facts: Facts;
  readonly output: { readonly answer: string; readonly speak: string };
}

const item = (key: string, value: number | string, en: string) => ({
  key,
  value,
  label: { en, hinglish: en, hi: en, gu: en },
});

const OVER_FACTS: Facts = {
  window: { fromSeq: 0, toSeq: 5, fromClock: '17.1', toClock: '17.6' },
  items: [
    item('balls', 6, '6 balls'),
    item('runs', 14, '+14 runs'),
    item('wkts', 0, '0 wkt'),
    item('sixes', 1, '1×6'),
    item('fours', 1, '1×4'),
    item('needNow', 40, 'Need 40 off 18 balls'),
    item('score', '120/4', 'Score 120/4'),
    item('batter:Kohli', 12, 'Kohli scored 12 off 4 balls'),
  ],
  highlights: [],
  numbers: [0, 1, 4, 6, 12, 14, 17.1, 17.6, 18, 40, 120],
};

const WICKET_FACTS: Facts = {
  window: { fromSeq: 10, toSeq: 10, fromClock: '19.1', toClock: '19.1' },
  items: [
    item('balls', 1, '1 balls'),
    item('runs', 0, '+0 runs'),
    item('wkts', 1, '1 wkt'),
    item('needNow', 16, 'Need 16 off 6 balls'),
    item('score', '144/5', 'Score 144/5'),
  ],
  highlights: ['Pandya c Iftikhar b Nawaz 40 (37), 144/5 at 19.1'],
  numbers: [0, 1, 5, 6, 16, 19, 19.1, 37, 40, 144],
};

const ASK_FACTS: Facts = {
  window: { fromSeq: 0, toSeq: 0, fromClock: '', toClock: '' },
  items: [
    item('need', 22, 'Need 22 off 7 balls'),
    item('ballsLeft', 7, '7'),
    item('striker', 'Kohli 68 (49)', 'Kohli 68 (49)'),
    item('nonStriker', 'Pandya 40 (36)', 'Pandya 40 (36)'),
    item('score', '138/4', 'Score 138/4'),
  ],
  highlights: [],
  numbers: [4, 7, 22, 36, 40, 49, 68, 138],
};

export const RECAP_EXAMPLES: Readonly<Record<Lang, readonly [RecapExample, RecapExample]>> = {
  en: [
    {
      facts: OVER_FACTS,
      output: {
        lead: '14 runs came off the over, with a six and a four.',
        body: 'Kohli scored 12 off 4 balls. India need 40 off 18 balls at 120/4.',
        speak:
          'What an over! A six, a four, 14 runs, and Kohli is flying. India still need 40.',
      },
    },
    {
      facts: WICKET_FACTS,
      output: {
        lead: 'Big blow: Pandya is out for 40 off 37.',
        body: 'He was caught by Iftikhar off Nawaz at 19.1, and India are 144/5. They need 16 off 6 balls.',
        speak:
          'Oh no, Pandya is gone! Caught off Nawaz for 40, and India still need 16.',
      },
    },
  ],
  hinglish: [
    {
      facts: OVER_FACTS,
      output: {
        lead: 'Over mein 14 run aaye, ek chhakka aur ek chauka.',
        body: 'Kohli ne 4 gend mein 12 run banaye. India ko 18 gend mein 40 run chahiye, score 120/4.',
        speak:
          'अरे यार, क्या ओवर था! एक छक्का, एक चौका, पूरे 14 रन। इंडिया को अब भी 40 रन चाहिए।',
      },
    },
    {
      facts: WICKET_FACTS,
      output: {
        lead: 'Bada jhatka: Pandya 37 gend mein 40 run banake out.',
        body: 'Iftikhar ne Nawaz ki gend par catch pakda, 19.1 par India 144/5. Ab 6 gend mein 16 run chahiye.',
        speak:
          'अरे, बड़ा झटका! पंड्या 40 रन बनाकर आउट, नवाज़ की गेंद पर कैच। इंडिया को अब भी 16 रन चाहिए।',
      },
    },
  ],
  hi: [
    {
      facts: OVER_FACTS,
      output: {
        lead: 'ओवर में 14 रन आए, एक छक्का और एक चौका।',
        body: 'कोहली ने 4 गेंद में 12 रन बनाए। भारत को 18 गेंद में 40 रन चाहिए, स्कोर 120/4।',
        speak:
          'अरे वाह, क्या ओवर था! एक छक्का, एक चौका, पूरे 14 रन। भारत को अब भी 40 रन चाहिए।',
      },
    },
    {
      facts: WICKET_FACTS,
      output: {
        lead: 'बड़ा झटका: पंड्या 37 गेंद में 40 रन बनाकर आउट।',
        body: 'इफ़्तिख़ार ने नवाज़ की गेंद पर कैच लिया, स्कोर 144/5। अब 6 गेंद में 16 रन चाहिए।',
        speak:
          'अरे, बड़ा झटका! पंड्या 40 रन बनाकर आउट, नवाज़ की गेंद पर कैच। भारत को अब भी 16 रन चाहिए।',
      },
    },
  ],
  gu: [
    {
      facts: OVER_FACTS,
      output: {
        lead: 'ઓવરમાં 14 રન આવ્યા, એક છગ્ગો અને એક ચોગ્ગો.',
        body: 'કોહલીએ 4 બોલમાં 12 રન બનાવ્યા. ભારતને 18 બોલમાં 40 રન જોઈએ, સ્કોર 120/4.',
        speak:
          'અરે વાહ, શું ઓવર હતો! એક છગ્ગો, એક ચોગ્ગો, પૂરા 14 રન. ભારતને હજી 40 રન જોઈએ.',
      },
    },
    {
      facts: WICKET_FACTS,
      output: {
        lead: 'મોટો ઝટકો: પંડ્યા 37 બોલમાં 40 રન બનાવી આઉટ.',
        body: 'ઇફ્તિખારે નવાઝના બોલ પર કેચ લીધો, સ્કોર 144/5. હવે 6 બોલમાં 16 રન જોઈએ.',
        speak:
          'અરે, મોટો ઝટકો! પંડ્યા 40 રન બનાવી આઉટ, નવાઝના બોલ પર કેચ. ભારતને હજી 16 રન જોઈએ.',
      },
    },
  ],
};

export const ASK_EXAMPLES: Readonly<Record<Lang, readonly [AskExample, AskExample]>> = {
  en: [
    {
      question: 'How many runs do India need?',
      facts: ASK_FACTS,
      output: {
        answer: 'India need 22 runs from 7 balls.',
        speak: 'India need 22 runs from 7 balls.',
      },
    },
    {
      question: 'Who is batting?',
      facts: ASK_FACTS,
      output: {
        answer: 'Kohli is on 68 off 49 and Pandya is on 40 off 36.',
        speak: 'Kohli is on 68 and Pandya is on 40.',
      },
    },
  ],
  hinglish: [
    {
      question: 'kitne run chahiye?',
      facts: ASK_FACTS,
      output: {
        answer: 'India ko 7 gend mein 22 run chahiye.',
        speak: 'इंडिया को 7 गेंद में 22 रन चाहिए।',
      },
    },
    {
      question: 'kaun khel raha hai?',
      facts: ASK_FACTS,
      output: {
        answer: 'Kohli 49 gend mein 68 par hain aur Pandya 36 gend mein 40 par.',
        speak: 'कोहली 68 रन पर हैं और पंड्या 40 रन पर।',
      },
    },
  ],
  hi: [
    {
      question: 'कितने रन चाहिए?',
      facts: ASK_FACTS,
      output: {
        answer: 'भारत को 7 गेंद में 22 रन चाहिए।',
        speak: 'भारत को 7 गेंद में 22 रन चाहिए।',
      },
    },
    {
      question: 'कौन बल्लेबाज़ी कर रहा है?',
      facts: ASK_FACTS,
      output: {
        answer: 'कोहली 49 गेंद में 68 पर हैं और पंड्या 36 गेंद में 40 पर।',
        speak: 'कोहली 68 रन पर हैं और पंड्या 40 रन पर।',
      },
    },
  ],
  gu: [
    {
      question: 'કેટલા રન જોઈએ?',
      facts: ASK_FACTS,
      output: {
        answer: 'ભારતને 7 બોલમાં 22 રન જોઈએ.',
        speak: 'ભારતને 7 બોલમાં 22 રન જોઈએ.',
      },
    },
    {
      question: 'કોણ બેટિંગ કરી રહ્યું છે?',
      facts: ASK_FACTS,
      output: {
        answer: 'કોહલી 49 બોલમાં 68 પર છે અને પંડ્યા 36 બોલમાં 40 પર.',
        speak: 'કોહલી 68 રન પર છે અને પંડ્યા 40 રન પર.',
      },
    },
  ],
};
