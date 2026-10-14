import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Lang } from '@shared/sports/types';
import { ToastContext } from '@/components/Toast/ToastContext';
import { useSettings } from '@/features/settings/settingsStore';
import { useStrings } from '@/i18n/useStrings';
import { fetchSpeech, peekSpeech, SpeechError } from './speakService';
import type { SpeechSource } from './speakService';
import { useAudioPlayer } from './useAudioPlayer';
import { useBrowserSpeech } from './useBrowserSpeech';
import { useVoices } from './useVoices';
import { pickVoice } from './voices';

export interface SpeakApi {
  /** Natural voice is possible, or the browser has a matching voice. */
  readonly supported: boolean;
  /** A browser voice matching the language exists (language sheet uses this). */
  readonly hasVoice: boolean;
  readonly speaking: boolean;
  /** Natural-voice audio is being fetched (not yet cached). */
  readonly loading: boolean;
  /** The robotic browser voice is (or will be) used instead of the natural one. */
  readonly usingFallback: boolean;
  /** `silent` suppresses the error toast (autoplay). */
  readonly speak: (opts?: { readonly silent?: boolean }) => void;
  readonly stop: () => void;
}

/** Outcome of the natural-voice attempt, scoped to one lang+source so it resets by itself. */
interface Outcome {
  readonly key: string;
  readonly kind: 'missing' | 'fellback' | 'unavailable';
}

const isBlocked = (e: unknown): boolean => e instanceof DOMException && e.name === 'NotAllowedError';

export function useSpeak(lang: Lang, source?: SpeechSource | null, fallbackText?: string): SpeakApi {
  const { voiceRate } = useSettings();
  const { t } = useStrings();
  const toast = useContext(ToastContext);
  const voice = pickVoice(lang, useVoices());
  const kind = source?.kind;
  const id = source?.id;
  const token = source?.token;
  const key = `${lang}|${kind ?? ''}:${id ?? ''}`;
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [loading, setLoading] = useState(false);
  const run = useRef(0);
  const failed = useRef(-1);
  const ctrl = useRef<AbortController | null>(null);
  const status = outcome?.key === key ? outcome.kind : null;
  const {
    speak: browserSpeak,
    stop: browserStop,
    speaking: browserSpeaking,
  } = useBrowserSpeech(voice, voiceRate);

  const fail = useCallback(
    (runId: number, silent: boolean) => {
      if (failed.current === runId) return;
      failed.current = runId;
      setLoading(false);
      if (voice && fallbackText && fallbackText.trim() !== '') {
        setOutcome({ key, kind: 'fellback' });
        browserSpeak(fallbackText);
        return;
      }
      setOutcome({ key, kind: 'unavailable' });
      if (!silent) toast?.show(t.voiceFailedToast);
    },
    [voice, fallbackText, key, browserSpeak, toast, t],
  );
  const {
    play,
    stop: stopAudio,
    speaking: audioSpeaking,
  } = useAudioPlayer(voiceRate, () => fail(run.current, false));

  // Warm the cache the moment a source exists so Listen is instant.
  useEffect(() => {
    if (!kind || !id || !token) return;
    fetchSpeech({ kind, id, token }).catch((e: unknown) => {
      if (e instanceof SpeechError && e.code === 'NOT_FOUND') setOutcome({ key, kind: 'missing' });
    });
  }, [kind, id, token, key]);

  const stop = useCallback(() => {
    run.current += 1;
    ctrl.current?.abort();
    setLoading(false);
    stopAudio();
    browserStop();
  }, [stopAudio, browserStop]);

  const speak = useCallback(
    (opts?: { readonly silent?: boolean }) => {
      const silent = opts?.silent === true;
      stop(); // bumps run.current, invalidating any older attempt
      const runId = run.current;
      if (!kind || !id || !token || status === 'missing' || status === 'fellback') {
        if (voice && fallbackText) browserSpeak(fallbackText);
        return;
      }
      const src = { kind, id, token };
      const controller = new AbortController();
      ctrl.current = controller;
      setLoading(peekSpeech(src) === undefined);
      fetchSpeech(src, controller.signal)
        .then((url) => {
          if (run.current !== runId) return undefined;
          setLoading(false);
          return play(url);
        })
        .catch((e: unknown) => {
          if (run.current !== runId) return;
          if (isBlocked(e)) setLoading(false);
          else fail(runId, silent);
        });
    },
    [kind, id, token, status, voice, fallbackText, browserSpeak, play, stop, fail],
  );

  // Stop when the language/source changes or the component unmounts.
  useEffect(() => stop, [key, stop]);

  const browserOnly = !source || status === 'missing' || status === 'fellback';
  return {
    supported: (!!source && status === null) || voice !== null,
    hasVoice: voice !== null,
    speaking: audioSpeaking || browserSpeaking,
    loading,
    usingFallback: browserOnly && voice !== null,
    speak,
    stop,
  };
}
