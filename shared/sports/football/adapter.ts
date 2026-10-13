import type { Fact, Facts, MatchTimeline, SportAdapter, TimelineEvent } from '../types.ts';

// Stub football adapter: proves the SportAdapter contract is not cricket-shaped.
// Input is a tiny hand-built feed of goals / shots / cards (not a real provider format).

export interface FootballFeedEvent {
  readonly minute: number;
  readonly type: 'goal' | 'shot' | 'yellow' | 'red';
  readonly team: 'home' | 'away';
  readonly player?: string;
}
export interface FootballFeed {
  readonly match: {
    readonly id: string;
    readonly date: string;
    readonly venue?: string;
    readonly home: { readonly code: string; readonly name: string };
    readonly away: { readonly code: string; readonly name: string };
  };
  readonly events: readonly FootballFeedEvent[];
}

export interface FootballSide {
  readonly code: string;
  readonly goals: number;
  readonly shots: number;
  readonly yellow: number;
  readonly red: number;
}
export interface FootballState {
  readonly home: FootballSide;
  readonly away: FootballSide;
  readonly minute: number;
  readonly clock: string;
  readonly period: number;
}

const MIN_GAP_EVENTS = 5;
const TYPES = ['goal', 'shot', 'yellow', 'red'] as const;
const fail = (msg: string): never => {
  throw new Error(`football normalize: ${msg}`);
};
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function parseFeed(raw: unknown): FootballFeed {
  if (!isObj(raw) || !isObj(raw.match) || !Array.isArray(raw.events))
    return fail('expected { match, events[] }');
  const m = raw.match;
  const side = (v: unknown, key: string) =>
    isObj(v) && typeof v.code === 'string' && typeof v.name === 'string'
      ? { code: v.code, name: v.name }
      : fail(`match.${key} needs code and name`);
  const events = raw.events.map((e: unknown, i: number): FootballFeedEvent => {
    if (!isObj(e) || typeof e.minute !== 'number' || e.minute < 0) return fail(`events[${i}].minute`);
    const type = TYPES.find((t) => t === e.type);
    if (!type) return fail(`events[${i}].type`);
    if (e.team !== 'home' && e.team !== 'away') return fail(`events[${i}].team`);
    return {
      minute: e.minute,
      type,
      team: e.team,
      ...(typeof e.player === 'string' ? { player: e.player } : {}),
    };
  });
  return {
    match: {
      id: typeof m.id === 'string' ? m.id : fail('match.id'),
      date: typeof m.date === 'string' ? m.date : fail('match.date'),
      ...(typeof m.venue === 'string' ? { venue: m.venue } : {}),
      home: side(m.home, 'home'),
      away: side(m.away, 'away'),
    },
    events,
  };
}

const TONE = { goal: 'major', red: 'big', yellow: 'good', shot: 'minor' } as const;

const TEXT = {
  goal: (who: string, code: string) => `GOAL! ${who} (${code})`,
  shot: (who: string, code: string) => `Shot by ${who} (${code})`,
  yellow: (who: string, code: string) => `Yellow card: ${who} (${code})`,
  red: (who: string, code: string) => `RED CARD: ${who} (${code})`,
} as const;

function buildEvents(feed: FootballFeed): TimelineEvent[] {
  const { home, away } = feed.match;
  const sorted = feed.events
    .map((e, i) => ({ e, i }))
    .sort((a, b) => a.e.minute - b.e.minute || a.i - b.i)
    .map((x) => x.e);
  const blank = () => ({ goals: 0, shots: 0, yellow: 0, red: 0 });
  const tally = { home: blank(), away: blank() };
  const counter = { goal: 'goals', shot: 'shots', yellow: 'yellow', red: 'red' } as const;
  return sorted.map((e, seq): TimelineEvent => {
    tally[e.team][counter[e.type]] += 1;
    const team = e.team === 'home' ? home : away;
    return {
      seq,
      clock: `${e.minute}'`,
      period: e.minute <= 45 ? 1 : 2,
      kind: e.type,
      tone: TONE[e.type],
      text: TEXT[e.type](e.player ?? team.name, team.code),
      data: {
        minute: e.minute,
        team: team.code,
        side: e.team,
        player: e.player ?? null,
        home: { code: home.code, ...tally.home },
        away: { code: away.code, ...tally.away },
      },
    };
  });
}

function normalize(raw: unknown): MatchTimeline {
  const feed = parseFeed(raw);
  const { home, away, venue } = feed.match;
  return {
    meta: {
      id: feed.match.id,
      sport: 'football',
      title: `${home.name} vs ${away.name}`,
      subtitle: venue ?? '',
      format: 'Football',
      date: feed.match.date,
      teams: [home, away],
      ...(venue ? { venue } : {}),
      source: 'hand-built feed',
      license: 'n/a',
    },
    events: buildEvents(feed),
  };
}

const zeroSide = (code: string): FootballSide => ({ code, goals: 0, shots: 0, yellow: 0, red: 0 });

function getState(tl: MatchTimeline, seq: number): FootballState {
  const [h, a] = tl.meta.teams;
  const last = tl.events[Math.min(seq, tl.events.length - 1)];
  if (seq < 0 || !last) {
    return {
      home: zeroSide(h?.code ?? ''),
      away: zeroSide(a?.code ?? ''),
      minute: 0,
      clock: "0'",
      period: 1,
    };
  }
  const d = last.data as { minute: number; home: FootballSide; away: FootballSide };
  return { home: d.home, away: d.away, minute: d.minute, clock: last.clock, period: last.period };
}

const fact = (key: string, value: number | string, label: string): Fact => ({
  key,
  value,
  label: { en: label, hinglish: label, hi: label, gu: label },
});

function summarize(tl: MatchTimeline, fromSeq: number, toSeq: number): Facts {
  const n = tl.events.length;
  const from = Math.max(0, Math.min(fromSeq, n - 1));
  const to = Math.max(from, Math.min(toSeq, n - 1));
  const slice = n === 0 ? [] : tl.events.slice(from, to + 1);
  const count = (kind: string) => slice.filter((e) => e.kind === kind).length;
  const goals = count('goal');
  const shots = count('shot');
  const cards = count('yellow') + count('red');
  const after = getState(tl, to);
  const score = `${after.home.goals}-${after.away.goals}`;
  return {
    window: {
      fromSeq: from,
      toSeq: to,
      fromClock: tl.events[from]?.clock ?? '',
      toClock: tl.events[to]?.clock ?? '',
    },
    items: [
      fact('goals', goals, `${goals} goals`),
      fact('shots', shots, `${shots} shots`),
      fact('cards', cards, `${cards} cards`),
      fact(
        'score',
        score,
        `Score ${after.home.code} ${after.home.goals}-${after.away.goals} ${after.away.code}`,
      ),
    ],
    highlights: slice.filter((e) => e.tone === 'major').map((e) => `${e.text} at ${e.clock}`),
    numbers: [
      ...new Set([
        goals,
        shots,
        cards,
        after.home.goals,
        after.away.goals,
        ...slice.map((e) => Number(e.data.minute)),
      ]),
    ].sort((x, y) => x - y),
  };
}

function askContext(tl: MatchTimeline, seq: number): Facts {
  const s = getState(tl, seq);
  const line = (x: FootballSide) =>
    `${x.code}: ${x.goals} goals, ${x.shots} shots, ${x.yellow} yellow, ${x.red} red`;
  return {
    window: { fromSeq: 0, toSeq: Math.max(0, seq), fromClock: "0'", toClock: s.clock },
    items: [
      fact(
        'score',
        `${s.home.goals}-${s.away.goals}`,
        `Score ${s.home.code} ${s.home.goals}-${s.away.goals} ${s.away.code}`,
      ),
      fact('minute', s.minute, `Minute ${s.minute}`),
      fact('home', s.home.goals, line(s.home)),
      fact('away', s.away.goals, line(s.away)),
    ],
    highlights: [],
    numbers: [
      ...new Set([s.minute, ...[s.home, s.away].flatMap((x) => [x.goals, x.shots, x.yellow, x.red])]),
    ].sort((x, y) => x - y),
  };
}

const QUESTIONS = ['Who scored?', 'What is the score?', 'Were there any cards?', 'What did I miss?'] as const;

export const footballAdapter: SportAdapter<FootballState> = {
  id: 'football',
  normalize,
  getState,
  summarize,
  askContext,
  /** Fewer than 5 events is not worth a recap. Window seqs are inclusive. */
  isMeaningfulGap: (tl, fromSeq, toSeq) =>
    Math.min(toSeq, tl.events.length - 1) - Math.max(fromSeq, 0) + 1 >= MIN_GAP_EVENTS,
  /** English only: other languages fall back to English until the sport is fully localised. */
  suggestedQuestions: () => [...QUESTIONS],
  teachables(tl, seq) {
    const kind = tl.events[seq]?.kind;
    return kind === 'yellow' ? ['yellow-card'] : kind === 'red' ? ['red-card'] : [];
  },
};
