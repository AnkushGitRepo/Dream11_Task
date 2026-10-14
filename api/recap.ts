import { createHash } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { GUARD_REASONS, runRecap } from '../shared/ai/pipeline.js';
import { createTextProvider, type TextProvider } from '../shared/ai/provider.js';
import type { Lang, MatchTimeline } from '../shared/sports/types.js';
import { LruCache } from './_lib/cache.js';
import { guardRequest } from './_lib/handlerKit.js';
import { sendError, sendJson } from './_lib/http.js';
import { inTimeline, resolveMatch } from './_lib/matchSeq.js';
import { loadTimeline } from './_lib/matchStore.js';
import type { RateLimiter } from './_lib/rateLimit.js';
import { recapBodySchema, type RecapBody } from './_lib/schemas.js';
import { sharedLimiter } from './_lib/shared.js';
import { mintSpeakToken, speakSecret } from './_lib/speakToken.js';

// POST /api/recap { matchId, fromSeq, toSeq, seqBase?, lang } -> { id, lead, body, source, window }
// Facts come from the sport engine on the server (the client never sends numbers). One guarded
// model call; any failure serves the deterministic template with source "template". The spoken
// version travels as a signed `speakToken` that /api/speak verifies (api/_lib/speakToken.ts).

const MAX_BODY_BYTES = 1024;
const LLM_TIMEOUT_MS = 6_000;
const RESPONSE_CACHE_ENTRIES = 300;

export interface RecapResponse {
  readonly id: string;
  readonly lead: string;
  readonly body: string;
  readonly source: 'ai' | 'template';
  readonly window: { readonly fromSeq: number; readonly toSeq: number };
  /** Signed token for POST /api/speak; absent when voicing is not configured. */
  readonly speakToken?: string;
}

/** What the response cache holds: the answer plus the text to voice (tokens are minted per send). */
export interface CachedRecap {
  readonly out: RecapResponse;
  readonly speak: string;
}

export interface RecapDeps {
  readonly getProvider: () => TextProvider | null;
  readonly loadTimeline: (matchId: string) => MatchTimeline | null;
  readonly cache: LruCache<CachedRecap>;
  readonly speakSecret?: string;
  readonly limiter: RateLimiter;
  readonly timeoutMs: number;
}

export function createDefaultDeps(env: NodeJS.ProcessEnv = process.env): RecapDeps {
  return {
    getProvider: () => createTextProvider({ GEMINI_API_KEY: env.GEMINI_API_KEY, LLM_MODEL: env.LLM_MODEL }),
    loadTimeline,
    cache: new LruCache<CachedRecap>(RESPONSE_CACHE_ENTRIES),
    speakSecret: speakSecret(env),
    limiter: sharedLimiter(env),
    timeoutMs: LLM_TIMEOUT_MS,
  };
}

/** Stable, URL-safe id (fits /api/speak's pattern): the same window reuses text and audio. */
export function recapId(matchId: string, from: number, to: number, lang: string): string {
  return createHash('sha256')
    .update(`recap|${matchId}|${from}|${to}|${lang}`)
    .digest('base64url')
    .slice(0, 24);
}

function withToken(entry: CachedRecap, lang: Lang, secret: string | undefined): RecapResponse {
  const speakToken = mintSpeakToken(entry.speak, lang, secret);
  return speakToken ? { ...entry.out, speakToken } : entry.out;
}

export async function handleRecap(req: IncomingMessage, res: ServerResponse, deps: RecapDeps): Promise<void> {
  const guarded = await guardRequest(req, res, {
    route: 'api/recap',
    maxBytes: MAX_BODY_BYTES,
    limiter: deps.limiter,
    schema: recapBodySchema,
    expects: 'Expected { matchId, fromSeq, toSeq, lang }.',
  });
  if (!guarded) return;
  const body: RecapBody = guarded.data;
  const { log } = guarded;

  const resolved = resolveMatch(body.matchId, deps.loadTimeline);
  if (!resolved.ok) {
    sendError(res, 'NOT_FOUND', 'Match not found.');
    return log(404, 'unknown-match');
  }
  const { tl, adapter } = resolved.match;
  const from = body.seqBase + body.fromSeq;
  const to = body.seqBase + body.toSeq;
  if (!inTimeline(tl, from, to)) {
    sendError(res, 'BAD_REQUEST', 'That window is outside the match.');
    return log(400, 'out-of-range');
  }

  const id = recapId(body.matchId, from, to, body.lang);
  const cached = deps.cache.get(id);
  if (cached) {
    sendJson(res, 200, withToken(cached, body.lang, deps.speakSecret));
    return log(200, 'cache');
  }

  const facts = adapter.summarize(tl, from, to);
  const result = await runRecap(
    { provider: deps.getProvider(), timeoutMs: deps.timeoutMs },
    { facts, lang: body.lang },
  );
  const out: RecapResponse = {
    id,
    lead: result.lead,
    body: result.body,
    source: result.source,
    window: { fromSeq: body.fromSeq, toSeq: body.toSeq },
  };
  // A refused model answer is cached (do not pay for the same refusal twice); an outage is not.
  const cacheable = result.source === 'ai' || (result.reason && GUARD_REASONS.includes(result.reason));
  const entry: CachedRecap = { out, speak: result.speak };
  if (cacheable) deps.cache.set(id, entry);
  sendJson(res, 200, withToken(entry, body.lang, deps.speakSecret));
  log(200, result.reason ? `${result.source}:${result.reason}` : result.source);
}

const defaultDeps = createDefaultDeps();

/** Vercel / Vite-dev entry point. */
export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return handleRecap(req, res, defaultDeps);
}
