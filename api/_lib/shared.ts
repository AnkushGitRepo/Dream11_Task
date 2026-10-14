import { createRateLimiter, type RateLimiter } from './rateLimit.js';

// One token bucket for every AI endpoint (speak, learn, recap, ask) so a client cannot multiply its
// budget by spreading calls across routes. Per-instance on serverless (documented limitation,
// docs/SECURITY.md §2): production would use Upstash Redis or Vercel WAF rate limiting.

const DEFAULT_PER_MINUTE = 20;
const DEFAULT_BURST = 5;

const positive = (raw: string | undefined, fallback: number): number => {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

let limiter: RateLimiter | null = null;

export function sharedLimiter(env: NodeJS.ProcessEnv = process.env): RateLimiter {
  limiter ??= createRateLimiter({
    perMinute: positive(env.RATE_LIMIT_PER_MIN, DEFAULT_PER_MINUTE),
    burst: positive(env.RATE_LIMIT_BURST, DEFAULT_BURST),
  });
  return limiter;
}
