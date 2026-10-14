import type { Fact, Lang } from '@shared/sports/types';

export interface RecapText {
  /** Server/mock id used to fetch the natural voice (POST /api/speak). */
  /** Absent for demo/static recaps the server never generated. */
  readonly id?: string;
  /** Signed token the server attached for natural voice; absent in mock mode. */
  readonly speakToken?: string;
  readonly lead: string;
  readonly body: string;
  readonly source: 'ai' | 'template';
}

export interface RecapEntry {
  readonly id: number;
  /** Language the recap was written in; it keeps it when the UI language changes. */
  readonly lang: Lang;
  /** Replay positions (events played) bounding the window [fromPosition, toPosition). */
  readonly fromPosition: number;
  readonly toPosition: number;
  /** Clock label at fromPosition, e.g. '17.0'. */
  readonly clock: string;
  /** Sport-provided gap label, e.g. '12 balls · 2 overs'. */
  readonly label: string;
  readonly facts: readonly Fact[];
  /** autoRead was on when this recap arrived: the newest card reads itself aloud once on mount. */
  readonly speakOnArrival: boolean;
  readonly status: 'loading' | 'ready' | 'error';
  readonly recap?: RecapText;
}
