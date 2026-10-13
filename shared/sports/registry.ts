import { cricketAdapter } from './cricket/adapter.ts';
import { footballAdapter } from './football/adapter.ts';
import type { SportAdapter, SportId } from './types.ts';

// reason: adapters carry different state types; callers narrow by sport id.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyAdapter = SportAdapter<any>;

export const adapters = {
  cricket: cricketAdapter,
  football: footballAdapter,
} as const;

export type RegisteredSport = keyof typeof adapters;

export function isRegisteredSport(id: SportId): id is RegisteredSport {
  return id in adapters;
}

/** Adapter for a sport, or null when the sport is not implemented yet (e.g. kabaddi). */
export function getAdapter(sport: SportId): AnyAdapter | null {
  return isRegisteredSport(sport) ? adapters[sport] : null;
}
