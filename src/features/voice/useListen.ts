import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lang } from '@shared/sports/types';
import type { Recognition, RecognitionCtor } from './speech';
import { LISTEN_LOCALE } from './voices';

export type ListenError = 'denied' | 'no-speech' | 'unavailable';

export interface ListenApi {
  /** SpeechRecognition (or webkit-prefixed) exists. Hide the mic when false. */
  readonly supported: boolean;
  readonly listening: boolean;
  /** Final + interim text so far for the current session. */
  readonly transcript: string;
  readonly error: ListenError | null;
  readonly start: () => void;
  readonly stop: () => void;
}

export function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  const ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return typeof ctor === 'function' ? (ctor as RecognitionCtor) : null;
}

function toError(code: string): ListenError | null {
  if (code === 'not-allowed' || code === 'service-not-allowed') return 'denied';
  if (code === 'no-speech') return 'no-speech';
  if (code === 'aborted') return null; // we stopped it ourselves
  return 'unavailable';
}

/**
 * Speech-to-text wrapper. `onFinal` receives the transcript once when a session ends with text.
 * Always ends on unmount.
 */
export function useListen(lang: Lang, onFinal?: (text: string) => void): ListenApi {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<ListenError | null>(null);
  const rec = useRef<Recognition | null>(null);
  const text = useRef('');
  const finalCb = useRef(onFinal);
  useEffect(() => {
    finalCb.current = onFinal;
  });
  const Ctor = getRecognitionCtor();

  const stop = useCallback(() => rec.current?.stop(), []);

  const start = useCallback(() => {
    const C = getRecognitionCtor();
    if (!C || rec.current) return;
    const r = new C();
    r.lang = LISTEN_LOCALE[lang];
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    text.current = '';
    let failure: ListenError | null = null;
    r.onresult = (e) => {
      let out = '';
      for (let i = 0; i < e.results.length; i += 1) out += e.results[i]?.[0]?.transcript ?? '';
      text.current = out.trim();
      setTranscript(text.current);
    };
    r.onerror = (e) => {
      failure = toError(e.error);
    };
    r.onend = () => {
      rec.current = null;
      setListening(false);
      if (failure) setError(failure);
      else if (text.current === '') setError('no-speech');
      else finalCb.current?.(text.current);
    };
    rec.current = r;
    setError(null);
    setTranscript('');
    setListening(true);
    try {
      r.start();
    } catch {
      rec.current = null;
      setListening(false);
      setError('unavailable');
    }
  }, [lang]);

  useEffect(
    () => () => {
      const r = rec.current;
      if (!r) return;
      r.onend = null;
      r.onerror = null;
      r.onresult = null;
      r.abort();
      rec.current = null;
    },
    [],
  );

  return { supported: Ctor !== null, listening, transcript, error, start, stop };
}
