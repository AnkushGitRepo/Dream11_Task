import { describe, expect, it } from 'vitest';
import { extractJsonObject, readText } from './json.js';

describe('extractJsonObject', () => {
  it('reads plain, fenced and surrounded JSON', () => {
    expect(extractJsonObject('{"a":1}')).toEqual({ a: 1 });
    expect(extractJsonObject('```json\n{"a":"x"}\n```')).toEqual({ a: 'x' });
    expect(extractJsonObject('Sure! {"a":2} hope that helps')).toEqual({ a: 2 });
  });

  it('rejects non-objects and broken JSON', () => {
    for (const bad of ['', 'no json', '[1,2]', '{"a":', '{a:1}']) {
      expect(extractJsonObject(bad)).toBeNull();
    }
  });
});

describe('readText', () => {
  it('trims, and enforces presence, type and cap', () => {
    expect(readText({ a: '  hi ' }, 'a', 10)).toBe('hi');
    expect(readText({ a: '   ' }, 'a', 10)).toBeNull();
    expect(readText({ a: 5 }, 'a', 10)).toBeNull();
    expect(readText({}, 'a', 10)).toBeNull();
    expect(readText({ a: 'x'.repeat(11) }, 'a', 10)).toBeNull();
  });
});
