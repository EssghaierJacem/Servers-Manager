import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { CloseIcon, ToastErrorIcon, ToastInfoIcon, ToastSuccessIcon } from '../components/icons';

export type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

const VARIANT_STYLE: Record<
  ToastVariant,
  { icon: (props: { className?: string }) => JSX.Element; className: string }
> = {
  success: {
    icon: ToastSuccessIcon,
    className: 'border-status-healthy/30 bg-status-healthy/10 text-status-healthy',
  },
  error: {
    icon: ToastErrorIcon,
    className: 'border-status-critical/30 bg-status-critical/10 text-status-critical',
  },
  info: { icon: ToastInfoIcon, className: 'border-accent/30 bg-accent/10 text-accent' },
};

let nextToastId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = nextToastId++;
      setToasts((current) => [...current, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
        {toasts.map((toast) => {
          const { icon: Icon, className } = VARIANT_STYLE[toast.variant];
          return (
            <div
              key={toast.id}
              role="status"
              className={`animate-fade-in pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border bg-bg-panel px-4 py-3 text-sm font-medium shadow-popover ${className}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1 text-text-primary">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 text-text-muted transition-colors duration-150 hover:text-text-primary"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
