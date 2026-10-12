import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleShortcut, type ShortcutEvent } from './useMatchShortcuts';

afterEach(() => {
  document.body.innerHTML = '';
});

function setup() {
  return {
    onTogglePlay: vi.fn(),
    onCatchUp: vi.fn(),
    onFocusAsk: vi.fn(),
    onOpenLanguage: vi.fn(),
  };
}

function key(k: string, target: EventTarget | null = document.body, extra: Partial<ShortcutEvent> = {}) {
  return {
    key: k,
    code: k === ' ' ? 'Space' : `Key${k.toUpperCase()}`,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    repeat: false,
    target,
    preventDefault: vi.fn(),
    ...extra,
  };
}

const idle = { dialogOpen: false };

describe('handleShortcut', () => {
  it('routes Space, C, / and L', () => {
    const h = setup();
    const space = key(' ');
    const slash = key('/');
    expect(handleShortcut(space, h, idle)).toBe(true);
    expect(handleShortcut(key('c'), h, idle)).toBe(true);
    expect(handleShortcut(slash, h, idle)).toBe(true);
    expect(handleShortcut(key('L'), h, idle)).toBe(true);
    expect(h.onTogglePlay).toHaveBeenCalledOnce();
    expect(h.onCatchUp).toHaveBeenCalledOnce();
    expect(h.onFocusAsk).toHaveBeenCalledOnce();
    expect(h.onOpenLanguage).toHaveBeenCalledOnce();
    expect(space.preventDefault).toHaveBeenCalled();
    expect(slash.preventDefault).toHaveBeenCalled();
  });

  it('ignores keys while typing in a field', () => {
    const h = setup();
    const input = document.createElement('input');
    document.body.append(input);
    expect(handleShortcut(key('c', input), h, idle)).toBe(false);
    expect(handleShortcut(key('/', input), h, idle)).toBe(false);
    expect(h.onCatchUp).not.toHaveBeenCalled();
    expect(h.onFocusAsk).not.toHaveBeenCalled();
  });

  it('ignores everything while a modal dialog is open', () => {
    const h = setup();
    expect(handleShortcut(key('c'), h, { dialogOpen: true })).toBe(false);
    expect(handleShortcut(key(' '), h, { dialogOpen: true })).toBe(false);
    expect(h.onCatchUp).not.toHaveBeenCalled();
  });

  it('does not hijack Space on a button', () => {
    const h = setup();
    const button = document.createElement('button');
    document.body.append(button);
    const e = key(' ', button);
    expect(handleShortcut(e, h, idle)).toBe(false);
    expect(e.preventDefault).not.toHaveBeenCalled();
    expect(h.onTogglePlay).not.toHaveBeenCalled();
  });

  it('ignores modifier combos and key repeat', () => {
    const h = setup();
    expect(handleShortcut(key('c', document.body, { metaKey: true }), h, idle)).toBe(false);
    expect(handleShortcut(key('c', document.body, { repeat: true }), h, idle)).toBe(false);
    expect(h.onCatchUp).not.toHaveBeenCalled();
  });
});
