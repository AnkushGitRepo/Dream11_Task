// Generates TTS samples for the 17.0 -> 19.0 recap so voices can be picked by ear.
//
//   node --env-file=<your local env file> scripts/voice-samples.mjs
//
// The script only reads GEMINI_API_KEY / TTS_MODEL from process.env (supplied by your shell) and
// never prints them. Output: tmp/voice-samples/*.wav (git-ignored) + RESULTS.txt.
// Numbers in the texts (32 runs, 0 wkts, 2 sixes, need 16 off 6) are the engine's golden checkpoints.
import { mkdirSync, writeFileSync } from 'node:fs';
import { GeminiTts } from '../shared/ai/tts.ts';
import { VOICES } from '../shared/ai/voices.ts';

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.TTS_MODEL || 'gemini-3.8-flash-tts';
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set in the environment. Nothing generated.');
  process.exit(1);
}
if (!process.env.TTS_MODEL) console.warn(`TTS_MODEL not set: trying "${model}" (from the SDK model list).`);

const TEXT = {
  en: 'Kohli hit two back-to-back sixes off Rauf in the last two balls of the 18th over! India added 32 runs in two overs without losing a wicket, and now they need 16 off 6.',
  hinglishLatin:
    'Kohli ne Rauf ke last ke do balls pe lagataar do chhakke maare! Do overs mein India ne 32 runs jode, koi wicket nahi gira, aur ab 6 balls mein 16 runs chahiye.',
  hinglishDevanagari:
    'कोहली ने राउफ़ की आख़िरी दो गेंदों पर लगातार दो छक्के मारे! दो ओवर में इंडिया ने 32 रन जोड़े, कोई विकेट नहीं गिरा, और अब 6 गेंदों में 16 रन चाहिए।',
  hi: 'कोहली ने रउफ़ की आख़िरी दो गेंदों पर दो छक्के जड़ दिए! दो ओवर में भारत ने 32 रन बटोरे और कोई विकेट नहीं गिरा। अब जीत के लिए 6 गेंदों में 16 रन चाहिए।',
  gu: 'કોહલીએ રઉફના છેલ્લા બે બોલ પર સતત બે છગ્ગા ફટકાર્યા! બે ઓવરમાં ભારતે 32 રન ઉમેર્યા અને એક પણ વિકેટ પડી નથી. હવે 6 બોલમાં 16 રન જોઈએ.',
};

// [file stem, app language (picks style prompt + language code), text]
const JOBS = [
  ['en', 'en', TEXT.en],
  ['hinglish-latin', 'hinglish', TEXT.hinglishLatin],
  ['hinglish-devanagari', 'hinglish', TEXT.hinglishDevanagari],
  ['hi', 'hi', TEXT.hi],
  ['gu', 'gu', TEXT.gu],
];

const outDir = 'tmp/voice-samples';
mkdirSync(outDir, { recursive: true });
const tts = new GeminiTts({ apiKey, model });
const lines = [`model: ${model}`, ''];

for (const [stem, lang, text] of JOBS) {
  const { voiceName, alternate } = VOICES[lang];
  for (const voice of [voiceName, alternate]) {
    const file = `${outDir}/${stem}__${voice}.wav`;
    const started = Date.now();
    try {
      const { audio } = await tts.synthesize({ text, lang, voiceName: voice });
      writeFileSync(file, audio);
      const line = `OK   ${file}  (${(audio.byteLength / 1024).toFixed(0)} KB, ${Date.now() - started} ms)`;
      console.log(line);
      lines.push(line);
    } catch (error) {
      const detail = error instanceof Error ? `${error.name}: ${error.message}` : 'unknown';
      const line = `FAIL ${file}  ${detail}`.slice(0, 300);
      console.error(line);
      lines.push(line);
    }
  }
}
writeFileSync(`${outDir}/RESULTS.txt`, `${lines.join('\n')}\n`);
