import { createHash } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { checkNumbers } from '../shared/ai/guard';
import {
  allowedNumbers,
  buildMomentPrompt,
  composeSpeak,
  parseMomentReply,
  templateMoment,
  type MomentText,
} from '../shared/ai/learnMoment';
import { createTextProvider, type TextProvider } from '../shared/ai/provider';
import { getRule } from '../shared/sports/rules';
import { getAdapter } from '../shared/sports/registry';
import type { Lang, MatchTimeline } from '../shared/sports/types';
import { LruCache } from './_lib/cache';
import { BodyTooLargeError, clientIp, isJsonRequest, readBody, sendError, sendJson } from './_lib/http';
import { isMatchId, loadTimeline } from './_lib/matchStore';
import { createRateLimiter, type RateLimiter } from './_lib/rateLimit';
import { registerSpeakable } from './_lib/speakRegistry';

// POST /api/learn { matchId, seq, ruleId, lang } -> { id, title, short, moment, speak, source }
// `title` and `short` are copied from the curated rulebook, never generated. `moment` is ONE model
// sentence built from engine facts, number-guarded; any failure falls back to a template.
// `speak` is registered under kind 'learn' so /api/speak can voice it by id.

const MAX_BODY_BYTES = 512;
const LLM_TIMEOUT_MS = 6_000;
const RESPONSE_CACHE_ENTRIES = 300;
const MAX_SEQ = 100_000;
const RULE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,39}$/;
const LANGS: readonly Lang[] = ['en', 'hinglish', 'hi', 'gu'];
const STATE_FACT_KEYS = ['score', 'overs', 'need', 'rrr', 'crr', 'striker', 'bowler'] as const;

export interface LearnResponse {
  readonly id: string;
  readonly title: string;
  readonly short: string;
  readonly moment: string;
  readonly speak: string;
  readonly source: 'ai' | 'template';
}

export interface LearnDeps {
  readonly getProvider: () => TextProvider | null;
  readonly loadTimeline: (matchId: string) => MatchTimeline | null;
  readonly cache: LruCache<LearnResponse>;
  readonly limiter: RateLimiter;
  readonly timeoutMs: number;
}

export function createDefaultDeps(env: NodeJS.ProcessEnv = process.env): LearnDeps {
  return {
    getProvider: () => createTextProvider({ GEMINI_API_KEY: env.GEMINI_API_KEY, LLM_MODEL: env.LLM_MODEL }),
    loadTimeline,
    cache: new LruCache<LearnResponse>(RESPONSE_CACHE_ENTRIES),
    limiter: createRateLimiter({ perMinute: Number(env.RATE_LIMIT_PER_MIN ?? 20), burst: 5 }),
    timeoutMs: LLM_TIMEOUT_MS,
  };
}

interface ParsedBody {
  readonly matchId: string;
  readonly seq: number;
  readonly ruleId: string;
  readonly lang: Lang;
}

function parseBody(raw: string): ParsedBody | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const { matchId, seq, ruleId, lang } = value as Record<string, unknown>;
  if (!isMatchId(matchId)) return null;
  if (typeof seq !== 'number' || !Number.isInteger(seq) || seq < 0 || seq > MAX_SEQ) return null;
  if (typeof ruleId !== 'string' || !RULE_ID_PATTERN.test(ruleId)) return null;
  if (typeof lang !== 'string' || !LANGS.includes(lang as Lang)) return null;
  return { matchId, seq, ruleId, lang: lang as Lang };
}

/** Stable, URL-safe id (fits /api/speak's id pattern) so the same moment reuses text and audio. */
export function learnId(b: ParsedBody): string {
  return createHash('sha256')
    .update(`${b.matchId}|${b.seq}|${b.ruleId}|${b.lang}`)
    .digest('base64url')
    .slice(0, 24);
}

async function generateMoment(
  provider: TextProvider,
  prompt: { system: string; user: string },
  allowed: readonly number[],
  timeoutMs: number,
): Promise<MomentText | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const reply = await provider.generate({ ...prompt, signal: controller.signal });
    const parsed = parseMomentReply(reply);
    if (!parsed) return null;
    const ok = checkNumbers(parsed.moment, allowed).ok && checkNumbers(parsed.speak, allowed).ok;
    return ok ? parsed : null;
  } catch {
    return null; // timeout / provider error: the template takes over, details are never forwarded
  } finally {
    clearTimeout(timer);
  }
}

export async function handleLearn(req: IncomingMessage, res: ServerResponse, deps: LearnDeps): Promise<void> {
  const started = Date.now();
  const log = (status: number, source: string) =>
    // Method, route, status, latency, source only: never prompts, keys or model output.
    console.info(`[api/learn] ${req.method} ${status} ${Date.now() - started}ms ${source}`);

  if (req.method !== 'POST') {
    sendError(res, 'METHOD_NOT_ALLOWED', 'Use POST.', { Allow: 'POST' });
    return log(405, 'rejected');
  }
  if (!isJsonRequest(req)) {
    sendError(res, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.');
    return log(415, 'rejected');
  }
  const limit = deps.limiter.take(clientIp(req));
  if (!limit.ok) {
    sendError(res, 'RATE_LIMITED', 'Too many requests. Try again shortly.', {
      'Retry-After': String(limit.retryAfterSeconds),
    });
    return log(429, 'rate-limited');
  }

  let raw: string;
  try {
    raw = await readBody(req, MAX_BODY_BYTES);
  } catch (error) {
    const tooLarge = error instanceof BodyTooLargeError;
    sendError(
      res,
      tooLarge ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST',
      tooLarge ? 'Body too large.' : 'Bad request.',
    );
    return log(tooLarge ? 413 : 400, 'rejected');
  }
  const body = parseBody(raw);
  if (!body) {
    sendError(res, 'BAD_REQUEST', 'Expected { matchId, seq, ruleId, lang }.');
    return log(400, 'rejected');
  }

  const id = learnId(body);
  const cached = deps.cache.get(id);
  if (cached) {
    sendJson(res, 200, cached);
    return log(200, 'cache');
  }

  const tl = deps.loadTimeline(body.matchId);
  const event = tl?.events[body.seq];
  const adapter = tl ? getAdapter(tl.meta.sport) : null;
  const rule = tl ? getRule(tl.meta.sport, body.ruleId) : null;
  if (!tl || !event || !adapter || !rule || !adapter.teachables(tl, body.seq).includes(body.ruleId)) {
    sendError(res, 'NOT_FOUND', 'Nothing to learn at that moment.');
    return log(404, 'not-teachable');
  }

  const facts = adapter.askContext(tl, body.seq);
  const stateLines = STATE_FACT_KEYS.map((k) => facts.items.find((f) => f.key === k)?.label.en).filter(
    (l): l is string => typeof l === 'string',
  );
  const prompt = buildMomentPrompt({ rule, event, lang: body.lang, stateLines });
  const allowed = allowedNumbers({ shown: prompt.user, event });

  const provider = deps.getProvider();
  const generated = provider ? await generateMoment(provider, prompt, allowed, deps.timeoutMs) : null;
  const text = generated ?? templateMoment(event, body.lang);
  const spoken = composeSpeak(rule, body.lang, text.speak);

  const out: LearnResponse = {
    id,
    title: rule.term[body.lang],
    short: rule.short[body.lang],
    moment: text.moment,
    speak: spoken,
    source: generated ? 'ai' : 'template',
  };
  deps.cache.set(id, out);
  registerSpeakable('learn', id, { text: spoken, lang: body.lang });
  sendJson(res, 200, out);
  log(200, out.source);
}

const defaultDeps = createDefaultDeps();

/** Vercel / Vite-dev entry point. */
export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return handleLearn(req, res, defaultDeps);
}
