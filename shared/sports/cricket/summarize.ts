import type { Fact, Facts, Lang, MatchTimeline } from '../types.ts';
import { ballData } from './ballData.ts';
import { countWindow, windowItems } from './facts.ts';
import { bowlingOvers, shortName } from './format.ts';
import { NumberBag } from './numbers.ts';
import { getCricketStateAt, type DetailedCricketState } from './position.ts';
import { factsFromState } from './snapshot.ts';
import { addBatter, addBowler, addStateNumbers } from './stateNumbers.ts';
import { EMPTY_BASELINE, tallyEvents } from './tally.ts';

const MAX_PLAYERS = 4;
const all = (s: string): Record<Lang, string> => ({ en: s, hinglish: s, hi: s, gu: s });

export function emptyFacts(): Facts {
  return {
    window: { fromSeq: 0, toSeq: 0, fromClock: '', toClock: '' },
    items: [],
    highlights: [],
    numbers: [],
  };
}

function playerItems(tl: MatchTimeline, from: number, to: number, bag: NumberBag): Fact[] {
  const t = tallyEvents(tl.events.slice(from, to + 1), EMPTY_BASELINE);
  const items: Fact[] = [];
  const batters = [...t.batters.entries()]
    .filter(([, b]) => b.balls > 0 || b.runs > 0)
    .sort((a, b) => b[1].runs - a[1].runs)
    .slice(0, MAX_PLAYERS);
  for (const [name, b] of batters) {
    addBatter(bag, { name, ...b });
    const n = shortName(name);
    items.push({
      key: `batter:${n}`,
      value: b.runs,
      label: {
        en: `${n} scored ${b.runs} off ${b.balls} ${b.balls === 1 ? 'ball' : 'balls'}`,
        hinglish: `${n} ne ${b.balls} gend mein ${b.runs} run banaye`,
        hi: `${n} ने ${b.balls} गेंद में ${b.runs} रन बनाए`,
        gu: `${n} એ ${b.balls} બોલમાં ${b.runs} રન બનાવ્યા`,
      },
    });
  }
  for (const [name, b] of [...t.bowlers.entries()].slice(0, MAX_PLAYERS)) {
    addBowler(bag, { name, ...b });
    const fig = `${shortName(name)}: ${bowlingOvers(b.legalBalls)}-${b.maidens}-${b.runs}-${b.wkts}`;
    items.push({ key: `bowler:${shortName(name)}`, value: fig, label: all(fig) });
  }
  return items;
}

function wicketHighlights(tl: MatchTimeline, from: number, to: number, bag: NumberBag): string[] {
  const out: string[] = [];
  for (const e of tl.events.slice(from, to + 1)) {
    const d = ballData(e);
    if (!d.wicket) continue;
    const after = getCricketStateAt(tl, e.seq + 1);
    const line = after.scorecard.batters.find((b) => b.name === d.wicket?.playerOut);
    const how = line?.out ?? d.wicket.kind;
    const stat = line ? ` ${line.runs} (${line.balls})` : '';
    if (line) bag.add(line.runs, line.balls);
    bag.add(d.score, d.wkts).addOvers(e.clock);
    out.push(`${shortName(d.wicket.playerOut)} ${how}${stat}, ${d.score}/${d.wkts} at ${e.clock}`);
  }
  return out;
}

function addWindowNumbers(
  bag: NumberBag,
  before: DetailedCricketState,
  after: DetailedCricketState,
  same: boolean,
  c: ReturnType<typeof countWindow>,
  overs: readonly number[],
): void {
  addStateNumbers(bag, after);
  if (same) addStateNumbers(bag, before);
  bag.add(c.balls, c.runs, c.wkts);
  if (c.sixes > 0) bag.add(c.sixes, 6);
  if (c.fours > 0) bag.add(c.fours, 4);
  for (const o of overs) bag.add(o, o + 1);
}

/** Facts for events seq `fromSeq..toSeq` inclusive: everything a recap may say, numbers allow-listed. */
export function summarizeCricket(tl: MatchTimeline, fromSeq: number, toSeq: number): Facts {
  const n = tl.events.length;
  if (n === 0) return emptyFacts();
  const from = Math.max(0, Math.min(fromSeq, n - 1));
  const to = Math.max(from, Math.min(toSeq, n - 1));
  const events = tl.events.slice(from, to + 1);
  const before = getCricketStateAt(tl, from);
  const after = getCricketStateAt(tl, to + 1);
  const same = before.period === after.period;
  const counts = countWindow(events);
  const bag = new NumberBag();

  const items = windowItems(counts, same ? before : null, same ? after : null);
  for (const f of factsFromState(after)) {
    if (f.key === 'striker' || f.key === 'nonStriker' || f.key === 'ballsLeft') continue;
    items.push(f.key === 'need' ? { ...f, key: 'needNow' } : f);
  }
  if (same)
    items.push({
      key: 'scoreBefore',
      value: `${before.score}/${before.wkts}`,
      label: all(`${before.score}/${before.wkts}`),
    });
  items.push(...playerItems(tl, from, to, bag));

  const highlights = wicketHighlights(tl, from, to, bag);
  if (to === n - 1 && after.result) {
    highlights.push(after.result);
    bag.addFromText(after.result);
  }
  addWindowNumbers(bag, before, after, same, counts, [...new Set(events.map((e) => ballData(e).over))]);
  bag.addOvers(events[0]?.clock).addOvers(events[events.length - 1]?.clock);

  return {
    window: {
      fromSeq: from,
      toSeq: to,
      fromClock: tl.events[from]?.clock ?? '',
      toClock: tl.events[to]?.clock ?? '',
    },
    items,
    highlights,
    numbers: bag.toSorted(),
  };
}
