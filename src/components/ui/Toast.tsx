import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cx } from '../../lib/cx';
import { useMotionInitial } from '../../design/motionStatus';
import s from './Toast.module.css';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  durationMs?: number;
}

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  durationMs: number;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const MAX_VISIBLE = 3;

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>.');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ message, tone = 'info', durationMs = 3500 }: ToastOptions) => {
    const id = nextId.current++;
    setItems((list) => [...list, { id, message, tone, durationMs }].slice(-MAX_VISIBLE));
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={s.stack}>
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <ToastView key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

const ICONS = { info: Info, success: CheckCircle2, error: XCircle } as const;

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const initial = useMotionInitial({ opacity: 0, y: 16, scale: 0.98 });
  const Icon = ICONS[item.tone];

  useEffect(() => {
    const handle = window.setTimeout(() => onDismiss(item.id), item.durationMs);
    return () => window.clearTimeout(handle);
  }, [item.id, item.durationMs, onDismiss]);

  return (
    <m.div
      layout="position"
      role={item.tone === 'error' ? 'alert' : 'status'}
      className={cx(s.toast, s[item.tone])}
      initial={initial}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Icon size={20} className={s.icon} aria-hidden="true" />
      <p className={s.message}>{item.message}</p>
      <button type="button" className={s.close} aria-label="Fechar aviso" onClick={() => onDismiss(item.id)}>
        <X size={16} aria-hidden="true" />
      </button>
    </m.div>
  );
}
