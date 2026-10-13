import { describe, expect, it } from 'vitest';
import { ballData } from '@shared/sports/cricket/ballData';
import type { MatchTimeline } from '@shared/sports/types';
import { MOCK_MATCH_ID, MOCK_START_SEQ, mockTimeline } from './match.mock';

const real = Object.values(
  import.meta.glob('../../data/matches/pak-ind-2022-t20wc-mcg.json', { eager: true, import: 'default' }),
)[0] as MatchTimeline;
const index = Object.values(
  import.meta.glob('../../data/matches/index.json', { eager: true, import: 'default' }),
)[0] as { matches: { id: string; defaultStartSeq: number }[] };

// The Match Room replays `mockTimeline` while /api/recap and /api/ask read the real timeline via
// seqBase. These tests are what makes that bridge trustworthy.
describe('mock timeline <-> real timeline bridge', () => {
  it('seqBase is the real start of the replay (index.json defaultStartSeq)', () => {
    expect(mockTimeline.meta.seqBase).toBe(MOCK_START_SEQ);
    const entry = index.matches.find((m) => m.id === MOCK_MATCH_ID);
    expect(entry?.defaultStartSeq).toBe(MOCK_START_SEQ);
  });

  it('the mock is the same match as the real file', () => {
    expect(mockTimeline.meta.id).toBe(real.meta.id);
    expect(mockTimeline.meta.sport).toBe(real.meta.sport);
    expect(mockTimeline.meta.teams).toEqual(real.meta.teams);
  });

  it('every mock event equals the real event at seqBase + seq', () => {
    expect(mockTimeline.events.length).toBeGreaterThan(20);
    expect(MOCK_START_SEQ + mockTimeline.events.length).toBeLessThanOrEqual(real.events.length);
    mockTimeline.events.forEach((m, i) => {
      const r = real.events[MOCK_START_SEQ + i];
      expect(r, `real event for mock seq ${i}`).toBeDefined();
      if (!r) return;
      expect([m.clock, m.kind, m.period], `seq ${i}`).toEqual([r.clock, r.kind, r.period]);
      const a = ballData(m);
      const b = ballData(r);
      expect(
        {
          batter: a.batter,
          bowler: a.bowler,
          runsBat: a.runsBat,
          extras: a.extras,
          legal: a.legal,
          extraType: a.extraType,
          wicket: a.wicket?.kind ?? null,
          score: a.score,
          wkts: a.wkts,
        },
        `seq ${i} (${m.clock})`,
      ).toEqual({
        batter: b.batter,
        bowler: b.bowler,
        runsBat: b.runsBat,
        extras: b.extras,
        legal: b.legal,
        extraType: b.extraType,
        wicket: b.wicket?.kind ?? null,
        score: b.score,
        wkts: b.wkts,
      });
    });
  });

  it('the mock ends where the real match ends', () => {
    const last = mockTimeline.events.length - 1;
    expect(MOCK_START_SEQ + last).toBe(real.events.length - 1);
  });
});
