import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Whether the referenced element intersects the viewport (IntersectionObserver, no scroll listeners).
 * Assumes "in view" when IntersectionObserver is unavailable so UI never gets stuck collapsed.
 */
export function useInView<T extends Element>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setInView(entry.isIntersecting);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}
