import { getAdapter } from '../../shared/sports/registry';
import type { MatchTimeline } from '../../shared/sports/types';
import { loadTimeline } from './matchStore';

// Resolves a request's match + seq range into the real timeline. The Match Room replays a
// mid-match window of the match, so it sends `seqBase` (the real seq of its own seq 0).

export type Adapter = NonNullable<ReturnType<typeof getAdapter>>;

export interface ResolvedMatch {
  readonly tl: MatchTimeline;
  readonly adapter: Adapter;
}

export type ResolveResult =
  { readonly ok: true; readonly match: ResolvedMatch } | { readonly ok: false; readonly status: 'NOT_FOUND' };

export function resolveMatch(
  matchId: string,
  load: (id: string) => MatchTimeline | null = loadTimeline,
): ResolveResult {
  const tl = load(matchId);
  const adapter = tl ? getAdapter(tl.meta.sport) : null;
  return tl && adapter ? { ok: true, match: { tl, adapter } } : { ok: false, status: 'NOT_FOUND' };
}

/** True when every real seq in [from, to] is a real event of the timeline. */
export const inTimeline = (tl: MatchTimeline, from: number, to: number): boolean =>
  Number.isInteger(from) && Number.isInteger(to) && from >= 0 && to >= from && to < tl.events.length;
