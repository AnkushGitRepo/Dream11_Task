import { useCallback, useEffect, useRef } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';

export const LONG_PRESS_MS = 500;
/** Finger travel (px) that turns a press into a scroll/drag and cancels the long-press. */
const MOVE_SLOP = 10;

export interface LongPressHandlers {
  readonly onPointerDown?: (e: PointerEvent) => void;
  readonly onPointerMove?: (e: PointerEvent) => void;
  readonly onPointerUp?: () => void;
  readonly onPointerLeave?: () => void;
  readonly onPointerCancel?: () => void;
  readonly onClickCapture?: (e: MouseEvent) => void;
  readonly onContextMenu?: (e: MouseEvent) => void;
  readonly onKeyDown?: (e: KeyboardEvent) => void;
}

/**
 * Pointer long-press that coexists with a normal tap: the click that follows a fired
 * long-press is swallowed (capture phase) so the inner button doesn't also activate.
 * Returns no handlers when `onLongPress` is absent. Shift+Enter is the keyboard equivalent.
 */
export function useLongPress(onLongPress?: () => void): LongPressHandlers {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);
  const latest = useRef(onLongPress);
  useEffect(() => {
    latest.current = onLongPress;
  }, [onLongPress]);

  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    origin.current = null;
  }, []);
  useEffect(() => cancel, [cancel]);

  if (!onLongPress) return {};
  return {
    onPointerDown: (e) => {
      fired.current = false;
      origin.current = { x: e.clientX, y: e.clientY };
      timer.current = setTimeout(() => {
        timer.current = null;
        fired.current = true;
        latest.current?.();
      }, LONG_PRESS_MS);
    },
    onPointerMove: (e) => {
      const o = origin.current;
      if (o && Math.hypot(e.clientX - o.x, e.clientY - o.y) > MOVE_SLOP) cancel();
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onClickCapture: (e) => {
      if (!fired.current) return;
      fired.current = false;
      e.stopPropagation();
      e.preventDefault();
    },
    // Touch long-press would otherwise open the browser context menu.
    onContextMenu: (e) => e.preventDefault(),
    onKeyDown: (e) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        latest.current?.();
      }
    },
  };
}
