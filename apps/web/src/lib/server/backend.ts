import { NextResponse } from "next/server";
import type { AuthResult } from "@ager/api-client";

import {
  clearSessionCookies,
  readAccessToken,
  readRefreshToken,
  setSessionCookies,
} from "./auth-cookies";
import { isExpiredOrExpiring } from "./jwt";
import { captureUpstreamError } from "./observability";

/**
 * SERVER-ONLY backend access. Imported by route handlers (the same-origin proxies) and
 * by server components — never by client components. `API_BASE_URL` stays server-side
 * (no CORS; backend URL never reaches the browser).
 */
const API_BASE = process.env.API_BASE_URL ?? "https://api.agerculture.com";

export function backendUrl(path: string): URL {
  return new URL(path, API_BASE);
}

export type BackendResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; data: null };

/** GET a JSON resource from the backend with the shared cache policy. */
export async function backendGet<T>(
  path: string,
  search?: URLSearchParams,
): Promise<BackendResult<T>> {
  const url = new URL(path, API_BASE);
  if (search) {
    const qs = search.toString();
    if (qs) url.search = qs;
  }
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      // 4xx (e.g. 404) is a normal upstream outcome; only report 5xx server failures.
      if (res.status >= 500) {
        captureUpstreamError(new Error(`Upstream ${res.status} for ${path}`), {
          path,
          upstreamStatus: res.status,
          phase: "backendGet",
        });
      }
      return { ok: false, status: res.status, data: null };
    }
    return { ok: true, status: res.status, data: (await res.json()) as T };
  } catch (error) {
    // Network/transport failure — collapsed to 502 below; capture it first.
    captureUpstreamError(error, { path, phase: "backendGet" });
    return { ok: false, status: 502, data: null };
  }
}

/**
 * Map a backend result to a same-origin proxy Response: pass through 404, collapse other
 * failures to 502, and attach the shared CDN cache headers on success.
 */
export function proxyJson<T>(result: BackendResult<T>): NextResponse {
  if (!result.ok) {
    const status = result.status === 404 ? 404 : 502;
    return NextResponse.json(
      { error: status === 404 ? "not_found" : "upstream_error" },
      { status },
    );
  }
  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

// ---------------------------------------------------------------------------------------
// Authenticated proxy: attach the Bearer from the HttpOnly cookie, refresh once on 401,
// and (for state-changing calls) perform the backend double-submit CSRF handshake.
// ---------------------------------------------------------------------------------------

function cookieValueFromSetCookie(
  setCookies: string[],
  name: string,
): string | null {
  for (const raw of setCookies) {
    const match = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  return null;
}

/**
 * Fetch a backend antiforgery token pair. The backend only enforces CSRF when the request
 * carries the XSRF-TOKEN cookie (Security:Csrf — EnforceOnCookieRequests, EnforceAlways
 * off), so this is belt-and-braces for state-changing calls. Bound to the current Bearer
 * so it validates for authenticated requests.
 */
async function backendCsrf(
  bearer?: string,
): Promise<{ cookie: string; token: string } | null> {
  const headers = new Headers({ accept: "application/json" });
  if (bearer) headers.set("authorization", `Bearer ${bearer}`);
  const res = await fetch(backendUrl("/api/auth/csrf"), { headers });
  if (!res.ok) return null;

  const body = (await res.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token;
  const cookie = cookieValueFromSetCookie(res.headers.getSetCookie(), "XSRF-TOKEN");
  return token && cookie ? { cookie, token } : null;
}

/**
 * Exchange the refresh cookie for a fresh token pair and re-set the session cookies (which
 * also EXTENDS the access-cookie max-age to the new refresh-token lifetime). Returns the new
 * access token, or null on failure.
 *
 * Crucially, the session is cleared ONLY on a definitive auth failure (the backend rejects
 * the refresh token with 401/403). A transient failure — network error or 5xx — returns null
 * WITHOUT clearing the cookies, so a blip can never log the user out; the next request retries.
 */
export async function refreshSession(): Promise<string | null> {
  const refreshToken = await readRefreshToken();
  if (!refreshToken) return null;

  let res: Response;
  try {
    res = await fetch(backendUrl("/api/auth/refresh"), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch {
    return null; // network blip — keep the session, retry on the next call
  }

  if (res.status === 401 || res.status === 403) {
    await clearSessionCookies(); // refresh token is invalid/expired/revoked → really logged out
    return null;
  }
  if (!res.ok) return null; // transient (5xx, etc.) — keep the session

  const auth = (await res.json().catch(() => null)) as AuthResult | null;
  if (!auth?.accessToken) return null;
  await setSessionCookies(auth);
  return auth.accessToken;
}

/**
 * Server-side authenticated fetch to the backend. Reads the access token from the HttpOnly
 * cookie and attaches it as a Bearer. PROACTIVELY refreshes when the access token is missing
 * or at/near expiry (so a predictable expiry never costs a 401 round-trip), and REACTIVELY
 * refreshes once on an unexpected 401, then retries. Either refresh writes the new Set-Cookie
 * back via the route response. For state-changing methods it runs the CSRF handshake. The
 * refresh token never leaves the server. Call only in route handlers (it can set cookies).
 */
export async function authedBackendFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const stateChanging = method !== "GET" && method !== "HEAD";

  const doFetch = async (bearer: string | undefined): Promise<Response> => {
    const headers = new Headers(init.headers);
    headers.set("accept", "application/json");
    if (bearer) headers.set("authorization", `Bearer ${bearer}`);

    if (stateChanging) {
      const csrf = await backendCsrf(bearer);
      if (csrf) {
        headers.set("x-csrf-token", csrf.token);
        const existing = headers.get("cookie");
        headers.set(
          "cookie",
          existing
            ? `${existing}; XSRF-TOKEN=${csrf.cookie}`
            : `XSRF-TOKEN=${csrf.cookie}`,
        );
      }
    }

    // Per-user responses must NEVER enter Next's Data Cache: its key is the URL (+ method /
    // body), NOT the Authorization header — so a cached anonymous (cold-start) response could
    // be served to a logged-in user, and one user's private data could be served to another.
    // Force no-store on every authed call so the request always reaches the backend as the
    // current user. (`headers` and `cache` win over any caller-supplied init.)
    let res: Response;
    try {
      res = await fetch(backendUrl(path), { ...init, cache: "no-store", headers });
    } catch (error) {
      // Transport failure — surfaces to the route handler; capture before rethrowing so the
      // BFF failure is never silent. (The response contract is unchanged.)
      captureUpstreamError(error, { path, phase: "authedBackendFetch" });
      throw error;
    }
    if (res.status >= 500) {
      captureUpstreamError(new Error(`Upstream ${res.status} for ${path}`), {
        path,
        upstreamStatus: res.status,
        phase: "authedBackendFetch",
      });
    }
    return res;
  };

  let access = await readAccessToken();

  // Proactive refresh: a missing or about-to-expire access token (and a refresh token to use)
  // is refreshed BEFORE the call, so an expected expiry never surfaces as a 401 / login prompt.
  if (isExpiredOrExpiring(access) || !access) {
    if (await readRefreshToken()) {
      const refreshed = await refreshSession();
      if (refreshed) access = refreshed;
    }
  }

  let res = await doFetch(access);

  // Reactive fallback: an unexpected 401 (clock skew, server-side invalidation) → refresh once
  // and retry. A single transient 401 does NOT log the user out when the refresh succeeds.
  if (res.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      res = await doFetch(refreshed);
    }
  }
  return res;
}
