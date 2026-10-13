import { EventEmitter } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Fake request/response pair for handler contract tests (no sockets).

export interface Captured {
  status: number;
  headers: Record<string, string | number>;
  body: string;
}

export interface FakeReqOptions {
  readonly method?: string;
  readonly body?: string;
  readonly contentType?: string;
  readonly ip?: string;
}

export function makeReq(opts: FakeReqOptions): IncomingMessage {
  const emitter = new EventEmitter() as IncomingMessage & EventEmitter;
  Object.assign(emitter, {
    method: opts.method ?? 'POST',
    headers: {
      'content-type': opts.contentType ?? 'application/json',
      'x-forwarded-for': opts.ip ?? '3.3.3.3',
    },
    socket: { remoteAddress: '127.0.0.1' },
    destroy: () => undefined,
    pause: () => undefined,
  });
  queueMicrotask(() => {
    if (opts.body !== undefined) emitter.emit('data', Buffer.from(opts.body));
    emitter.emit('end');
  });
  return emitter;
}

export function makeRes() {
  const captured: Captured = { status: 0, headers: {}, body: '' };
  const res = {
    writeHead(status: number, headers: Record<string, string | number>) {
      captured.status = status;
      captured.headers = headers;
    },
    end(data?: string | Buffer) {
      captured.body = Buffer.from(data ?? '').toString('utf8');
    },
  } as unknown as ServerResponse;
  return { res, captured };
}

/** Runs a handler and returns status, headers and the parsed JSON body. */
export async function callHandler<D>(
  handler: (req: IncomingMessage, res: ServerResponse, deps: D) => Promise<void>,
  deps: D,
  opts: FakeReqOptions,
) {
  const { res, captured } = makeRes();
  await handler(makeReq(opts), res, deps);
  const json = captured.body ? (JSON.parse(captured.body) as Record<string, unknown>) : {};
  return { ...captured, json };
}
