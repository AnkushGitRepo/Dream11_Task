import type { Facts, Lang } from '../sports/types.js';
import { checkNumbers, findBanned } from './guard.js';
import {
  allowedFromFacts,
  ASK_MAX_TOKENS,
  buildAskPrompt,
  buildRecapPrompt,
  parseAskReply,
  parseRecapReply,
  RECAP_MAX_TOKENS,
  ruleFromFacts,
  type Prompt,
} from './prompts.js';
import { numbersMissingFromSpeak, spokenForm } from './parity.js';
import { askTemplate, recapTemplate, type RecapText } from './templates.js';
import type { TextProvider } from './provider.js';

// SERVER-ONLY. The guarded generation pipeline shared by /api/recap, /api/ask and the eval script:
//   prompt -> model (timeout) -> parse JSON -> guard -> text, else deterministic template.
// `reason` says why the template was used, for logs and the eval report; it never reaches clients.

export type FallbackReason =
  'no-provider' | 'provider-error' | 'timeout' | 'parse' | 'numbers' | 'banned' | 'script' | 'rule-quote' | 'parity';

/** Reasons that mean the model answered but the answer was refused (the eval's "guard failures"). */
export const GUARD_REASONS: readonly FallbackReason[] = [
  'numbers',
  'banned',
  'script',
  'rule-quote',
  'parity',
  'parse',
];

export interface PipelineDeps {
  readonly provider: TextProvider | null;
  readonly timeoutMs: number;
}

export interface RecapResult extends RecapText {
  readonly source: 'ai' | 'template';
  readonly reason?: FallbackReason;
  /** Provider error text (server logs / eval only; endpoints never put it in a response). */
  readonly detail?: string;
}

export interface AskResult {
  readonly answer: string;
  readonly speak: string;
  readonly source: 'ai' | 'template' | 'unknown';
  readonly reason?: FallbackReason;
}

type Called =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly reason: FallbackReason; readonly detail?: string };

/** One model call with a hard timeout. Never throws. */
export async function callModel(deps: PipelineDeps, prompt: Prompt, maxTokens: number): Promise<Called> {
  if (!deps.provider) return { ok: false, reason: 'no-provider' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deps.timeoutMs);
  try {
    const text = await deps.provider.generate({
      ...prompt,
      maxTokens,
      json: true,
      signal: controller.signal,
    });
    return { ok: true, text };
  } catch (error) {
    const detail = error instanceof Error ? error.message.slice(0, 240) : undefined;
    return {
      ok: false,
      reason: controller.signal.aborted ? 'timeout' : 'provider-error',
      ...(detail ? { detail } : {}),
    };
  } finally {
    clearTimeout(timer);
  }
}

const DEVANAGARI = /[ऀ-ॿ]/;
const GUJARATI = /[઀-૿]/;

/** Display text must be in the requested script; Hinglish speech must be Devanagari. */
function scriptOk(display: string, speak: string, lang: Lang): boolean {
  switch (lang) {
    case 'en':
      return !DEVANAGARI.test(display + speak) && !GUJARATI.test(display + speak);
    case 'hinglish':
      return !DEVANAGARI.test(display) && DEVANAGARI.test(speak);
    case 'hi':
      return DEVANAGARI.test(display) && DEVANAGARI.test(speak);
    case 'gu':
      return GUJARATI.test(display) && GUJARATI.test(speak);
  }
}

/** Markdown and arrows the model sometimes adds; they would be read out by the voice. */
const cleanSpeak = (s: string, lang: Lang): string =>
  spokenForm(
    s
      .replace(/[*_#`~→]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
    lang,
  );

const squash = (s: string): string => s.replace(/\s+/g, ' ').trim().toLowerCase();

function check(
  texts: readonly string[],
  allowed: readonly number[],
): Extract<FallbackReason, 'numbers' | 'banned'> | null {
  for (const t of texts) {
    if (findBanned(t).length > 0) return 'banned';
    if (!checkNumbers(t, allowed).ok) return 'numbers';
  }
  return null;
}

export async function runRecap(
  deps: PipelineDeps,
  args: { readonly facts: Facts; readonly lang: Lang },
): Promise<RecapResult> {
  const { facts, lang } = args;
  const fallback = (reason: FallbackReason, detail?: string): RecapResult => ({
    ...recapTemplate(facts, lang),
    source: 'template',
    reason,
    ...(detail ? { detail } : {}),
  });
  const called = await callModel(deps, buildRecapPrompt({ facts, lang }), RECAP_MAX_TOKENS);
  if (!called.ok) return fallback(called.reason, called.detail);
  const parsed = parseRecapReply(called.text);
  if (!parsed) return fallback('parse');
  const speak = cleanSpeak(parsed.speak, lang);
  const bad = check([parsed.lead, parsed.body, speak], allowedFromFacts(facts));
  if (bad) return fallback(bad);
  if (!scriptOk(`${parsed.lead} ${parsed.body}`, speak, lang)) return fallback('script');
  return { lead: parsed.lead, body: parsed.body, speak, source: 'ai' };
}

export async function runAsk(
  deps: PipelineDeps,
  args: { readonly facts: Facts; readonly lang: Lang; readonly question: string },
): Promise<AskResult> {
  const { facts, lang, question } = args;
  const fallback = (reason: FallbackReason): AskResult => ({
    ...askTemplate(question, facts, lang),
    reason,
  });
  const called = await callModel(deps, buildAskPrompt({ facts, lang, question }), ASK_MAX_TOKENS);
  if (!called.ok) return fallback(called.reason);
  const parsed = parseAskReply(called.text);
  if (!parsed) return fallback('parse');
  const speak = cleanSpeak(parsed.speak, lang);
  const bad = check([parsed.answer, speak], allowedFromFacts(facts));
  if (bad) return fallback(bad);
  // Unlike a recap, an answer is voiced IN FULL: every number on screen must be spoken too.
  if (numbersMissingFromSpeak(parsed.answer, speak).length > 0) return fallback('parity');
  if (!scriptOk(parsed.answer, speak, lang)) return fallback('script');
  const rule = ruleFromFacts(facts, lang);
  if (rule && !squash(parsed.answer).includes(squash(rule.short))) return fallback('rule-quote');
  return { answer: parsed.answer, speak, source: 'ai' };
}
