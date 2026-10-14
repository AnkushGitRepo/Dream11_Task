export type SpeechKind = 'recap' | 'answer' | 'learn';

/**
 * Identifies server-generated text. The client never sends text to /api/speak: it sends the signed
 * `token` the server attached to the answer, which only that server can mint (and which expires).
 */
export interface SpeechSource {
  readonly kind: SpeechKind;
  readonly id: string;
  readonly token: string;
}

export type SpeechErrorCode = 'NOT_FOUND' | 'RATE_LIMITED' | 'UNAVAILABLE' | 'NETWORK';

export class SpeechError extends Error {
  readonly code: SpeechErrorCode;
  constructor(code: SpeechErrorCode) {
    super(`Speech ${code}`);
    this.name = 'SpeechError';
    this.code = code;
  }
}

const ENDPOINT = '/api/speak';
export const SPEAK_TIMEOUT_MS = 12_000;

const urls = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();
/** Ids the server does not know (mock mode / expired cache): do not ask again this session. */
const missing = new Set<string>();

const keyOf = (s: SpeechSource): string => `${s.kind}:${s.id}`;

/** Blob URL if audio for this source is already fetched. */
export function peekSpeech(source: SpeechSource): string | undefined {
  return urls.get(keyOf(source));
}

function statusToError(status: number): SpeechError {
  if (status === 404) return new SpeechError('NOT_FOUND');
  if (status === 429) return new SpeechError('RATE_LIMITED');
  return new SpeechError('UNAVAILABLE');
}

async function request(source: SpeechSource): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), SPEAK_TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: source.token }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw statusToError(res.status);
    // A dev server may answer unknown /api paths with index.html and a 200: not audio.
    if (!(res.headers.get('content-type') ?? '').startsWith('audio/')) throw new SpeechError('UNAVAILABLE');
    const blob = await res.blob();
    if (blob.size === 0) throw new SpeechError('UNAVAILABLE');
    return URL.createObjectURL(blob);
  } catch (err) {
    throw err instanceof SpeechError ? err : new SpeechError('NETWORK');
  } finally {
    clearTimeout(timer);
  }
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal | undefined): Promise<T> {
  if (!signal) return promise;
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new SpeechError('NETWORK'));
    if (signal.aborted) return onAbort();
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

/**
 * Natural-voice audio for a recap/answer as a blob: URL. Cached per source, in-flight requests are
 * shared. `signal` only abandons this caller's wait; the shared request keeps filling the cache.
 */
export function fetchSpeech(source: SpeechSource, signal?: AbortSignal): Promise<string> {
  const key = keyOf(source);
  const hit = urls.get(key);
  if (hit) return Promise.resolve(hit);
  if (missing.has(key)) return Promise.reject(new SpeechError('NOT_FOUND'));
  let pending = inflight.get(key);
  if (!pending) {
    pending = request(source)
      .then((url) => {
        urls.set(key, url);
        return url;
      })
      .catch((err: unknown) => {
        if (err instanceof SpeechError && err.code === 'NOT_FOUND') missing.add(key);
        throw err;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  return abortable(pending, signal);
}

/** Warm the cache so Listen plays instantly. Never throws. */
export function prefetchSpeech(source: SpeechSource): void {
  fetchSpeech(source).catch(() => undefined);
}

/** Free every blob URL and forget all state (also used by tests). */
export function revokeAll(): void {
  urls.forEach((url) => URL.revokeObjectURL(url));
  urls.clear();
  missing.clear();
}

if (typeof window !== 'undefined') window.addEventListener('pagehide', revokeAll);
