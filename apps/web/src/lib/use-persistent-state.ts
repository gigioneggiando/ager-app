"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A string value backed by localStorage, reactive across components and tabs.
 *
 * Uses `useSyncExternalStore` (not an effect) so it never trips the
 * set-state-in-effect rule and renders the server/first-paint snapshot as `fallback`
 * before hydrating to the stored value — no hydration mismatch. Writes broadcast a
 * synthetic event so every consumer of the same key updates in step.
 */
export function usePersistentState(
  key: string,
  fallback: string,
): [string, (value: string) => void] {
  const eventName = `persist:${key}`;

  const subscribe = useCallback(
    (notify: () => void) => {
      const onStorage = (e: StorageEvent) => {
        if (e.key === null || e.key === key) notify();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(eventName, notify);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(eventName, notify);
      };
    },
    [key, eventName],
  );

  const getSnapshot = useCallback(() => {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }, [key, fallback]);

  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: string) => {
      try {
        localStorage.setItem(key, next);
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event(eventName));
    },
    [key, eventName],
  );

  return [value, setValue];
}
