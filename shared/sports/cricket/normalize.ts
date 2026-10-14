import type { MatchTimeline, TimelineEvent } from '../types.js';
import type { CricketBallData, ExtrasDetail, WicketData } from './ballData.js';
import { describe, extraTypeOf, kindAndTone, type Delivery } from './describeBall.js';
import { asArr, asNum, asObj, asStr, fail, optNum, teamCode, type Obj } from './rawParse.js';
import { buildMeta } from './rawMeta.js';

// Cricsheet JSON (v1.x) -> MatchTimeline. ONE implementation, used by scripts/preprocess-cricsheet.ts.
//
// Scope: the first two NON-super-over innings are converted. Innings beyond the second, and any
// innings flagged `super_over`, are ignored without error (the replay is a single 2-innings match).
// Malformed input (missing fields, wrong types) throws an Error beginning "cricket normalize:".
//
// Wickets that do not count: on a free hit only run out / obstructing the field / hit the ball
// twice / handled the ball are wickets; anything else is dropped (the delivery stays, wkts unchanged).

const MAX_INNINGS = 2;
const FREE_HIT_WICKETS = new Set([
  'run out',
  'obstructing the field',
  'hit the ball twice',
  'handled the ball',
]);
const NOT_BOWLERS_WICKET = new Set([
  'run out',
  'retired hurt',
  'retired out',
  'obstructing the field',
  'hit the ball twice',
  'handled the ball',
]);
const NO_TEAM_WICKET = new Set(['retired hurt']);

function parseExtras(d: Obj, path: string): ExtrasDetail {
  const e = d.extras === undefined ? {} : asObj(d.extras, `${path}.extras`);
  return {
    wides: optNum(e, 'wides', `${path}.extras`),
    noballs: optNum(e, 'noballs', `${path}.extras`),
    byes: optNum(e, 'byes', `${path}.extras`),
    legbyes: optNum(e, 'legbyes', `${path}.extras`),
    penalty: optNum(e, 'penalty', `${path}.extras`),
  };
}

function parseWickets(d: Obj, path: string): WicketData[] {
  if (d.wickets === undefined) return [];
  return asArr(d.wickets, `${path}.wickets`).map((w, i) => {
    const o = asObj(w, `${path}.wickets[${i}]`);
    const kind = asStr(o.kind, `${path}.wickets[${i}].kind`);
    const fielders = o.fielders === undefined ? [] : asArr(o.fielders, `${path}.wickets[${i}].fielders`);
    const first = fielders[0] === undefined ? null : asObj(fielders[0], `${path}.wickets[${i}].fielders[0]`);
    const fielder = first && typeof first.name === 'string' ? first.name : null;
    return {
      playerOut: asStr(o.player_out, `${path}.wickets[${i}].player_out`),
      kind,
      fielder,
      bowlerCredited: !NOT_BOWLERS_WICKET.has(kind),
    };
  });
}

function parseDelivery(raw: unknown, over: number, path: string): Delivery {
  const d = asObj(raw, path);
  const runs = asObj(d.runs, `${path}.runs`);
  const bowler = asStr(d.bowler, `${path}.bowler`);
  const extras = parseExtras(d, path);
  const extrasTotal = asNum(runs.extras ?? 0, `${path}.runs.extras`);
  return {
    over,
    batter: asStr(d.batter, `${path}.batter`),
    bowler,
    nonStriker: asStr(d.non_striker, `${path}.non_striker`),
    runsBat: asNum(runs.batter, `${path}.runs.batter`),
    extras,
    extrasTotal,
    wickets: parseWickets(d, path),
  };
}

interface InningsCtx {
  readonly inn: number;
  readonly team: string;
  readonly target: number | undefined;
  readonly maxBalls: number;
}

interface Running {
  score: number;
  wkts: number;
  freeHit: boolean;
}

function toEvent(d: Delivery, ctx: InningsCtx, run: Running, legalDone: number, seq: number): TimelineEvent {
  const type = extraTypeOf(d.extras, d.runsBat);
  const legal = d.extras.wides === 0 && d.extras.noballs === 0;
  const counted = d.wickets.filter((w) => !run.freeHit || FREE_HIT_WICKETS.has(w.kind));
  const wicket = counted.find((w) => !NO_TEAM_WICKET.has(w.kind)) ?? counted[0];
  const freeHit = run.freeHit;
  run.score += d.runsBat + d.extrasTotal;
  run.wkts += counted.filter((w) => !NO_TEAM_WICKET.has(w.kind)).length;
  if (d.extras.noballs > 0) run.freeHit = true;
  else if (legal) run.freeHit = false;
  const { kind, tone } = kindAndTone(d, type, wicket);
  const data: CricketBallData = {
    inn: ctx.inn,
    over: d.over,
    ball: legalDone,
    batter: d.batter,
    bowler: d.bowler,
    nonStriker: d.nonStriker,
    runsBat: d.runsBat,
    extras: d.extrasTotal,
    extrasBowler: d.extras.wides + d.extras.noballs,
    extraType: type,
    extrasDetail: d.extras,
    legal,
    freeHit,
    ...(wicket ? { wicket } : {}),
    score: run.score,
    wkts: run.wkts,
    team: ctx.team,
    ...(ctx.target !== undefined ? { target: ctx.target } : {}),
    maxBalls: ctx.maxBalls,
  };
  return {
    seq,
    clock: `${d.over}.${legalDone}`,
    period: ctx.inn,
    kind,
    tone,
    text: describe(d, type, wicket),
    data: data as unknown as Record<string, unknown>,
  };
}

function parseInnings(raw: unknown, idx: number): { team: string; deliveries: Delivery[]; target?: Obj } {
  const path = `innings[${idx}]`;
  const inn = asObj(raw, path);
  const overs = asArr(inn.overs, `${path}.overs`);
  const deliveries: Delivery[] = [];
  overs.forEach((o, i) => {
    const over = asObj(o, `${path}.overs[${i}]`);
    const n = asNum(over.over, `${path}.overs[${i}].over`);
    asArr(over.deliveries, `${path}.overs[${i}].deliveries`).forEach((d, j) => {
      deliveries.push(parseDelivery(d, n, `${path}.overs[${i}].deliveries[${j}]`));
    });
  });
  const target = inn.target === undefined ? undefined : asObj(inn.target, `${path}.target`);
  return { team: asStr(inn.team, `${path}.team`), deliveries, ...(target ? { target } : {}) };
}

export function normalizeCricsheet(raw: unknown): MatchTimeline {
  const root = asObj(raw, 'root');
  const info = asObj(root.info, 'info');
  const rawInnings = asArr(root.innings, 'innings');
  if (rawInnings.length === 0) fail('innings', 'must contain at least one innings');
  const regular = rawInnings.filter((i) => asObj(i, 'innings[]').super_over !== true);
  const parsed = regular.slice(0, MAX_INNINGS).map((i, idx) => parseInnings(i, idx));
  if (parsed.length === 0) fail('innings', 'must contain at least one regular innings');

  const oversPerSide = typeof info.overs === 'number' ? info.overs : 20;
  const ballsPerOver = typeof info.balls_per_over === 'number' ? info.balls_per_over : 6;
  const events: TimelineEvent[] = [];
  parsed.forEach((inn, idx) => {
    const targetRuns = inn.target && typeof inn.target.runs === 'number' ? inn.target.runs : undefined;
    const targetOvers = inn.target && typeof inn.target.overs === 'number' ? inn.target.overs : undefined;
    const ctx: InningsCtx = {
      inn: idx + 1,
      team: teamCode(inn.team),
      target: idx === 1 ? targetRuns : undefined,
      maxBalls: (idx === 1 && targetOvers !== undefined ? targetOvers : oversPerSide) * ballsPerOver,
    };
    const run: Running = { score: 0, wkts: 0, freeHit: false };
    let legalDone = 0;
    let currentOver = -1;
    for (const d of inn.deliveries) {
      if (d.over !== currentOver) {
        currentOver = d.over;
        legalDone = 0;
      }
      if (d.extras.wides === 0 && d.extras.noballs === 0) legalDone += 1;
      events.push(toEvent(d, ctx, run, legalDone, events.length));
    }
  });
  return {
    meta: buildMeta(
      info,
      parsed.map((p) => p.team),
    ),
    events,
  };
}
