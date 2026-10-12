import { describe, expect, it } from 'vitest';
import { pickVoice } from './voices';

const v = (lang: string, name = lang) => ({ lang, name });
const VOICES = [v('en-US'), v('en-GB'), v('hi-IN'), v('en-IN'), v('de-DE')];

describe('pickVoice', () => {
  it('hinglish uses only en-IN', () => {
    expect(pickVoice('hinglish', VOICES)?.lang).toBe('en-IN');
    expect(pickVoice('hinglish', [v('en-US'), v('en-GB')])).toBeNull();
  });

  it('hi and gu require their own voice, never a fallback', () => {
    expect(pickVoice('hi', VOICES)?.lang).toBe('hi-IN');
    expect(pickVoice('gu', VOICES)).toBeNull();
    expect(pickVoice('gu', [...VOICES, v('gu_IN')])?.lang).toBe('gu_IN');
  });

  it('en prefers en-IN, then any en-*', () => {
    expect(pickVoice('en', VOICES)?.lang).toBe('en-IN');
    expect(pickVoice('en', [v('de-DE'), v('en-GB')])?.lang).toBe('en-GB');
    expect(pickVoice('en', [v('de-DE'), v('hi-IN')])).toBeNull();
  });

  it('returns null for no voices', () => {
    expect(pickVoice('en', [])).toBeNull();
  });
});
