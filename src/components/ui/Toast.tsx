import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends ToastInput {
  id: string;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, number>());
  const nextId = useRef(0);

  const removeToast = useCallback((id: string) => {
    const timer = timers.current.get(id);

    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }

    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      nextId.current += 1;
      const id = `toast-${nextId.current}`;
      const duration = input.duration ?? 5000;

      setToasts((current) => [...current, { ...input, id }]);

      if (duration > 0) {
        const timer = window.setTimeout(() => removeToast(id), duration);
        timers.current.set(id, timer);
      }
    },
    [removeToast],
  );

  useEffect(() => {
    const activeTimers = timers.current;

    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="toast-region" aria-live="polite" aria-atomic="false">
          {toasts.map((item) => {
            const variant = item.variant ?? "info";
            const Icon = ICONS[variant];

            return (
              <div
                key={item.id}
                className={`toast toast--${variant}`}
                role="status"
              >
                <Icon aria-hidden="true" size={20} className="toast__icon" />
                <div className="toast__content">
                  <p className="toast__title">{item.title}</p>
                  {item.description && (
                    <p className="toast__description">{item.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="toast__close"
                  onClick={() => removeToast(item.id)}
                  aria-label="Cerrar notificación"
                >
                  <X aria-hidden="true" size={16} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }

  return context;
}
