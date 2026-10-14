import { createHash } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createTtsProvider, TtsError, type TtsProvider } from '../shared/ai/tts.js';
import { LruCache } from './_lib/cache.js';
import { guardRequest } from './_lib/handlerKit.js';
import { sendError } from './_lib/http.js';
import type { RateLimiter } from './_lib/rateLimit.js';
import { speakBodySchema } from './_lib/schemas.js';
import { sharedLimiter } from './_lib/shared.js';
import { speakSecret, verifySpeakToken } from './_lib/speakToken.js';

// POST /api/speak { token }  ->  audio/wav
// `token` is the signed speakToken a recap / ask / learn answer carries (api/_lib/speakToken.ts).
// Only text this server signed is voiced, so there is no free-text TTS proxy and no per-instance
// state to lose (docs/SECURITY.md §8). Unsigned, tampered or expired tokens are refused.

const MAX_BODY_BYTES = 8 * 1024;
const TTS_TIMEOUT_MS = 12_000;
const AUDIO_CACHE_ENTRIES = 60;
/** Bump when how audio is produced changes (v2: style moved out of the spoken text). */
const AUDIO_CACHE_VERSION = 'v2';

export interface SpeakDeps {
  readonly getProvider: () => TtsProvider | null;
  readonly audioCache: LruCache<Uint8Array>;
  readonly limiter: RateLimiter;
  readonly timeoutMs: number;
  readonly speakSecret?: string;
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
    speakSecret: speakSecret(env),
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
    expects: 'Expected { token }.',
  });
  if (!guarded) return;
  const { data: body, log } = guarded;

  const speakable = verifySpeakToken(body.token, deps.speakSecret);
  if (!speakable) {
    sendError(res, 'NOT_FOUND', 'Nothing to voice for that token.');
    return log(404, 'bad-token');
  }

  const cacheKey = createHash('sha256').update(`${AUDIO_CACHE_VERSION}|${speakable.lang}|${speakable.text}`).digest('base64url');
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
