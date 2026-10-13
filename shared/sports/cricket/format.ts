// Pure, dependency-free cricket formatting helpers (safe to import from anywhere).

export const BALLS_PER_OVER = 6;
export const WICKETS_IN_INNINGS = 10;

export const round2 = (n: number): number => Math.round(n * 100) / 100;

/** 102 legal balls -> '17.0'; 105 -> '17.3'. */
export function formatOvers(legalBalls: number): string {
  return `${Math.floor(legalBalls / BALLS_PER_OVER)}.${legalBalls % BALLS_PER_OVER}`;
}

/** Bowling overs in the scorecard: whole overs print without '.0' ('3'), partial as '3.2'. */
export function bowlingOvers(legalBalls: number): string {
  return legalBalls % BALLS_PER_OVER === 0 ? String(legalBalls / BALLS_PER_OVER) : formatOvers(legalBalls);
}

// Display names that differ from the plain surname (first-name fans, surname clashes such as
// SA Yadav / Kuldeep Yadav, or surnames that are not a usable name like 'Singh'). Cricsheet names
// only; anything not listed falls back to the surname (keeping lower-case particles: 'de Kock').
const DISPLAY_NAMES: Readonly<Record<string, string>> = {
  'Babar Azam': 'Babar',
  'SA Yadav': 'Suryakumar',
  'Kuldeep Yadav': 'Kuldeep',
  'Arshdeep Singh': 'Arshdeep',
  'Naseem Shah': 'Naseem',
  'Shaheen Shah Afridi': 'Afridi',
  'Shadab Khan': 'Shadab',
  'Iftikhar Ahmed': 'Iftikhar',
  'Asif Ali': 'Asif',
  'Haider Ali': 'Haider',
  'B Kumar': 'Bhuvneshwar',
};

/** 'V Kohli' -> 'Kohli', 'Mohammad Nawaz' -> 'Nawaz', 'Q de Kock' -> 'de Kock'. */
export function shortName(name: string): string {
  const full = name.trim().replace(/\s+/g, ' ');
  const known = DISPLAY_NAMES[full];
  if (known) return known;
  const parts = full.split(' ');
  let i = parts.length - 1;
  while (i > 1 && /^[a-z]/.test(parts[i - 1] ?? '')) i -= 1;
  return parts.slice(i).join(' ') || name;
}

/** 'c Babar b Nawaz', 'run out (Kohli)', 'b Rauf', 'lbw b Shami', 'retired hurt'. */
export function dismissalText(
  kind: string,
  fielder: string | null,
  bowler: string,
  bowlerCredited: boolean,
): string {
  const f = fielder ? shortName(fielder) : '';
  const b = shortName(bowler);
  if (kind === 'caught') return f === b || f === '' ? `c & b ${b}` : `c ${f} b ${b}`;
  if (kind === 'caught and bowled') return `c & b ${b}`;
  if (kind === 'stumped') return `st ${f} b ${b}`;
  if (kind === 'lbw') return `lbw b ${b}`;
  if (kind === 'bowled') return `b ${b}`;
  if (kind === 'run out') return f ? `run out (${f})` : 'run out';
  return bowlerCredited ? `${kind} b ${b}` : kind;
}

/** Runs per over with two decimals, or null before the first legal ball. */
export function runRate(runs: number, legalBalls: number): number | null {
  return legalBalls > 0 ? round2((runs * BALLS_PER_OVER) / legalBalls) : null;
}

/** Parses '17.0' / '19.3' into a legal-ball count (102 / 117). Returns null when malformed. */
export function clockToLegalBalls(clock: string): number | null {
  const m = /^(\d+)\.([0-6])$/.exec(clock.trim());
  if (!m) return null;
  return Number(m[1]) * BALLS_PER_OVER + Number(m[2]);
}
