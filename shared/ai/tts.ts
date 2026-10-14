import { GoogleGenAI, Modality } from '@google/genai';
import type { Lang } from '../sports/types.js';
import { VOICES } from './voices.js';

// SERVER-ONLY (never import from src/). Text-to-speech behind a provider interface so Gemini can be
// swapped for Sarvam (TTS_PROVIDER=sarvam) without touching the endpoint.

export type TtsErrorCode =
  'NOT_CONFIGURED' | 'NOT_IMPLEMENTED' | 'EMPTY_AUDIO' | 'PROVIDER_ERROR' | 'TIMEOUT';

export class TtsError extends Error {
  readonly code: TtsErrorCode;

  constructor(code: TtsErrorCode, message: string) {
    super(message);
    this.name = 'TtsError';
    this.code = code;
  }
}

export interface TtsRequest {
  readonly text: string;
  readonly lang: Lang;
  /** Overrides the language's default voice (used by the sample script). */
  readonly voiceName?: string;
  readonly signal?: AbortSignal;
}

export interface TtsResult {
  readonly audio: Uint8Array;
  readonly mimeType: 'audio/wav';
}

export interface TtsProvider {
  readonly id: 'gemini' | 'sarvam';
  synthesize(request: TtsRequest): Promise<TtsResult>;
}

const DEFAULT_SAMPLE_RATE = 24000;

/** Wraps 16-bit mono PCM in a WAV container so browsers can play it from a Blob. */
export function pcmToWav(pcm: Uint8Array, sampleRate = DEFAULT_SAMPLE_RATE): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const write = (offset: number, text: string) =>
    [...text].forEach((ch, i) => view.setUint8(offset + i, ch.charCodeAt(0)));
  write(0, 'RIFF');
  view.setUint32(4, 36 + pcm.byteLength, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  write(36, 'data');
  view.setUint32(40, pcm.byteLength, true);
  const out = new Uint8Array(44 + pcm.byteLength);
  out.set(new Uint8Array(header), 0);
  out.set(pcm, 44);
  return out;
}

/** 'audio/L16;codec=pcm;rate=24000' -> 24000 */
export function sampleRateFromMime(mimeType: string | undefined): number {
  const match = /rate=(\d{4,6})/.exec(mimeType ?? '');
  return match?.[1] ? Number(match[1]) : DEFAULT_SAMPLE_RATE;
}

export interface GeminiTtsOptions {
  readonly apiKey: string;
  /** From TTS_MODEL. Candidates in the installed SDK's model list: gemini-3.8-flash-tts, gemini-3.8-flash-lite-tts. */
  readonly model: string;
  /** Tests inject a fake; production builds the SDK client from apiKey. */
  readonly client?: TtsGenerateClient;
}

/** The slice of the SDK client we use. */
export interface TtsGenerateClient {
  models: { generateContent(args: Record<string, unknown>): Promise<TtsGenerateResponse> };
}

interface TtsGenerateResponse {
  candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
}

export class GeminiTts implements TtsProvider {
  readonly id = 'gemini' as const;
  private readonly client: TtsGenerateClient;
  private readonly options: GeminiTtsOptions;

  constructor(options: GeminiTtsOptions) {
    this.options = options;
    this.client = options.client ?? (new GoogleGenAI({ apiKey: options.apiKey }) as unknown as TtsGenerateClient);
  }

  async synthesize({ text, lang, voiceName, signal }: TtsRequest): Promise<TtsResult> {
    const profile = VOICES[lang];
    let response;
    try {
      response = await this.client.models.generateContent({
        model: this.options.model,
        // The part text is EXACTLY the speak text. The delivery style travels in speechMetadata:
        // prefixing it into the text made the model read the instruction aloud.
        contents: [{ role: 'user', parts: [{ text, speechMetadata: { style: profile.style } }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            languageCode: profile.languageCode,
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName ?? profile.voiceName } },
          },
          ...(signal ? { abortSignal: signal } : {}),
        },
      });
    } catch (error) {
      if (signal?.aborted) throw new TtsError('TIMEOUT', 'TTS request aborted');
      // Detail is for the sample script / server logs only: /api/speak never forwards it to clients.
      throw new TtsError(
        'PROVIDER_ERROR',
        error instanceof Error ? `${error.name}: ${error.message}` : 'unknown',
      );
    }
    const inline = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData?.data,
    )?.inlineData;
    if (!inline?.data) throw new TtsError('EMPTY_AUDIO', 'Provider returned no audio');
    const pcm = new Uint8Array(Buffer.from(inline.data, 'base64'));
    return { audio: pcmToWav(pcm, sampleRateFromMime(inline.mimeType)), mimeType: 'audio/wav' };
  }
}

/** Fallback provider slot (Sarvam Bulbul): implements the interface, deliberately unused for now. */
export class SarvamTts implements TtsProvider {
  readonly id = 'sarvam' as const;

  async synthesize(): Promise<TtsResult> {
    throw new TtsError('NOT_IMPLEMENTED', 'Sarvam TTS is a stub');
  }
}

export interface TtsEnv {
  readonly TTS_PROVIDER?: string;
  readonly TTS_MODEL?: string;
  readonly GEMINI_API_KEY?: string;
}

/** Returns null when the selected provider is not configured (endpoint then answers 503). */
export function createTtsProvider(env: TtsEnv): TtsProvider | null {
  if (env.TTS_PROVIDER === 'sarvam') return new SarvamTts();
  if (!env.GEMINI_API_KEY || !env.TTS_MODEL) return null;
  return new GeminiTts({ apiKey: env.GEMINI_API_KEY, model: env.TTS_MODEL });
}
