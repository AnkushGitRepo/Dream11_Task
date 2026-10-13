import type { IncomingMessage, ServerResponse } from 'node:http';

// Shared request/response helpers (docs/SECURITY.md §2): generic error envelope, no stack traces,
// no provider error bodies, same-origin only (no CORS headers).

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'UNAVAILABLE'
  | 'INTERNAL';

const ERROR_STATUS: Readonly<Record<ErrorCode, number>> = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  UNSUPPORTED_MEDIA_TYPE: 415,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  UNAVAILABLE: 503,
  INTERNAL: 502,
};

export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(payload);
}

export function sendError(
  res: ServerResponse,
  code: ErrorCode,
  message: string,
  headers: Record<string, string> = {},
) {
  sendJson(res, ERROR_STATUS[code], { code, message }, headers);
}

export class BodyTooLargeError extends Error {}

/** Reads the body up to `maxBytes`; rejects with BodyTooLargeError as soon as the cap is exceeded. */
export function readBody(req: IncomingMessage, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new BodyTooLargeError());
        req.pause(); // stop buffering; the 413 below closes the connection (destroying early would reset it)
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export function clientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || req.socket.remoteAddress || 'unknown';
}

export function isJsonRequest(req: IncomingMessage): boolean {
  return (req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json');
}
