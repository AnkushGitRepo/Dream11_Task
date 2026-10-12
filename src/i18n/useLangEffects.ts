import { useEffect } from 'react';
import { LANG_ATTR } from '@shared/i18n/strings';
import { useSettings } from '@/features/settings/settingsStore';
import { loadIndicFont } from './loadIndicFont';

/** Resolves the stored theme to the `data-theme` token set ('paper' = light); 'system' follows prefers-color-scheme. */
export function resolveTheme(theme: 'system' | 'dark' | 'light', prefersLight: boolean): 'dark' | 'paper' {
  const light = theme === 'system' ? prefersLight : theme === 'light';
  return light ? 'paper' : 'dark';
}

/**
 * Call once near the app root. Keeps <html lang> and <html data-theme> in sync with
 * settings, and loads the Indic font when hi/gu is selected.
 */
export function useLangEffects(): void {
  const { lang, theme } = useSettings();

  useEffect(() => {
    document.documentElement.lang = LANG_ATTR[lang];
    loadIndicFont(lang);
  }, [lang]);

  useEffect(() => {
    const query =
      typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: light)') : null;
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(theme, query?.matches ?? false);
    };
    apply();
    if (theme !== 'system' || !query) return;
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [theme]);
}
