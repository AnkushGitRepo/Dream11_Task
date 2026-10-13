// Cricsheet raw JSON -> data/matches/<slug>.json (MatchTimeline) + data/matches/index.json.
// Run: npm run data:build  (node --experimental-strip-types; no deps; erasable TS only).
// All conversion lives in the cricket adapter (shared/sports/cricket/normalize.ts): one implementation.
// Output is deterministic (stable key order, 2-space indent) so reruns produce no diff.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeCricsheet } from '../shared/sports/cricket/normalize.ts';

// Facts the ball-by-ball data cannot show, added by hand and attributed. Each entry must match
// exactly one delivery or the build fails, so a data change can never silently move a label.
interface Annotation {
  readonly period: number;
  readonly clock: string;
  readonly kind: string;
  readonly annotation: string;
  /** One sentence per language, shown as "in this match" when the rule is explained. */
  readonly note: Readonly<Record<'en' | 'hinglish' | 'hi' | 'gu', string>>;
  readonly source: string;
}

interface MatchConfig {
  readonly cricsheetId: string;
  readonly slug: string;
  readonly hook: string; // editorial one-liner for the match card
  readonly annotations?: readonly Annotation[];
}

const MATCHES: readonly MatchConfig[] = [
  {
    cricsheetId: '1298150',
    slug: 'pak-ind-2022-t20wc-mcg',
    hook: 'Last-ball thriller',
    annotations: [
      {
        // Nawaz bowled Kohli on the free hit (after the no-ball): not out, and 3 byes were run.
        // Cricsheet records only "3 byes"; the bowled dismissal that did not count is not in the data.
        period: 2,
        clock: '19.4',
        kind: 'bye',
        annotation: 'bowled-on-free-hit',
        note: {
          en: 'Kohli was bowled on the free hit, so he was not out: the ball stayed live and 3 byes were run.',
          hinglish: 'Kohli free hit par bowled hue, isliye out nahi: ball live rahi aur 3 byes daude gaye.',
          hi: 'कोहली फ्री हिट पर बोल्ड हुए, इसलिए आउट नहीं: गेंद लाइव रही और 3 बाई दौड़ी गईं।',
          gu: 'કોહલી ફ્રી હિટ પર બોલ્ડ થયા, એટલે આઉટ નહીં: બોલ લાઇવ રહ્યો અને 3 બાય દોડાયા.',
        },
        source: 'Curated by hand from the match broadcast; not present in the Cricsheet data',
      },
    ],
  },
  { cricsheetId: '1415755', slug: 'ind-sa-2024-t20wc-final', hook: 'India won by 7 runs' },
];

const DEFAULT_START = { period: 2, over: 17 } as const;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rawDir = join(root, 'data', 'raw');
const outDir = join(root, 'data', 'matches');

interface EventLike {
  readonly seq: number;
  readonly period: number;
  readonly data: Record<string, unknown>;
}

function inningsSummary(events: readonly EventLike[], period: number) {
  const inn = events.filter((e) => e.period === period);
  const last = inn[inn.length - 1];
  return {
    team: String(last?.data.team ?? ''),
    score: Number(last?.data.score ?? 0),
    wkts: Number(last?.data.wkts ?? 0),
    legalBalls: inn.filter((e) => e.data.legal === true).length,
  };
}

function defaultStartSeq(events: readonly EventLike[]): number {
  const e = events.find((x) => x.period === DEFAULT_START.period && x.data.over === DEFAULT_START.over);
  if (!e) throw new Error(`no delivery at period ${DEFAULT_START.period} over ${DEFAULT_START.over}`);
  return e.seq;
}

const json = (v: unknown): string => `${JSON.stringify(v, null, 2)}\n`;

function applyAnnotations<E extends EventLike & { clock: string; kind: string }>(
  events: readonly E[],
  annotations: readonly Annotation[] = [],
): E[] {
  const out = [...events];
  for (const a of annotations) {
    const hits = out.filter((e) => e.period === a.period && e.clock === a.clock && e.kind === a.kind);
    const [hit] = hits;
    if (hits.length !== 1 || !hit) {
      throw new Error(
        `annotation ${a.annotation} @ ${a.period}/${a.clock}/${a.kind}: ${hits.length} matches`,
      );
    }
    out[hit.seq] = {
      ...hit,
      data: { ...hit.data, annotation: a.annotation, annotationNote: a.note, annotationSource: a.source },
    };
  }
  return out;
}

mkdirSync(outDir, { recursive: true });
const index: unknown[] = [];

for (const m of MATCHES) {
  const raw: unknown = JSON.parse(readFileSync(join(rawDir, `${m.cricsheetId}.json`), 'utf8'));
  const tl = normalizeCricsheet(raw);
  const events = applyAnnotations(tl.events, m.annotations);
  const timeline = { meta: { ...tl.meta, id: m.slug }, events };
  const file = `${m.slug}.json`;
  writeFileSync(join(outDir, file), json(timeline));

  const periods = [...new Set(tl.events.map((e) => e.period))].sort();
  const innings = periods.map((p) => inningsSummary(tl.events, p));
  index.push({
    ...timeline.meta,
    cricsheetId: m.cricsheetId,
    file,
    events: tl.events.length,
    innings,
    hook: m.hook,
    featured: true,
    playable: true,
    defaultStart: DEFAULT_START,
    defaultStartSeq: defaultStartSeq(tl.events),
  });
  const line = innings.map((i) => `${i.team} ${i.score}/${i.wkts} (${i.legalBalls} legal balls)`).join('  ');
  console.log(`${m.slug}: ${tl.events.length} events  ${line}  | ${timeline.meta.result ?? ''}`);
}

writeFileSync(join(outDir, 'index.json'), json({ matches: index }));
console.log(`wrote ${index.length} matches + index.json to data/matches`);
