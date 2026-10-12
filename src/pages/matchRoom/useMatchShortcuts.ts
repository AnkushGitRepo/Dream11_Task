import { useEffect, useRef } from 'react';

const TYPING = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';
const ACTIVATABLE = 'button, a, [role="tab"], summary';
const DIALOG = '[role="dialog"][aria-modal="true"], dialog[open]';

/** Every handler is optional so callers can wire shortcuts incrementally. */
export interface ShortcutHandlers {
  /** Space: play / pause the replay. */
  readonly onTogglePlay?: () => void;
  /** C: run "Catch me up". */
  readonly onCatchUp?: () => void;
  /** `/`: focus the Ask composer. */
  readonly onFocusAsk?: () => void;
  /** L: open the language sheet. */
  readonly onOpenLanguage?: () => void;
}

/** What the handler needs to know about the page; injected for testability. */
export interface ShortcutContext {
  readonly dialogOpen: boolean;
}

/** Minimal event shape so tests need not build real KeyboardEvents. */
export type ShortcutEvent = Pick<
  KeyboardEvent,
  'key' | 'code' | 'metaKey' | 'ctrlKey' | 'altKey' | 'repeat' | 'target' | 'preventDefault'
>;

/**
 * Pure keyboard routing. Returns true when a shortcut was handled.
 * Ignored: modifier keys, key repeat, typing in a field, any open modal dialog.
 * Space is never hijacked from a focused button/link/tab (they activate themselves).
 */
export function handleShortcut(
  event: ShortcutEvent,
  handlers: ShortcutHandlers,
  context: ShortcutContext,
): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return false;
  if (context.dialogOpen) return false;
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest(TYPING)) return false;

  if (event.code === 'Space' || event.key === ' ') {
    if (!handlers.onTogglePlay || target?.closest(ACTIVATABLE)) return false;
    event.preventDefault();
    handlers.onTogglePlay();
    return true;
  }
  const key = event.key.toLowerCase();
  if (key === 'c' && handlers.onCatchUp) {
    handlers.onCatchUp();
    return true;
  }
  if (key === 'l' && handlers.onOpenLanguage) {
    handlers.onOpenLanguage();
    return true;
  }
  if (event.key === '/' && handlers.onFocusAsk) {
    event.preventDefault(); // don't type "/" into the composer we are about to focus
    handlers.onFocusAsk();
    return true;
  }
  return false;
}

/** Space = play/pause, C = catch up, / = ask, L = language. Thin wrapper over handleShortcut. */
export function useMatchShortcuts(handlers: ShortcutHandlers): void {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      handleShortcut(e, latest.current, { dialogOpen: document.querySelector(DIALOG) !== null });
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}
