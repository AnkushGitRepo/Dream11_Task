// Independent golden checkpoints, computed straight from the raw Cricsheet JSON.
// DELIBERATELY imports nothing from shared/: its own tiny scorer, so the engine is never validated
// against itself. Output: shared/sports/cricket/golden.fixtures.json (deterministic, committed).
// Run: node scripts/golden-checkpoints.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MATCHES = [
  { cricsheetId: '1298150', slug: 'pak-ind-2022-t20wc-mcg' },
  { cricsheetId: '1415755', slug: 'ind-sa-2024-t20wc-final' },
];
const FREE_HIT_OK = new Set(['run out', 'obstructing the field', 'hit the ball twice', 'handled the ball']);
const round2 = (n) => Math.round(n * 100) / 100;

/** Flatten one innings to deliveries with free-hit and legality resolved (one entry per delivery). */
function flatten(innings) {
  const out = [];
  let freeHit = false;
  for (const over of innings.overs) {
    for (const d of over.deliveries) {
      const ex = d.extras ?? {};
      const legal = !ex.wides && !ex.noballs;
      const wickets = (d.wickets ?? []).filter((w) => !freeHit || FREE_HIT_OK.has(w.kind));
      out.push({ over: over.over, d, legal, wickets, runsTotal: d.runs.total });
      if (ex.noballs) freeHit = true;
      else if (legal) freeHit = false;
    }
  }
  return out;
}

/** Scoreboard after the first `k` deliveries of an innings. */
function scoreAfter(deliveries, k, target) {
  let score = 0;
  let wkts = 0;
  let legal = 0;
  let extras = 0;
  let pRuns = 0;
  let pBalls = 0;
  const bat = new Map();
  const bowl = new Map();
  const overs = new Map();
  for (const x of deliveries.slice(0, k)) {
    const { d } = x;
    const b = bat.get(d.batter) ?? [0, 0];
    bat.set(d.batter, [b[0] + d.runs.batter, b[1] + (d.extras?.wides ? 0 : 1)]);
    const conceded = d.runs.batter + (d.extras?.wides ?? 0) + (d.extras?.noballs ?? 0);
    const key = `${x.over}|${d.bowler}`;
    const o = overs.get(key) ?? { legal: 0, conceded: 0, bowler: d.bowler };
    o.conceded += conceded;
    if (x.legal) o.legal += 1;
    overs.set(key, o);
    const w = bowl.get(d.bowler) ?? { balls: 0, runs: 0, wkts: 0 };
    w.balls += x.legal ? 1 : 0;
    w.runs += conceded;
    for (const wk of x.wickets) {
      if (!['run out', 'retired hurt', 'retired out', 'obstructing the field'].includes(wk.kind)) w.wkts += 1;
    }
    bowl.set(d.bowler, w);
    score += x.runsTotal;
    extras += d.runs.extras;
    if (x.legal) legal += 1;
    const teamWkts = x.wickets.filter((wk) => wk.kind !== 'retired hurt').length;
    wkts += teamWkts;
    if (x.wickets.length > 0) {
      pRuns = 0;
      pBalls = 0;
    } else {
      pRuns += x.runsTotal;
      pBalls += x.legal ? 1 : 0;
    }
  }
  const maidens = new Map();
  for (const o of overs.values()) {
    if (o.legal === 6 && o.conceded === 0) maidens.set(o.bowler, (maidens.get(o.bowler) ?? 0) + 1);
  }
  const batters = {};
  for (const [n, [r, bl]] of bat) if (r > 0 || bl > 0) batters[n] = [r, bl];
  const bowlers = {};
  for (const [n, w] of bowl) {
    const ov = w.balls % 6 === 0 ? `${w.balls / 6}` : `${Math.floor(w.balls / 6)}.${w.balls % 6}`;
    bowlers[n] = `${ov}-${maidens.get(n) ?? 0}-${w.runs}-${w.wkts}`;
  }
  const need = target == null ? null : Math.max(0, target - score);
  const ballsLeft = Math.max(0, 120 - legal);
  return {
    score,
    wkts,
    overs: `${Math.floor(legal / 6)}.${legal % 6}`,
    legalBalls: legal,
    batters,
    bowlers,
    extras,
    crr: legal > 0 ? round2((score * 6) / legal) : null,
    target: target ?? null,
    need,
    ballsLeft: target == null ? null : ballsLeft,
    rrr: need != null && need > 0 && ballsLeft > 0 ? round2((need * 6) / ballsLeft) : null,
    partnership: { runs: pRuns, balls: pBalls },
  };
}

function checkpointsFor(deliveries, target) {
  const points = new Map(); // afterDelivery -> label
  const legalAt = (n) => {
    let legal = 0;
    for (let i = 0; i < deliveries.length; i += 1) {
      if (deliveries[i].legal) legal += 1;
      if (legal === n) return i + 1;
    }
    return null;
  };
  for (const [label, balls] of [
    ['6.0', 36],
    ['10.0', 60],
    ['15.0', 90],
  ]) {
    const k = legalAt(balls);
    if (k !== null) points.set(k, label);
  }
  let wicketNo = 0;
  deliveries.forEach((x, i) => {
    if (x.wickets.some((w) => w.kind !== 'retired hurt')) {
      wicketNo += 1;
      const s = scoreAfter(deliveries, i + 1, target);
      const label = `wicket ${s.wkts} (${s.overs})`;
      points.set(i + 1, points.has(i + 1) ? `${points.get(i + 1)} + ${label}` : label);
    }
  });
  points.set(deliveries.length, 'final ball');
  return [...points.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([afterDelivery, label]) => ({
      label,
      afterDelivery,
      ...scoreAfter(deliveries, afterDelivery, target),
    }));
}

const fixtures = {};
for (const m of MATCHES) {
  const raw = JSON.parse(readFileSync(join(root, 'data', 'raw', `${m.cricsheetId}.json`), 'utf8'));
  const regular = raw.innings.filter((i) => !i.super_over).slice(0, 2);
  fixtures[m.slug] = {
    cricsheetId: m.cricsheetId,
    innings: regular.map((inn, idx) => {
      const target = idx === 1 ? (inn.target?.runs ?? null) : null;
      return { period: idx + 1, checkpoints: checkpointsFor(flatten(inn), target) };
    }),
  };
}

const outFile = join(root, 'shared', 'sports', 'cricket', 'golden.fixtures.json');
writeFileSync(outFile, `${JSON.stringify(fixtures, null, 2)}\n`);
for (const [slug, f] of Object.entries(fixtures)) {
  const n = f.innings.reduce((a, i) => a + i.checkpoints.length, 0);
  console.log(`${slug}: ${n} checkpoints`);
}
console.log(`wrote ${outFile}`);
