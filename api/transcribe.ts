import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  createTranscriber,
  TranscribeError,
  type Transcriber,
} from '../shared/ai/transcribe.js';
import { createDailyBudget, type DailyBudget } from './_lib/dailyBudget.js';
import { guardRequest } from './_lib/handlerKit.js';
import { sendError, sendJson } from './_lib/http.js';
import type { RateLimiter } from './_lib/rateLimit.js';
import { transcribeBodySchema } from './_lib/schemas.js';
import { sharedLimiter } from './_lib/shared.js';

// POST /api/transcribe { lang, mimeType, durationMs, audio (base64) } -> { text, source: 'ai' }
// Turns a <= 15 s voice question into text so voice input works in every browser (SpeechRecognition
// is missing in Firefox and broken in Brave). The audio is held in memory for the one provider
// call and never stored or logged. Same shared rate limit as the other AI routes plus a hard
// daily budget, because every call is paid model time.

const MAX_BODY_BYTES = 1.5 * 1024 * 1024;
const TRANSCRIBE_TIMEOUT_MS = 10_000;
const DEFAULT_DAILY_BUDGET = 300;

export interface TranscribeDeps {
  readonly getTranscriber: () => Transcriber | null;
  readonly limiter: RateLimiter;
  readonly budget: DailyBudget;
  readonly timeoutMs: number;
}

export interface TranscribeResponse {
  readonly text: string;
  readonly source: 'ai';
}

export function createDefaultDeps(env: NodeJS.ProcessEnv = process.env): TranscribeDeps {
  const configured = Number(env.TRANSCRIBE_DAILY_BUDGET);
  const limit = Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : DEFAULT_DAILY_BUDGET;
  return {
    getTranscriber: () => createTranscriber({ GEMINI_API_KEY: env.GEMINI_API_KEY, LLM_MODEL: env.LLM_MODEL }),
    limiter: sharedLimiter(env),
    budget: createDailyBudget({ limit }),
    timeoutMs: TRANSCRIBE_TIMEOUT_MS,
  };
}

async function transcribeWithTimeout(
  transcriber: Transcriber,
  request: Omit<Parameters<Transcriber['transcribe']>[0], 'signal'>,
  ms: number,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await transcriber.transcribe({ ...request, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function handleTranscribe(
  req: IncomingMessage,
  res: ServerResponse,
  deps: TranscribeDeps,
): Promise<void> {
  const guarded = await guardRequest(req, res, {
    route: 'api/transcribe',
    maxBytes: MAX_BODY_BYTES,
    limiter: deps.limiter,
    schema: transcribeBodySchema,
    expects: 'Expected { lang, mimeType, durationMs, audio }.',
  });
  if (!guarded) return;
  const { data: body, log } = guarded;

  const transcriber = deps.getTranscriber();
  if (!transcriber) {
    sendError(res, 'UNAVAILABLE', 'Voice input is not configured.');
    return log(503, 'not-configured');
  }

  const budget = deps.budget.take();
  if (!budget.ok) {
    sendError(res, 'RATE_LIMITED', 'Voice input is resting for today. Please type your question.', {
      'Retry-After': String(budget.retryAfterSeconds),
    });
    return log(429, 'daily-budget');
  }

  try {
    const text = await transcribeWithTimeout(
      transcriber,
      { audioBase64: body.audio, mimeType: body.mimeType, lang: body.lang },
      deps.timeoutMs,
    );
    const out: TranscribeResponse = { text, source: 'ai' };
    sendJson(res, 200, out);
    log(200, text === '' ? 'empty' : 'ai');
  } catch (error) {
    const code = error instanceof TranscribeError ? error.code : 'PROVIDER_ERROR';
    sendError(res, 'INTERNAL', 'Voice input is unavailable right now.'); // provider detail never leaves the server
    log(502, `transcribe-${code}`);
  }
}

const defaultDeps = createDefaultDeps();

/** Vercel / Vite-dev entry point. */
export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return handleTranscribe(req, res, defaultDeps);
}
