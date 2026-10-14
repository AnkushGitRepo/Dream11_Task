import type { Fact, Lang } from '@shared/sports/types';

export type TurnStatus = 'pending' | 'done' | 'error';

export interface AskTurn {
  readonly id: number;
  readonly question: string;
  /** Language the question was asked in; the answer comes back in it. */
  readonly lang: Lang;
  readonly status: TurnStatus;
  /** Bumped on every (re)send; responses for an older attempt are dropped. */
  readonly attempt: number;
  readonly answer?: string;
  /** Id used to fetch the natural voice (POST /api/speak). */
  readonly answerId?: string;
  /** Signed token for natural voice; absent in mock mode. */
  readonly answerToken?: string;
  /** 'unknown' = honest "I don't know". */
  readonly source?: 'ai' | 'template' | 'unknown';
  readonly failure?: 'failed' | 'rateLimited';
}

/** What the lead provides at the moment a question is sent. */
export interface AskContext {
  /** Latest event seq played (position - 1). */
  readonly seq: number;
  /** Engine snapshot facts for that moment (mock mode only; the server computes its own). */
  readonly facts: readonly Fact[];
  /** Real timeline seq of seq 0 when the replay is a window of the match (default 0). */
  readonly seqBase?: number;
}
