import { describe, expect, it } from 'vitest';
import { createDailyBudget } from './dailyBudget.js';

const DAY = 86_400_000;

describe('createDailyBudget', () => {
  it('allows up to the limit then refuses with a Retry-After to midnight UTC', () => {
    let now = 5 * DAY + 3_600_000; // 01:00 UTC
    const budget = createDailyBudget({ limit: 2, now: () => now });
    expect(budget.take().ok).toBe(true);
    expect(budget.take().ok).toBe(true);
    const refused = budget.take();
    expect(refused.ok).toBe(false);
    expect(refused.retryAfterSeconds).toBe(23 * 3600);
    now += 1000;
    expect(budget.take().ok).toBe(false);
  });

  it('resets on the next UTC day', () => {
    let now = 5 * DAY;
    const budget = createDailyBudget({ limit: 1, now: () => now });
    expect(budget.take().ok).toBe(true);
    expect(budget.take().ok).toBe(false);
    now += DAY;
    expect(budget.take().ok).toBe(true);
  });
});
