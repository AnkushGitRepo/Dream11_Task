import type { Fact, Lang } from '@shared/sports/types';
import { answerFromFacts } from './mockAnswer';

export interface MockRecapRequest {
  matchId: string;
  fromSeq: number;
  toSeq: number;
  lang: Lang;
  /** Engine-computed facts for the window; all recap numbers come from here. */
  facts: Fact[];
}
export interface MockAskRequest {
  matchId: string;
  seq: number;
  question: string;
  lang: Lang;
  /** Engine-computed snapshot facts; every number in an answer comes from here. */
  facts: Fact[];
}
export interface MockRecapResponse {
  lead: string;
  body: string;
  facts: Fact[];
  source: 'ai' | 'template';
  window: { fromSeq: number; toSeq: number };
}
export interface MockAskResponse {
  answer: string;
  /** 'unknown' = honest "I don't know" (no matching facts). */
  source: 'template' | 'unknown';
}

/** Thrown by mockAsk; `code` mirrors the future /api error codes. */
export class AskError extends Error {
  readonly code: 'RATE_LIMITED' | 'FAILED';
  constructor(code: 'RATE_LIMITED' | 'FAILED') {
    super(code === 'RATE_LIMITED' ? 'Rate limited' : 'Ask failed');
    this.name = 'AskError';
    this.code = code;
  }
}

const MIN_DELAY_MS = 700;
const MAX_DELAY_MS = 1200;

// Template copy per language. Text is assembled from fact labels only, so no number can
// disagree with the FactStrip. Real LLM phrasing arrives in Phase 2.
const COPY: Record<Lang, { intro: string; quiet: string; also: string }> = {
  en: { intro: 'Since you left', quiet: 'A quiet stretch, nothing big happened.', also: 'Also' },
  hinglish: { intro: 'Is dauraan', quiet: 'Shaant stretch raha, kuch bada nahi hua.', also: 'Aur' },
  hi: { intro: 'इस दौरान', quiet: 'शांत दौर रहा, कुछ बड़ा नहीं हुआ।', also: 'और' },
  gu: { intro: 'આ દરમિયાન', quiet: 'શાંત તબક્કો રહ્યો, કંઈ મોટું બન્યું નહીં.', also: 'અને' },
};

const LEAD_FACTS = 3;

function buildText(facts: Fact[], lang: Lang): { lead: string; body: string } {
  const copy = COPY[lang];
  const counts = facts.filter((f) => typeof f.value === 'number' && f.value !== 0);
  const notes = facts.filter((f) => typeof f.value === 'string');
  const head = counts.slice(0, LEAD_FACTS).map((f) => f.label[lang]);
  const tail = [...counts.slice(LEAD_FACTS), ...notes].map((f) => f.label[lang]);
  const lead = head.length > 0 ? `${copy.intro}: ${head.join(', ')}.` : copy.quiet;
  const body = tail.length > 0 ? `${copy.also}: ${tail.join(' · ')}.` : '';
  return { lead, body };
}

/** Template recap text for a fact window (no delay). Same text mockRecap resolves with. */
export function buildRecapText(facts: readonly Fact[], lang: Lang): { lead: string; body: string } {
  return buildText([...facts], lang);
}

function queryParam(name: string): string | null {
  return typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get(name);
}

const wantsFallback = (): boolean => queryParam('fallback') === '1';

function delay(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockRecap(req: MockRecapRequest): Promise<MockRecapResponse> {
  await delay();
  const { lead, body } = buildText(req.facts, req.lang);
  return {
    lead,
    body,
    facts: req.facts,
    source: wantsFallback() ? 'template' : 'ai',
    window: { fromSeq: req.fromSeq, toSeq: req.toSeq },
  };
}

export async function mockAsk(req: MockAskRequest): Promise<MockAskResponse> {
  await delay();
  const mode = queryParam('ask');
  if (mode === 'error') throw new AskError('FAILED');
  if (mode === 'ratelimit') throw new AskError('RATE_LIMITED');
  return answerFromFacts(req.question, req.facts, req.lang);
}
