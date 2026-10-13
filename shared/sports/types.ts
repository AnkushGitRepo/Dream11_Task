export type SportId = 'cricket' | 'football' | 'kabaddi';
export type Lang = 'en' | 'hinglish' | 'hi' | 'gu';
export type EventTone = 'major' | 'big' | 'good' | 'minor' | 'none'; // maps to --c-ev-* tokens

export interface TimelineEvent {
  seq: number; // 0..n-1, the only cursor the app uses
  clock: string; // display label: '16.3' (cricket) | "67'" (football)
  period: number; // innings / half
  kind: string; // sport-specific: 'dot'|'run'|'four'|'six'|'wicket'|'wide'… | 'goal'…
  tone: EventTone;
  text: string; // short factual description from data (not AI)
  data: Record<string, unknown>; // sport-specific payload (typed inside the adapter)
}

export interface MatchMeta {
  id: string;
  sport: SportId;
  title: string;
  subtitle: string;
  format: string;
  date: string;
  teams: { code: string; name: string }[];
  venue?: string;
  result?: string;
  source: string;
  license: string;
  /**
   * Set when `events` is a window of the full match: the real timeline seq of events[0]. The
   * server resolves client seqs as `seqBase + seq`. Absent (= 0) for a complete timeline.
   */
  seqBase?: number;
}
export interface MatchTimeline {
  meta: MatchMeta;
  events: TimelineEvent[];
}

export interface Fact {
  key: string;
  value: number | string;
  label: Record<Lang, string>;
}
export interface Facts {
  window: { fromSeq: number; toSeq: number; fromClock: string; toClock: string };
  items: Fact[];
  highlights: string[];
  numbers: number[]; // numbers = every number the AI may use
}

/** One curated rule. Hand-written and checked; the AI never writes or alters it. */
export interface RuleEntry {
  id: string;
  term: Record<Lang, string>;
  short: Record<Lang, string>; // 1 sentence, <= 25 words
  detail: Record<Lang, string>; // <= 3 sentences
  related: string[]; // ids of other entries in the same rulebook
}

export interface SportAdapter<S = unknown> {
  id: SportId;
  normalize(raw: unknown): MatchTimeline; // offline, in scripts/
  getState(tl: MatchTimeline, seq: number): S; // UI scoreboard + Ask context
  summarize(tl: MatchTimeline, fromSeq: number, toSeq: number): Facts; // Catch-up facts
  askContext(tl: MatchTimeline, seq: number): Facts; // compact state + scorecard as facts
  isMeaningfulGap(tl: MatchTimeline, fromSeq: number, toSeq: number): boolean; // e.g. ≥ 6 legal balls
  suggestedQuestions(lang: Lang, state: S): string[];
  /** Rule ids worth explaining for event `seq` (may look at earlier events). Empty when none. */
  teachables(tl: MatchTimeline, seq: number): string[];
}
