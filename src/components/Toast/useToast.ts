import { useContext } from 'react';
import { ToastContext } from './ToastContext';
import type { ToastApi } from './ToastContext';

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
