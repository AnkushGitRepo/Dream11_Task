import type { ComponentType, ReactNode } from 'react';
import type { EventTone, Fact, Lang, MatchTimeline } from '@shared/sports/types';

/** Props every sport's score slots receive. Sport-agnostic: the sport module derives its own state. */
export interface SportScoreProps {
  readonly timeline: MatchTimeline;
  /** Events played so far (0..n). Latest event seq = position - 1. */
  readonly position: number;
  /** Sport-specific starting state for replays that begin mid-match (narrowed inside the sport module). */
  readonly baseline: unknown;
  /** ReplayControl element rendered inside the hero's top row. */
  readonly replay?: ReactNode;
}

export interface SportGap {
  /** Countable units missed (cricket: legal balls). */
  readonly count: number;
  /** Human text for the banner, e.g. "12 balls · 2 overs" (English; fallback). */
  readonly label: string;
  /** The same text per language. Optional: pick `labels?.[lang] ?? label`. */
  readonly labels?: Readonly<Record<Lang, string>>;
}

/** A Moments-tab filter chip: label per language + the event tones it keeps. */
export interface SportMomentFilter {
  readonly id: string;
  readonly label: Readonly<Record<Lang, string>>;
  readonly tones: readonly EventTone[];
}

/** Sport-specific UI + helpers plugged into the generic Match Room. */
export interface SportUi {
  readonly ScoreHero: ComponentType<SportScoreProps>;
  /** 56px collapsed sticky bar shown once the hero scrolls out of view. */
  readonly ScoreBar: ComponentType<SportScoreProps>;
  /** Units missed between two replay positions (drives AwayBanner). */
  readonly gap: (timeline: MatchTimeline, fromPosition: number, toPosition: number) => SportGap;
  /** Moments-tab filter chips (first = default, normally "All"). */
  readonly momentFilters: readonly SportMomentFilter[];
  /** Localised labels for `TimelineEvent.kind` shown on moment rows; unknown kinds fall back to the raw kind. */
  readonly momentKindLabels: Readonly<Record<string, Readonly<Record<Lang, string>>>>;
  /** Minimum count that counts as a meaningful gap (cricket: 6 legal balls). */
  readonly minGap: number;
  /** Clock label of the state before event 0 (cricket: '17.0'). */
  readonly startClock: (baseline: unknown) => string;
  /** Positions to jump forward for "Simulate stepping away" (cricket: 12 legal balls). */
  readonly positionAfterGap: (timeline: MatchTimeline, fromPosition: number, count: number) => number;
  /** Facts computed from data for a replay window [fromPosition, toPosition). Never AI-written. */
  readonly facts: (
    timeline: MatchTimeline,
    fromPosition: number,
    toPosition: number,
    baseline: unknown,
  ) => Fact[];
  /** Facts describing the state right now (Ask context). The only numbers an answer may use. */
  readonly snapshot: (timeline: MatchTimeline, position: number, baseline: unknown) => Fact[];
}
