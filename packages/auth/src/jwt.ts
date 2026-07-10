import { base64UrlDecode } from "./base64url";

/**
 * Minimal JWT payload decoding — mirrors the web's `jwt.ts` but Buffer-free (RN-safe). This
 * does NOT verify the signature; the backend is the authority on validity. Use only to read
 * claims (sub, email, role) for display and to decide whether to refresh proactively.
 */

export type JwtPayload = Record<string, unknown>;

/** .NET emits the role under this claim URI; some tokens also carry a plain `role`. */
const ROLE_CLAIM_URI =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    return JSON.parse(base64UrlDecode(part)) as JwtPayload;
  } catch {
    return null;
  }
}

/** The access token's `exp` claim as epoch milliseconds, or null if absent/unparseable. */
export function accessTokenExpiryMs(
  token: string | null | undefined,
): number | null {
  if (!token) return null;
  const exp = decodeJwtPayload(token)?.exp;
  return typeof exp === "number" ? exp * 1000 : null;
}

/**
 * True when the token is missing a readable expiry we can trust, expired, or within
 * `skewSeconds` of expiring — i.e. it should be refreshed before use. A token with no
 * readable `exp` returns false (we can't tell; the reactive 401 path still covers it).
 */
export function isExpiredOrExpiring(
  token: string | null | undefined,
  skewSeconds = 60,
  now: number = Date.now(),
): boolean {
  const expMs = accessTokenExpiryMs(token);
  if (expMs === null) return false;
  return expMs - now <= skewSeconds * 1000;
}

export interface AuthUser {
  userId: string;
  email: string | null;
  role: string;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** Reconstruct the user from an access token's claims (used on restore + after sign-in). */
export function userFromToken(
  token: string | null | undefined,
): AuthUser | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return {
    userId: asString(payload.sub) ?? "",
    email: asString(payload.email),
    role: asString(payload[ROLE_CLAIM_URI]) ?? asString(payload.role) ?? "user",
  };
}
