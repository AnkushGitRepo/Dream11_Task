import type { MatchMeta } from '../types.ts';
import { asArr, asObj, asStr, teamCode, type Obj } from './rawParse.ts';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function resultText(info: Obj): string | undefined {
  if (info.outcome === undefined) return undefined;
  const o = asObj(info.outcome, 'info.outcome');
  const winner = typeof o.winner === 'string' ? o.winner : null;
  const by = o.by === undefined ? null : asObj(o.by, 'info.outcome.by');
  const dl = o.method === 'D/L' ? ' (D/L method)' : '';
  if (winner && by && typeof by.runs === 'number')
    return `${winner} won by ${plural(by.runs, 'run', 'runs')}${dl}`;
  if (winner && by && typeof by.wickets === 'number') {
    return `${winner} won by ${plural(by.wickets, 'wicket', 'wickets')}${dl}`;
  }
  if (winner) return `${winner} won${typeof o.eliminator === 'string' ? ' (super over)' : ''}${dl}`;
  return typeof o.result === 'string' ? o.result.charAt(0).toUpperCase() + o.result.slice(1) : undefined;
}

export function buildMeta(info: Obj, teamNames: string[]): MatchMeta {
  const event = info.event === undefined ? {} : asObj(info.event, 'info.event');
  const dates = asArr(info.dates, 'info.dates');
  const date = asStr(dates[0], 'info.dates[0]');
  const venue = typeof info.venue === 'string' ? info.venue : undefined;
  const stage =
    typeof event.stage === 'string'
      ? event.stage
      : typeof event.match_number === 'number'
        ? `Match ${event.match_number}`
        : undefined;
  const subtitle = [typeof event.name === 'string' ? event.name : undefined, stage, venue]
    .filter((s): s is string => typeof s === 'string')
    .join(' · ');
  const result = resultText(info);
  const teams = teamNames.map((name) => ({ code: teamCode(name), name }));
  return {
    id: `${teams.map((t) => t.code.toLowerCase()).join('-')}-${date}`,
    sport: 'cricket',
    title: teamNames.join(' vs '),
    subtitle,
    format: typeof info.match_type === 'string' ? info.match_type : 'T20',
    date,
    teams,
    ...(venue ? { venue } : {}),
    ...(result ? { result } : {}),
    source: 'Cricsheet',
    license: 'ODC-BY 1.0',
  };
}
