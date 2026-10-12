import { BALLS_PER_OVER, countLegalBalls, formatOvers, windowFacts } from '@shared/sports/cricket/state';
import type { SportUi } from '../../types';
import { isCricketBaseline } from './baseline';
import { ScoreBar } from './ScoreBar';
import { ScoreHero } from './ScoreHero';

export const cricketUi: SportUi = {
  ScoreHero,
  ScoreBar,
  minGap: 6,
  gap: (timeline, from, to) => {
    const count = countLegalBalls(timeline, from, to);
    const overs =
      count >= BALLS_PER_OVER
        ? ` · ${count % BALLS_PER_OVER === 0 ? count / BALLS_PER_OVER : formatOvers(count)} overs`
        : '';
    return { count, label: `${count} balls${overs}` };
  },
  startClock: (baseline) => (isCricketBaseline(baseline) ? baseline.clock : ''),
  positionAfterGap: (timeline, from, count) => {
    let seen = 0;
    let pos = from;
    while (pos < timeline.events.length && seen < count) {
      if (timeline.events[pos]?.data.legal === true) seen += 1;
      pos += 1;
    }
    return pos;
  },
  facts: (timeline, from, to, baseline) =>
    isCricketBaseline(baseline) ? windowFacts(timeline, from, to, baseline) : [],
};
