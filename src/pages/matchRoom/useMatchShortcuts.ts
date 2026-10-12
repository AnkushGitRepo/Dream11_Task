import { useEffect } from 'react';

const TYPING = 'input, textarea, select, [contenteditable="true"]';
const ACTIVATABLE = 'button, a, [role="tab"]';

interface Handlers {
  readonly onTogglePlay: () => void;
  readonly onCatchUp: () => void;
}

/** Space = play/pause, C = catch me up. Ignored while typing or with modifier keys. */
export function useMatchShortcuts({ onTogglePlay, onCatchUp }: Handlers): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest(TYPING)) return;
      if (e.code === 'Space') {
        // A focused button already handles Space itself.
        if (target?.closest(ACTIVATABLE)) return;
        e.preventDefault();
        onTogglePlay();
      } else if (e.key === 'c' || e.key === 'C') {
        onCatchUp();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onTogglePlay, onCatchUp]);
}
