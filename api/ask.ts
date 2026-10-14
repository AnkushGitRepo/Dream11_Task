import { createHash } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { GUARD_REASONS, runAsk } from '../shared/ai/pipeline.js';
import { createTextProvider, type TextProvider } from '../shared/ai/provider.js';
import { askContextWithRule, lookupRule } from '../shared/sports/rules.js';
import type { Lang, MatchTimeline } from '../shared/sports/types.js';
import { LruCache } from './_lib/cache.js';
import { guardRequest } from './_lib/handlerKit.js';
import { sendError, sendJson } from './_lib/http.js';
import { inTimeline, resolveMatch } from './_lib/matchSeq.js';
import { loadTimeline } from './_lib/matchStore.js';
import type { RateLimiter } from './_lib/rateLimit.js';
import { askBodySchema } from './_lib/schemas.js';
import { sharedLimiter } from './_lib/shared.js';
import { mintSpeakToken, speakSecret } from './_lib/speakToken.js';

// POST /api/ask { matchId, seq, seqBase?, question, lang } -> { id, answer, source }
// The question is untrusted: it goes into the prompt only inside <question> tags, is never logged,
// and a rule question ("what is X") adds the curated rulebook entry to the facts, which the answer
// must quote. Any model or guard failure serves the deterministic template.

const MAX_BODY_BYTES = 2048;
const LLM_TIMEOUT_MS = 6_000;
const RESPONSE_CACHE_ENTRIES = 300;

export interface AskResponse {
  readonly id: string;
  readonly answer: string;
  readonly source: 'ai' | 'template' | 'unknown';
  /** Signed token for POST /api/speak; absent when voicing is not configured. */
  readonly speakToken?: string;
}

/** What the response cache holds: the answer plus the text to voice (tokens are minted per send). */
export interface CachedAsk {
  readonly out: AskResponse;
  readonly speak: string;
}

export interface AskDeps {
  readonly getProvider: () => TextProvider | null;
  readonly loadTimeline: (matchId: string) => MatchTimeline | null;
  readonly cache: LruCache<CachedAsk>;
  readonly speakSecret?: string;
  readonly limiter: RateLimiter;
  readonly timeoutMs: number;
}

export function createDefaultDeps(env: NodeJS.ProcessEnv = process.env): AskDeps {
  return {
    getProvider: () => createTextProvider({ GEMINI_API_KEY: env.GEMINI_API_KEY, LLM_MODEL: env.LLM_MODEL }),
    loadTimeline,
    cache: new LruCache<CachedAsk>(RESPONSE_CACHE_ENTRIES),
    speakSecret: speakSecret(env),
    limiter: sharedLimiter(env),
    timeoutMs: LLM_TIMEOUT_MS,
  };
}

/** Stable id: same match moment + language + (normalised) question reuses text and audio. */
export function askId(matchId: string, seq: number, lang: string, question: string): string {
  const q = question.toLowerCase().replace(/\s+/g, ' ').trim();
  return createHash('sha256').update(`ask|${matchId}|${seq}|${lang}|${q}`).digest('base64url').slice(0, 24);
}

function withToken(entry: CachedAsk, lang: Lang, secret: string | undefined): AskResponse {
  const speakToken = mintSpeakToken(entry.speak, lang, secret);
  return speakToken ? { ...entry.out, speakToken } : entry.out;
}

export async function handleAsk(req: IncomingMessage, res: ServerResponse, deps: AskDeps): Promise<void> {
  const guarded = await guardRequest(req, res, {
    route: 'api/ask',
    maxBytes: MAX_BODY_BYTES,
    limiter: deps.limiter,
    schema: askBodySchema,
    expects: 'Expected { matchId, seq, question, lang }.',
  });
  if (!guarded) return;
  const { data: body, log } = guarded;

  const resolved = resolveMatch(body.matchId, deps.loadTimeline);
  if (!resolved.ok) {
    sendError(res, 'NOT_FOUND', 'Match not found.');
    return log(404, 'unknown-match');
  }
  const { tl, adapter } = resolved.match;
  const seq = body.seqBase + body.seq;
  if (!inTimeline(tl, seq, seq)) {
    sendError(res, 'BAD_REQUEST', 'That moment is outside the match.');
    return log(400, 'out-of-range');
  }

  const id = askId(body.matchId, seq, body.lang, body.question);
  const cached = deps.cache.get(id);
  if (cached) {
    sendJson(res, 200, withToken(cached, body.lang, deps.speakSecret));
    return log(200, 'cache');
  }

  const rule = lookupRule(body.question, tl.meta.sport);
  const facts = askContextWithRule(adapter.askContext(tl, seq), rule);
  const result = await runAsk(
    { provider: deps.getProvider(), timeoutMs: deps.timeoutMs },
    { facts, lang: body.lang, question: body.question },
  );
  const out: AskResponse = { id, answer: result.answer, source: result.source };
  const cacheable = result.source === 'ai' || (result.reason && GUARD_REASONS.includes(result.reason));
  const entry: CachedAsk = { out, speak: result.speak };
  if (cacheable) deps.cache.set(id, entry);
  sendJson(res, 200, withToken(entry, body.lang, deps.speakSecret));
  log(200, result.reason ? `${result.source}:${result.reason}` : result.source);
}

const defaultDeps = createDefaultDeps();

/** Vercel / Vite-dev entry point. */
export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return handleAsk(req, res, defaultDeps);
}
