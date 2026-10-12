import { cricketLabelAll } from '@shared/sports/cricket/labels';
import { snapshotFacts } from '@shared/sports/cricket/snapshot';
import { windowFacts } from '@shared/sports/cricket/facts';
import { BALLS_PER_OVER, countLegalBalls, formatOvers } from '@shared/sports/cricket/state';
import type { SportUi } from '../../types';
import { MOMENT_FILTERS, MOMENT_KIND_LABELS } from './momentLabels';
import { isCricketBaseline } from './baseline';
import { ScoreBar } from './ScoreBar';
import { ScoreHero } from './ScoreHero';

export const cricketUi: SportUi = {
  ScoreHero,
  ScoreBar,
  momentFilters: MOMENT_FILTERS,
  momentKindLabels: MOMENT_KIND_LABELS,
  minGap: 6,
  gap: (timeline, from, to) => {
    const count = countLegalBalls(timeline, from, to);
    const labels =
      count >= BALLS_PER_OVER
        ? cricketLabelAll('gapBallsOvers', {
            n: count,
            m: count % BALLS_PER_OVER === 0 ? count / BALLS_PER_OVER : formatOvers(count),
          })
        : cricketLabelAll('gapBalls', { n: count });
    return { count, label: labels.en, labels };
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
  snapshot: (timeline, position, baseline) =>
    isCricketBaseline(baseline) ? snapshotFacts(timeline, position, baseline) : [],
};
