"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

/** An optional chip rendered inside an undo toast (e.g. a DISCARD reason). */
export interface ToastChip {
  label: string;
  /** Value handed back to `onCommit` when this chip is the active selection. */
  value: string;
}

export interface ToastOptions {
  message: string;
  /** Action button label (e.g. "Annulla"). */
  actionLabel?: string;
  /** Run when the action button (or Escape) is pressed (cancels the deferred commit). */
  onAction?: () => void;
  /**
   * Run when the toast expires WITHOUT the action being pressed (the deferred commit).
   * Receives the value of the selected chip, if one was tapped during the window.
   */
  onCommit?: (chipValue?: string) => void;
  /** Optional skippable chips shown alongside the action; tapping one sets the committed value. */
  chips?: ToastChip[];
  /** Accessible label for the chip group. */
  chipsLabel?: string;
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
 *
 * Optional `chips` ride inside the toast (e.g. the §11.2 discard reasons): tapping one keeps
 * the undo window open and passes its value to `onCommit`. Escape cancels the latest toast
 * (keyboard parity with the action button). Toasts without chips render exactly as before.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  // The committed selection per toast id, read by the (closure-captured) commit timer.
  const selectedRef = useRef<Record<number, string>>({});

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    if (id in selectedRef.current) {
      const next = { ...selectedRef.current };
      delete next[id];
      selectedRef.current = next;
      setSelected(next);
    }
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = ++nextId.current;
      setToasts((list) => [...list, { ...options, id }]);
      const timer = setTimeout(() => {
        options.onCommit?.(selectedRef.current[id]);
        dismiss(id);
      }, options.durationMs ?? 4000);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  // Cancel = run the undo action and drop the toast without committing.
  const cancel = useCallback(
    (toast: ActiveToast) => {
      toast.onAction?.();
      dismiss(toast.id);
    },
    [dismiss],
  );

  const selectChip = useCallback((id: number, value: string) => {
    const next = { ...selectedRef.current, [id]: value };
    selectedRef.current = next;
    setSelected(next);
  }, []);

  // Escape cancels (undoes) the most recently shown toast — keyboard parity with "Annulla".
  useEffect(() => {
    if (toasts.length === 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const latest = toasts[toasts.length - 1];
      if (latest) cancel(latest);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [toasts, cancel]);

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
            className="pointer-events-auto flex max-w-[calc(100vw-2rem)] flex-col gap-2 rounded-lg border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-md"
          >
            <div className="flex items-center gap-4">
              <span>{t.message}</span>
              {t.actionLabel ? (
                <button
                  type="button"
                  onClick={() => cancel(t)}
                  className="ml-auto shrink-0 font-medium text-link transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t.actionLabel}
                </button>
              ) : null}
            </div>

            {t.chips?.length ? (
              <div
                role="group"
                aria-label={t.chipsLabel ?? t.message}
                className="flex flex-wrap gap-1.5"
              >
                {t.chips.map((chip) => {
                  const isSelected = selected[t.id] === chip.value;
                  return (
                    <button
                      key={chip.value}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => selectChip(t.id, chip.value)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isSelected
                          ? "border-transparent bg-accent text-accent-foreground"
                          : "border-border bg-card text-foreground hover:bg-secondary",
                      )}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
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
