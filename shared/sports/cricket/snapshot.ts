import type { Fact, Lang, MatchTimeline } from '../types.ts';
import { bowlerFigures, getCricketState, shortName } from './state.ts';
import type { CricketBaseline, CricketState } from './stateTypes.ts';

const all = (s: string): Record<Lang, string> => ({ en: s, hinglish: s, hi: s, gu: s });

/**
 * Facts describing the match state at `position` (events played). They are the ONLY numbers the
 * Ask answers may use. Labels are complete phrases per language so answers can be built from them.
 */
export function snapshotFacts(timeline: MatchTimeline, position: number, baseline: CricketBaseline): Fact[] {
  return factsFromState(getCricketState(timeline, position, baseline));
}

/** Same facts from an already computed state (used with the innings-aware getCricketStateAt). */
export function factsFromState(s: CricketState): Fact[] {
  const facts: Fact[] = [
    {
      key: 'score',
      value: `${s.score}/${s.wkts}`,
      label: {
        en: `Score ${s.score}/${s.wkts}`,
        hinglish: `Score ${s.score}/${s.wkts}`,
        hi: `स्कोर ${s.score}/${s.wkts}`,
        gu: `સ્કોર ${s.score}/${s.wkts}`,
      },
    },
    {
      key: 'overs',
      value: s.overs,
      label: {
        en: `Overs ${s.overs}`,
        hinglish: `Overs ${s.overs}`,
        hi: `ओवर ${s.overs}`,
        gu: `ઓવર ${s.overs}`,
      },
    },
  ];
  if (s.need !== null) {
    const n = s.need;
    const b = s.ballsLeft;
    facts.push({
      key: 'need',
      value: n,
      label:
        n === 0
          ? {
              en: 'Target reached',
              hinglish: 'Target poora ho gaya',
              hi: 'लक्ष्य पूरा हो गया',
              gu: 'લક્ષ્ય પૂરું થયું',
            }
          : {
              en: `Need ${n} off ${b} balls`,
              hinglish: `${b} balls mein ${n} runs chahiye`,
              hi: `${b} गेंदों में ${n} रन चाहिए`,
              gu: `${b} બોલમાં ${n} રન જોઈએ`,
            },
    });
    facts.push({ key: 'ballsLeft', value: b, label: all(`${b}`) });
  }
  // Full words, not "CRR"/"RRR": these labels become Ask answers and are read aloud.
  if (s.crr !== null) {
    const n = s.crr.toFixed(2);
    facts.push({
      key: 'crr',
      value: s.crr,
      label: {
        en: `Run rate ${n}`,
        hinglish: `Run rate ${n}`,
        hi: `रन रेट ${n}`,
        gu: `રન રેટ ${n}`,
      },
    });
  }
  if (s.rrr !== null) {
    const n = s.rrr.toFixed(2);
    facts.push({
      key: 'rrr',
      value: s.rrr,
      label: {
        en: `Required run rate ${n}`,
        hinglish: `Zaroori run rate ${n}`,
        hi: `आवश्यक रन रेट ${n}`,
        gu: `જરૂરી રન રેટ ${n}`,
      },
    });
  }
  const { partnership: p } = s;
  const pText = `${p.runs} (${p.balls})`;
  facts.push({
    key: 'partnership',
    value: pText,
    label: {
      en: `Partnership ${pText}`,
      hinglish: `Partnership ${pText}`,
      hi: `साझेदारी ${pText}`,
      gu: `ભાગીદારી ${pText}`,
    },
  });
  for (const [key, b] of [
    ['striker', s.striker],
    ['nonStriker', s.nonStriker],
  ] as const) {
    const text = `${shortName(b.name)} ${b.runs} (${b.balls})`;
    facts.push({ key, value: text, label: all(text) });
  }
  const fig = `${shortName(s.bowler.name)} ${bowlerFigures(s.bowler)}`;
  facts.push({
    key: 'bowler',
    value: fig,
    label: {
      en: `Bowler: ${fig}`,
      hinglish: `Bowler: ${fig}`,
      hi: `गेंदबाज़: ${fig}`,
      gu: `બોલર: ${fig}`,
    },
  });
  return facts;
}
