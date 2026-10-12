import type { Lang } from '@shared/sports/types';
import { Chip } from '@/components/Chip';
import { format, useStrings } from '@/i18n/useStrings';

export interface LangChipProps {
  /** Opens the LanguageSheet. */
  readonly onClick: () => void;
}

/** Short name of each language in its own script, and the `lang` its text should render with. */
export const LANG_CHIP: Readonly<Record<Lang, { short: string; name: string; attr: string }>> = {
  en: { short: 'EN', name: 'English', attr: 'en' },
  hinglish: { short: 'Hing', name: 'Hinglish', attr: 'en-IN' },
  hi: { short: 'हिं', name: 'हिंदी', attr: 'hi' },
  gu: { short: 'ગુ', name: 'ગુજરાતી', attr: 'gu' },
};

export function LangChip({ onClick }: LangChipProps) {
  const { lang, t } = useStrings();
  const chip = LANG_CHIP[lang];
  return (
    <Chip onClick={onClick} label={format(t.languageChipLabel, { name: chip.name })}>
      <span lang={chip.attr}>{chip.short}</span>
    </Chip>
  );
}
