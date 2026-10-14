import { z } from 'zod';
import { isMatchId } from './matchStore.js';

// Request schemas for every POST endpoint (docs/SECURITY.md §2). Shape and bounds live here;
// "does this match exist / is the seq inside its timeline" is answered by the handler once it
// has loaded the timeline (404 / 400).

export const MAX_WINDOW_EVENTS = 120;
const MAX_SEQ = 100_000;
export const MAX_QUESTION_CHARS = 200;

const LANGS = ['en', 'hinglish', 'hi', 'gu'] as const;
// eslint-disable-next-line no-control-regex -- stripping control characters is the point
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

const langSchema = z.enum(LANGS);
const matchIdSchema = z.string().refine(isMatchId, { message: 'invalid match id' });
const seqSchema = z.number().int().min(0).max(MAX_SEQ);
/** Real timeline seq of the client's seq 0 (the client replays a mid-match window of the match). */
const seqBaseSchema = seqSchema.default(0);

export const recapBodySchema = z
  .object({
    matchId: matchIdSchema,
    fromSeq: seqSchema,
    toSeq: seqSchema,
    seqBase: seqBaseSchema,
    lang: langSchema,
  })
  .refine((v) => v.toSeq >= v.fromSeq, { message: 'toSeq before fromSeq' })
  .refine((v) => v.toSeq - v.fromSeq + 1 <= MAX_WINDOW_EVENTS, { message: 'window too large' });

export const askBodySchema = z.object({
  matchId: matchIdSchema,
  /** Latest played event; -1 = nothing played yet (the handler resolves it with seqBase). */
  seq: z.number().int().min(-1).max(MAX_SEQ),
  seqBase: seqBaseSchema,
  lang: langSchema,
  question: z
    .string()
    .transform((s) => s.replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim())
    .pipe(z.string().min(1).max(MAX_QUESTION_CHARS)),
});

export const learnBodySchema = z.object({
  matchId: matchIdSchema,
  seq: seqSchema,
  ruleId: z.string().regex(/^[a-z0-9][a-z0-9-]{1,39}$/),
  lang: langSchema,
});

/** The signed token from a recap / ask / learn answer (see speakToken.ts); verified by the handler. */
export const speakBodySchema = z.object({
  token: z.string().min(10).max(7000),
});

export type RecapBody = z.infer<typeof recapBodySchema>;
export type AskBody = z.infer<typeof askBodySchema>;
export type LearnBody = z.infer<typeof learnBodySchema>;
export type SpeakBody = z.infer<typeof speakBodySchema>;

export type ParseResult<T> = { readonly ok: true; readonly data: T } | { readonly ok: false };

/** JSON.parse + schema in one step. Never throws; the caller answers 400 with a generic message. */
export function parseBody<S extends z.ZodType>(raw: string, schema: S): ParseResult<z.infer<S>> {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false };
  }
  const parsed = schema.safeParse(value);
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false };
}
