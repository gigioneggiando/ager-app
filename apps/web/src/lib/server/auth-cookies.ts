import { cookies } from "next/headers";
import type { AuthResult } from "@ager/api-client";

/**
 * SERVER-ONLY session cookies on the FRONTEND origin. They hold the backend JWTs but are
 * HttpOnly, so browser JS can never read them (the refresh token in particular never
 * reaches client JS). The browser sends them only to our own route handlers (same-origin).
 */
export const ACCESS_COOKIE = "ager_at";
export const REFRESH_COOKIE = "ager_rt";

// The access cookie deliberately outlives the access token: it carries a possibly-expired
// JWT (used for display + as the Bearer; the backend rejects it when expired → we refresh).
// Both cookies live as long as the refresh token (≈14d) so a session survives a closed tab.
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

function maxAgeFrom(iso: string | null | undefined, fallback: number): number {
  if (!iso) return fallback;
  const seconds = Math.floor((new Date(iso).getTime() - Date.now()) / 1000);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : fallback;
}

/** Persist the backend auth result as HttpOnly cookies. Call only in route handlers. */
export async function setSessionCookies(auth: AuthResult): Promise<void> {
  const store = await cookies();
  const refreshMaxAge = maxAgeFrom(
    auth.refreshTokenExpiresAt,
    SESSION_MAX_AGE_SECONDS,
  );

  store.set(ACCESS_COOKIE, auth.accessToken ?? "", {
    ...baseCookieOptions(),
    maxAge: refreshMaxAge,
  });
  if (auth.refreshToken) {
    store.set(REFRESH_COOKIE, auth.refreshToken, {
      ...baseCookieOptions(),
      maxAge: refreshMaxAge,
    });
  }
}

/** Clear the session cookies. Call only in route handlers. */
export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function readAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_COOKIE)?.value || undefined;
}

export async function readRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_COOKIE)?.value || undefined;
}
