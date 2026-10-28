import { useEffect } from 'react';
import { create } from 'zustand';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

// ─── Toast Types ─────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

// ─── Zustand Store ───────────────────────────────────────

let nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message, duration = 5000) => {
    const id = `toast-${++nextId}`;
    set((s) => ({ toasts: [...s.toasts, { id, type, message, duration }] }));
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// ─── Convenience Hook ────────────────────────────────────

export function useToast() {
  const addToast = useToastStore((s) => s.addToast);
  return {
    success: (msg: string) => addToast('success', msg),
    error: (msg: string) => addToast('error', msg),
    warning: (msg: string) => addToast('warning', msg),
    info: (msg: string) => addToast('info', msg),
  };
}

// ─── Style Maps ──────────────────────────────────────────

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap: Record<ToastType, string> = {
  success: 'border-l-[var(--color-success)] text-[var(--color-success)]',
  error: 'border-l-[var(--color-error)] text-[var(--color-error)]',
  warning: 'border-l-[var(--color-warning)] text-[var(--color-warning)]',
  info: 'border-l-[var(--color-primary-light)] text-[var(--color-primary-light)]',
};

// ─── Single Toast Item ───────────────────────────────────

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const Icon = iconMap[toast.type];

  useEffect(() => {
    if (!toast.duration) return;
    const timer = setTimeout(() => removeToast(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex w-80 items-start gap-3 rounded-lg border-l-4 bg-[var(--color-surface)] px-4 py-3 shadow-lg animate-[slideIn_0.25s_ease-out] ${colorMap[toast.type]}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm text-[var(--color-text)]">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 rounded p-0.5 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Toast Container (mount once in App) ─────────────────

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed right-4 top-4 z-[60] flex flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
