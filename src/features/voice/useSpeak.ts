import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lang } from '@shared/sports/types';
import { useSettings } from '@/features/settings/settingsStore';
import { getSynth, useVoices } from './useVoices';
import { pickVoice } from './voices';

export interface SpeakApi {
  /** Browser has speech synthesis at all. */
  readonly supported: boolean;
  /** A voice matching the language exists. Without it the UI hides Listen. */
  readonly hasVoice: boolean;
  readonly speaking: boolean;
  readonly speak: (text: string) => void;
  readonly stop: () => void;
}

export function useSpeak(lang: Lang): SpeakApi {
  const { voiceRate } = useSettings();
  const voices = useVoices();
  const voice = pickVoice(lang, voices);
  const [speaking, setSpeaking] = useState(false);
  const current = useRef<SpeechSynthesisUtterance | null>(null);
  const synth = getSynth();

  const stop = useCallback(() => {
    if (current.current === null) return;
    current.current = null; // detach first so the cancel event is ignored as stale
    getSynth()?.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      const engine = getSynth();
      if (!engine || !voice || text.trim() === '') return;
      engine.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = voiceRate;
      const done = () => {
        if (current.current !== utterance) return;
        current.current = null;
        setSpeaking(false);
      };
      utterance.onend = done;
      utterance.onerror = done;
      current.current = utterance;
      setSpeaking(true);
      engine.speak(utterance);
    },
    [voice, voiceRate],
  );

  // Stop when the language changes or the component unmounts.
  useEffect(() => stop, [lang, stop]);

  return { supported: synth !== null, hasVoice: voice !== null, speaking, speak, stop };
}
