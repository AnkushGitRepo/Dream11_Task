import type { Lang } from '../sports/types';

// SERVER-ONLY. One voice + one style prompt per language for server TTS (docs/ARCHITECTURE.md §7b).
// Voice chosen by ear (Ankush, 13 Oct): Puck for every language. Alternates kept for future A/B.

export interface VoiceProfile {
  /** Gemini prebuilt voice used in production for this language. */
  readonly voiceName: string;
  /** Second candidate, generated alongside the primary in the sample script. */
  readonly alternate: string;
  /** Spoken-language hint passed to the TTS config (ISO 639-1). */
  readonly languageCode: string;
  /** Delivery instruction placed before the text. Kept in English: the model follows it reliably. */
  readonly style: string;
}

const FAN =
  'Speak like an excited Indian cricket fan catching a friend up: warm, quick, conversational, natural pauses, not a news anchor';

export const VOICES: Readonly<Record<Lang, VoiceProfile>> = {
  en: {
    voiceName: 'Puck',
    alternate: 'Zephyr',
    languageCode: 'en',
    style: `${FAN}. Plain Indian English, friendly and upbeat`,
  },
  hinglish: {
    voiceName: 'Puck',
    alternate: 'Kore',
    languageCode: 'hi',
    style: `${FAN}. Natural Hinglish: Hindi with English cricket words (over, wicket, runs) said the way fans say them`,
  },
  hi: {
    voiceName: 'Puck',
    alternate: 'Leda',
    languageCode: 'hi',
    style: `${FAN}. Spoken Hindi, the way friends talk, not formal newsreader Hindi`,
  },
  gu: {
    voiceName: 'Puck',
    alternate: 'Aoede',
    languageCode: 'gu',
    style: `${FAN}. Spoken Gujarati, everyday and friendly, English cricket words kept as they are`,
  },
};

/** Gemini TTS follows "<style>: <text>" prompts; the text itself is never altered. */
export function buildTtsPrompt(lang: Lang, text: string): string {
  return `${VOICES[lang].style}: ${text}`;
}
