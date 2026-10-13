// In-memory token bucket per key (docs/SECURITY.md §2: 20 req/min + burst 5). Per-instance on
// serverless: production would use Upstash Redis or Vercel WAF rate limiting.

export interface RateLimiterOptions {
  readonly perMinute: number;
  readonly burst: number;
  readonly now?: () => number;
}

export interface RateDecision {
  readonly ok: boolean;
  readonly retryAfterSeconds: number;
}

interface Bucket {
  readonly tokens: number;
  readonly updatedAt: number;
}

const MAX_BUCKETS = 5000;

export function createRateLimiter({ perMinute, burst, now = Date.now }: RateLimiterOptions) {
  const capacity = Math.max(1, burst); // bucket size = burst; refills at the sustained per-minute rate
  const refillPerMs = perMinute / 60_000;
  const buckets = new Map<string, Bucket>();

  return {
    take(key: string): RateDecision {
      const t = now();
      const bucket = buckets.get(key) ?? { tokens: capacity, updatedAt: t };
      const tokens = Math.min(capacity, bucket.tokens + (t - bucket.updatedAt) * refillPerMs);
      if (buckets.size >= MAX_BUCKETS && !buckets.has(key)) {
        const oldest = buckets.keys().next().value;
        if (oldest !== undefined) buckets.delete(oldest);
      }
      if (tokens < 1) {
        buckets.set(key, { tokens, updatedAt: t });
        return { ok: false, retryAfterSeconds: Math.ceil((1 - tokens) / refillPerMs / 1000) };
      }
      buckets.set(key, { tokens: tokens - 1, updatedAt: t });
      return { ok: true, retryAfterSeconds: 0 };
    },
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;
