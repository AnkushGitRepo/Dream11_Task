import { createHash } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { checkNumbers, findBanned } from '../shared/ai/guard';
import { callModel, type PipelineDeps } from '../shared/ai/pipeline';
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
import type { MatchTimeline } from '../shared/sports/types';
import { LruCache } from './_lib/cache';
import { guardRequest } from './_lib/handlerKit';
import { sendError, sendJson } from './_lib/http';
import { loadTimeline } from './_lib/matchStore';
import type { RateLimiter } from './_lib/rateLimit';
import { learnBodySchema, type LearnBody } from './_lib/schemas';
import { sharedLimiter } from './_lib/shared';
import { registerSpeakable } from './_lib/speakRegistry';

// POST /api/learn { matchId, seq, ruleId, lang } -> { id, title, short, moment, speak, source }
// `title` and `short` are copied from the curated rulebook, never generated. `moment` is ONE model
// sentence built from engine facts, number-guarded; any failure falls back to a template.
// `speak` is registered under kind 'learn' so /api/speak can voice it by id.

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
): Promise<MomentText | null> {
  const called = await callModel(deps, prompt, LEARN_MAX_TOKENS);
  if (!called.ok) return null; // no key / timeout / provider error: the template takes over
  const parsed = parseMomentReply(called.text);
  if (!parsed) return null;
  const texts = [parsed.moment, parsed.speak];
  const clean = texts.every((t) => checkNumbers(t, allowed).ok && findBanned(t).length === 0);
  return clean ? parsed : null;
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

  const generated = await generateMoment(
    { provider: deps.getProvider(), timeoutMs: deps.timeoutMs },
    prompt,
    allowed,
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
  registerSpeakable('learn', id, { text: spoken, lang: body.lang });
  sendJson(res, 200, out);
  log(200, out.source);
}

const defaultDeps = createDefaultDeps();

/** Vercel / Vite-dev entry point. */
export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return handleLearn(req, res, defaultDeps);
}
