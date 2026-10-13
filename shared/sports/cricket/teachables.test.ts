import { describe, expect, it } from 'vitest';
import type { MatchTimeline, TimelineEvent } from '../types';
import { cricketAdapter } from './adapter';
import { getCricketStateAt } from './position';
import { ballData } from './ballData';
import { cricketTeachables } from './teachables';

const files = import.meta.glob(
  ['../../../data/matches/pak-ind-2022-t20wc-mcg.json', '../../../data/matches/ind-sa-2024-t20wc-final.json'],
  { eager: true, import: 'default' },
) as Record<string, MatchTimeline>;
const byId = Object.fromEntries(Object.values(files).map((tl) => [tl.meta.id, tl]));
const pakInd = byId['pak-ind-2022-t20wc-mcg'] as MatchTimeline;
const indSa = byId['ind-sa-2024-t20wc-final'] as MatchTimeline;

const at = (tl: MatchTimeline, seq: number): string[] => cricketTeachables(tl, seq);

describe('cricketTeachables: PAK v IND 2022', () => {
  it('flags the no-ball, then the free hit once, at 19.3-19.4', () => {
    expect(at(pakInd, 245)).toContain('no-ball');
    expect(at(pakInd, 246)).toEqual(expect.arrayContaining(['free-hit', 'wide']));
    // 19.4 is still a free-hit ball but it was already taught on the ball before.
    expect(at(pakInd, 247)).not.toContain('free-hit');
  });

  it('detects free-hit-bowled-not-out at 19.4 (3 byes) from the curated annotation, most specific first', () => {
    const e = pakInd.events[247] as TimelineEvent;
    expect([e.clock, e.kind]).toEqual(['19.4', 'bye']);
    expect(ballData(e).extrasDetail.byes).toBe(3);
    const ids = at(pakInd, 247);
    expect(ids[0]).toBe('free-hit-bowled-not-out');
    expect(ids).toContain('bye');
  });

  it('does NOT claim a bowled dismissal on a free-hit bye without the annotation', () => {
    const e = pakInd.events[247] as TimelineEvent;
    const rest: Record<string, unknown> = { ...e.data };
    for (const k of ['annotation', 'annotationNote', 'annotationSource']) delete rest[k];
    const plain: MatchTimeline = {
      ...pakInd,
      events: pakInd.events.map((x, i) => (i === 247 ? { ...e, data: rest } : x)),
    };
    expect(at(plain, 247)).not.toContain('free-hit-bowled-not-out');
    expect(at(plain, 247)).toContain('bye');
  });

  it('only annotates that one delivery in the whole match', () => {
    const hits = pakInd.events.filter((e) => at(pakInd, e.seq).includes('free-hit-bowled-not-out'));
    expect(hits.map((e) => e.seq)).toEqual([247]);
  });

  it('flags a stumping and the chase start (powerplay + required-rate)', () => {
    expect(at(pakInd, 248)).toContain('stumped');
    const firstInn2 = pakInd.events.findIndex((e) => e.period === 2);
    expect(at(pakInd, 0)).toContain('powerplay');
    expect(at(pakInd, 0)).not.toContain('required-rate');
    expect(at(pakInd, firstInn2)).toEqual(expect.arrayContaining(['powerplay', 'required-rate']));
    expect(at(pakInd, firstInn2 + 1)).not.toContain('powerplay');
  });

  it('is empty for an ordinary ball and for out-of-range positions', () => {
    const plain = pakInd.events.findIndex(
      (e, i) => i > 10 && i < 40 && e.kind === 'run' && ballData(e).runsBat === 1 && ballData(e).over > 0,
    );
    expect(at(pakInd, plain)).toEqual([]);
    expect(at(pakInd, -1)).toEqual([]);
    expect(at(pakInd, pakInd.events.length + 5)).toEqual([]);
  });
});

describe.each([
  ['PAK v IND', pakInd],
  ['IND v SA', indSa],
])('cricketTeachables invariants: %s', (_name, tl) => {
  it('maps every dismissal kind to its rule', () => {
    const map: Record<string, string> = {
      'run out': 'run-out',
      stumped: 'stumped',
      lbw: 'lbw',
      caught: 'caught',
      'caught and bowled': 'caught',
      bowled: 'bowled',
    };
    let seen = 0;
    for (const e of tl.events) {
      const w = ballData(e).wicket;
      if (!w) continue;
      seen += 1;
      const expected = map[w.kind];
      if (expected) expect(at(tl, e.seq), `seq ${e.seq} ${w.kind}`).toContain(expected);
    }
    expect(seen).toBeGreaterThan(5);
  });

  it('flags a maiden exactly on the closing ball of an over that conceded nothing', () => {
    const overs = new Map<string, TimelineEvent[]>();
    for (const e of tl.events) {
      const d = ballData(e);
      const key = `${d.inn}:${d.over}`;
      overs.set(key, [...(overs.get(key) ?? []), e]);
    }
    const expected: number[] = [];
    for (const evs of overs.values()) {
      const legal = evs.filter((e) => ballData(e).legal).length;
      const conceded = evs.reduce((n, e) => n + ballData(e).runsBat + ballData(e).extrasBowler, 0);
      const last = evs[evs.length - 1];
      if (legal === 6 && conceded === 0 && last) expected.push(last.seq);
    }
    const actual = tl.events.filter((e) => at(tl, e.seq).includes('maiden')).map((e) => e.seq);
    expect(actual).toEqual(expected);
  });

  it('never repeats the free-hit rule on consecutive free-hit balls', () => {
    for (let i = 1; i < tl.events.length; i += 1) {
      const prev = tl.events[i - 1] as TimelineEvent;
      const cur = tl.events[i] as TimelineEvent;
      if (ballData(prev).freeHit && ballData(cur).freeHit && prev.period === cur.period) {
        expect(at(tl, i)).not.toContain('free-hit');
      }
    }
  });
});

describe('adapter wiring', () => {
  it('exposes teachables on the cricket adapter', () => {
    expect(cricketAdapter.teachables(pakInd, 247)).toEqual(at(pakInd, 247));
    // state at the same position still works (no coupling)
    expect(getCricketStateAt(pakInd, 248).period).toBe(2);
  });
});
