import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Lang } from '../../shared/sports/types.js';

// Signed, self-contained "voice this text" tokens (docs/SECURITY.md §8). recap / ask / learn mint
// one for the exact text THEY produced; /api/speak verifies it and synthesizes. Nothing is stored
// server-side, so any serverless instance can verify a token another instance issued, and
// /api/speak still cannot be used as a free TTS proxy: it only voices text this server signed.
//
// token = base64url(JSON { lang, text, exp }) + "." + base64url(HMAC-SHA256(payload, secret))

export const MAX_SPEAK_CHARS = 1200;
export const SPEAK_TOKEN_TTL_MS = 60 * 60 * 1000;
const MIN_SECRET_CHARS = 16;
const LANGS: readonly string[] = ['en', 'hinglish', 'hi', 'gu'];
const SENTENCE_ENDS = ['. ', '। ', '! ', '? '] as const;

export interface SpeakPayload {
  readonly lang: Lang;
  readonly text: string;
}

let ephemeralSecret: string | undefined;

/**
 * The signing secret. Production must set SPEAK_SIGNING_SECRET (without it no token is minted and
 * the client falls back to the browser voice). Outside production a per-process random secret is
 * used so `vite dev` and tests work without configuration.
 */
export function speakSecret(source: NodeJS.ProcessEnv = process.env): string | undefined {
  const configured = source.SPEAK_SIGNING_SECRET;
  if (configured && configured.length >= MIN_SECRET_CHARS) return configured;
  if (source.NODE_ENV === 'production') return undefined;
  ephemeralSecret ??= randomBytes(32).toString('hex');
  return ephemeralSecret;
}

const b64 = (value: string | Buffer): string => Buffer.from(value).toString('base64url');
const hmac = (data: string, secret: string): Buffer => createHmac('sha256', secret).update(data).digest();

/** Cuts over-long text at the last sentence end that fits (or hard at the limit). */
function clampText(text: string): string {
  if (text.length <= MAX_SPEAK_CHARS) return text;
  const head = text.slice(0, MAX_SPEAK_CHARS);
  const end = Math.max(...SENTENCE_ENDS.map((s) => head.lastIndexOf(s)));
  return end > MAX_SPEAK_CHARS / 2 ? head.slice(0, end + 1) : head;
}

export function signSpeakToken(payload: SpeakPayload, secret: string, nowMs: number = Date.now()): string {
  const data = { lang: payload.lang, text: clampText(payload.text), exp: nowMs + SPEAK_TOKEN_TTL_MS };
  const body = b64(JSON.stringify(data));
  return `${body}.${b64(hmac(body, secret))}`;
}

/** Token for `text`, or undefined when there is nothing to voice or no secret is configured. */
export function mintSpeakToken(text: string, lang: Lang, secret: string | undefined): string | undefined {
  if (!secret || text.trim() === '') return undefined;
  return signSpeakToken({ lang, text }, secret);
}

/** The payload of a genuine, unexpired token; null for anything else. Never throws. */
export function verifySpeakToken(
  token: unknown,
  secret: string | undefined,
  nowMs: number = Date.now(),
): SpeakPayload | null {
  if (!secret || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body = '', sig = ''] = parts;
  const given = Buffer.from(sig, 'base64url');
  const expected = hmac(body, secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Record<string, unknown>;
    const { lang, text, exp } = data;
    if (typeof lang !== 'string' || !LANGS.includes(lang)) return null;
    if (typeof text !== 'string' || text.trim() === '' || text.length > MAX_SPEAK_CHARS) return null;
    if (typeof exp !== 'number' || !Number.isFinite(exp) || exp <= nowMs) return null;
    return { lang: lang as Lang, text };
  } catch {
    return null;
  }
}
