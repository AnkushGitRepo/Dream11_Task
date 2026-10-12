import { useMemo } from 'react';
import { getCricketState, type CricketBaseline, type CricketState } from '@shared/sports/cricket/state';
import type { MatchTimeline } from '@shared/sports/types';

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Narrows the sport-agnostic `baseline: unknown` coming through SportScoreProps. */
export function isCricketBaseline(v: unknown): v is CricketBaseline {
  if (!isRecord(v)) return false;
  return (
    typeof v.battingTeam === 'string' &&
    typeof v.clock === 'string' &&
    isNum(v.score) &&
    isNum(v.wkts) &&
    isNum(v.legalBalls) &&
    (v.target === null || isNum(v.target)) &&
    isNum(v.maxBalls) &&
    isRecord(v.batters) &&
    isRecord(v.bowlers) &&
    isRecord(v.partnership) &&
    typeof v.striker === 'string' &&
    typeof v.nonStriker === 'string' &&
    typeof v.bowler === 'string'
  );
}

export function useCricketState(
  timeline: MatchTimeline,
  position: number,
  baseline: CricketBaseline,
): CricketState {
  return useMemo(() => getCricketState(timeline, position, baseline), [timeline, position, baseline]);
}

/** The one-line chase status shown in hero and bar. Numbers come from the engine state. */
export function statusLine(s: CricketState): string {
  if (s.finished) return s.result ?? 'Innings complete';
  if (s.need === null) return `${s.ballsLeft} balls left`;
  return `Need ${s.need} off ${s.ballsLeft}`;
}

export const scoreText = (s: CricketState): string => `${s.score}/${s.wkts}`;
