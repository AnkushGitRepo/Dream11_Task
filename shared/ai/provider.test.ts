import { describe, expect, it, vi } from 'vitest';
import { createTextProvider, GeminiText, TextError } from './provider.ts';

interface GenArgs {
  model: string;
  contents: unknown;
  config?: Record<string, unknown>;
}

type GenFn = (args: GenArgs) => Promise<{ text?: string | undefined }>;

const clientReturning = (text: string | undefined) => ({
  models: {
    generateContent: vi.fn<GenFn>(async () => ({ text })),
  },
});

describe('GeminiText', () => {
  it('returns the trimmed model text and sends system + user separately', async () => {
    const client = clientReturning('  Kohli was bowled.  ');
    const p = new GeminiText({ apiKey: 'k', model: 'm', client });
    await expect(p.generate({ system: 'S', user: 'U' })).resolves.toBe('Kohli was bowled.');
    const call = client.models.generateContent.mock.calls[0]?.[0];
    expect(call?.model).toBe('m');
    expect(call?.config?.systemInstruction).toBe('S');
    expect(JSON.stringify(call?.contents)).toContain('U');
  });

  it('throws EMPTY when the model returns nothing', async () => {
    const p = new GeminiText({ apiKey: 'k', model: 'm', client: clientReturning('   ') });
    await expect(p.generate({ system: 's', user: 'u' })).rejects.toMatchObject({ code: 'EMPTY' });
  });

  it('maps SDK errors to PROVIDER_ERROR and aborts to TIMEOUT', async () => {
    const boom = {
      models: { generateContent: vi.fn<GenFn>(async () => Promise.reject(new Error('503 secret'))) },
    };
    const p = new GeminiText({ apiKey: 'k', model: 'm', client: boom });
    await expect(p.generate({ system: 's', user: 'u' })).rejects.toBeInstanceOf(TextError);
    await expect(p.generate({ system: 's', user: 'u' })).rejects.toMatchObject({ code: 'PROVIDER_ERROR' });
    const ac = new AbortController();
    ac.abort();
    await expect(p.generate({ system: 's', user: 'u', signal: ac.signal })).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
  });
});

describe('createTextProvider', () => {
  it('is null unless both key and model are configured', () => {
    expect(createTextProvider({})).toBeNull();
    expect(createTextProvider({ GEMINI_API_KEY: 'k' })).toBeNull();
    expect(createTextProvider({ LLM_MODEL: 'm' })).toBeNull();
    expect(createTextProvider({ GEMINI_API_KEY: 'k', LLM_MODEL: 'm' })?.id).toBe('gemini');
  });
});
