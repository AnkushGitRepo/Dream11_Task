import type { Lang, RuleEntry, SportId } from '@shared/sports/types';
import { getRule } from '@shared/sports/rules';

// Client side of POST /api/learn. The rule text is read from the bundled rulebook, so a card can
// always show its title and rule instantly and offline; only the "in this match" sentence needs
// the server, and when that fails the card simply has no moment line.

export interface LearnMoment {
  /** Id for natural voice (/api/speak kind 'learn'). */
  readonly id: string;
  readonly moment: string;
  /** Text voiced by the server; also the basic-voice fallback text. */
  readonly speak: string;
  readonly source: 'ai' | 'template';
}

export interface MomentRequest {
  readonly matchId: string;
  readonly seq: number;
  readonly ruleId: string;
  readonly lang: Lang;
  readonly signal?: AbortSignal;
}

const ENDPOINT = '/api/learn';
export const LEARN_TIMEOUT_MS = 9_000;
const ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export function ruleFor(sport: SportId, ruleId: string): RuleEntry | null {
  return getRule(sport, ruleId);
}

function parse(value: unknown): LearnMoment | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  const { id, moment, speak, source } = v;
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) return null;
  if (typeof moment !== 'string' || moment.trim() === '') return null;
  if (typeof speak !== 'string') return null;
  if (source !== 'ai' && source !== 'template') return null;
  return { id, moment, speak, source };
}

/** The moment sentence for a rule at an event, or null when the server cannot give one. */
export async function fetchLearnMoment(req: MomentRequest): Promise<LearnMoment | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LEARN_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  req.signal?.addEventListener('abort', onAbort);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: req.matchId, seq: req.seq, ruleId: req.ruleId, lang: req.lang }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return parse(await res.json());
  } catch {
    return null; // offline, aborted or malformed: the card falls back to rulebook text only
  } finally {
    clearTimeout(timer);
    req.signal?.removeEventListener('abort', onAbort);
  }
}
