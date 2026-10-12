import type { Fact, Lang } from '@shared/sports/types';
import { MOCK_BASELINE, mockTimeline } from '@/mocks/match.mock';
import { buildRecapText } from '@/services/mockApi';
import type { RecapEntry } from '@/features/catchup/types';
import { getSportUi } from '@/sports/uiRegistry';

/** Replay position the demo starts at, and how many idle ticks play before "stepping away". */
const START = 2;
const TICKS = 2;
const AWAY_BALLS = 12;

export interface DemoWindow {
  readonly from: number;
  readonly to: number;
  readonly clock: string;
  readonly label: string;
  readonly facts: readonly Fact[];
}

export interface DemoStep {
  readonly position: number;
  readonly banner: boolean;
  readonly recap: boolean;
  readonly ms: number;
}

export interface DemoModel {
  readonly window: DemoWindow;
  readonly steps: readonly DemoStep[];
}

let cached: DemoModel | null = null;

/** All numbers come from the sport engine (facts + gap); nothing is hard-coded here. */
export function getDemoModel(): DemoModel {
  if (cached) return cached;
  const ui = getSportUi(mockTimeline.meta.sport);
  if (!ui) throw new Error('Landing demo needs a registered sport UI');
  const from = START + TICKS;
  const to = ui.positionAfterGap(mockTimeline, from, AWAY_BALLS);
  const window: DemoWindow = {
    from,
    to,
    clock: mockTimeline.events[from - 1]?.clock ?? ui.startClock(MOCK_BASELINE),
    label: ui.gap(mockTimeline, from, to).label,
    facts: ui.facts(mockTimeline, from, to, MOCK_BASELINE),
  };
  const idle = (i: number, ms: number): DemoStep => ({
    position: START + i,
    banner: false,
    recap: false,
    ms,
  });
  const steps: readonly DemoStep[] = [
    idle(0, 1600),
    idle(1, 1200),
    idle(2, 1200),
    { position: to, banner: true, recap: false, ms: 2400 },
    { position: to, banner: false, recap: true, ms: 6000 },
  ];
  cached = { window, steps };
  return cached;
}

/** The same recap window rendered in one language (template text, source 'template'). */
export function demoRecapEntry(lang: Lang): RecapEntry {
  const { window } = getDemoModel();
  const { lead, body } = buildRecapText(window.facts, lang);
  return {
    id: 0,
    lang,
    fromPosition: window.from,
    toPosition: window.to,
    clock: window.clock,
    label: window.label,
    facts: window.facts,
    speakOnArrival: false,
    status: 'ready',
    recap: { lead, body, source: 'template' },
  };
}
