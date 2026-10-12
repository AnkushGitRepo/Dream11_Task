import { useState, type FormEvent, type Ref } from 'react';
import { Mic, SendHorizontal } from 'lucide-react';
import { IconButton } from '@/components/IconButton';
import { useListen, type ListenError } from '@/features/voice';
import { format, useStrings } from '@/i18n/useStrings';
import type { StringKey } from '@shared/i18n/strings';
import { MicListening } from './MicListening';
import { useKeyboardInset } from './useKeyboardInset';
import styles from './Composer.module.scss';

export const MAX_CHARS = 200;
export const COUNTER_FROM = 160;

export interface ComposerProps {
  readonly onSend: (text: string) => void;
  /** Forwarded to the text input so the page can focus it (shortcut '/'). */
  readonly inputRef?: Ref<HTMLInputElement>;
}

const MIC_ERRORS: Readonly<Record<ListenError, StringKey>> = {
  denied: 'askMicDenied',
  'no-speech': 'askMicNoSpeech',
  unavailable: 'askMicUnavailable',
};

export function Composer({ onSend, inputRef }: ComposerProps) {
  const { t, lang, langAttr } = useStrings();
  const [value, setValue] = useState('');
  const listen = useListen(lang, (text) => setValue(text.slice(0, MAX_CHARS)));
  useKeyboardInset();

  const trimmed = value.trim();
  const showCounter = value.length >= COUNTER_FROM;
  const atLimit = value.length >= MAX_CHARS;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (trimmed === '') return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <div className={styles.dock}>
      <div className={styles.inner}>
        {listen.error ? (
          <p className={styles.error} role="alert">
            {t[MIC_ERRORS[listen.error]]}
          </p>
        ) : null}
        {listen.listening ? <MicListening transcript={listen.transcript} onStop={listen.stop} /> : null}
        <form className={styles.form} onSubmit={submit} hidden={listen.listening}>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            value={value}
            maxLength={MAX_CHARS}
            placeholder={t.askPlaceholder}
            aria-label={t.askPlaceholder}
            lang={langAttr}
            enterKeyHint="send"
            autoComplete="off"
            onChange={(e) => setValue(e.target.value.slice(0, MAX_CHARS))}
          />
          {showCounter ? (
            <span
              className={`${styles.counter} ${atLimit ? styles.limit : ''}`.trim()}
              aria-label={format(t.askCounterLabel, { n: value.length, max: MAX_CHARS })}
            >
              {value.length}/{MAX_CHARS}
            </span>
          ) : null}
          <span className={styles.srOnly} aria-live="polite">
            {atLimit ? t.askLimitReached : ''}
          </span>
          {listen.supported ? (
            <IconButton
              label={t.askMic}
              icon={<Mic strokeWidth={1.75} />}
              onClick={listen.start}
              className={styles.mic}
            />
          ) : null}
          <IconButton
            type="submit"
            label={t.askSend}
            icon={<SendHorizontal strokeWidth={1.75} />}
            disabled={trimmed === ''}
            className={styles.send}
          />
        </form>
      </div>
    </div>
  );
}
