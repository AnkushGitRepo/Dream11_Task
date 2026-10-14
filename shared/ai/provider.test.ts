import { describe, expect, it, vi } from 'vitest';
import { createTextProvider, DEFAULT_LLM_MODEL, GeminiText, resolveModel, TextError } from './provider.js';

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

describe('GeminiText options and retry', () => {
  it('asks for JSON, a low temperature and the token cap when requested', async () => {
    const client = clientReturning('{}');
    const p = new GeminiText({ apiKey: 'k', model: 'm', client });
    await p.generate({ system: 's', user: 'u', json: true, maxTokens: 300 });
    const cfg = client.models.generateContent.mock.calls[0]?.[0].config;
    expect(cfg?.responseMimeType).toBe('application/json');
    expect(cfg?.maxOutputTokens).toBe(300);
    expect(cfg?.temperature).toBe(0.3);
  });

  it('does not force JSON unless asked', async () => {
    const client = clientReturning('hi');
    await new GeminiText({ apiKey: 'k', model: 'm', client }).generate({ system: 's', user: 'u' });
    expect(client.models.generateContent.mock.calls[0]?.[0].config?.responseMimeType).toBeUndefined();
  });

  it('retries once on a provider error, then succeeds', async () => {
    const fn = vi.fn<GenFn>().mockRejectedValueOnce(new Error('503')).mockResolvedValueOnce({ text: 'ok' });
    const p = new GeminiText({ apiKey: 'k', model: 'm', client: { models: { generateContent: fn } } });
    await expect(p.generate({ system: 's', user: 'u' })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('gives up after one retry', async () => {
    const fn = vi.fn<GenFn>().mockRejectedValue(new Error('503'));
    const p = new GeminiText({ apiKey: 'k', model: 'm', client: { models: { generateContent: fn } } });
    await expect(p.generate({ system: 's', user: 'u' })).rejects.toMatchObject({ code: 'PROVIDER_ERROR' });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('never retries an aborted request', async () => {
    const fn = vi.fn<GenFn>().mockRejectedValue(new Error('aborted'));
    const p = new GeminiText({ apiKey: 'k', model: 'm', client: { models: { generateContent: fn } } });
    const ac = new AbortController();
    ac.abort();
    await expect(p.generate({ system: 's', user: 'u', signal: ac.signal })).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('createTextProvider', () => {
  it('is null without a key, and uses the default model when LLM_MODEL is unset', () => {
    expect(createTextProvider({})).toBeNull();
    expect(createTextProvider({ LLM_MODEL: 'm' })).toBeNull();
    expect(createTextProvider({ GEMINI_API_KEY: 'k' })?.id).toBe('gemini');
    expect(DEFAULT_LLM_MODEL).toBe('gemini-3.8-flash');
  });

  it('prefers LLM_MODEL when set', async () => {
    const p = createTextProvider({ GEMINI_API_KEY: 'k', LLM_MODEL: 'gemini-x' });
    expect(p).toBeInstanceOf(GeminiText);
    expect((p as unknown as { model: string }).model).toBe('gemini-x');
  });
});

describe('resolveModel', () => {
  it('uses a real-looking LLM_MODEL', () => {
    expect(resolveModel('gemini-3.8-flash')).toBe('gemini-3.8-flash');
    expect(resolveModel('  gemini-2.5-flash  ')).toBe('gemini-2.5-flash');
  });

  it.each([
    '',
    '   ',
    undefined,
    '<current Gemini Flash model id>',
    'my model',
    'a',
    'x'.repeat(80),
    '"quoted"',
  ])('falls back to the default for %j', (raw) => {
    expect(resolveModel(raw)).toBe(DEFAULT_LLM_MODEL);
  });
});
