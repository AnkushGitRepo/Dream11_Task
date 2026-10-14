import type { Lang } from '@shared/sports/types';
import { startRecording, type Recording, RecorderError } from './recorder';
import type { Recognition, RecognitionCtor } from './speech';
import { TranscribeError, transcribeAudio } from './transcribeService';
import { LISTEN_LOCALE } from './voices';

// The two ways a voice question becomes text. Both return a ListenSession and guarantee that the
// callbacks fire at most once in total (one onResult OR one onError OR one onUnavailable), that
// every timer, handler and microphone is released afterwards, and that nothing can stay "listening".

export type ListenError = 'denied' | 'no-speech' | 'unavailable' | 'rate-limited';

export interface ListenCallbacks {
  readonly onInterim: (text: string) => void;
  readonly onTranscribing: () => void;
  /** Final text; never empty (empty becomes onError('no-speech')). */
  readonly onResult: (text: string) => void;
  /** The fan tapped stop before the microphone even opened: back to idle, no error. */
  readonly onCancelled: () => void;
  readonly onError: (error: ListenError) => void;
}

export interface ListenSession {
  /** The fan is done talking (or the max-duration timer fired): finish with what we have. */
  stop(): void;
  /** Abandon silently (unmount / superseded). */
  cancel(): void;
}

export const MAX_LISTEN_MS = 12_000;
export const NO_RESULT_MS = 6_000;
/** Shorter than this is a mis-tap, not a question. */
const MIN_RECORDING_MS = 400;
const MIN_RECORDING_BYTES = 800;
const MAX_REQUEST_MS = 15_000;

function recognitionError(code: string): ListenError | 'aborted' {
  if (code === 'not-allowed' || code === 'service-not-allowed') return 'denied';
  if (code === 'no-speech') return 'no-speech';
  if (code === 'aborted') return 'aborted';
  return 'unavailable'; // network, audio-capture, language-not-supported, ...
}

/**
 * Browser SpeechRecognition: free and live, but absent in Firefox and non-functional in Brave, so
 * it is only a fast path. `onUnavailable` means "it did not work, use the recorder instead".
 */
export function startRecognition(
  Ctor: RecognitionCtor,
  lang: Lang,
  cb: ListenCallbacks & { readonly onUnavailable: () => void },
): ListenSession {
  const r: Recognition = new Ctor();
  r.lang = LISTEN_LOCALE[lang];
  r.interimResults = true;
  r.continuous = false;
  r.maxAlternatives = 1;

  let settled = false;
  let text = '';
  // timers[0] is the no-result watchdog (cleared by the first result); timers[1] the max duration.
  const timers: ReturnType<typeof setTimeout>[] = [];

  const settle = (then: () => void): void => {
    if (settled) return;
    settled = true;
    timers.forEach(clearTimeout);
    r.onresult = null;
    r.onerror = null;
    r.onend = null;
    // stop() alone never fires onend in some browsers; abort() always ends the session.
    for (const end of [() => r.stop(), () => r.abort()]) {
      try {
        end();
      } catch {
        // already ended
      }
    }
    then();
  };
  const finish = (): void => settle(() => (text === '' ? cb.onError('no-speech') : cb.onResult(text)));

  r.onresult = (e) => {
    clearTimeout(timers[0]);
    let out = '';
    for (let i = 0; i < e.results.length; i += 1) out += e.results[i]?.[0]?.transcript ?? '';
    text = out.trim();
    cb.onInterim(text);
  };
  r.onerror = (e) => {
    const failure = recognitionError(e.error);
    if (failure === 'aborted') return;
    settle(() => (failure === 'unavailable' ? cb.onUnavailable() : cb.onError(failure)));
  };
  r.onend = finish;

  timers.push(setTimeout(() => settle(cb.onUnavailable), NO_RESULT_MS));
  timers.push(setTimeout(finish, MAX_LISTEN_MS));
  try {
    r.start();
  } catch {
    settle(cb.onUnavailable);
  }
  return { stop: finish, cancel: () => settle(() => undefined) };
}

/** MediaRecorder -> POST /api/transcribe. Works wherever getUserMedia does. */
export function startServerListen(lang: Lang, cb: ListenCallbacks): ListenSession {
  let settled = false;
  let recording: Recording | null = null;
  const request = new AbortController();
  let maxTimer: ReturnType<typeof setTimeout> | undefined;

  const settle = (then: () => void): void => {
    if (settled) return;
    settled = true;
    if (maxTimer) clearTimeout(maxTimer);
    request.abort();
    recording?.cancel();
    then();
  };

  const send = async (active: Recording): Promise<void> => {
    cb.onTranscribing();
    try {
      const { blob, durationMs } = await active.stop();
      if (settled) return;
      if (durationMs < MIN_RECORDING_MS || blob.size < MIN_RECORDING_BYTES) {
        return settle(() => cb.onError('no-speech'));
      }
      const text = await transcribeAudio({ blob, lang, durationMs, signal: request.signal });
      settle(() => (text === '' ? cb.onError('no-speech') : cb.onResult(text)));
    } catch (error) {
      if (error instanceof TranscribeError && error.code === 'RATE_LIMITED') {
        return settle(() => cb.onError('rate-limited'));
      }
      settle(() => cb.onError('unavailable'));
    }
  };

  const stop = (): void => {
    if (settled) return;
    const active = recording;
    if (!active) return settle(cb.onCancelled); // still waiting on the permission prompt
    if (maxTimer) clearTimeout(maxTimer);
    recording = null; // `send` now owns the recorder; a later settle must not cancel it twice
    void send(active);
  };

  startRecording()
    .then((started) => {
      if (settled) return started.cancel();
      recording = started;
      maxTimer = setTimeout(stop, MAX_LISTEN_MS);
    })
    .catch((error: unknown) => {
      const denied = error instanceof RecorderError && error.code === 'denied';
      settle(() => cb.onError(denied ? 'denied' : 'unavailable'));
    });

  // Whole-session ceiling so a hung request can never leave the UI stuck on "Transcribing…".
  const ceiling = setTimeout(
    () => settle(() => cb.onError('unavailable')),
    MAX_LISTEN_MS + MAX_REQUEST_MS,
  );
  const clearCeiling = request.signal;
  clearCeiling.addEventListener('abort', () => clearTimeout(ceiling), { once: true });

  return { stop, cancel: () => settle(() => undefined) };
}
