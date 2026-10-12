import type { Fact } from '@shared/sports/types';

export interface RecapText {
  readonly lead: string;
  readonly body: string;
  readonly source: 'ai' | 'template';
}

export interface RecapEntry {
  readonly id: number;
  /** Replay positions (events played) bounding the window [fromPosition, toPosition). */
  readonly fromPosition: number;
  readonly toPosition: number;
  /** Clock label at fromPosition, e.g. '17.0'. */
  readonly clock: string;
  /** Sport-provided gap label, e.g. '12 balls · 2 overs'. */
  readonly label: string;
  readonly facts: readonly Fact[];
  readonly status: 'loading' | 'ready' | 'error';
  readonly recap?: RecapText;
}
