import { useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import type { Lang } from '@shared/sports/types';
import { Button } from '@/components/Button';
import { useStrings } from '@/i18n/useStrings';
import { useSpeak } from './useSpeak';
import styles from './SpeakButton.module.scss';

export interface SpeakButtonProps {
  /** Plain text to read aloud. */
  readonly text: string;
  /** Language the text is written in (decides the voice). */
  readonly lang: Lang;
  /** Icon-only look (label stays as the accessible name). */
  readonly compact?: boolean;
  /** Read once as soon as a voice exists (settings.autoRead). */
  readonly autoPlay?: boolean;
}

const BARS = [0, 1, 2, 3, 4] as const;

/** Listen / Stop toggle. Renders nothing when no voice matches the language. */
export function SpeakButton({ text, lang, compact = false, autoPlay = false }: SpeakButtonProps) {
  const { t } = useStrings();
  const { hasVoice, speaking, speak, stop } = useSpeak(lang);
  const autoDone = useRef(false);

  useEffect(() => {
    if (!autoPlay || !hasVoice || autoDone.current) return;
    autoDone.current = true;
    speak(text);
  }, [autoPlay, hasVoice, speak, text]);

  if (!hasVoice) return null;
  const label = speaking ? t.speakStop : t.speakListen;
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`${styles.speak} ${compact ? styles.compact : ''}`.trim()}
      aria-pressed={speaking}
      aria-label={compact ? label : undefined}
      onClick={() => (speaking ? stop() : speak(text))}
    >
      {speaking ? (
        <span className={styles.wave} aria-hidden="true">
          {BARS.map((i) => (
            <span key={i} className={styles.bar} />
          ))}
        </span>
      ) : (
        <Volume2 size={18} strokeWidth={1.75} aria-hidden="true" />
      )}
      <span className={compact ? styles.srOnly : styles.text}>{label}</span>
    </Button>
  );
}
