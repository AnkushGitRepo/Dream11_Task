import { useCallback, useEffect, useRef, useState } from 'react';

export interface AudioPlayer {
  readonly speaking: boolean;
  /** Rejects when the browser refuses (NotAllowedError) or cannot decode. */
  readonly play: (url: string) => Promise<void>;
  readonly stop: () => void;
}

/** One <audio> element; `speaking` mirrors its play/pause/ended/error events. */
export function useAudioPlayer(rate: number, onError: () => void): AudioPlayer {
  const [speaking, setSpeaking] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const errorCb = useRef(onError);
  const rateRef = useRef(rate);
  useEffect(() => {
    errorCb.current = onError;
    rateRef.current = rate;
    if (audio.current) audio.current.playbackRate = rate;
  });

  const element = useCallback((): HTMLAudioElement => {
    if (audio.current) return audio.current;
    const el = new Audio();
    el.preservesPitch = true;
    el.addEventListener('play', () => setSpeaking(true));
    el.addEventListener('pause', () => setSpeaking(false));
    el.addEventListener('ended', () => setSpeaking(false));
    el.addEventListener('error', () => {
      setSpeaking(false);
      errorCb.current();
    });
    audio.current = el;
    return el;
  }, []);

  const play = useCallback(
    (url: string) => {
      const el = element();
      if (el.src !== url) el.src = url;
      el.currentTime = 0;
      el.preservesPitch = true;
      el.playbackRate = rateRef.current;
      return el.play();
    },
    [element],
  );

  const stop = useCallback(() => {
    const el = audio.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setSpeaking(false);
  }, []);

  useEffect(
    () => () => {
      audio.current?.pause();
      audio.current = null;
    },
    [],
  );

  return { speaking, play, stop };
}
