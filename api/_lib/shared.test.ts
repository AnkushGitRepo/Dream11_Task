// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

async function fresh() {
  vi.resetModules();
  return import('./shared.js');
}

describe('sharedLimiter', () => {
  it('is one instance for every route', async () => {
    const { sharedLimiter } = await fresh();
    expect(sharedLimiter({})).toBe(sharedLimiter({}));
  });

  it('defaults to a burst of 5 and honours RATE_LIMIT_BURST', async () => {
    const a = await fresh();
    const lim = a.sharedLimiter({});
    const ok = Array.from({ length: 6 }, () => lim.take('1.1.1.1').ok);
    expect(ok).toEqual([true, true, true, true, true, false]);
    const b = await fresh();
    const big = b.sharedLimiter({ RATE_LIMIT_BURST: '8' });
    const ok8 = Array.from({ length: 9 }, () => big.take('2.2.2.2').ok);
    expect(ok8.filter(Boolean)).toHaveLength(8);
  });

  it('ignores garbage values', async () => {
    const { sharedLimiter } = await fresh();
    const lim = sharedLimiter({ RATE_LIMIT_BURST: 'abc', RATE_LIMIT_PER_MIN: '-4' });
    expect(Array.from({ length: 5 }, () => lim.take('3.3.3.3').ok).every(Boolean)).toBe(true);
  });
});
