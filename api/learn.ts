import { createHash } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { checkNumbers, findBanned } from '../shared/ai/guard.js';
import { numbersMissingFromSpeak, spokenForm } from '../shared/ai/parity.js';
import { callModel, type PipelineDeps } from '../shared/ai/pipeline.js';
import {
  allowedNumbers,
  buildMomentPrompt,
  composeSpeak,
  parseMomentReply,
  templateMoment,
  type MomentText,
} from '../shared/ai/learnMoment.js';
import { createTextProvider, type TextProvider } from '../shared/ai/provider.js';
import { getRule } from '../shared/sports/rules.js';
import { getAdapter } from '../shared/sports/registry.js';
import type { Lang, MatchTimeline } from '../shared/sports/types.js';
import { LruCache } from './_lib/cache.js';
import { guardRequest } from './_lib/handlerKit.js';
import { sendError, sendJson } from './_lib/http.js';
import { loadTimeline } from './_lib/matchStore.js';
import type { RateLimiter } from './_lib/rateLimit.js';
import { learnBodySchema, type LearnBody } from './_lib/schemas.js';
import { sharedLimiter } from './_lib/shared.js';
import { mintSpeakToken, speakSecret } from './_lib/speakToken.js';

// POST /api/learn { matchId, seq, ruleId, lang } -> { id, title, short, moment, speak, source }
// `title` and `short` are copied from the curated rulebook, never generated. `moment` is ONE model
// sentence built from engine facts, number-guarded; any failure falls back to a template.
// `speakToken` is a signed token for /api/speak (api/_lib/speakToken.ts).

const MAX_BODY_BYTES = 512;
const LEARN_MAX_TOKENS = 400;
const LLM_TIMEOUT_MS = 6_000;
const RESPONSE_CACHE_ENTRIES = 300;
const STATE_FACT_KEYS = ['score', 'overs', 'need', 'rrr', 'crr', 'striker', 'bowler'] as const;

export interface LearnResponse {
  readonly id: string;
  readonly title: string;
  readonly short: string;
  readonly moment: string;
  readonly speak: string;
  readonly source: 'ai' | 'template';
  /** Signed token for POST /api/speak; absent when voicing is not configured. */
  readonly speakToken?: string;
}

export interface LearnDeps {
  readonly getProvider: () => TextProvider | null;
  readonly loadTimeline: (matchId: string) => MatchTimeline | null;
  readonly cache: LruCache<LearnResponse>;
  readonly speakSecret?: string;
  readonly limiter: RateLimiter;
  readonly timeoutMs: number;
}

export function createDefaultDeps(env: NodeJS.ProcessEnv = process.env): LearnDeps {
  return {
    getProvider: () => createTextProvider({ GEMINI_API_KEY: env.GEMINI_API_KEY, LLM_MODEL: env.LLM_MODEL }),
    loadTimeline,
    cache: new LruCache<LearnResponse>(RESPONSE_CACHE_ENTRIES),
    speakSecret: speakSecret(env),
    limiter: sharedLimiter(env),
    timeoutMs: LLM_TIMEOUT_MS,
  };
}

/** Stable, URL-safe id (fits /api/speak's id pattern) so the same moment reuses text and audio. */
export function learnId(b: LearnBody): string {
  return createHash('sha256')
    .update(`${b.matchId}|${b.seq}|${b.ruleId}|${b.lang}`)
    .digest('base64url')
    .slice(0, 24);
}

async function generateMoment(
  deps: PipelineDeps,
  prompt: { system: string; user: string },
  allowed: readonly number[],
  lang: Lang,
): Promise<MomentText | null> {
  const called = await callModel(deps, prompt, LEARN_MAX_TOKENS);
  if (!called.ok) return null; // no key / timeout / provider error: the template takes over
  const parsed = parseMomentReply(called.text);
  if (!parsed) return null;
  const texts = [parsed.moment, parsed.speak];
  const clean = texts.every((t) => checkNumbers(t, allowed).ok && findBanned(t).length === 0);
  // The card voices everything it shows: no number may be dropped from the spoken sentence.
  const spoken = spokenForm(parsed.speak, lang);
  if (!clean || numbersMissingFromSpeak(parsed.moment, spoken).length > 0) return null;
  return { moment: parsed.moment, speak: spoken };
}

function withToken(out: LearnResponse, lang: Lang, secret: string | undefined): LearnResponse {
  const speakToken = mintSpeakToken(out.speak, lang, secret);
  return speakToken ? { ...out, speakToken } : out;
}

export async function handleLearn(req: IncomingMessage, res: ServerResponse, deps: LearnDeps): Promise<void> {
  const guarded = await guardRequest(req, res, {
    route: 'api/learn',
    maxBytes: MAX_BODY_BYTES,
    limiter: deps.limiter,
    schema: learnBodySchema,
    expects: 'Expected { matchId, seq, ruleId, lang }.',
  });
  if (!guarded) return;
  const { data: body, log } = guarded;

  const id = learnId(body);
  const cached = deps.cache.get(id);
  if (cached) {
    sendJson(res, 200, withToken(cached, body.lang, deps.speakSecret));
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

  const generated = await generateMoment(
    { provider: deps.getProvider(), timeoutMs: deps.timeoutMs },
    prompt,
    allowed,
    body.lang,
  );
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
  sendJson(res, 200, withToken(out, body.lang, deps.speakSecret));
  log(200, out.source);
}

const defaultDeps = createDefaultDeps();

/** Vercel / Vite-dev entry point. */
export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return handleLearn(req, res, defaultDeps);
}
