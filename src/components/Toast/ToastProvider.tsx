import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ToastContext } from './ToastContext';
import styles from './Toast.module.scss';

const DISMISS_MS = 3000;

interface ToastItem {
  readonly id: number;
  readonly message: string;
}

export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [items, setItems] = useState<readonly ToastItem[]>([]);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const nextId = useRef(0);

  useEffect(() => {
    const active = timers.current;
    return () => {
      active.forEach(clearTimeout);
      active.clear();
    };
  }, []);

  const show = useCallback((message: string) => {
    const id = nextId.current++;
    setItems((prev) => [...prev, { id, message }]);
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, DISMISS_MS);
    timers.current.add(timer);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {items.map((t) => (
          <p key={t.id} className={styles.toast}>
            {t.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
