import type { IncomingMessage, ServerResponse } from 'node:http';
import { createTtsProvider, TtsError, type TtsProvider } from '../shared/ai/tts';
import { LruCache } from './_lib/cache';
import { BodyTooLargeError, clientIp, isJsonRequest, readBody, sendError } from './_lib/http';
import { createRateLimiter, type RateLimiter } from './_lib/rateLimit';
import { lookupSpeakable, type SpeakKind } from './_lib/speakRegistry';

// POST /api/speak { kind: 'recap' | 'answer', id }  ->  audio/wav
// Voices ONLY text the server generated (looked up by id in the speakable registry). Never accepts
// free text, so it cannot be used as a TTS proxy (docs/SECURITY.md §8).

const MAX_BODY_BYTES = 1024;
const TTS_TIMEOUT_MS = 12_000;
const AUDIO_CACHE_ENTRIES = 60;
const ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const KINDS: readonly SpeakKind[] = ['recap', 'answer'];

export interface SpeakDeps {
  readonly getProvider: () => TtsProvider | null;
  readonly audioCache: LruCache<Uint8Array>;
  readonly limiter: RateLimiter;
  readonly timeoutMs: number;
}

export function createDefaultDeps(env: NodeJS.ProcessEnv = process.env): SpeakDeps {
  return {
    getProvider: () =>
      createTtsProvider({
        TTS_PROVIDER: env.TTS_PROVIDER,
        TTS_MODEL: env.TTS_MODEL,
        GEMINI_API_KEY: env.GEMINI_API_KEY,
      }),
    audioCache: new LruCache<Uint8Array>(AUDIO_CACHE_ENTRIES),
    // Shared with /api/recap once it exists: import the same limiter instance from a common module then.
    limiter: createRateLimiter({ perMinute: Number(env.RATE_LIMIT_PER_MIN ?? 20), burst: 5 }),
    timeoutMs: TTS_TIMEOUT_MS,
  };
}

interface ParsedBody {
  readonly kind: SpeakKind;
  readonly id: string;
}

function parseBody(raw: string): ParsedBody | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const { kind, id } = value as Record<string, unknown>;
  if (typeof kind !== 'string' || !KINDS.includes(kind as SpeakKind)) return null;
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) return null;
  return { kind: kind as SpeakKind, id };
}

function sendAudio(res: ServerResponse, audio: Uint8Array) {
  res.writeHead(200, {
    'Content-Type': 'audio/wav',
    'Content-Length': audio.byteLength,
    'Cache-Control': 'private, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(Buffer.from(audio));
}

async function synthesizeWithTimeout(
  provider: TtsProvider,
  text: string,
  lang: Parameters<TtsProvider['synthesize']>[0]['lang'],
  ms: number,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await provider.synthesize({ text, lang, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function handleSpeak(req: IncomingMessage, res: ServerResponse, deps: SpeakDeps): Promise<void> {
  const started = Date.now();
  const log = (status: number, source: string) =>
    // Method, route, status, latency, source only: never ids' text, prompts or keys.
    console.info(`[api/speak] ${req.method} ${status} ${Date.now() - started}ms ${source}`);

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
    sendError(res, 'BAD_REQUEST', 'Expected { kind: "recap" | "answer", id }.');
    return log(400, 'rejected');
  }

  const speakable = lookupSpeakable(body.kind, body.id);
  if (!speakable) {
    sendError(res, 'NOT_FOUND', 'Nothing to voice for that id.');
    return log(404, 'unknown-id');
  }

  const cacheKey = `${body.id}:${speakable.lang}`;
  const cached = deps.audioCache.get(cacheKey);
  if (cached) {
    sendAudio(res, cached);
    return log(200, 'cache');
  }

  const provider = deps.getProvider();
  if (!provider) {
    sendError(res, 'UNAVAILABLE', 'Voice is not configured.');
    return log(503, 'not-configured');
  }

  try {
    const { audio } = await synthesizeWithTimeout(provider, speakable.text, speakable.lang, deps.timeoutMs);
    deps.audioCache.set(cacheKey, audio);
    sendAudio(res, audio);
    log(200, provider.id);
  } catch (error) {
    const code = error instanceof TtsError ? error.code : 'PROVIDER_ERROR';
    sendError(res, 'INTERNAL', 'Voice is unavailable right now.'); // provider error bodies never leave the server
    log(502, `tts-${code}`);
  }
}

const defaultDeps = createDefaultDeps();

/** Vercel / Vite-dev entry point. */
export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return handleSpeak(req, res, defaultDeps);
}
