import { useState } from 'react';
import { BALLS_PER_OVER, type CricketState } from '@shared/sports/cricket/state';

const isBoundary = (label: string) => label === '4' || label === '6';

/**
 * Text for the polite live region. Announces ONLY wickets, boundaries and the end of an over,
 * and only when the replay advanced by exactly one ball (never on seeks / catch-up jumps).
 */
export function useAnnouncement(state: CricketState): string {
  const newest = state.recent[state.recent.length - 1];
  const [track, setTrack] = useState({
    seq: newest?.seq ?? null,
    legalBalls: state.legalBalls,
    message: '',
  });
  const seq = newest?.seq ?? null;
  if (track.seq !== seq || track.legalBalls !== state.legalBalls) {
    const parts: string[] = [];
    const step = seq !== null && track.seq !== null && seq - track.seq === 1;
    if (step && newest) {
      if (newest.label === 'W' || isBoundary(newest.label)) parts.push(newest.a11y);
      const over = state.legalBalls / BALLS_PER_OVER;
      if (state.legalBalls > track.legalBalls && Number.isInteger(over) && over > 0) {
        parts.push(`End of over ${over}. ${state.score}/${state.wkts}.`);
      }
    }
    setTrack({ seq, legalBalls: state.legalBalls, message: parts.join(' ') });
  }
  return track.message;
}
