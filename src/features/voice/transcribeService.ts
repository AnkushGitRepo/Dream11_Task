import type { Lang } from '@shared/sports/types';

// Client side of POST /api/transcribe: sends one short recording, gets the words back. The audio is
// only held in memory for this request.

export type TranscribeErrorCode = 'RATE_LIMITED' | 'UNAVAILABLE' | 'NETWORK';

export class TranscribeError extends Error {
  readonly code: TranscribeErrorCode;
  constructor(code: TranscribeErrorCode) {
    super(`Transcribe ${code}`);
    this.name = 'TranscribeError';
    this.code = code;
  }
}

const ENDPOINT = '/api/transcribe';
export const TRANSCRIBE_TIMEOUT_MS = 12_000;
const MAX_AUDIO_MS = 15_000;
const CHUNK = 0x8000;

async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export interface TranscribeInput {
  readonly blob: Blob;
  readonly lang: Lang;
  readonly durationMs: number;
  readonly signal?: AbortSignal;
}

/** The transcript ('' when nothing intelligible was said). Throws TranscribeError. */
export async function transcribeAudio({ blob, lang, durationMs, signal }: TranscribeInput): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TRANSCRIBE_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lang,
        mimeType: blob.type || 'audio/webm',
        durationMs: Math.max(1, Math.min(Math.round(durationMs), MAX_AUDIO_MS)),
        audio: await toBase64(blob),
      }),
      signal: controller.signal,
    });
    if (res.status === 429) throw new TranscribeError('RATE_LIMITED');
    if (!res.ok) throw new TranscribeError('UNAVAILABLE');
    const json = (await res.json()) as { text?: unknown };
    if (typeof json.text !== 'string') throw new TranscribeError('UNAVAILABLE');
    return json.text.trim();
  } catch (error) {
    throw error instanceof TranscribeError ? error : new TranscribeError('NETWORK');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
