import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  MAX_SPEAK_CHARS,
  SPEAK_TOKEN_TTL_MS,
  mintSpeakToken,
  signSpeakToken,
  speakSecret,
  verifySpeakToken,
} from './speakToken.js';

const SECRET = 'test-secret-0123456789abcdef';
const NOW = 1_800_000_000_000;

/** A correctly signed token for an arbitrary payload (bypasses signSpeakToken's own clamping). */
function signRaw(data: object, secret = SECRET): string {
  const body = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}

describe('speak tokens', () => {
  it('round-trips lang and text', () => {
    const token = signSpeakToken({ lang: 'hinglish', text: 'Kohli ne chhakka maara' }, SECRET, NOW);
    expect(verifySpeakToken(token, SECRET, NOW + 1000)).toEqual({
      lang: 'hinglish',
      text: 'Kohli ne chhakka maara',
    });
  });

  it('rejects a tampered payload', () => {
    const sig = signSpeakToken({ lang: 'en', text: 'hello' }, SECRET, NOW).split('.')[1];
    const forged = Buffer.from(JSON.stringify({ lang: 'en', text: 'free tts', exp: NOW + 5000 })).toString(
      'base64url',
    );
    expect(verifySpeakToken(`${forged}.${sig}`, SECRET, NOW)).toBeNull();
  });

  it('rejects a tampered signature and a different secret', () => {
    const token = signSpeakToken({ lang: 'en', text: 'hello' }, SECRET, NOW);
    expect(verifySpeakToken(`${token.slice(0, -2)}AA`, SECRET, NOW)).toBeNull();
    expect(verifySpeakToken(token, 'another-secret-0123456789', NOW)).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = signSpeakToken({ lang: 'en', text: 'hello' }, SECRET, NOW);
    expect(verifySpeakToken(token, SECRET, NOW + SPEAK_TOKEN_TTL_MS - 1)).not.toBeNull();
    expect(verifySpeakToken(token, SECRET, NOW + SPEAK_TOKEN_TTL_MS + 1)).toBeNull();
  });

  it('rejects unsigned and malformed input', () => {
    const unsigned = Buffer.from(JSON.stringify({ lang: 'en', text: 'x', exp: NOW + 5000 })).toString(
      'base64url',
    );
    for (const bad of [unsigned, `${unsigned}.`, '', 'a.b.c', 42, null, undefined, { text: 'x' }]) {
      expect(verifySpeakToken(bad, SECRET, NOW)).toBeNull();
    }
  });

  it('rejects everything when no secret is configured', () => {
    const token = signSpeakToken({ lang: 'en', text: 'hello' }, SECRET, NOW);
    expect(verifySpeakToken(token, undefined, NOW)).toBeNull();
  });

  it('rejects a genuinely signed token with an unknown language or oversized text', () => {
    const exp = NOW + 5000;
    expect(verifySpeakToken(signRaw({ lang: 'fr', text: 'bonjour', exp }), SECRET, NOW)).toBeNull();
    expect(
      verifySpeakToken(signRaw({ lang: 'en', text: 'x'.repeat(MAX_SPEAK_CHARS + 1), exp }), SECRET, NOW),
    ).toBeNull();
    expect(verifySpeakToken(signRaw({ lang: 'en', text: '  ', exp }), SECRET, NOW)).toBeNull();
    expect(verifySpeakToken(signRaw({ lang: 'en', text: 'ok' }), SECRET, NOW)).toBeNull();
  });

  it('clamps over-long text so the signed token always verifies', () => {
    const token = signSpeakToken({ lang: 'en', text: 'Ball by ball. '.repeat(200) }, SECRET, NOW);
    const out = verifySpeakToken(token, SECRET, NOW);
    expect(out).not.toBeNull();
    expect(out?.text.length).toBeLessThanOrEqual(MAX_SPEAK_CHARS);
  });

  it('mints nothing without a secret or text', () => {
    expect(mintSpeakToken('hello', 'en', undefined)).toBeUndefined();
    expect(mintSpeakToken('   ', 'en', SECRET)).toBeUndefined();
    expect(mintSpeakToken('hello', 'en', SECRET)).toMatch(/^[\w-]+\.[\w-]+$/);
  });

  it('requires a configured secret in production only', () => {
    expect(speakSecret({ NODE_ENV: 'production' })).toBeUndefined();
    expect(speakSecret({ NODE_ENV: 'production', SPEAK_SIGNING_SECRET: 'short' })).toBeUndefined();
    expect(speakSecret({ NODE_ENV: 'production', SPEAK_SIGNING_SECRET: SECRET })).toBe(SECRET);
    expect(speakSecret({ NODE_ENV: 'test' })).toHaveLength(64);
  });
});
