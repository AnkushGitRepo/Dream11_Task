import type { Lang } from '@shared/sports/types';

export interface MockRecapRequest {
  matchId: string;
  fromSeq: number;
  toSeq: number;
  lang: Lang;
}
export interface MockAskRequest {
  matchId: string;
  seq: number;
  question: string;
  lang: Lang;
}
export interface MockRecapResponse {
  lead: string;
  body: string;
  facts: { label: string; value: string }[];
  source: 'template';
  window: { fromSeq: number; toSeq: number };
}
export interface MockAskResponse {
  answer: string;
  source: 'template';
}

const MIN_DELAY_MS = 700;
const MAX_DELAY_MS = 1200;

// Canned copy only for the UI phase. Real numbers come from the engine in Phase 2.
const RECAP: Record<Lang, { lead: string; body: string }> = {
  en: {
    lead: 'Kohli took charge: two sixes in the 19th over.',
    body: 'India added 32 runs and lost 1 wicket. Pandya was caught off Nawaz, and 16 are needed from 6.',
  },
  hinglish: {
    lead: 'Kohli ne game palat diya: 19th over mein 2 chhakke.',
    body: 'India ne 32 runs jode aur 1 wicket gira. Pandya Nawaz ki gend par catch out hue, ab 6 gend mein 16 chahiye.',
  },
  hi: {
    lead: 'कोहली ने मैच पलट दिया: 19वें ओवर में दो छक्के।',
    body: 'भारत ने 32 रन जोड़े और 1 विकेट गिरा। पंड्या नवाज़ की गेंद पर कैच आउट हुए।',
  },
  gu: {
    lead: 'કોહલીએ મેચ પલટી નાખી: 19મી ઓવરમાં બે છગ્ગા.',
    body: 'ભારતે 32 રન ઉમેર્યા અને 1 વિકેટ પડી. પંડ્યા નવાઝની બોલ પર કેચ આઉટ થયા.',
  },
};

const ASK: Record<Lang, string> = {
  en: 'India need 16 runs from 6 balls. Kohli is on 74 and Pandya is out.',
  hinglish: 'India ko 6 gend mein 16 runs chahiye. Kohli 74 par khel rahe hain.',
  hi: 'भारत को 6 गेंदों में 16 रन चाहिए। कोहली 74 पर खेल रहे हैं।',
  gu: 'ભારતને 6 બોલમાં 16 રન જોઈએ. કોહલી 74 પર રમી રહ્યા છે.',
};

function delay(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockRecap(req: MockRecapRequest): Promise<MockRecapResponse> {
  await delay();
  const { lead, body } = RECAP[req.lang];
  return {
    lead,
    body,
    facts: [
      { label: 'runs', value: '+32' },
      { label: 'wkt', value: '1' },
      { label: 'sixes', value: '2' },
    ],
    source: 'template',
    window: { fromSeq: req.fromSeq, toSeq: req.toSeq },
  };
}

export async function mockAsk(req: MockAskRequest): Promise<MockAskResponse> {
  await delay();
  return { answer: ASK[req.lang], source: 'template' };
}
