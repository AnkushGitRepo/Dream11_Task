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

export class GeminiText implements TextProvider {
  readonly id = 'gemini' as const;
  private readonly client: GenerateClient;
  private readonly model: string;

  constructor({ apiKey, model, client }: GeminiTextOptions) {
    this.model = model;
    this.client = client ?? (new GoogleGenAI({ apiKey }) as unknown as GenerateClient);
  }

  async generate({ system, user, maxTokens, signal }: TextRequest): Promise<string> {
    let text: string | undefined;
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: [{ role: 'user', parts: [{ text: user }] }],
        config: {
          systemInstruction: system,
          maxOutputTokens: maxTokens ?? DEFAULT_MAX_TOKENS,
          temperature: 0.4,
          ...(signal ? { abortSignal: signal } : {}),
        },
      });
      text = response.text;
    } catch (error) {
      if (signal?.aborted) throw new TextError('TIMEOUT', 'text request aborted');
      // Detail is for server logs only; endpoints never forward it to clients.
      throw new TextError(
        'PROVIDER_ERROR',
        error instanceof Error ? `${error.name}: ${error.message}` : 'unknown',
      );
    }
    const out = text?.trim();
    if (!out) throw new TextError('EMPTY', 'provider returned no text');
    return out;
  }
}

export interface TextEnv {
  readonly GEMINI_API_KEY?: string;
  readonly LLM_MODEL?: string;
}

/** Null when not configured; callers then use their template fallback. */
export function createTextProvider(env: TextEnv): TextProvider | null {
  if (!env.GEMINI_API_KEY || !env.LLM_MODEL) return null;
  return new GeminiText({ apiKey: env.GEMINI_API_KEY, model: env.LLM_MODEL });
}
