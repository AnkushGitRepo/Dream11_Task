import type { IncomingMessage, ServerResponse } from 'node:http';
import { createTtsProvider, TtsError, type TtsProvider } from '../shared/ai/tts';
import { LruCache } from './_lib/cache';
import { guardRequest } from './_lib/handlerKit';
import { sendError } from './_lib/http';
import type { RateLimiter } from './_lib/rateLimit';
import { speakBodySchema } from './_lib/schemas';
import { sharedLimiter } from './_lib/shared';
import { lookupSpeakable } from './_lib/speakRegistry';

// POST /api/speak { kind: 'recap' | 'answer' | 'learn', id }  ->  audio/wav
// Voices ONLY text the server generated (looked up by id in the speakable registry). Never accepts
// free text, so it cannot be used as a TTS proxy (docs/SECURITY.md §8).

const MAX_BODY_BYTES = 1024;
const TTS_TIMEOUT_MS = 12_000;
const AUDIO_CACHE_ENTRIES = 60;

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
    limiter: sharedLimiter(env),
    timeoutMs: TTS_TIMEOUT_MS,
  };
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
  const guarded = await guardRequest(req, res, {
    route: 'api/speak',
    maxBytes: MAX_BODY_BYTES,
    limiter: deps.limiter,
    schema: speakBodySchema,
    expects: 'Expected { kind: "recap" | "answer" | "learn", id }.',
  });
  if (!guarded) return;
  const { data: body, log } = guarded;

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
