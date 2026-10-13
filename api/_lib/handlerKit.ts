import type { IncomingMessage, ServerResponse } from 'node:http';
import type { z } from 'zod';
import { BodyTooLargeError, clientIp, isJsonRequest, readBody, sendError } from './http';
import type { RateLimiter } from './rateLimit';
import { parseBody } from './schemas';

// The request prologue every POST endpoint shares (docs/SECURITY.md §2): method, content type,
// rate limit, body size cap, zod validation, and one log line per request. On any failure it has
// already answered and returns null.

export type RequestLog = (status: number, source: string) => void;

export interface GuardOptions<S extends z.ZodType> {
  readonly route: string;
  readonly maxBytes: number;
  readonly limiter: RateLimiter;
  readonly schema: S;
  /** Generic 400 text, e.g. 'Expected { matchId, seq, lang }.' */
  readonly expects: string;
}

export interface GuardedRequest<T> {
  readonly data: T;
  readonly log: RequestLog;
}

export async function guardRequest<S extends z.ZodType>(
  req: IncomingMessage,
  res: ServerResponse,
  opts: GuardOptions<S>,
): Promise<GuardedRequest<z.infer<S>> | null> {
  const started = Date.now();
  // Method, route, status, latency, source only: never prompts, questions, keys or model output.
  const log: RequestLog = (status, source) =>
    console.info(`[${opts.route}] ${req.method} ${status} ${Date.now() - started}ms ${source}`);

  if (req.method !== 'POST') {
    sendError(res, 'METHOD_NOT_ALLOWED', 'Use POST.', { Allow: 'POST' });
    log(405, 'rejected');
    return null;
  }
  if (!isJsonRequest(req)) {
    sendError(res, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.');
    log(415, 'rejected');
    return null;
  }
  const limit = opts.limiter.take(clientIp(req));
  if (!limit.ok) {
    sendError(res, 'RATE_LIMITED', 'Too many requests. Try again shortly.', {
      'Retry-After': String(limit.retryAfterSeconds),
    });
    log(429, 'rate-limited');
    return null;
  }

  let raw: string;
  try {
    raw = await readBody(req, opts.maxBytes);
  } catch (error) {
    const tooLarge = error instanceof BodyTooLargeError;
    sendError(
      res,
      tooLarge ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST',
      tooLarge ? 'Body too large.' : 'Bad request.',
    );
    log(tooLarge ? 413 : 400, 'rejected');
    return null;
  }

  const parsed = parseBody(raw, opts.schema);
  if (!parsed.ok) {
    sendError(res, 'BAD_REQUEST', opts.expects);
    log(400, 'rejected');
    return null;
  }
  return { data: parsed.data, log };
}
