"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

import type { Session } from "@/lib/session-types";

interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  /** Re-read the session from the server (after login). */
  refresh: () => Promise<void>;
  /** Clear the session (server clears cookies + revokes the refresh token). */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialSession,
  children,
}: {
  initialSession: Session | null;
  children: ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(initialSession);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    if (!res.ok) {
      setSession(null);
      return;
    }
    const data = (await res.json()) as { session: Session | null };
    setSession(data.session ?? null);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, isAuthenticated: session !== null, refresh, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useSession(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useSession must be used within an AuthProvider");
  }
  return ctx;
}
