import type { EventTone } from '../types';

export interface BatterLine {
  readonly name: string;
  readonly runs: number;
  readonly balls: number;
  readonly fours: number;
  readonly sixes: number;
  /** Dismissal text ('c Babar b Nawaz'); absent while not out. */
  readonly out?: string;
}
export interface BowlerLine {
  readonly name: string;
  readonly legalBalls: number;
  readonly maidens: number;
  readonly runs: number;
  readonly wkts: number;
}

/** State of the innings before event 0 (lets a replay start mid-innings). */
export interface CricketBaseline {
  readonly battingTeam: string; // team code, e.g. 'IND'
  readonly clock: string; // '17.0'
  readonly score: number;
  readonly wkts: number;
  readonly legalBalls: number;
  readonly target: number | null;
  readonly maxBalls: number;
  readonly batters: Readonly<Record<string, Omit<BatterLine, 'name'>>>;
  readonly bowlers: Readonly<Record<string, Omit<BowlerLine, 'name'>>>;
  readonly partnership: { readonly runs: number; readonly balls: number };
  readonly striker: string;
  readonly nonStriker: string;
  readonly bowler: string;
  /** Innings number (1|2) when known; defaults to the period of the events. */
  readonly period?: number;
}

export interface BallView {
  readonly seq: number;
  readonly clock: string; // '16.3', for localised screen-reader text
  readonly over: number; // 0-based over index, used for the strip separator
  readonly label: string; // '•' '1' '2' '3' '4' '6' 'W' 'wd' 'nb' 'b' 'lb'
  readonly tone: EventTone;
  readonly freeHit: boolean;
  readonly a11y: string;
}

export interface ExtrasLine {
  readonly wides: number;
  readonly noballs: number;
  readonly byes: number;
  readonly legbyes: number;
  readonly penalty: number;
  readonly total: number;
}
export interface FallOfWicket {
  readonly wkt: number; // 1-based wicket number
  readonly score: number;
  readonly batter: string;
  readonly clock: string;
  readonly seq: number;
}
/** Full innings scorecard as of the position (batters in order of appearance). */
export interface Scorecard {
  readonly batters: readonly BatterLine[];
  readonly bowlers: readonly BowlerLine[];
  readonly extras: ExtrasLine;
  readonly fow: readonly FallOfWicket[];
}

export interface CricketState {
  readonly battingTeam: string;
  readonly score: number;
  readonly wkts: number;
  readonly legalBalls: number;
  readonly overs: string; // '19.0'
  readonly target: number | null;
  readonly need: number | null;
  readonly ballsLeft: number;
  readonly crr: number | null;
  readonly rrr: number | null;
  readonly partnership: { readonly runs: number; readonly balls: number };
  readonly striker: BatterLine;
  readonly nonStriker: BatterLine;
  readonly bowler: BowlerLine;
  readonly recent: readonly BallView[];
  readonly freeHitNext: boolean;
  readonly lastWicketSeq: number | null;
  readonly finished: boolean;
  readonly result: string | null;
  /** Innings (1|2) the numbers belong to. Always set by the engine. */
  readonly period?: number;
  /** Full tallies for the innings. Always set by the engine. */
  readonly scorecard?: Scorecard;
}
