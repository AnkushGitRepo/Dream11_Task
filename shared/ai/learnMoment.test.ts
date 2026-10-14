import { describe, expect, it } from 'vitest';
import type { RuleEntry, TimelineEvent } from '../sports/types.js';
import { checkNumbers } from './guard.js';
import {
  allowedNumbers,
  buildMomentPrompt,
  composeSpeak,
  parseMomentReply,
  templateMoment,
} from './learnMoment.js';

const rule: RuleEntry = {
  id: 'free-hit',
  term: { en: 'Free hit', hinglish: 'Free hit', hi: 'फ्री हिट', gu: 'ફ્રી હિટ' },
  short: {
    en: 'The ball after a no-ball.',
    hinglish: 'No-ball ke baad ki ball.',
    hi: 'नो-बॉल के बाद की गेंद।',
    gu: 'નો-બોલ પછીનો બોલ.',
  },
  detail: { en: 'd', hinglish: 'd', hi: 'd', gu: 'd' },
  related: [],
};

const event = (data: Record<string, unknown> = {}): TimelineEvent => ({
  seq: 247,
  clock: '19.4',
  period: 2,
  kind: 'bye',
  tone: 'good',
  text: '3 byes off Nawaz',
  data,
});

const note = {
  en: 'Kohli was bowled on the free hit, so he was not out.',
  hinglish: 'Kohli free hit par bowled hue, isliye out nahi.',
  hi: 'कोहली फ्री हिट पर बोल्ड हुए, इसलिए आउट नहीं।',
  gu: 'કોહલી ફ્રી હિટ પર બોલ્ડ થયા, એટલે આઉટ નહીં.',
};

describe('allowedNumbers', () => {
  it('allows only numbers shown to the model, plus the clock parts and the event text', () => {
    const nums = allowedNumbers({ shown: 'Score 158/5', event: event() });
    expect(nums).toEqual(expect.arrayContaining([158, 5, 19.4, 19, 4, 3]));
    expect(nums).not.toContain(7);
  });
});

describe('templateMoment', () => {
  it('uses the curated note when present, in the fan language', () => {
    expect(templateMoment(event({ annotationNote: note }), 'hi').moment).toBe(note.hi);
    const h = templateMoment(event({ annotationNote: note }), 'hinglish');
    expect(h.moment).toBe(note.hinglish);
    expect(h.speak).toBe(note.hi); // Hinglish is voiced from the Devanagari rendering
  });

  it('falls back to a localised frame around the event text, with only engine numbers', () => {
    for (const lang of ['en', 'hinglish', 'hi', 'gu'] as const) {
      const t = templateMoment(event(), lang);
      expect(t.moment).toContain('3 byes off Nawaz');
      expect(t.moment).toContain('19.4');
      expect(checkNumbers(t.moment, allowedNumbers({ shown: '', event: event() })).ok).toBe(true);
    }
  });
});

describe('parseMomentReply', () => {
  it('reads plain and fenced JSON', () => {
    expect(parseMomentReply('{"moment":"A","speak":"B"}')).toEqual({ moment: 'A', speak: 'B' });
    expect(parseMomentReply('```json\n{"moment":"A","speak":"B"}\n```')).toEqual({ moment: 'A', speak: 'B' });
  });

  it('defaults speak to moment and rejects junk, empties and over-long text', () => {
    expect(parseMomentReply('{"moment":"Only"}')).toEqual({ moment: 'Only', speak: 'Only' });
    expect(parseMomentReply('not json')).toBeNull();
    expect(parseMomentReply('{"moment":"  "}')).toBeNull();
    expect(parseMomentReply(JSON.stringify({ moment: 'x'.repeat(400) }))).toBeNull();
  });
});

describe('buildMomentPrompt', () => {
  it('contains only server-side facts and the language instruction', () => {
    const p = buildMomentPrompt({
      rule,
      event: event({ annotationNote: note }),
      lang: 'hinglish',
      stateLines: ['Score 158/5'],
    });
    expect(p.system).toMatch(/one sentence/i);
    expect(p.system).toMatch(/never state a number/i);
    expect(p.user).toContain('3 byes off Nawaz');
    expect(p.user).toContain('19.4');
    expect(p.user).toContain('Score 158/5');
    expect(p.user).toContain(note.en);
    expect(p.system).toMatch(/Latin/);
  });
});

describe('composeSpeak', () => {
  it('voices the term, the rulebook rule and the moment; Hinglish uses the Devanagari rule text', () => {
    expect(composeSpeak(rule, 'en', 'Moment.')).toBe('Free hit. The ball after a no-ball. Moment.');
    expect(composeSpeak(rule, 'hinglish', 'क्षण।')).toBe('फ्री हिट। नो-बॉल के बाद की गेंद। क्षण।');
  });
});
