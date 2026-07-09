"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * `true` once running in the browser, `false` during SSR and the first (hydration) render.
 *
 * Uses `useSyncExternalStore` rather than a mount effect so it never trips the
 * set-state-in-effect rule, while still avoiding hydration mismatches. Handy for gating
 * `createPortal(..., document.body)`, which must not run on the server.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
