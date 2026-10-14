import { bowlingOvers } from './format.js';
import { NumberBag } from './numbers.js';
import type { BatterLine, BowlerLine, CricketState } from './stateTypes.js';

export function addBatter(bag: NumberBag, b: BatterLine): void {
  bag.add(b.runs, b.balls, b.fours, b.sixes);
}

export function addBowler(bag: NumberBag, b: BowlerLine): void {
  const ov = bowlingOvers(b.legalBalls);
  bag.addOvers(ov.includes('.') ? ov : `${ov}.0`).add(Number(ov), b.maidens, b.runs, b.wkts, b.legalBalls);
}

/** Every number derivable from a scoreboard state (score, overs, need, rates, players, partnership). */
export function addStateNumbers(bag: NumberBag, s: CricketState): void {
  bag.add(s.score, s.wkts, s.legalBalls, s.target, s.need, s.ballsLeft);
  bag.addOvers(s.overs).addRate(s.crr).addRate(s.rrr);
  bag.add(s.partnership.runs, s.partnership.balls);
  addBatter(bag, s.striker);
  addBatter(bag, s.nonStriker);
  addBowler(bag, s.bowler);
}
