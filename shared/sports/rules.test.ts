import { describe, expect, it } from 'vitest';
import { askContextWithRule, getRule, getRulebook, lookupRule, RULE_LIMITS } from './rules.js';
import type { Lang, SportId } from './types.js';

const LANGS: readonly Lang[] = ['en', 'hinglish', 'hi', 'gu'];
const SPORTS: readonly SportId[] = ['cricket', 'football', 'kabaddi'];
const MIN_ENTRIES: Record<SportId, number> = { cricket: 15, football: 10, kabaddi: 8 };

const DEVANAGARI = /[ऀ-ॿ]/;
const GUJARATI = /[઀-૿]/;
const words = (s: string) => s.trim().split(/\s+/).length;
const sentences = (s: string) => s.split(/[.!?।]+(?:\s|$)/).filter((p) => p.trim().length > 0).length;

describe.each(SPORTS)('%s rulebook', (sport) => {
  const book = getRulebook(sport);

  it('has the agreed number of entries with unique ids', () => {
    expect(book.length).toBe(MIN_ENTRIES[sport]);
    expect(new Set(book.map((r) => r.id)).size).toBe(book.length);
  });

  it('has every field in all four languages, none empty', () => {
    for (const r of book) {
      for (const lang of LANGS) {
        for (const field of ['term', 'short', 'detail'] as const) {
          expect(r[field][lang].trim().length, `${r.id}.${field}.${lang}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('respects length caps', () => {
    for (const r of book) {
      for (const lang of LANGS) {
        expect(words(r.short[lang]), `${r.id}.short.${lang}`).toBeLessThanOrEqual(RULE_LIMITS.shortWords);
        expect(sentences(r.short[lang]), `${r.id}.short.${lang} sentences`).toBe(1);
        expect(sentences(r.detail[lang]), `${r.id}.detail.${lang}`).toBeLessThanOrEqual(
          RULE_LIMITS.detailSentences,
        );
        expect(words(r.term[lang]), `${r.id}.term.${lang}`).toBeLessThanOrEqual(RULE_LIMITS.termWords);
      }
    }
  });

  it('uses the right script per language', () => {
    for (const r of book) {
      for (const field of ['short', 'detail'] as const) {
        expect(DEVANAGARI.test(r[field].hi), `${r.id}.${field}.hi`).toBe(true);
        expect(GUJARATI.test(r[field].gu), `${r.id}.${field}.gu`).toBe(true);
        expect(DEVANAGARI.test(r[field].hinglish), `${r.id}.${field}.hinglish`).toBe(false);
        expect(GUJARATI.test(r[field].hinglish), `${r.id}.${field}.hinglish`).toBe(false);
        expect(DEVANAGARI.test(r[field].en) || GUJARATI.test(r[field].en)).toBe(false);
      }
    }
  });

  it('only relates to ids that exist in the same rulebook', () => {
    const ids = new Set(book.map((r) => r.id));
    for (const r of book) {
      for (const rel of r.related) expect(ids.has(rel), `${r.id} -> ${rel}`).toBe(true);
      expect(r.related).not.toContain(r.id);
    }
  });

  it('getRule finds each entry', () => {
    for (const r of book) expect(getRule(sport, r.id)).toBe(r);
    expect(getRule(sport, 'nope')).toBeNull();
  });
});

describe('lookupRule', () => {
  const cases: ReadonlyArray<readonly [string, SportId, string]> = [
    ['what is a free hit?', 'cricket', 'free-hit'],
    ["What's a no ball", 'cricket', 'no-ball'],
    ['free hit kya hota hai', 'cricket', 'free-hit'],
    ['LBW kya hai?', 'cricket', 'lbw'],
    ['फ्री हिट क्या होता है', 'cricket', 'free-hit'],
    ['वाइड क्या है?', 'cricket', 'wide'],
    ['free hit shu che', 'cricket', 'free-hit'],
    ['પાવરપ્લે શું છે', 'cricket', 'powerplay'],
    ['what is free hit bowled not out', 'cricket', 'free-hit-bowled-not-out'],
    ['what is offside?', 'football', 'offside'],
    ['what is a super tackle', 'kabaddi', 'super-tackle'],
    ['do or die raid kya hota hai', 'kabaddi', 'do-or-die-raid'],
  ];
  it.each(cases)('%s', (q, sport, id) => {
    expect(lookupRule(q, sport)?.id).toBe(id);
  });

  it('prefers the most specific term', () => {
    expect(lookupRule('what is a free hit bowled not out', 'cricket')?.id).toBe('free-hit-bowled-not-out');
    expect(lookupRule('what is a free hit', 'cricket')?.id).toBe('free-hit');
  });

  it('does not hijack match questions or unknown terms', () => {
    expect(lookupRule('how many wides has he bowled', 'cricket')).toBeNull();
    expect(lookupRule('who is batting now', 'cricket')).toBeNull();
    expect(lookupRule('what is the score', 'cricket')).toBeNull();
    expect(lookupRule('what is offside', 'cricket')).toBeNull(); // wrong sport's term
  });
});

describe('askContextWithRule', () => {
  const base = {
    window: { fromSeq: 0, toSeq: 4, fromClock: '0.1', toClock: '0.5' },
    items: [],
    highlights: [],
    numbers: [1, 2],
  };

  it('returns the base facts unchanged when no rule matched', () => {
    expect(askContextWithRule(base, null)).toBe(base);
  });

  it('adds term, short and detail as facts and allows the rule numbers', () => {
    const rule = getRule('cricket', 'powerplay');
    if (!rule) throw new Error('missing rule');
    const out = askContextWithRule(base, rule);
    expect(out).not.toBe(base);
    expect(base.items).toHaveLength(0); // immutable
    expect(out.items.map((f) => f.key)).toEqual(['ruleTerm', 'ruleShort', 'ruleDetail']);
    expect(out.items[1]?.label.hi).toBe(rule.short.hi);
    expect(out.numbers).toEqual(expect.arrayContaining([1, 2, 30]));
  });
});
