import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lang } from '@shared/sports/types';
import {
  startRecognition,
  startServerListen,
  type ListenCallbacks,
  type ListenError,
  type ListenSession,
} from './listenEngines';
import { recorderSupported } from './recorder';
import type { RecognitionCtor } from './speech';

export type { ListenError } from './listenEngines';

export interface ListenApi {
  /** Some voice-input path exists. Hide the mic when false. */
  readonly supported: boolean;
  /** Microphone is open and the fan is talking. */
  readonly listening: boolean;
  /** Recording stopped; the words are being worked out. */
  readonly transcribing: boolean;
  /** Live text while SpeechRecognition is the engine; '' on the recorder path. */
  readonly transcript: string;
  readonly error: ListenError | null;
  readonly start: () => void;
  /** Ends listening NOW (listening is false before this returns). */
  readonly stop: () => void;
}

type Phase = 'idle' | 'listening' | 'transcribing';

export function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  const ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return typeof ctor === 'function' ? (ctor as RecognitionCtor) : null;
}

/** Brave exposes SpeechRecognition but its requests are blocked, so it never produces a result. */
const isBrave = (): boolean => typeof navigator !== 'undefined' && 'brave' in navigator;

/** Offline mock mode has no /api/transcribe, so the recorder path is not offered there. */
const serverPathAvailable = (): boolean =>
  import.meta.env.VITE_USE_MOCK_API !== 'true' && recorderSupported();

const fastPathCtor = (): RecognitionCtor | null => (isBrave() ? null : getRecognitionCtor());

/**
 * Voice -> text. Prefers the browser's live SpeechRecognition where it can be trusted, and
 * otherwise (or when it stalls / errors) records with MediaRecorder and transcribes on the server.
 * `onFinal` receives the text once. Whatever happens, the hook ends in idle: timers are bounded,
 * the microphone is released, and unmount cancels everything.
 */
export function useListen(lang: Lang, onFinal?: (text: string) => void): ListenApi {
  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<ListenError | null>(null);
  const session = useRef<ListenSession | null>(null);
  const run = useRef(0);
  const finalCb = useRef(onFinal);
  useEffect(() => {
    finalCb.current = onFinal;
  });

  const start = useCallback(() => {
    if (session.current) return;
    const runId = (run.current += 1);
    const live = (fn: () => void) => () => {
      if (run.current === runId) fn();
    };
    const idle = () => {
      session.current = null;
      setPhase('idle');
    };
    const callbacks: ListenCallbacks = {
      onInterim: (text) => run.current === runId && setTranscript(text),
      onTranscribing: live(() => setPhase('transcribing')),
      onCancelled: live(idle),
      onResult: (text) => {
        if (run.current !== runId) return;
        idle();
        finalCb.current?.(text);
      },
      onError: (failure) => {
        if (run.current !== runId) return;
        idle();
        setError(failure);
      },
    };
    const fallBackToServer = (): void => {
      if (!serverPathAvailable()) return callbacks.onError('unavailable');
      session.current = startServerListen(lang, callbacks);
    };

    setError(null);
    setTranscript('');
    setPhase('listening');
    const Ctor = fastPathCtor();
    session.current = Ctor
      ? startRecognition(Ctor, lang, { ...callbacks, onUnavailable: live(fallBackToServer) })
      : null;
    if (!Ctor) fallBackToServer();
  }, [lang]);

  const stop = useCallback(() => {
    const active = session.current;
    if (!active) return;
    active.stop();
    // Engines normally move the phase themselves; this guarantees "listening" is off immediately.
    setPhase((p) => (p === 'listening' ? 'idle' : p));
  }, []);

  useEffect(
    () => () => {
      run.current += 1;
      session.current?.cancel();
      session.current = null;
    },
    [],
  );

  return {
    supported: fastPathCtor() !== null || serverPathAvailable(),
    listening: phase === 'listening',
    transcribing: phase === 'transcribing',
    transcript,
    error,
    start,
    stop,
  };
}
