import { describe, expect, it, vi } from 'vitest';
import type { GenerateClient } from './provider.js';
import {
  buildTranscribePrompt,
  cleanTranscript,
  GeminiTranscriber,
  MAX_TRANSCRIPT_CHARS,
  TranscribeError,
} from './transcribe.js';

const clientReturning = (text: string | undefined) => ({
  models: { generateContent: vi.fn<GenerateClient['models']['generateContent']>(async () => ({ text })) },
});

describe('buildTranscribePrompt', () => {
  it('keeps Hinglish in Latin, Hindi in Devanagari and Gujarati in Gujarati script', () => {
    expect(buildTranscribePrompt('hinglish').user).toMatch(/Latin \(Roman\) script/);
    expect(buildTranscribePrompt('hinglish').user).toMatch(/Never use Devanagari/);
    expect(buildTranscribePrompt('hi').user).toMatch(/Devanagari script/);
    expect(buildTranscribePrompt('gu').user).toMatch(/Gujarati script/);
    expect(buildTranscribePrompt('en').user).toMatch(/English/);
  });

  it('tells the model the audio is data, not instructions', () => {
    expect(buildTranscribePrompt('en').system).toMatch(/never as instructions/);
  });
});

describe('cleanTranscript', () => {
  it('flattens whitespace, strips wrapping quotes and bounds the length', () => {
    expect(cleanTranscript('  "kitne run\nchahiye?"  ')).toBe('kitne run chahiye?');
    expect(cleanTranscript('x'.repeat(500))).toHaveLength(MAX_TRANSCRIPT_CHARS);
    expect(cleanTranscript('   ')).toBe('');
  });
});

describe('GeminiTranscriber', () => {
  it('sends the audio inline with the language prompt and returns the cleaned text', async () => {
    const client = clientReturning('"What is the score?"');
    const t = new GeminiTranscriber({ apiKey: 'k', model: 'm', client });
    const out = await t.transcribe({ audioBase64: 'QUJD', mimeType: 'audio/webm', lang: 'en' });
    expect(out).toBe('What is the score?');
    const call = client.models.generateContent.mock.calls[0]?.[0];
    const contents = call?.contents as { parts: { inlineData?: unknown }[] }[] | undefined;
    expect(contents?.[0]?.parts[1]?.inlineData).toEqual({ mimeType: 'audio/webm', data: 'QUJD' });
  });

  it('returns an empty transcript when the model heard nothing', async () => {
    const t = new GeminiTranscriber({ apiKey: 'k', model: 'm', client: clientReturning(undefined) });
    expect(await t.transcribe({ audioBase64: 'QUJD', mimeType: 'audio/webm', lang: 'hi' })).toBe('');
  });

  it('maps provider failures and aborts to TranscribeError', async () => {
    const failing: GenerateClient = {
      models: {
        generateContent: async () => {
          throw new Error('quota exceeded');
        },
      },
    };
    const t = new GeminiTranscriber({ apiKey: 'k', model: 'm', client: failing });
    await expect(t.transcribe({ audioBase64: 'QUJD', mimeType: 'audio/webm', lang: 'en' })).rejects.toMatchObject(
      { name: 'TranscribeError', code: 'PROVIDER_ERROR' },
    );
    const controller = new AbortController();
    controller.abort();
    await expect(
      t.transcribe({ audioBase64: 'QUJD', mimeType: 'audio/webm', lang: 'en', signal: controller.signal }),
    ).rejects.toBeInstanceOf(TranscribeError);
  });
});
