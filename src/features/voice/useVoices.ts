import { useEffect, useState } from 'react';
import type { Lang } from '@shared/sports/types';
import { pickVoice } from './voices';

export function getSynth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
}

/** Voices the browser has right now (may be empty until `voiceschanged`). */
function currentVoices(): SpeechSynthesisVoice[] {
  return getSynth()?.getVoices() ?? [];
}

/** Synchronous check, for non-React callers. */
export function hasVoiceFor(lang: Lang): boolean {
  return pickVoice(lang, currentVoices()) !== null;
}

/** Voice list that updates when the browser finishes loading voices. */
export function useVoices(): readonly SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<readonly SpeechSynthesisVoice[]>(currentVoices);
  useEffect(() => {
    const synth = getSynth();
    if (!synth) return;
    const update = () => setVoices(synth.getVoices());
    update();
    synth.addEventListener('voiceschanged', update);
    return () => synth.removeEventListener('voiceschanged', update);
  }, []);
  return voices;
}

/** Reactive version of `hasVoiceFor` (language sheet uses it to show "voice not available"). */
export function useHasVoice(lang: Lang): boolean {
  const voices = useVoices();
  return pickVoice(lang, voices) !== null;
}
