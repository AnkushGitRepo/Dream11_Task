// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { numbersMissingFromSpeak } from './parity.js';
import { cricketAdapter } from '../sports/cricket/adapter.js';
import { askContextWithRule, getRule } from '../sports/rules.js';
import type { Facts, Lang, MatchTimeline } from '../sports/types.js';
import { checkNumbers, findBanned } from './guard.js';
import { allowedFromFacts } from './prompts.js';
import { askTemplate, detectIntent, recapTemplate } from './templates.js';

const load = (id: string) =>
  JSON.parse(
    readFileSync(new URL(`../../data/matches/${id}.json`, import.meta.url), 'utf8'),
  ) as MatchTimeline;
const timelines = [load('pak-ind-2022-t20wc-mcg'), load('ind-sa-2024-t20wc-final')];
const PAK_IND = timelines.find((t) => t.meta.id === 'pak-ind-2022-t20wc-mcg') as MatchTimeline;

const LANGS: readonly Lang[] = ['en', 'hinglish', 'hi', 'gu'];
const DEVANAGARI = /[ऀ-ॿ]/;
const GUJARATI = /[઀-૿]/;
const LATIN_WORD = /[A-Za-z]{3,}/;
const SYMBOLS = /[+×/%→()]|\b(?:RRR|CRR|wkts?)\b/;

/** Windows of 6 events every 9 balls, so wickets, boundaries and quiet overs all show up. */
function windows(tl: MatchTimeline): Array<readonly [number, number]> {
  const out: Array<readonly [number, number]> = [];
  for (let from = 0; from + 5 < tl.events.length; from += 9) out.push([from, from + 5]);
  return out;
}

describe('recapTemplate over every real window', () => {
  for (const tl of timelines) {
    for (const lang of LANGS) {
      it(`${tl.meta.id} / ${lang}: only engine numbers, no betting words, spoken style`, () => {
        let n = 0;
        for (const [from, to] of windows(tl)) {
          const facts = cricketAdapter.summarize(tl, from, to);
          const allowed = allowedFromFacts(facts);
          const t = recapTemplate(facts, lang);
          for (const part of [t.lead, t.body, t.speak]) {
            expect(part.trim().length, `${from}-${to}`).toBeGreaterThan(0);
            expect(checkNumbers(part, allowed), `${lang} ${from}-${to}: ${part}`).toEqual({
              ok: true,
              offending: [],
            });
            expect(findBanned(part)).toEqual([]);
          }
          expect(t.speak, `${lang} ${from}-${to}`).not.toMatch(SYMBOLS);
          n += 1;
        }
        expect(n).toBeGreaterThan(20);
      });
    }
  }
});

describe('recapTemplate wording', () => {
  const tl = PAK_IND;
  const wicketWindow = cricketAdapter.summarize(tl, 244, 248); // 19.3 .. 19.5 incl. a stumping
  const find = (key: string, f: Facts) => f.items.find((i) => i.key === key)?.value;

  it('is deterministic', () => {
    for (const lang of LANGS) {
      expect(recapTemplate(wicketWindow, lang)).toEqual(recapTemplate(wicketWindow, lang));
    }
  });

  it('leads with the wicket when one fell, using the counts from the facts', () => {
    expect(find('wkts', wicketWindow)).toBeGreaterThan(0);
    const en = recapTemplate(wicketWindow, 'en');
    expect(en.lead).toMatch(/wicket/);
    expect(en.lead).toContain(`${find('runs', wicketWindow)} run`);
  });

  it('uses the right script per language, and Devanagari for Hinglish speech', () => {
    const f = cricketAdapter.summarize(tl, 229, 240);
    const hing = recapTemplate(f, 'hinglish');
    expect(DEVANAGARI.test(hing.lead + hing.body)).toBe(false);
    expect(DEVANAGARI.test(hing.speak)).toBe(true);
    expect(DEVANAGARI.test(recapTemplate(f, 'hi').lead)).toBe(true);
    expect(GUJARATI.test(recapTemplate(f, 'gu').lead)).toBe(true);
    expect(DEVANAGARI.test(recapTemplate(f, 'en').speak)).toBe(false);
  });

  it('speaks "144 for 5" style scores without a slash', () => {
    const en = recapTemplate(cricketAdapter.summarize(tl, 229, 240), 'en');
    expect(en.speak).toMatch(/The score is \d+ for \d+ after/);
    expect(en.body).toMatch(/Score \d+\/\d+ after/);
  });

  it('copes with an empty fact set', () => {
    const empty: Facts = {
      window: { fromSeq: 0, toSeq: 0, fromClock: '', toClock: '' },
      items: [],
      highlights: [],
      numbers: [],
    };
    for (const lang of LANGS) {
      const t = recapTemplate(empty, lang);
      expect(t.lead.length).toBeGreaterThan(0);
      expect(LATIN_WORD.test('')).toBe(false);
    }
  });
});

describe('askTemplate', () => {
  const tl = PAK_IND;
  const facts = cricketAdapter.askContext(tl, 240); // 18.5, India need 22 off 7

  it.each([
    ['how many runs do they need?', 'need'],
    ['kitne run chahiye', 'need'],
    ['कितने रन चाहिए', 'need'],
    ['કેટલા રન જોઈએ', 'need'],
    ['who is bowling', 'bowler'],
    ['who is batting', 'batting'],
    ['what is the score', 'score'],
    ['will it rain', null],
  ])('intent for "%s"', (q, intent) => {
    expect(detectIntent(q)).toBe(intent);
  });

  it.each(LANGS)('%s: need answer reads engine numbers only and is spoken without symbols', (lang) => {
    const a = askTemplate('how many runs are needed', facts, lang);
    expect(a.source).toBe('template');
    const allowed = allowedFromFacts(facts);
    expect(checkNumbers(a.answer, allowed).ok).toBe(true);
    expect(checkNumbers(a.speak, allowed).ok).toBe(true);
    expect(a.speak).not.toMatch(SYMBOLS);
    expect(a.answer).toContain('22');
    expect(a.speak).toContain('22');
    if (lang === 'hinglish') expect(DEVANAGARI.test(a.speak)).toBe(true);
  });

  it('reads out the batters and bowler in plain words', () => {
    const bat = askTemplate('who is batting', facts, 'en');
    expect(bat.speak).toMatch(/Kohli is on 68 off 49 balls/);
    expect(bat.speak).toMatch(/Pandya is on 40 off 36 balls/);
    expect(bat.speak).not.toMatch(SYMBOLS);
    const bowl = askTemplate('bowler figures', facts, 'en');
    expect(bowl.speak).toMatch(/Rauf has bowled 3\.5 overs, with 0 maidens, 30 runs and 2 wickets/);
  });

  it('is honest when nothing in the facts answers it', () => {
    for (const lang of LANGS) {
      const a = askTemplate('who will win the toss next year', facts, lang);
      expect(a.source).toBe('unknown');
      expect(a.answer.length).toBeGreaterThan(10);
      expect(findBanned(a.answer + a.speak)).toEqual([]);
    }
  });

  it('answers a rule question with the rulebook text verbatim', () => {
    const rule = getRule('cricket', 'free-hit');
    if (!rule) throw new Error('missing rule');
    const withRule = askContextWithRule(facts, rule);
    for (const lang of LANGS) {
      const a = askTemplate('what is a free hit', withRule, lang);
      expect(a.answer).toBe(`${rule.term[lang]}: ${rule.short[lang]} ${rule.detail[lang]}`);
      const spoken = lang === 'hinglish' ? 'hi' : lang;
      expect(a.speak).toBe(`${rule.term[spoken]}: ${rule.short[spoken]} ${rule.detail[spoken]}`);
    }
  });

  it('every number in every template answer over many seqs is an engine number', () => {
    let checked = 0;
    for (const tlx of timelines) {
      for (let seq = 5; seq < tlx.events.length; seq += 17) {
        const f = cricketAdapter.askContext(tlx, seq);
        const allowed = allowedFromFacts(f);
        for (const q of ['need', 'who is batting', 'bowler', 'score']) {
          for (const lang of LANGS) {
            const a = askTemplate(q, f, lang);
            expect(checkNumbers(a.answer, allowed).ok, `${seq} ${q} ${lang}: ${a.answer}`).toBe(true);
            expect(checkNumbers(a.speak, allowed).ok, `${seq} ${q} ${lang}: ${a.speak}`).toBe(true);
            // an answer is voiced in full: nothing shown may be missing from what is spoken
            expect(numbersMissingFromSpeak(a.answer, a.speak), `${seq} ${q} ${lang}: ${a.answer}`).toEqual([]);
            checked += 1;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('ends display text with the full stop of its own script', () => {
    expect(askTemplate('kitne run chahiye', facts, 'hinglish').answer).toMatch(/\.$/);
    expect(askTemplate('कितने रन चाहिए', facts, 'hi').answer).toMatch(/।$/);
    expect(askTemplate('how many runs are needed', facts, 'en').answer).toMatch(/\.$/);
    expect(askTemplate('kitne run chahiye', facts, 'hinglish').speak).toMatch(/।$/);
  });
});
