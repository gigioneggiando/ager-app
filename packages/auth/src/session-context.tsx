import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { AuthUser } from "./jwt";
import type { SessionController, SessionStatus } from "./session-controller";

export interface SessionContextValue {
  status: SessionStatus;
  user: AuthUser | null;
  accessToken: string | null;
  requestOtp: (email: string, locale?: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Binds a SessionController to React. Kicks off `restore()` once on mount and re-renders on
 * every session state change via useSyncExternalStore.
 */
export function SessionProvider({
  controller,
  children,
}: {
  controller: SessionController;
  children: ReactNode;
}) {
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  useEffect(() => {
    void controller.restore();
  }, [controller]);

  const value = useMemo<SessionContextValue>(
    () => ({
      status: state.status,
      user: state.user,
      accessToken: state.accessToken,
      requestOtp: (email, locale) => controller.requestOtp(email, locale),
      verifyOtp: (email, code) => controller.verifyOtp(email, code),
      signOut: () => controller.signOut(),
    }),
    [controller, state.status, state.user, state.accessToken],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a <SessionProvider>.");
  }
  return ctx;
}
