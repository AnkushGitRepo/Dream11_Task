import type { MatchMeta } from '@shared/sports/types';
import { MOCK_MATCH_ID, mockTimeline } from './match.mock';

/** Final score of one side, rendered verbatim (never computed or guessed in the UI). */
export interface TeamScore {
  readonly code: string;
  readonly score: string;
}

/** Everything a match card/row needs on top of the engine's MatchMeta. */
export interface MatchIndexEntry {
  readonly meta: MatchMeta;
  /** Competition overline on featured cards. */
  readonly competition: string;
  /** Title and team order used in the "All replays" list. */
  readonly rowTitle: string;
  readonly rowTeams: readonly [string, string];
  /** Short competition name for the row meta line. */
  readonly competitionShort: string;
  readonly venueShort: string;
  readonly scores: readonly [TeamScore, TeamScore];
  readonly hook: string;
  /** False => rendered as a "Coming soon" card without navigation. */
  readonly playable: boolean;
  readonly featured: boolean;
}

// Final scores below are hand-copied from Cricsheet 1298150 (PAK v IND, MCG, 23 Oct 2022:
// PAK 159/8, IND 160/6) and Cricsheet 1415755 (IND v SA, T20 WC final, Barbados, 29 Jun 2024:
// IND 176/7, SA 169/8). They are the real results; do not edit without re-checking the source.
export const MATCHES_INDEX: readonly MatchIndexEntry[] = [
  {
    meta: mockTimeline.meta,
    competition: 'T20 World Cup 2022',
    rowTitle: 'India vs Pakistan',
    rowTeams: ['IND', 'PAK'],
    competitionShort: 'T20 World Cup',
    venueShort: 'MCG',
    scores: [
      { code: 'PAK', score: '159/8' },
      { code: 'IND', score: '160/6' },
    ],
    hook: 'Last-ball thriller',
    playable: true,
    featured: true,
  },
  {
    meta: {
      id: 'ind-sa-2024-t20wc-final',
      sport: 'cricket',
      title: 'India vs South Africa',
      subtitle: "ICC Men's T20 World Cup 2024 · Final · Kensington Oval, Barbados",
      format: 'T20',
      date: '2024-06-29',
      teams: [
        { code: 'IND', name: 'India' },
        { code: 'SA', name: 'South Africa' },
      ],
      venue: 'Kensington Oval, Barbados',
      result: 'India won by 7 runs',
      source: 'Cricsheet',
      license: 'ODC-BY 1.0 (Cricsheet)',
    },
    competition: 'T20 World Cup 2024 final',
    rowTitle: 'India vs South Africa',
    rowTeams: ['IND', 'SA'],
    competitionShort: 'T20 World Cup final',
    venueShort: 'Barbados',
    scores: [
      { code: 'IND', score: '176/7' },
      { code: 'SA', score: '169/8' },
    ],
    hook: 'India won by 7 runs',
    playable: false,
    featured: true,
  },
];

export { MOCK_MATCH_ID };
