// Defensive accessors for Cricsheet JSON. Anything unexpected throws a clear Error naming the path.

export type Obj = Readonly<Record<string, unknown>>;

export function fail(path: string, msg: string): never {
  throw new Error(`cricket normalize: ${path} ${msg}`);
}

export function asObj(v: unknown, path: string): Obj {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return fail(path, 'must be an object');
  return v as Obj;
}

export function asArr(v: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(v)) return fail(path, 'must be an array');
  return v as readonly unknown[];
}

export function asStr(v: unknown, path: string): string {
  if (typeof v !== 'string' || v.trim() === '') return fail(path, 'must be a non-empty string');
  return v;
}

export function asNum(v: unknown, path: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
    return fail(path, 'must be a non-negative number');
  }
  return v;
}

/** Optional numeric field: missing -> 0, wrong type -> throws. */
export function optNum(o: Obj, key: string, path: string): number {
  return o[key] === undefined ? 0 : asNum(o[key], `${path}.${key}`);
}

const TEAM_CODES: Readonly<Record<string, string>> = {
  India: 'IND',
  Pakistan: 'PAK',
  'South Africa': 'SA',
  Australia: 'AUS',
  England: 'ENG',
  'New Zealand': 'NZ',
  'Sri Lanka': 'SL',
  Bangladesh: 'BAN',
  'West Indies': 'WI',
  Afghanistan: 'AFG',
  Ireland: 'IRE',
  Zimbabwe: 'ZIM',
  Netherlands: 'NED',
  Scotland: 'SCO',
  Nepal: 'NEP',
  'United States of America': 'USA',
};

/** 'India' -> 'IND'. Unknown teams: initials for multi-word names, first 3 letters otherwise. */
export function teamCode(name: string): string {
  const known = TEAM_CODES[name];
  if (known) return known;
  const words = name.trim().split(/\s+/);
  const code = words.length > 1 ? words.map((w) => w[0] ?? '').join('') : name.slice(0, 3);
  return code.toUpperCase();
}
