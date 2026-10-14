// A hard daily ceiling on paid calls (voice transcription), on top of the per-IP token bucket.
// Counts per UTC day, in memory: per-instance on serverless, so the real ceiling is
// limit x warm instances. Documented limitation (docs/SECURITY.md §2); a shared store would fix it.

export interface DailyBudgetOptions {
  readonly limit: number;
  readonly now?: () => number;
}

export interface BudgetDecision {
  readonly ok: boolean;
  readonly retryAfterSeconds: number;
}

export interface DailyBudget {
  take(): BudgetDecision;
}

const DAY_MS = 86_400_000;

export function createDailyBudget({ limit, now = Date.now }: DailyBudgetOptions): DailyBudget {
  let day = Math.floor(now() / DAY_MS);
  let used = 0;
  return {
    take(): BudgetDecision {
      const t = now();
      const today = Math.floor(t / DAY_MS);
      if (today !== day) {
        day = today;
        used = 0;
      }
      if (used >= limit) {
        return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil(((day + 1) * DAY_MS - t) / 1000)) };
      }
      used += 1;
      return { ok: true, retryAfterSeconds: 0 };
    },
  };
}
