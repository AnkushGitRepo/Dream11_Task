import { useMemo } from 'react';
import { ballA11y, cricketLabel, type CricketLabelKey } from '@shared/sports/cricket/labels';
import type { BallView } from '@shared/sports/cricket/state';
import type { Lang } from '@shared/sports/types';
import { useSettings } from '@/features/settings/settingsStore';

export type LabelValues = Readonly<Record<string, string | number>>;

export interface CricketText {
  readonly lang: Lang;
  readonly text: (key: CricketLabelKey, values?: LabelValues) => string;
  /** Localised screen-reader text for a ball; falls back to the data's own text. */
  readonly ball: (ball: BallView) => string;
}

/** Cricket UI wording in the user's language. Re-renders when the language changes. */
export function useCricketText(): CricketText {
  const { lang } = useSettings();
  return useMemo(
    () => ({
      lang,
      text: (key, values) => cricketLabel(lang, key, values),
      ball: (ball) => ballA11y(lang, ball) ?? ball.a11y,
    }),
    [lang],
  );
}
