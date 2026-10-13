import { describe, expect, it } from 'vitest';
import { collectNew, enqueue, MAX_LOOKBACK, promote } from './learnQueue';

const table: Record<number, string[]> = { 3: ['no-ball'], 4: ['free-hit', 'wide'], 5: [], 20: ['maiden'] };
const at = (seq: number): string[] => table[seq] ?? [];

describe('collectNew', () => {
  it('returns teachables of newly played events, oldest first', () => {
    expect(collectNew(4, 6, at)).toEqual([
      { seq: 4, ruleId: 'free-hit' },
      { seq: 4, ruleId: 'wide' },
    ]);
  });

  it('raises nothing when time stands still or goes backwards', () => {
    expect(collectNew(6, 6, at)).toEqual([]);
    expect(collectNew(9, 2, at)).toEqual([]);
  });

  it('only looks at the newest events after a big jump', () => {
    expect(MAX_LOOKBACK).toBe(2);
    expect(collectNew(0, 21, at)).toEqual([{ seq: 20, ruleId: 'maiden' }]);
    expect(collectNew(0, 20, at)).toEqual([]); // event 20 is not played yet
    // events 3 and 4 are older than the lookback: only 4 (the newest two are 4 and 5) can raise
    expect(collectNew(0, 6, at)).toEqual([
      { seq: 4, ruleId: 'free-hit' },
      { seq: 4, ruleId: 'wide' },
    ]);
  });
});

describe('enqueue', () => {
  it('skips rules already queued or excluded, without mutating', () => {
    const queue = [{ seq: 1, ruleId: 'wide' }];
    const out = enqueue(
      queue,
      [
        { seq: 2, ruleId: 'wide' },
        { seq: 2, ruleId: 'bye' },
        { seq: 3, ruleId: 'lbw' },
      ],
      (id) => id === 'lbw',
    );
    expect(out).toEqual([
      { seq: 1, ruleId: 'wide' },
      { seq: 2, ruleId: 'bye' },
    ]);
    expect(queue).toHaveLength(1);
  });
});

describe('promote', () => {
  it('moves a tapped rule to the front', () => {
    const q = [
      { seq: 1, ruleId: 'a' },
      { seq: 2, ruleId: 'b' },
    ];
    expect(promote(q, { seq: 9, ruleId: 'b' })).toEqual([
      { seq: 9, ruleId: 'b' },
      { seq: 1, ruleId: 'a' },
    ]);
  });
});
