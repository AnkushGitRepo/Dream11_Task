import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, beforeEach } from 'vitest';
import { updateSettings } from '@/features/settings/settingsStore';
import { resolveTheme, useLangEffects } from './useLangEffects';

beforeEach(() => updateSettings({ lang: 'en', theme: 'system' }));
afterEach(() => {
  cleanup();
  document.head.replaceChildren();
  document.documentElement.removeAttribute('data-theme');
});

describe('resolveTheme', () => {
  it('follows the system only for "system"', () => {
    expect(resolveTheme('system', true)).toBe('paper');
    expect(resolveTheme('system', false)).toBe('dark');
    expect(resolveTheme('dark', true)).toBe('dark');
    expect(resolveTheme('light', false)).toBe('paper');
  });
});

describe('useLangEffects', () => {
  it('syncs lang, theme and the Indic font with settings', () => {
    renderHook(() => useLangEffects());
    expect(document.documentElement.lang).toBe('en');
    act(() => updateSettings({ lang: 'gu', theme: 'light' }));
    expect(document.documentElement.lang).toBe('gu');
    expect(document.documentElement.dataset.theme).toBe('paper');
    expect(document.head.querySelector('#indic-font-gu')).not.toBeNull();
    act(() => updateSettings({ lang: 'hinglish', theme: 'dark' }));
    expect(document.documentElement.lang).toBe('en-IN');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
