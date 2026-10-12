import { describe, expect, it } from 'vitest';
import { MOCK_BASELINE, mockTimeline } from '../../../src/mocks/match.mock';
import { snapshotFacts } from './snapshot';

const get = (position: number) =>
  Object.fromEntries(snapshotFacts(mockTimeline, position, MOCK_BASELINE).map((f) => [f.key, f]));

describe('snapshotFacts', () => {
  it('19.0: need 16 off 6, Kohli 74 (50), localised need label', () => {
    const f = get(13);
    expect(f.score?.value).toBe('144/4');
    expect(f.overs?.value).toBe('19.0');
    expect(f.need?.value).toBe(16);
    expect(f.need?.label.en).toBe('Need 16 off 6 balls');
    expect(f.need?.label.hinglish).toBe('6 balls mein 16 runs chahiye');
    expect(f.rrr?.label.en).toBe('RRR 16.00');
    expect(f.bowler?.value).toBe('Nawaz 3-0-29-0');
    const batters = [f.striker?.value, f.nonStriker?.value];
    expect(batters).toContain('Kohli 74 (50)');
    expect(batters).toContain('Pandya 40 (36)');
  });

  it('final: target reached, no rrr', () => {
    const f = get(22);
    expect(f.need?.label.en).toBe('Target reached');
    expect(f.rrr).toBeUndefined();
  });
});
