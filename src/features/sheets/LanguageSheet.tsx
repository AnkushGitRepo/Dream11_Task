import type { Lang } from '@shared/sports/types';
import { BottomSheet } from '@/components/BottomSheet';
import { updateSettings } from '@/features/settings/settingsStore';
import { useStrings } from '@/i18n/useStrings';
import { RadioGroup } from './RadioGroup';
import type { RadioOption } from './RadioGroup';

export interface LanguageSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /** Voice detection is owned by the voice feature. True when a TTS voice exists for `lang`. */
  readonly hasVoice: (lang: Lang) => boolean;
}

// Own-script names and English sub-labels are fixed by design (DESIGN_PROMPT §1.6).
const ROWS: readonly { value: Lang; label: string; sub: string; lang: string }[] = [
  { value: 'en', label: 'English', sub: 'English', lang: 'en' },
  { value: 'hinglish', label: 'Hinglish', sub: 'Hindi in English letters', lang: 'en-IN' },
  { value: 'hi', label: 'हिंदी', sub: 'Hindi', lang: 'hi' },
  { value: 'gu', label: 'ગુજરાતી', sub: 'Gujarati', lang: 'gu' },
];

/** Four large radio rows. Choosing one updates settings immediately and closes the sheet. */
export function LanguageSheet({ open, onClose, hasVoice }: LanguageSheetProps) {
  const { lang, t } = useStrings();
  const options: RadioOption<Lang>[] = ROWS.map((row) => ({
    value: row.value,
    label: row.label,
    sub: row.sub,
    lang: row.lang,
    note: (row.value === 'hi' || row.value === 'gu') && !hasVoice(row.value) ? t.voiceUnavailable : undefined,
  }));

  return (
    <BottomSheet open={open} onClose={onClose} title={t.languageTitle}>
      <RadioGroup
        label={t.languageTitle}
        options={options}
        value={lang}
        onChange={(next) => {
          updateSettings({ lang: next });
          onClose();
        }}
      />
    </BottomSheet>
  );
}
