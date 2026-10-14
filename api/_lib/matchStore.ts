import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MatchTimeline } from '../../shared/sports/types.js';

// Server-side match loader. Only ids listed in data/matches/index.json can be loaded, so a request
// value never reaches the filesystem path unchecked.

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,63}$/;
const cache = new Map<string, MatchTimeline>();
let allowed: ReadonlySet<string> | null = null;

const dir = (): string => join(process.cwd(), 'data', 'matches');

function allowedIds(): ReadonlySet<string> {
  if (allowed) return allowed;
  const index = JSON.parse(readFileSync(join(dir(), 'index.json'), 'utf8')) as {
    matches?: { id?: unknown }[];
  };
  allowed = new Set(
    (index.matches ?? []).map((m) => m.id).filter((id): id is string => typeof id === 'string'),
  );
  return allowed;
}

export function isMatchId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value);
}

/** The timeline for a listed match id, or null when unknown / unreadable. */
export function loadTimeline(matchId: string): MatchTimeline | null {
  if (!isMatchId(matchId)) return null;
  const hit = cache.get(matchId);
  if (hit) return hit;
  try {
    if (!allowedIds().has(matchId)) return null;
    const tl = JSON.parse(readFileSync(join(dir(), `${matchId}.json`), 'utf8')) as MatchTimeline;
    if (!Array.isArray(tl.events) || typeof tl.meta?.sport !== 'string') return null;
    cache.set(matchId, tl);
    return tl;
  } catch {
    return null;
  }
}
