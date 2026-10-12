import { useEffect } from 'react';

const VAR = '--kb-inset';

/**
 * Publishes the on-screen keyboard height as `--kb-inset` on <html> using visualViewport, so a
 * fixed composer can sit above it (`bottom: var(--kb-inset, 0px)`). No-op where unsupported.
 */
export function useKeyboardInset(): void {
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) return;
    const root = document.documentElement;
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty(VAR, `${Math.round(inset)}px`);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      root.style.removeProperty(VAR);
    };
  }, []);
}
