import { useCallback, useRef, useState } from 'react';
import { getSynth } from './useVoices';

export interface BrowserSpeech {
  readonly speaking: boolean;
  readonly speak: (text: string) => void;
  readonly stop: () => void;
}

/** Robotic fallback: speechSynthesis with an already language-matched voice. */
export function useBrowserSpeech(voice: SpeechSynthesisVoice | null, rate: number): BrowserSpeech {
  const [speaking, setSpeaking] = useState(false);
  const current = useRef<SpeechSynthesisUtterance | null>(null);

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
      utterance.rate = rate;
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
    [voice, rate],
  );

  return { speaking, speak, stop };
}
