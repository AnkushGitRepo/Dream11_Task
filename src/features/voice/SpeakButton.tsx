import { useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import type { Lang } from '@shared/sports/types';
import { Button } from '@/components/Button';
import { useStrings } from '@/i18n/useStrings';
import type { SpeechSource } from './speakService';
import { useSpeak } from './useSpeak';
import styles from './SpeakButton.module.scss';

export interface SpeakButtonProps {
  /** Text to read with the basic browser voice when natural audio fails. Never sent to the server. */
  readonly text: string;
  /** Language the text is written in (decides the voice). */
  readonly lang: Lang;
  /** Server-generated text to voice naturally (looked up by id on the server). */
  readonly source?: SpeechSource;
  /** Icon-only look (label stays as the accessible name). */
  readonly compact?: boolean;
  /** Read once as soon as possible (settings.autoRead). Needs a prior user gesture to be audible. */
  readonly autoPlay?: boolean;
}

const BARS = [0, 1, 2, 3, 4] as const;

/** Listen / Stop toggle. Renders nothing when nothing can speak this language. */
export function SpeakButton({ text, lang, source, compact = false, autoPlay = false }: SpeakButtonProps) {
  const { t } = useStrings();
  const { supported, speaking, loading, usingFallback, speak, stop } = useSpeak(lang, source, text);
  const autoDone = useRef(false);

  useEffect(() => {
    if (!autoPlay || !supported || autoDone.current) return;
    autoDone.current = true;
    speak({ silent: true });
  }, [autoPlay, supported, speak]);

  if (!supported) return null;
  const label = speaking ? t.speakStop : t.speakListen;
  const cls = [styles.speak, compact && styles.compact, loading && styles.busy].filter(Boolean).join(' ');
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cls}
      aria-pressed={speaking}
      aria-busy={loading}
      aria-label={compact ? (usingFallback ? `${label} (${t.basicVoice})` : label) : undefined}
      onClick={() => (speaking || loading ? stop() : speak())}
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
      {usingFallback && !compact ? <span className={styles.basic}>{t.basicVoice}</span> : null}
    </Button>
  );
}
