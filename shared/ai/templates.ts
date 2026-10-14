import type { Fact, Facts, Lang } from '../sports/types.js';
import { spokenLang } from './lang.js';

// SERVER AND CLIENT SAFE. Deterministic fallbacks used whenever the model is unavailable or its
// output fails the guard. Text is assembled from fact VALUES and localized fact labels only, so
// every number is an engine number and the result is byte-identical for the same facts.
// `speak` is the same content for the ear: no symbols, no abbreviations; Hinglish is voiced from
// the Hindi (Devanagari) wording.

export interface RecapText {
  readonly lead: string;
  readonly body: string;
  readonly speak: string;
}

const item = (facts: Facts, key: string): Fact | undefined => facts.items.find((f) => f.key === key);
const num = (facts: Facts, key: string): number => {
  const v = item(facts, key)?.value;
  return typeof v === 'number' ? v : 0;
};
const str = (facts: Facts, key: string): string => {
  const v = item(facts, key)?.value;
  return typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';
};
const label = (f: Fact | undefined, lang: Lang): string => f?.label[lang]?.trim() ?? '';

const SCORE = /^(\d+)\/(\d+)$/;

interface Phrases {
  /** "2 wickets fell and 14 runs came off 6 balls." */
  readonly wicketLead: (w: number, r: number, b: number) => string;
  readonly boundaryLead: (r: number, b: number, sixes: number, fours: number) => string;
  readonly quietLead: (r: number, b: number) => string;
  readonly scoreShown: (score: string, overs: string) => string;
  readonly scoreSpoken: (runs: number, wkts: number, overs: string) => string;
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;
const join = (parts: readonly string[], and: string): string => parts.join(` ${and} `);

const EN: Phrases = {
  wicketLead: (w, r, b) =>
    `${plural(w, 'wicket', 'wickets')} fell and ${plural(r, 'run', 'runs')} came off ${plural(b, 'ball', 'balls')}.`,
  boundaryLead: (r, b, s, f) =>
    `${plural(r, 'run', 'runs')} came off ${plural(b, 'ball', 'balls')}, including ${join(
      [...(s > 0 ? [plural(s, 'six', 'sixes')] : []), ...(f > 0 ? [plural(f, 'four', 'fours')] : [])],
      'and',
    )}.`,
  quietLead: (r, b) => `A quiet stretch: ${plural(r, 'run', 'runs')} off ${plural(b, 'ball', 'balls')}.`,
  scoreShown: (score, overs) => `Score ${score} after ${overs} overs.`,
  scoreSpoken: (r, w, overs) => `The score is ${r} for ${w} after ${overs} overs.`,
};

const HINGLISH: Phrases = {
  wicketLead: (w, r, b) => `${w} wicket gira aur ${b} gend mein ${r} run bane.`,
  boundaryLead: (r, b, s, f) =>
    `${b} gend mein ${r} run bane, ${join(
      [...(s > 0 ? [`${s} chhakka`] : []), ...(f > 0 ? [`${f} chauka`] : [])],
      'aur',
    )} ke saath.`,
  quietLead: (r, b) => `Shaant stretch: ${b} gend mein ${r} run.`,
  scoreShown: (score, overs) => `Score ${score}, ${overs} over ke baad.`,
  scoreSpoken: (r, w, overs) => `${overs} over ke baad score ${r} par ${w} wicket.`,
};

const HI: Phrases = {
  wicketLead: (w, r, b) => `${w} विकेट ${w === 1 ? 'गिरा' : 'गिरे'} और ${b} गेंद में ${r} रन बने।`,
  boundaryLead: (r, b, s, f) =>
    `${b} गेंद में ${r} रन बने, ${join(
      [
        ...(s > 0 ? [`${s} ${s === 1 ? 'छक्का' : 'छक्के'}`] : []),
        ...(f > 0 ? [`${f} ${f === 1 ? 'चौका' : 'चौके'}`] : []),
      ],
      'और',
    )} के साथ।`,
  quietLead: (r, b) => `शांत दौर: ${b} गेंद में ${r} रन।`,
  scoreShown: (score, overs) => `स्कोर ${score}, ${overs} ओवर के बाद।`,
  scoreSpoken: (r, w, overs) => `${overs} ओवर के बाद स्कोर ${r} पर ${w} विकेट।`,
};

const GU: Phrases = {
  wicketLead: (w, r, b) => `${w} વિકેટ પડી અને ${b} બોલમાં ${r} રન બન્યા.`,
  boundaryLead: (r, b, s, f) =>
    `${b} બોલમાં ${r} રન બન્યા, ${join(
      [
        ...(s > 0 ? [`${s} ${s === 1 ? 'છગ્ગો' : 'છગ્ગા'}`] : []),
        ...(f > 0 ? [`${f} ${f === 1 ? 'ચોગ્ગો' : 'ચોગ્ગા'}`] : []),
      ],
      'અને',
    )} સાથે.`,
  quietLead: (r, b) => `શાંત તબક્કો: ${b} બોલમાં ${r} રન.`,
  scoreShown: (score, overs) => `સ્કોર ${score}, ${overs} ઓવર પછી.`,
  scoreSpoken: (r, w, overs) => `${overs} ઓવર પછી સ્કોર ${r} પર ${w} વિકેટ.`,
};

const PHRASES: Readonly<Record<Lang, Phrases>> = { en: EN, hinglish: HINGLISH, hi: HI, gu: GU };

function leadFor(facts: Facts, p: Phrases): string {
  const wkts = num(facts, 'wkts');
  const runs = num(facts, 'runs');
  const balls = num(facts, 'balls');
  const sixes = num(facts, 'sixes');
  const fours = num(facts, 'fours');
  if (wkts > 0) return p.wicketLead(wkts, runs, balls);
  if (sixes > 0 || fours > 0) return p.boundaryLead(runs, balls, sixes, fours);
  return p.quietLead(runs, balls);
}

/** The best-scoring batter of the window, as a localized label ("Kohli scored 22 off 7 balls"). */
function topBatter(facts: Facts, lang: Lang): string {
  const top = facts.items
    .filter((f) => f.key.startsWith('batter:') && Number(f.value) > 0)
    .sort((a, b) => Number(b.value) - Number(a.value))[0];
  return label(top, lang);
}

function bodyFor(facts: Facts, lang: Lang, speak: boolean): string {
  const p = PHRASES[speak ? spokenLang(lang) : lang];
  const l = speak ? spokenLang(lang) : lang;
  const parts: string[] = [];
  const batter = topBatter(facts, l);
  if (batter) parts.push(batter);
  const need = label(item(facts, 'needNow') ?? item(facts, 'need'), l);
  if (need) parts.push(need);
  const score = str(facts, 'score');
  const overs = str(facts, 'overs');
  const m = SCORE.exec(score);
  if (score && overs) {
    parts.push(speak && m ? p.scoreSpoken(Number(m[1]), Number(m[2]), overs) : p.scoreShown(score, overs));
  }
  return parts.map((s) => (/[.!?।]$/.test(s) ? s : `${s}${l === 'hi' ? '।' : '.'}`)).join(' ');
}

/** The recap shown when the model cannot (or may not) write it. Pure and deterministic. */
export function recapTemplate(facts: Facts, lang: Lang): RecapText {
  const lead = leadFor(facts, PHRASES[lang]);
  const body = bodyFor(facts, lang, false);
  const spokenLead = leadFor(facts, PHRASES[spokenLang(lang)]);
  const speak = `${spokenLead} ${bodyFor(facts, lang, true)}`.trim();
  return { lead, body, speak };
}

export { askTemplate, detectIntent } from './askTemplates.js';
export type { AnswerText, AskIntent } from './askTemplates.js';
