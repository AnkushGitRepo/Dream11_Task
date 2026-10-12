import type { Lang } from '@shared/sports/types';
import type { SportMomentFilter } from '../../types';

type L = Readonly<Record<Lang, string>>;
const l = (en: string, hinglish: string, hi: string, gu: string): L => ({ en, hinglish, hi, gu });

// Cricket-specific moment filters and event-kind labels (4 languages).
export const MOMENT_FILTERS: readonly SportMomentFilter[] = [
  {
    id: 'all',
    label: l('All', 'Sab', 'सभी', 'બધા'),
    tones: ['major', 'big', 'good', 'minor', 'none'],
  },
  { id: 'wickets', label: l('Wickets', 'Wicket', 'विकेट', 'વિકેટ'), tones: ['major'] },
  { id: 'boundaries', label: l('Boundaries', 'Boundary', 'बाउंड्री', 'બાઉન્ડરી'), tones: ['big', 'good'] },
];

export const MOMENT_KIND_LABELS: Readonly<Record<string, L>> = {
  dot: l('Dot', 'Dot', 'डॉट', 'ડોટ'),
  run: l('Runs', 'Runs', 'रन', 'રન'),
  four: l('Four', 'Chauka', 'चौका', 'ચોગ્ગો'),
  six: l('Six', 'Chhakka', 'छक्का', 'છગ્ગો'),
  wicket: l('Wicket', 'Wicket', 'विकेट', 'વિકેટ'),
  caught: l('Caught', 'Catch', 'कैच', 'કેચ'),
  stumped: l('Stumped', 'Stumped', 'स्टंप', 'સ્ટમ્પ'),
  wide: l('Wide', 'Wide', 'वाइड', 'વાઇડ'),
  noball: l('No ball', 'No ball', 'नो बॉल', 'નો બોલ'),
  bye: l('Bye', 'Bye', 'बाई', 'બાય'),
  legbye: l('Leg bye', 'Leg bye', 'लेग बाई', 'લેગ બાય'),
};
