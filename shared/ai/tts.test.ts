import { describe, expect, it, vi } from 'vitest';
import type { Lang } from '../sports/types.js';
import { GeminiTts, type TtsGenerateClient } from './tts.js';
import { VOICES } from './voices.js';

const PCM = Buffer.from(new Uint8Array(480)).toString('base64');

function fakeClient() {
  const generateContent = vi.fn<TtsGenerateClient['models']['generateContent']>(async () => ({
    candidates: [{ content: { parts: [{ inlineData: { data: PCM, mimeType: 'audio/L16;codec=pcm;rate=24000' } }] } }],
  }));
  const client: TtsGenerateClient = { models: { generateContent } };
  return { client, generateContent };
}

type Sent = {
  contents: { parts: { text: string; speechMetadata?: { style?: string } }[] }[];
  config: { speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: string } } } };
};

const LANGS: readonly Lang[] = ['en', 'hinglish', 'hi', 'gu'];

describe('GeminiTts request', () => {
  it.each(LANGS)('%s: the text sent is EXACTLY the speak text; style rides in speechMetadata', async (lang) => {
    const { client, generateContent } = fakeClient();
    const tts = new GeminiTts({ apiKey: 'k', model: 'm', client });
    const text = 'अरे यार, क्या ओवर था! Kohli ने 14 रन जोड़े।';
    await tts.synthesize({ text, lang });

    const sent = generateContent.mock.calls[0]?.[0] as unknown as Sent;
    const part = sent.contents[0]?.parts[0];
    expect(sent.contents[0]?.parts).toHaveLength(1);
    expect(part?.text).toBe(text);
    expect(part?.speechMetadata?.style).toBe(VOICES[lang].style);
    // Nothing of the instruction can leak into what is spoken.
    for (const word of ['Excited', 'cricket fan', 'news anchor', 'conversational']) {
      expect(part?.text).not.toContain(word);
    }
  });

  it('uses Puck for every language', async () => {
    for (const lang of LANGS) {
      const { client, generateContent } = fakeClient();
      await new GeminiTts({ apiKey: 'k', model: 'm', client }).synthesize({ text: 'hi', lang });
      const sent = generateContent.mock.calls[0]?.[0] as unknown as Sent;
      expect(sent.config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Puck');
    }
  });

  it('style is the fan-friend delivery plus a language hint', () => {
    for (const lang of LANGS) {
      expect(VOICES[lang].style).toMatch(/^Excited Indian cricket fan telling a friend what just happened\./);
      expect(VOICES[lang].style).toMatch(/Not a news anchor\./);
    }
  });
});
