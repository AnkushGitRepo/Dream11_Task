import { vi } from 'vitest';
import type { MatchTimeline } from '@shared/sports/types';

const files = import.meta.glob('../../../data/matches/pak-ind-2022-t20wc-mcg.json', {
  eager: true,
  import: 'default',
}) as Record<string, MatchTimeline>;

/** The real 2022 PAK v IND timeline (seq 245 = no-ball, 247 = bowled on a free hit, 3 byes). */
export const PAK_IND: MatchTimeline = Object.values(files)[0] as MatchTimeline;

export const MOMENT = {
  id: 'learnmoment0001',
  title: 'x',
  short: 'x',
  moment: 'Nawaz overstepped, so India got a free hit.',
  speak: 'spoken text',
  source: 'ai',
};

/** fetch stub: /api/learn answers with `learn`, everything else (speak prefetch) is a 404. */
export function stubFetch(learn: unknown | null): ReturnType<typeof vi.fn> {
  const fn = vi.fn(async (url: string) => {
    if (url === '/api/learn' && learn !== null) return { ok: true, status: 200, json: async () => learn };
    return { ok: false, status: 404, json: async () => ({}) };
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}
