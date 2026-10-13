// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './rateLimit';
import { LruCache } from './cache';

describe('LruCache', () => {
  it('evicts the least recently used entry', () => {
    const cache = new LruCache<number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a');
    cache.set('c', 3);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.size).toBe(2);
  });
});

describe('createRateLimiter', () => {
  it('allows a burst, then refills over time', () => {
    let now = 0;
    const limiter = createRateLimiter({ perMinute: 60, burst: 2, now: () => now });
    const results = [1, 2, 3, 4].map(() => limiter.take('ip').ok);
    expect(results).toEqual([true, true, false, false]); // bucket size = burst
    expect(limiter.take('ip').ok).toBe(false);
    now += 1000; // 60/min = 1 token per second
    expect(limiter.take('ip').ok).toBe(true);
  });

  it('keeps buckets separate per key', () => {
    const limiter = createRateLimiter({ perMinute: 1, burst: 0, now: () => 0 });
    expect(limiter.take('a').ok).toBe(true);
    expect(limiter.take('a').ok).toBe(false);
    expect(limiter.take('b').ok).toBe(true);
  });
});
