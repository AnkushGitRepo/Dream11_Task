import type { ReplaySpeed } from '@/features/replay';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { updateSettings, useSettings } from '@/features/settings/settingsStore';
import type { Theme, VoiceRate } from '@/features/settings/settingsStore';
import { useStrings } from '@/i18n/useStrings';
import { RadioGroup } from './RadioGroup';
import { Switch } from './Switch';
import styles from './SettingsSheet.module.scss';

export interface SettingsSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly replay: {
    readonly speed: ReplaySpeed;
    readonly setSpeed: (speed: ReplaySpeed) => void;
  };
  /** "Restart replay" button. The sheet closes itself after calling it. */
  readonly onRestart: () => void;
}

const VOICE_RATES: readonly VoiceRate[] = [0.8, 1, 1.2];
const REPLAY_SPEEDS: readonly ReplaySpeed[] = [1, 5, 20];
const multiplier = (n: number) => ({ value: String(n), label: `${n}×` });

export function SettingsSheet({ open, onClose, replay, onRestart }: SettingsSheetProps) {
  const { t } = useStrings();
  const settings = useSettings();
  const themes: { value: Theme; label: string }[] = [
    { value: 'system', label: t.themeSystem },
    { value: 'dark', label: t.themeDark },
    { value: 'light', label: t.themeLight },
  ];

  return (
    <BottomSheet open={open} onClose={onClose} title={t.settingsTitle}>
      <div className={styles.stack}>
        <section className={styles.section}>
          <h3 className={styles.heading}>{t.themeLabel}</h3>
          <RadioGroup
            layout="segments"
            label={t.themeLabel}
            options={themes}
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
          />
        </section>
        <Switch
          label={t.autoReadLabel}
          hint={t.autoReadHint}
          checked={settings.autoRead}
          onChange={(autoRead) => updateSettings({ autoRead })}
        />
        <section className={styles.section}>
          <h3 className={styles.heading}>{t.voiceSpeedLabel}</h3>
          <RadioGroup
            layout="segments"
            label={t.voiceSpeedLabel}
            options={VOICE_RATES.map(multiplier)}
            value={String(settings.voiceRate)}
            onChange={(v) => updateSettings({ voiceRate: VOICE_RATES.find((r) => String(r) === v) ?? 1 })}
          />
        </section>
        <section className={styles.section}>
          <h3 className={styles.heading}>{t.replaySpeedTitle}</h3>
          <RadioGroup
            layout="segments"
            label={t.replaySpeedTitle}
            options={REPLAY_SPEEDS.map(multiplier)}
            value={String(replay.speed)}
            onChange={(v) => replay.setSpeed(REPLAY_SPEEDS.find((s) => String(s) === v) ?? 1)}
          />
        </section>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            onRestart();
            onClose();
          }}
        >
          {t.restartReplay}
        </Button>
        <section className={styles.about} aria-labelledby="about-heading">
          <h3 id="about-heading" className={styles.heading}>
            {t.aboutTitle}
          </h3>
          <ul className={styles.list}>
            <li>{t.aboutData}</li>
            <li>{t.aboutAi}</li>
            <li>{t.aboutPrivacy}</li>
            <li>{t.aboutMic}</li>
          </ul>
        </section>
      </div>
    </BottomSheet>
  );
}
