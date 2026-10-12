// Landing copy. English marketing text; only the language showcase is multilingual.
// Every figure is sourced in docs/PRD.md (Evidence + Sources). Do not add unsourced numbers.

export const DEMO_PATH = '/match/pak-ind-2022-t20wc-mcg';
export const MATCHES_PATH = '/matches';

export interface ProblemStat {
  readonly big: string;
  readonly caption: string;
  readonly source: string;
}

export const PROBLEM_STATS: readonly ProblemStat[] = [
  {
    big: '80%',
    caption: 'of sports fans already use a second screen during live matches.',
    source: 'analyticsinsight.net, storyboard18.com',
  },
  {
    big: 'Lag',
    caption:
      'Fans report streams running balls behind the real match, so score apps spoil moments before the video shows them.',
    source: 'm9.news (Mar 2025); app-review analysis, unstar.app (2026)',
  },
  {
    big: '+42%',
    caption: 'regional-language cricket watch-time growth, IPL 2026 vs the previous edition.',
    source: 'deccanherald.com',
  },
];

export const STEPS: readonly { readonly title: string; readonly text: string }[] = [
  { title: 'Step away', text: 'Ad break, chai, phone call. The match keeps moving without you.' },
  { title: 'Come back, tap once', text: 'One tap and you get exactly what you missed, in your language.' },
  { title: 'Ask anything — by voice', text: 'Who is on strike? How many needed? Just say it, or type it.' },
];

export const PIPELINE: readonly { readonly title: string; readonly tag: string; readonly ai?: true }[] = [
  { title: 'Ball-by-ball data', tag: 'Source' },
  { title: 'Stats engine', tag: 'Code' },
  { title: 'AI writes the sentence', tag: 'AI', ai: true },
  { title: 'Number check', tag: 'Code' },
];

export const GUARD_SENTENCE =
  'Every number in the AI’s sentence is checked against the stats engine; if one does not match, a plain template replaces it.';

export const SPORTS: readonly { readonly name: string; readonly live: boolean }[] = [
  { name: 'Cricket', live: true },
  { name: 'Football', live: false },
  { name: 'Kabaddi', live: false },
  { name: 'Hockey', live: false },
];

// TODO: link each source to its exact article URL once the URLs are recorded (only domains are known).
export const SOURCES: readonly string[] = [
  'analyticsinsight.net',
  'storyboard18.com',
  'respawn.outlookindia.com',
  'm9.news',
  'unstar.app',
  'deccanherald.com',
];
