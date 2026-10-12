import type { EventTone } from '@shared/sports/types';

/** A selectable moments filter (sport supplies them; core knows only tones). */
export interface MomentFilter {
  readonly id: string;
  readonly label: string;
  /** Events whose tone is in this list pass the filter. */
  readonly tones: readonly EventTone[];
}

/** Resolve a per-language label map for the current language, falling back to `fallback`. */
export function pickLabels(
  labels: Readonly<Record<string, Readonly<Record<string, string>>>>,
  lang: string,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(labels).flatMap(([k, v]) => (v[lang] !== undefined ? [[k, v[lang]]] : [])),
  );
}
