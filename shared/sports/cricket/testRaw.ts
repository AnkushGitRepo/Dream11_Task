// Builders for hand-made Cricsheet-shaped raw objects used by the edge-case tests.

export type Raw = Record<string, unknown>;

export interface D {
  b?: string; // batter
  n?: string; // non-striker
  w?: string; // bowler
  runs?: number; // off the bat
  ex?: Record<string, number>;
  out?: { who: string; kind: string; by?: string };
  extrasTotal?: number;
}

function delivery(d: D): Raw {
  const ex = d.ex ?? {};
  const extrasTotal = d.extrasTotal ?? Object.values(ex).reduce((a, v) => a + v, 0);
  const runs = d.runs ?? 0;
  return {
    batter: d.b ?? 'A Bat',
    bowler: d.w ?? 'X Bowl',
    non_striker: d.n ?? 'B Bat',
    runs: { batter: runs, extras: extrasTotal, total: runs + extrasTotal },
    ...(Object.keys(ex).length > 0 ? { extras: ex } : {}),
    ...(d.out
      ? {
          wickets: [
            { player_out: d.out.who, kind: d.out.kind, fielders: d.out.by ? [{ name: d.out.by }] : [] },
          ],
        }
      : {}),
  };
}

export function innings(team: string, overs: D[][], extra: Raw = {}): Raw {
  return {
    team,
    overs: overs.map((o, i) => ({ over: i, deliveries: o.map(delivery) })),
    ...extra,
  };
}

export function match(inns: Raw[], info: Raw = {}): Raw {
  return {
    info: {
      balls_per_over: 6,
      overs: 20,
      dates: ['2024-01-01'],
      teams: ['Alpha', 'Beta'],
      event: { name: 'Test Cup', match_number: 1 },
      venue: 'Test Ground',
      ...info,
    },
    innings: inns,
  };
}
