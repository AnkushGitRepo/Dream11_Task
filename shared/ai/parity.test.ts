import { describe, expect, it } from 'vitest';
import { numbersMissingFromSpeak, spokenForm } from './parity.js';

describe('spokenForm', () => {
  it('drops the .0 of a clock and spells a score with its joiner', () => {
    expect(spokenForm('Score 112/4 after 17.0 overs', 'en')).toBe('Score 112 for 4 after 17 overs');
    expect(spokenForm('स्कोर 112/4, 17.0 ओवर', 'hinglish')).toBe('स्कोर 112 पर 4, 17 ओवर');
    expect(spokenForm('સ્કોર 112/4', 'gu')).toBe('સ્કોર 112 પર 4');
  });

  it('leaves real fractions of an over and plain text alone', () => {
    expect(spokenForm('19.4 overs, 3 byes', 'en')).toBe('19.4 overs, 3 byes');
  });
});

describe('numbersMissingFromSpeak', () => {
  it('reports the prod bug: the spoken line lost 17 overs and the target', () => {
    const display = 'Score 17.0 overs mein 112 par 4 wickets hai. Target 160 runs ka hai.';
    expect(numbersMissingFromSpeak(display, 'स्कोर 112 पर 4 है।')).toEqual([17, 160]);
  });

  it('is satisfied by the spoken form, in any digit script', () => {
    const display = 'Score 17.0 overs mein 112 par 4 wickets hai. Target 160 runs ka hai.';
    expect(
      numbersMissingFromSpeak(display, 'स्कोर 17 ओवर में 112 पर 4 विकेट है। टारगेट 160 रन का है।'),
    ).toEqual([]);
    expect(numbersMissingFromSpeak('112/4', '११२ पर ४')).toEqual([]);
  });
});
