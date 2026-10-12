import type { SportId } from '@shared/sports/types';
import { cricketUi } from './cricket/ui';
import type { SportUi } from './types';

const REGISTRY: Partial<Record<SportId, SportUi>> = {
  cricket: cricketUi,
};

export function getSportUi(sport: SportId): SportUi | null {
  return REGISTRY[sport] ?? null;
}
