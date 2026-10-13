// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  askBodySchema,
  learnBodySchema,
  MAX_WINDOW_EVENTS,
  parseBody,
  recapBodySchema,
  speakBodySchema,
} from './schemas';

const MATCH = 'pak-ind-2022-t20wc-mcg';
const j = (v: unknown) => JSON.stringify(v);

describe('parseBody', () => {
  it('rejects invalid JSON and non-objects', () => {
    for (const raw of ['nope', '', 'null', '"x"', '[]', '42']) {
      expect(parseBody(raw, recapBodySchema).ok).toBe(false);
    }
  });
});

describe('recapBodySchema', () => {
  const ok = { matchId: MATCH, fromSeq: 10, toSeq: 20, lang: 'hinglish' };

  it('accepts a valid window and defaults seqBase to 0', () => {
    const r = parseBody(j(ok), recapBodySchema);
    expect(r).toEqual({ ok: true, data: { ...ok, seqBase: 0 } });
  });

  it('keeps an explicit seqBase', () => {
    const r = parseBody(j({ ...ok, seqBase: 229 }), recapBodySchema);
    expect(r.ok && r.data.seqBase).toBe(229);
  });

  it.each([
    ['toSeq before fromSeq', { toSeq: 5 }],
    ['negative seq', { fromSeq: -1 }],
    ['fractional seq', { toSeq: 20.5 }],
    ['string seq', { fromSeq: '10' }],
    ['unknown lang', { lang: 'fr' }],
    ['bad match id', { matchId: '../etc/passwd' }],
    ['upper-case match id', { matchId: 'PAK-IND' }],
    ['negative seqBase', { seqBase: -3 }],
    ['huge seq', { toSeq: 10_000_000 }],
  ])('rejects %s', (_n, patch) => {
    expect(parseBody(j({ ...ok, ...patch }), recapBodySchema).ok).toBe(false);
  });

  it('allows exactly the maximum window and rejects one more', () => {
    const exact = { ...ok, fromSeq: 0, toSeq: MAX_WINDOW_EVENTS - 1 };
    expect(parseBody(j(exact), recapBodySchema).ok).toBe(true);
    expect(parseBody(j({ ...exact, toSeq: MAX_WINDOW_EVENTS }), recapBodySchema).ok).toBe(false);
  });
});

describe('askBodySchema', () => {
  const ok = { matchId: MATCH, seq: 12, question: 'kitne runs chahiye?', lang: 'hinglish' };

  it('trims the question and strips control characters', () => {
    const r = parseBody(j({ ...ok, question: '  who\u0000 is\u0007 batting?\n ' }), askBodySchema);
    expect(r.ok && r.data.question).toBe('who is batting?');
  });

  it('accepts exactly 200 characters and rejects 201', () => {
    expect(parseBody(j({ ...ok, question: 'a'.repeat(200) }), askBodySchema).ok).toBe(true);
    expect(parseBody(j({ ...ok, question: 'a'.repeat(201) }), askBodySchema).ok).toBe(false);
  });

  it('rejects an empty or whitespace/control-only question', () => {
    for (const question of ['', '   ', '\u0000\u0001\n']) {
      expect(parseBody(j({ ...ok, question }), askBodySchema).ok).toBe(false);
    }
  });

  it('rejects non-string questions and bad seq, but allows -1 (nothing played yet)', () => {
    expect(parseBody(j({ ...ok, question: 5 }), askBodySchema).ok).toBe(false);
    expect(parseBody(j({ ...ok, seq: -2 }), askBodySchema).ok).toBe(false);
    expect(parseBody(j({ ...ok, seq: 1.5 }), askBodySchema).ok).toBe(false);
    expect(parseBody(j({ ...ok, seq: -1 }), askBodySchema).ok).toBe(true);
  });

  it('keeps Devanagari and Gujarati text intact', () => {
    const r = parseBody(j({ ...ok, question: 'कितने रन चाहिए? કેટલા રન જોઈએ?' }), askBodySchema);
    expect(r.ok && r.data.question).toBe('कितने रन चाहिए? કેટલા રન જોઈએ?');
  });
});

describe('learnBodySchema / speakBodySchema', () => {
  it('validates the learn body', () => {
    const ok = { matchId: MATCH, seq: 247, ruleId: 'free-hit', lang: 'en' };
    expect(parseBody(j(ok), learnBodySchema).ok).toBe(true);
    expect(parseBody(j({ ...ok, ruleId: 'FREE_HIT' }), learnBodySchema).ok).toBe(false);
    expect(parseBody(j({ ...ok, lang: 'xx' }), learnBodySchema).ok).toBe(false);
  });

  it('validates the speak body', () => {
    const ok = { kind: 'learn', id: 'abcdefgh12345678' };
    expect(parseBody(j(ok), speakBodySchema).ok).toBe(true);
    expect(parseBody(j({ ...ok, kind: 'text' }), speakBodySchema).ok).toBe(false);
    expect(parseBody(j({ ...ok, id: 'short' }), speakBodySchema).ok).toBe(false);
    expect(parseBody(j({ ...ok, id: 'has spaces and !' }), speakBodySchema).ok).toBe(false);
  });
});
