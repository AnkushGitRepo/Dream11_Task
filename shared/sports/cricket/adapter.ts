import type { Facts, MatchTimeline, SportAdapter } from '../types.ts';
import { askContextCricket } from './askContext.ts';
import { normalizeCricsheet } from './normalize.ts';
import { getCricketStateAt } from './position.ts';
import { suggestedCricketQuestions } from './questions.ts';
import { summarizeCricket } from './summarize.ts';
import type { CricketState } from './stateTypes.ts';
import { cricketTeachables } from './teachables.ts';

/** A catch-up is only worth a recap when at least this many legal balls were bowled. */
export const MEANINGFUL_GAP_BALLS = 6;

export const cricketAdapter: SportAdapter<CricketState> = {
  id: 'cricket',
  normalize: (raw: unknown): MatchTimeline => normalizeCricsheet(raw),
  /** State AFTER event `seq` (seq -1 = before the first ball). */
  getState: (tl, seq) => getCricketStateAt(tl, Math.max(0, seq + 1)),
  summarize: (tl, fromSeq, toSeq): Facts => summarizeCricket(tl, fromSeq, toSeq),
  askContext: (tl, seq): Facts => askContextCricket(tl, seq),
  /** Window seqs are inclusive. */
  isMeaningfulGap(tl, fromSeq, toSeq) {
    const lo = Math.max(0, fromSeq);
    const hi = Math.min(toSeq, tl.events.length - 1);
    let legal = 0;
    for (let i = lo; i <= hi; i += 1) {
      if (tl.events[i]?.data.legal === true) legal += 1;
      if (legal >= MEANINGFUL_GAP_BALLS) return true;
    }
    return false;
  },
  suggestedQuestions: (lang, state) => suggestedCricketQuestions(lang, state),
  teachables: (tl, seq) => cricketTeachables(tl, seq),
};
