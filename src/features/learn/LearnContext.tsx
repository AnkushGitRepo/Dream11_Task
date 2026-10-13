import { createContext, useContext } from 'react';
import type { SportId } from '@shared/sports/types';
import { useStrings } from '@/i18n/useStrings';
import { ruleFor } from './learnService';

export interface LearnContextValue {
  readonly on: boolean;
  readonly sport: SportId;
  readonly teachablesAt: (seq: number) => readonly string[];
  readonly explain: (seq: number) => void;
}

export const LearnContext = createContext<LearnContextValue | null>(null);

export interface Teachable {
  readonly ruleId: string;
  /** Term in the fan's language, e.g. "Free hit". */
  readonly term: string;
  /** Appended to a chip's accessible name: "tap to learn: Free hit". */
  readonly ariaHint: string;
  readonly onLearn: () => void;
}

/**
 * The teachable rule (if any) at an event, when Learn mode is on. Safe outside a LearnProvider
 * (returns null), so chips and moments render the same everywhere.
 */
export function useTeachable(seq: number): Teachable | null {
  const ctx = useContext(LearnContext);
  const { lang, t } = useStrings();
  if (!ctx || !ctx.on) return null;
  const ruleId = ctx.teachablesAt(seq)[0];
  const rule = ruleId ? ruleFor(ctx.sport, ruleId) : null;
  if (!ruleId || !rule) return null;
  const term = rule.term[lang];
  return {
    ruleId,
    term,
    ariaHint: t.learnTapAria.replace('{term}', term),
    onLearn: () => ctx.explain(seq),
  };
}
