import { LANG_ATTR, STRINGS, type Strings } from '@shared/i18n/strings';
import type { Lang } from '@shared/sports/types';
import { useSettings } from '@/features/settings/settingsStore';

export interface I18n {
  readonly lang: Lang;
  /** Value for the `lang` attribute of text in the current language. */
  readonly langAttr: string;
  readonly t: Strings;
}

/** Current language + its strings. Re-renders when the language changes. */
export function useStrings(): I18n {
  const { lang } = useSettings();
  return { lang, langAttr: LANG_ATTR[lang], t: STRINGS[lang] };
}

export { format } from '@shared/i18n/format';
