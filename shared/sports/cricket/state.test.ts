import { describe, expect, it } from 'vitest';
import { MOCK_BASELINE, mockTimeline } from '../../../src/mocks/match.mock';
import { bowlerFigures, countLegalBalls, getCricketState, shortName } from './state';

const at = (position: number) => getCricketState(mockTimeline, position, MOCK_BASELINE);

describe('getCricketState (golden checkpoints)', () => {
  it('17.0: 112/4, need 48 off 18', () => {
    const s = at(0);
    expect([s.score, s.wkts, s.overs, s.need, s.ballsLeft]).toEqual([112, 4, '17.0', 48, 18]);
    expect(s.recent).toHaveLength(0);
  });

  it('19.0: 144/4, need 16 off 6, Kohli 74 (50), Pandya 40 (36), Nawaz 3-0-29-0', () => {
    const s = at(13);
    expect([s.score, s.wkts, s.overs, s.need, s.ballsLeft]).toEqual([144, 4, '19.0', 16, 6]);
    expect(s.crr).toBe(7.58);
    expect(s.rrr).toBe(16);
    expect(s.partnership.runs).toBe(113);
    const byName = [s.striker, s.nonStriker].find((b) => b.name === 'V Kohli');
    const pandya = [s.striker, s.nonStriker].find((b) => b.name === 'HH Pandya');
    expect([byName?.runs, byName?.balls]).toEqual([74, 50]);
    expect([pandya?.runs, pandya?.balls]).toEqual([40, 36]);
    expect(shortName(s.bowler.name)).toBe('Nawaz');
    expect(bowlerFigures(s.bowler)).toBe('3-0-29-0');
  });

  it('flags a free hit after the 19.3 no-ball and persists through the wide', () => {
    expect(at(17).freeHitNext).toBe(true); // after the no-ball (seq 16)
    expect(at(18).freeHitNext).toBe(true); // after the wide on the free hit
    expect(at(19).freeHitNext).toBe(false); // byes consumed it
  });

  it('final: 160/6, India won by 4 wickets', () => {
    const s = at(22);
    expect([s.score, s.wkts, s.overs, s.need]).toEqual([160, 6, '20.0', 0]);
    expect(s.finished).toBe(true);
    expect(s.result).toBe('IND won by 4 wickets');
  });

  it('counts legal balls between positions (wide and no-ball excluded)', () => {
    expect(countLegalBalls(mockTimeline, 0, 22)).toBe(18);
    expect(countLegalBalls(mockTimeline, 0, 2)).toBe(1);
  });
});
