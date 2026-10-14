import type { Fact, Facts, Lang, MatchTimeline } from '../types.js';
import { bowlingOvers, shortName } from './format.js';
import { NumberBag } from './numbers.js';
import {
  getCricketStateAt,
  getInningsStateAfter,
  inningsStartPosition,
  type DetailedCricketState,
} from './position.js';
import { factsFromState } from './snapshot.js';
import { addBatter, addBowler, addStateNumbers } from './stateNumbers.js';
import { emptyFacts } from './summarize.js';

const all = (s: string): Record<Lang, string> => ({ en: s, hinglish: s, hi: s, gu: s });
const fact = (key: string, value: number | string, label = String(value)): Fact => ({
  key,
  value,
  label: all(label),
});

function scorecardFacts(s: DetailedCricketState, bag: NumberBag): Fact[] {
  const out: Fact[] = [];
  for (const b of s.scorecard.batters) {
    addBatter(bag, b);
    const n = shortName(b.name);
    const text = `${b.runs} (${b.balls})`;
    out.push(fact(`card:bat:${n}`, text, `${n} ${text}${b.out ? `, ${b.out}` : ' not out'}`));
  }
  for (const b of s.scorecard.bowlers) {
    addBowler(bag, b);
    const n = shortName(b.name);
    const fig = `${bowlingOvers(b.legalBalls)}-${b.maidens}-${b.runs}-${b.wkts}`;
    out.push(fact(`card:bowl:${n}`, fig, `${n} ${fig}`));
  }
  const x = s.scorecard.extras;
  bag.add(x.total, x.wides, x.noballs, x.byes, x.legbyes, x.penalty);
  out.push(
    fact(
      'extras',
      x.total,
      `Extras ${x.total} (wd ${x.wides}, nb ${x.noballs}, b ${x.byes}, lb ${x.legbyes}, pen ${x.penalty})`,
    ),
  );
  if (s.scorecard.fow.length > 0) {
    const text = s.scorecard.fow
      .map((f) => {
        bag.add(f.wkt, f.score).addOvers(f.clock);
        return `${f.wkt}-${f.score} (${shortName(f.batter)}, ${f.clock})`;
      })
      .join(', ');
    out.push(fact('fow', text, `Fall of wickets: ${text}`));
  }
  return out;
}

function firstInningsFact(tl: MatchTimeline, s: DetailedCricketState, bag: NumberBag): Fact[] {
  if (s.period < 2) return [];
  const first = getInningsStateAfter(tl, s.period - 1, Number.MAX_SAFE_INTEGER);
  addStateNumbers(bag, first);
  const text = `${first.battingTeam} ${first.score}/${first.wkts} in ${first.overs} overs`;
  return [fact('firstInnings', `${first.score}/${first.wkts}`, text)];
}

/** Compact state + innings scorecard as facts (the ONLY numbers Ask answers may use). */
export function askContextCricket(tl: MatchTimeline, seq: number): Facts {
  const n = tl.events.length;
  if (n === 0) return emptyFacts();
  const last = Math.max(-1, Math.min(seq, n - 1));
  const s = getCricketStateAt(tl, last + 1);
  const bag = new NumberBag();
  addStateNumbers(bag, s);
  const items: Fact[] = [...factsFromState(s)];
  if (s.target !== null) items.push(fact('target', s.target, `Target ${s.target}`));
  items.push(...scorecardFacts(s, bag), ...firstInningsFact(tl, s, bag));
  const highlights: string[] = [];
  if (s.finished && s.result) {
    highlights.push(s.result);
    bag.addFromText(s.result);
  }
  const startSeq = Math.min(inningsStartPosition(tl, s.period), n - 1);
  const cur = last >= 0 ? tl.events[last] : undefined;
  return {
    window: {
      fromSeq: startSeq,
      toSeq: Math.max(last, 0),
      fromClock: tl.events[startSeq]?.clock ?? '',
      toClock: cur?.clock ?? '',
    },
    items,
    highlights,
    numbers: bag.toSorted(),
  };
}
