import { lookupRule, ruleFacts } from '@shared/sports/rules';
import type { Fact, Lang, SportId } from '@shared/sports/types';
import { prefetchSpeech } from '@/features/voice';

// Client side of POST /api/recap and POST /api/ask. The server computes every fact itself, so the
// request carries only ids, positions, the language and (for ask) the question.
// `VITE_USE_MOCK_API=true` swaps in the offline mock (tests, demos without a server). The mock
// branch is a dynamic import behind a build-time constant, so production bundles drop it.

export type AiErrorCode = 'RATE_LIMITED' | 'FAILED';

/** Same `code` contract the UI already reads (`RATE_LIMITED` shows the cool-down message). */
export class AiError extends Error {
  readonly code: AiErrorCode;
  constructor(code: AiErrorCode) {
    super(code === 'RATE_LIMITED' ? 'Rate limited' : 'AI request failed');
    this.name = 'AiError';
    this.code = code;
  }
}

export interface RecapRequest {
  readonly matchId: string;
  readonly fromSeq: number;
  readonly toSeq: number;
  /** Real timeline seq of this client's seq 0 (a replay that starts mid-match). */
  readonly seqBase: number;
  readonly lang: Lang;
  /** Mock mode only: the mock composes text from these. The server ignores facts from clients. */
  readonly facts?: readonly Fact[];
}

export interface RecapResponse {
  /** Id for natural voice (POST /api/speak kind 'recap'). */
  readonly id: string;
  readonly lead: string;
  readonly body: string;
  readonly source: 'ai' | 'template';
  readonly window: { readonly fromSeq: number; readonly toSeq: number };
}

export interface AskRequest {
  readonly matchId: string;
  readonly seq: number;
  readonly seqBase: number;
  readonly question: string;
  readonly lang: Lang;
  readonly sport?: SportId;
  /** Mock mode only (see RecapRequest.facts). */
  readonly facts?: readonly Fact[];
}

export interface AskResponse {
  /** Id for natural voice (POST /api/speak kind 'answer'). */
  readonly id: string;
  readonly answer: string;
  readonly source: 'ai' | 'template' | 'unknown';
}

export const AI_TIMEOUT_MS = 12_000;

async function post(path: string, payload: unknown): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (res.status === 429) throw new AiError('RATE_LIMITED');
    if (!res.ok) throw new AiError('FAILED');
    return await res.json();
  } catch (error) {
    throw error instanceof AiError ? error : new AiError('FAILED');
  } finally {
    clearTimeout(timer);
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const ID = /^[A-Za-z0-9_-]{8,64}$/;

function readRecap(v: unknown, req: RecapRequest): RecapResponse {
  if (!isObj(v)) throw new AiError('FAILED');
  const { id, lead, body, source } = v;
  if (typeof id !== 'string' || !ID.test(id)) throw new AiError('FAILED');
  if (typeof lead !== 'string' || typeof body !== 'string') throw new AiError('FAILED');
  if (source !== 'ai' && source !== 'template') throw new AiError('FAILED');
  return { id, lead, body, source, window: { fromSeq: req.fromSeq, toSeq: req.toSeq } };
}

function readAsk(v: unknown): AskResponse {
  if (!isObj(v)) throw new AiError('FAILED');
  const { id, answer, source } = v;
  if (typeof id !== 'string' || !ID.test(id)) throw new AiError('FAILED');
  if (typeof answer !== 'string' || answer.trim() === '') throw new AiError('FAILED');
  if (source !== 'ai' && source !== 'template' && source !== 'unknown') throw new AiError('FAILED');
  return { id, answer, source };
}

export async function getRecap(req: RecapRequest): Promise<RecapResponse> {
  // Literal comparison at the use site: Vite substitutes the env string, so this branch (and the
  // mock chunk behind it) is dead code in any build where VITE_USE_MOCK_API !== 'true'.
  if (import.meta.env.VITE_USE_MOCK_API === 'true') {
    const { mockRecap } = await import('./mockApi');
    const res = await mockRecap({
      matchId: req.matchId,
      fromSeq: req.fromSeq,
      toSeq: req.toSeq,
      lang: req.lang,
      facts: [...(req.facts ?? [])],
    });
    return { id: res.id, lead: res.lead, body: res.body, source: res.source, window: res.window };
  }
  const out = readRecap(
    await post('/api/recap', {
      matchId: req.matchId,
      fromSeq: req.fromSeq,
      toSeq: req.toSeq,
      seqBase: req.seqBase,
      lang: req.lang,
    }),
    req,
  );
  prefetchSpeech({ kind: 'recap', id: out.id }); // audio is ready by the time Listen is tapped
  return out;
}

export async function askMatch(req: AskRequest): Promise<AskResponse> {
  if (import.meta.env.VITE_USE_MOCK_API === 'true') {
    const { mockAsk } = await import('./mockApi');
    // The mock has no server to look rules up, so the rulebook entry joins its facts here.
    const rule = lookupRule(req.question, req.sport ?? 'cricket');
    const facts = [...(req.facts ?? []), ...(rule ? ruleFacts(rule) : [])];
    return mockAsk({ matchId: req.matchId, seq: req.seq, question: req.question, lang: req.lang, facts });
  }
  const out = readAsk(
    await post('/api/ask', {
      matchId: req.matchId,
      seq: req.seq,
      seqBase: req.seqBase,
      question: req.question,
      lang: req.lang,
    }),
  );
  prefetchSpeech({ kind: 'answer', id: out.id });
  return out;
}
