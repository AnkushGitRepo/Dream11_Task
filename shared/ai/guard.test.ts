import { describe, expect, it } from 'vitest';
import { checkNumbers, extractNumbers, findBanned } from './guard.js';

describe('extractNumbers', () => {
  it('reads ASCII, Devanagari and Gujarati digits', () => {
    expect(extractNumbers('159/8 in 19.4 overs')).toEqual([159, 8, 19.4]);
    expect(extractNumbers('१५९ रन, ८ विकेट, १९.४ ओवर')).toEqual([159, 8, 19.4]);
    expect(extractNumbers('૧૫૯ રન, ૮ વિકેટ')).toEqual([159, 8]);
  });

  it('reads ordinals and ignores a sentence-ending full stop', () => {
    expect(extractNumbers('In the 19th over he scored 6.')).toEqual([19, 6]);
  });

  it('reads English number words', () => {
    expect(extractNumbers('three byes and a four, then twenty runs')).toEqual([3, 4, 20]);
  });

  it('does not treat the T20 format name as a number', () => {
    expect(extractNumbers('a T20 match')).toEqual([]);
  });

  it('returns nothing for text without numbers', () => {
    expect(extractNumbers('Kohli was bowled but it was a free hit.')).toEqual([]);
  });
});

describe('checkNumbers', () => {
  const allowed = [3, 6, 19.4, 19, 4];

  it('accepts text whose numbers are all allowed', () => {
    expect(checkNumbers('Bowled at 19.4, so 3 byes were run.', allowed)).toEqual({ ok: true, offending: [] });
  });

  it('flags an invented number', () => {
    const r = checkNumbers('He was bowled and they ran 5 byes.', allowed);
    expect(r.ok).toBe(false);
    expect(r.offending).toEqual(['5']);
  });

  it('flags invented numbers in other scripts and as words', () => {
    expect(checkNumbers('उन्होंने ७ रन दौड़े', allowed).ok).toBe(false);
    expect(checkNumbers('ત્રણ બાય અને ૯ રન', [3]).offending).toEqual(['9']);
    expect(checkNumbers('they ran five byes', allowed).offending).toEqual(['5']);
  });

  it('passes a digit-free sentence', () => {
    expect(checkNumbers('A free hit cannot get you out bowled.', []).ok).toBe(true);
  });

  it('treats a decimal as different from its integer part', () => {
    expect(checkNumbers('19.5 overs', [19]).ok).toBe(false);
  });
});

describe('findBanned', () => {
  it.each([
    'You can bet on this one.',
    'The odds are shifting.',
    'India will win from here.',
    'This is going to win them the game.',
    'My prediction: a close finish.',
    'India favourites now.',
    'Ab satta market mein jeet jayega India.',
    'इंडिया जीतेगा यह मैच।',
    'આ મેચમાં ભારત જીતશે.',
  ])('flags %s', (text) => {
    expect(findBanned(text).length).toBeGreaterThan(0);
  });

  it.each([
    'Kohli hit a six and India need 22 off 7.',
    'The batting side took the win at the last ball.',
    'Karthik was stumped, 144/5 at 19.1.',
    'कोहली ने छक्का मारा और 22 रन चाहिए।',
    'કોહલીએ છગ્ગો માર્યો.',
    'The bowler beat the bat twice.',
  ])('allows %s', (text) => {
    expect(findBanned(text)).toEqual([]);
  });
});
