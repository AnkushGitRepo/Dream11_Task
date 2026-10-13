import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Fact } from '@shared/sports/types';
import { mockAsk } from './mockApi';

const fact = (key: string, value: number | string, en: string, hinglish = en): Fact => ({
  key,
  value,
  label: { en, hinglish, hi: en, gu: en },
});
const FACTS = [
  fact('score', '144/4', 'Score 144/4'),
  fact('overs', '19.0', 'Overs 19.0'),
  fact('need', 16, 'Need 16 off 6 balls', '6 balls mein 16 runs chahiye'),
  fact('rrr', 16, 'RRR 16.00'),
  fact('striker', 'Kohli 74 (50)', 'Kohli 74 (50)'),
  fact('nonStriker', 'Pandya 40 (36)', 'Pandya 40 (36)'),
  fact('bowler', 'Nawaz 3-0-29-0', 'Bowler: Nawaz 3-0-29-0'),
];

async function ask(question: string, lang: 'en' | 'hinglish' = 'en', facts: Fact[] = FACTS) {
  const p = mockAsk({ matchId: 'm', seq: 3, question, lang, facts });
  const settled = p.then(
    (v) => v,
    (e: unknown) => e,
  );
  await vi.advanceTimersByTimeAsync(1300);
  return settled;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState(null, '', '/');
});

describe('mockAsk', () => {
  it('answers the chase question from facts only', async () => {
    expect(await ask('How many runs are needed?')).toEqual({
      id: expect.stringMatching(/^[A-Za-z0-9_-]{8,64}$/) as string,
      answer: 'Need 16 off 6 balls · RRR 16.00',
      source: 'template',
    });
  });

  it('understands Hinglish keywords and answers in that language', async () => {
    const res = await ask('Kitne runs chahiye?', 'hinglish');
    expect(res).toMatchObject({ source: 'template' });
    expect((res as { answer: string }).answer).toContain('6 balls mein 16 runs chahiye');
  });

  it('answers score, batting and bowler intents', async () => {
    expect(await ask("What's the score?")).toMatchObject({ answer: 'Score 144/4 · Overs 19.0' });
    expect(await ask('Top scorer kaun?')).toMatchObject({ answer: 'Kohli 74 (50) · Pandya 40 (36)' });
    expect(await ask('How is the bowler doing?')).toMatchObject({ answer: 'Bowler: Nawaz 3-0-29-0' });
  });

  it('says it does not know instead of inventing', async () => {
    expect(await ask('Last wicket kaise gira?', 'hinglish')).toMatchObject({
      source: 'unknown',
      answer: expect.stringContaining('nahi hai') as string,
    });
  });

  it('is unknown when the needed facts are missing', async () => {
    expect(await ask('How many runs are needed?', 'en', [])).toMatchObject({ source: 'unknown' });
  });

  it('simulates failures via ?ask=', async () => {
    window.history.replaceState(null, '', '/?ask=error');
    expect(await ask('score')).toBeInstanceOf(Error);
    window.history.replaceState(null, '', '/?ask=ratelimit');
    expect(await ask('score')).toMatchObject({ code: 'RATE_LIMITED' });
  });
});
