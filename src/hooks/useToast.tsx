import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Toast, ToastVariant } from '@/types';
import { uid } from '@/lib/utils';

interface ToastValue {
  toasts: Toast[];
  toast: (message: string, options?: { variant?: ToastVariant; description?: string }) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastValue | null>(null);
const DURATION = 3200;
const MAX_VISIBLE = 4;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback<ToastValue['toast']>(
    (message, options) => {
      const entry: Toast = {
        id: uid('t'),
        message,
        description: options?.description,
        variant: options?.variant ?? 'success',
      };
      setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), entry]);
      timers.current.set(
        entry.id,
        setTimeout(() => dismiss(entry.id), DURATION),
      );
    },
    [dismiss],
  );

  const value = useMemo<ToastValue>(
    () => ({
      toasts,
      toast,
      dismiss,
      success: (message, description) => toast(message, { variant: 'success', description }),
      error: (message, description) => toast(message, { variant: 'error', description }),
    }),
    [toasts, toast, dismiss],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
