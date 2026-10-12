import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/** Scale factor that fits content laid out at `designWidth` px into the element's current width. */
export function useFitScale(ref: RefObject<HTMLElement | null>, designWidth: number): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / designWidth) || 1);
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, designWidth]);

  return scale;
}
