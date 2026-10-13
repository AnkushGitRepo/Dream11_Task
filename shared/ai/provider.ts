import { GoogleGenAI } from '@google/genai';

// SERVER-ONLY (never import from src/). Text generation behind a small interface so the endpoint
// and tests do not depend on the SDK. Phase 3 extends this with the recap/ask prompts; the
// interface stays the same.

export type TextErrorCode = 'EMPTY' | 'PROVIDER_ERROR' | 'TIMEOUT';

export class TextError extends Error {
  readonly code: TextErrorCode;

  constructor(code: TextErrorCode, message: string) {
    super(message);
    this.name = 'TextError';
    this.code = code;
  }
}

export interface TextRequest {
  readonly system: string;
  readonly user: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
  /** Ask the model for a JSON document (the callers parse and validate it). */
  readonly json?: boolean;
  readonly signal?: AbortSignal;
}

export interface TextProvider {
  readonly id: 'gemini';
  generate(request: TextRequest): Promise<string>;
}

/** The slice of the SDK client we use, so tests can inject a fake. */
export interface GenerateClient {
  models: {
    generateContent(args: {
      model: string;
      contents: unknown;
      config?: Record<string, unknown>;
    }): Promise<{ text?: string | undefined }>;
  };
}

export interface GeminiTextOptions {
  readonly apiKey: string;
  readonly model: string;
  readonly client?: GenerateClient;
}

const DEFAULT_MAX_TOKENS = 200;
const DEFAULT_TEMPERATURE = 0.3; // docs/ARCHITECTURE.md §7
const RETRIES = 1; // one retry on a provider error (5xx / transient); never on abort

/**
 * Newest non-preview Gemini Flash text model in the installed @google/genai model list (2.29.0).
 * NOT verified against the live API: set LLM_MODEL to override.
 */
export const DEFAULT_LLM_MODEL = 'gemini-3.8-flash';

export class GeminiText implements TextProvider {
  readonly id = 'gemini' as const;
  private readonly client: GenerateClient;
  private readonly model: string;

  constructor({ apiKey, model, client }: GeminiTextOptions) {
    this.model = model;
    this.client = client ?? (new GoogleGenAI({ apiKey }) as unknown as GenerateClient);
  }

  async generate(request: TextRequest): Promise<string> {
    const { system, user, maxTokens, temperature, json, signal } = request;
    let lastError: unknown;
    for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
      try {
        const response = await this.client.models.generateContent({
          model: this.model,
          contents: [{ role: 'user', parts: [{ text: user }] }],
          config: {
            systemInstruction: system,
            maxOutputTokens: maxTokens ?? DEFAULT_MAX_TOKENS,
            temperature: temperature ?? DEFAULT_TEMPERATURE,
            ...(json ? { responseMimeType: 'application/json' } : {}),
            ...(signal ? { abortSignal: signal } : {}),
          },
        });
        const out = response.text?.trim();
        if (!out) throw new TextError('EMPTY', 'provider returned no text');
        return out;
      } catch (error) {
        if (error instanceof TextError) throw error;
        if (signal?.aborted) throw new TextError('TIMEOUT', 'text request aborted');
        lastError = error;
      }
    }
    // Detail is for server logs only; endpoints never forward it to clients.
    throw new TextError(
      'PROVIDER_ERROR',
      lastError instanceof Error ? `${lastError.name}: ${lastError.message}` : 'unknown',
    );
  }
}

export interface TextEnv {
  readonly GEMINI_API_KEY?: string;
  readonly LLM_MODEL?: string;
}

const MODEL_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/;

/** The model to use: LLM_MODEL when it looks like a real id, else the default (a placeholder such as "<model id>" is ignored). */
export function resolveModel(raw: string | undefined): string {
  const v = raw?.trim() ?? '';
  return MODEL_ID.test(v) ? v : DEFAULT_LLM_MODEL;
}

/** Null without a key; callers then use their template fallback. */
export function createTextProvider(env: TextEnv): TextProvider | null {
  if (!env.GEMINI_API_KEY) return null;
  return new GeminiText({ apiKey: env.GEMINI_API_KEY, model: resolveModel(env.LLM_MODEL) });
}
