// Prompt evaluation: 20 match windows x 4 languages through the SAME pipeline /api/recap uses
// (shared/ai/pipeline.ts). Reports how often the guard refused a model answer and prints samples.
//
//   GEMINI_API_KEY=... [LLM_MODEL=...] npm run eval:prompts
//
// The key is read by Node itself (`npm run eval:prompts` passes --env-file-if-exists) or comes from
// your shell; this script never opens or prints any secrets file.
// Without a key it runs in template mode and says so; guard failures are then 0 by construction.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GUARD_REASONS, runRecap, type FallbackReason, type RecapResult } from '../shared/ai/pipeline.ts';
import { createTextProvider, resolveModel } from '../shared/ai/provider.ts';
import { cricketAdapter } from '../shared/sports/cricket/adapter.ts';
import type { Facts, Lang, MatchTimeline } from '../shared/sports/types.ts';

const LANGS: readonly Lang[] = ['en', 'hinglish', 'hi', 'gu'];
const MATCHES = ['pak-ind-2022-t20wc-mcg', 'ind-sa-2024-t20wc-final'] as const;
const WINDOW_EVENTS = 6;
const STRIDE = 5;
const TARGET = { wicket: 7, boundary: 7, quiet: 6 } as const; // = 20 windows
const SAMPLES_PER_LANG = 2; // = 8 samples
const TIMEOUT_MS = 8_000;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (id: string): MatchTimeline =>
  JSON.parse(readFileSync(join(root, 'data', 'matches', `${id}.json`), 'utf8')) as MatchTimeline;

type Kind = keyof typeof TARGET;
interface EvalWindow {
  readonly match: string;
  readonly from: number;
  readonly to: number;
  readonly kind: Kind;
  readonly facts: Facts;
}

function kindOf(tl: MatchTimeline, from: number, to: number): Kind {
  const evs = tl.events.slice(from, to + 1);
  if (evs.some((e) => e.kind === 'wicket')) return 'wicket';
  if (evs.some((e) => e.kind === 'four' || e.kind === 'six')) return 'boundary';
  return 'quiet';
}

/** Deterministic: the same 20 windows every run, spread over both matches and both innings. */
function pickWindows(): EvalWindow[] {
  const pools: Record<Kind, EvalWindow[]> = { wicket: [], boundary: [], quiet: [] };
  for (const id of MATCHES) {
    const tl = load(id);
    for (let from = 0; from + WINDOW_EVENTS <= tl.events.length; from += STRIDE) {
      const to = from + WINDOW_EVENTS - 1;
      const kind = kindOf(tl, from, to);
      pools[kind].push({ match: id, from, to, kind, facts: cricketAdapter.summarize(tl, from, to) });
    }
  }
  const out: EvalWindow[] = [];
  for (const kind of Object.keys(TARGET) as Kind[]) {
    const pool = pools[kind];
    const want = TARGET[kind];
    const step = Math.max(1, Math.floor(pool.length / want));
    for (let i = 0; i < want && i * step < pool.length; i += 1) {
      const w = pool[i * step];
      if (w) out.push(w);
    }
  }
  return out;
}

interface Row {
  readonly window: EvalWindow;
  readonly lang: Lang;
  readonly result: RecapResult;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Quota / overload / timeout: says nothing about prompt quality, so the eval waits and retries. */
const isTransient = (r: RecapResult): boolean =>
  r.reason === 'timeout' ||
  (r.reason === 'provider-error' && /\b(429|503|500|UNAVAILABLE|RESOURCE_EXHAUSTED)\b/.test(r.detail ?? ''));

const pct = (n: number, d: number): string => (d === 0 ? '0.0%' : `${((100 * n) / d).toFixed(1)}%`);
const isGuard = (r: FallbackReason | undefined): boolean => r !== undefined && GUARD_REASONS.includes(r);

async function main(): Promise<void> {
  const provider = createTextProvider({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    LLM_MODEL: process.env.LLM_MODEL,
  });
  const limit = Number(process.env.EVAL_LIMIT ?? 0);
  const all = pickWindows();
  const windows = limit > 0 ? all.slice(0, limit) : all;
  const jobs = windows.flatMap((window) => LANGS.map((lang) => ({ window, lang })));
  console.log(`Prompt eval: ${windows.length} windows x ${LANGS.length} languages = ${jobs.length} recaps`);
  console.log(
    provider
      ? `Mode: LIVE model ${resolveModel(process.env.LLM_MODEL)} (timeout ${TIMEOUT_MS} ms)`
      : 'Mode: TEMPLATE ONLY (no GEMINI_API_KEY in the environment): 0 model calls, so 0 guard failures by construction.',
  );

  // Sequential and paced: free/low tiers allow only a handful of requests per minute, and a 429 or
  // 503 says nothing about the prompts. Transient provider errors are retried with backoff here
  // (never in the endpoints, which must answer within seconds).
  const delayMs = Number(process.env.EVAL_DELAY_MS ?? 4000);
  const attempts = Number(process.env.EVAL_RETRIES ?? 3);
  const rows: Row[] = [];
  let retried = 0;
  for (const { window, lang } of jobs) {
    let result = await runRecap({ provider, timeoutMs: TIMEOUT_MS }, { facts: window.facts, lang });
    for (let a = 1; a <= attempts && provider && isTransient(result); a += 1) {
      retried += 1;
      await sleep(15_000 * a);
      result = await runRecap({ provider, timeoutMs: TIMEOUT_MS }, { facts: window.facts, lang });
    }
    rows.push({ window, lang, result });
    if (provider && delayMs > 0) await sleep(delayMs);
  }
  if (retried > 0) console.log(`(retried ${retried} transient provider errors with backoff)`);

  const ai = rows.filter((r) => r.result.source === 'ai');
  const fallbacks = rows.filter((r) => r.result.source === 'template');
  const reasons = new Map<FallbackReason, number>();
  for (const r of fallbacks) {
    if (r.result.reason) reasons.set(r.result.reason, (reasons.get(r.result.reason) ?? 0) + 1);
  }
  const guardFailures = fallbacks.filter((r) => isGuard(r.result.reason));
  const modelCalls = provider ? rows.length : 0;

  console.log('\n== Report ==');
  console.log(`Model calls:        ${modelCalls}`);
  console.log(`Accepted (ai):      ${ai.length}`);
  console.log(`Template fallbacks: ${fallbacks.length}`);
  console.log(
    `GUARD FAILURES:     ${guardFailures.length}  (${pct(guardFailures.length, modelCalls)} of model calls)`,
  );
  for (const [reason, n] of [...reasons].sort((a, b) => b[1] - a[1])) {
    console.log(
      `  - ${reason.padEnd(15)} ${String(n).padStart(3)}  (${isGuard(reason) ? 'guard' : 'infra'})`,
    );
  }
  const details = [...new Set(fallbacks.map((r) => r.result.detail).filter((d): d is string => Boolean(d)))];
  for (const d of details.slice(0, 3)) console.log(`  provider said: ${d}`);
  console.log('By language (guard failures / model calls):');
  for (const lang of LANGS) {
    const own = rows.filter((r) => r.lang === lang);
    const bad = own.filter((r) => isGuard(r.result.reason));
    console.log(`  ${lang.padEnd(9)} ${bad.length} / ${provider ? own.length : 0}`);
  }

  console.log('\n== Samples (display + speak) ==');
  for (const lang of LANGS) {
    const own = rows.filter((r) => r.lang === lang);
    const chosen = [...own.filter((r) => r.result.source === 'ai'), ...own].slice(0, SAMPLES_PER_LANG);
    for (const r of chosen) {
      const w = r.window;
      const why = r.result.reason ? ` reason=${r.result.reason}` : '';
      console.log(`\n[${lang}] ${w.match} seq ${w.from}-${w.to} (${w.kind}) source=${r.result.source}${why}`);
      console.log(`  lead : ${r.result.lead}`);
      console.log(`  body : ${r.result.body}`);
      console.log(`  speak: ${r.result.speak}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'eval failed');
  process.exitCode = 1;
});
