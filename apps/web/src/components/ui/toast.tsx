"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface ToastOptions {
  message: string;
  /** Action button label (e.g. "Annulla"). */
  actionLabel?: string;
  /** Run when the action button is pressed (cancels the deferred commit). */
  onAction?: () => void;
  /** Run when the toast expires WITHOUT the action being pressed (the deferred commit). */
  onCommit?: () => void;
  durationMs?: number;
}

interface ActiveToast extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Minimal toast host with deferred-commit semantics: a toast runs `onCommit` when it
 * expires unless its action (Undo) fires first. The timer lives here (not in the caller)
 * so an optimistic action that unmounts its card — e.g. Hide removing a feed item — still
 * commits or can be undone.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = ++nextId.current;
      setToasts((list) => [...list, { ...options, id }]);
      const timer = setTimeout(() => {
        options.onCommit?.();
        dismiss(id);
      }, options.durationMs ?? 4000);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4"
        role="region"
        aria-label="Notifiche"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-center gap-4 rounded-lg border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-md"
          >
            <span>{t.message}</span>
            {t.actionLabel ? (
              <button
                type="button"
                onClick={() => {
                  t.onAction?.();
                  dismiss(t.id);
                }}
                className="shrink-0 font-medium text-link transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t.actionLabel}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
