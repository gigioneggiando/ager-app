/**
 * Minimal JWT payload decoding for server-side display + expiry hints. This does NOT verify
 * the signature — the backend is the authority on validity. Use only to read claims (sub,
 * email, role) and to decide whether to refresh proactively.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = Buffer.from(part, "base64url").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** The access token's `exp` claim as epoch milliseconds, or null if absent/unparseable. */
export function accessTokenExpiryMs(token: string | undefined | null): number | null {
  if (!token) return null;
  const exp = decodeJwtPayload(token)?.exp;
  return typeof exp === "number" ? exp * 1000 : null;
}

/**
 * True when the token is missing an expiry we can read, expired, or within `skewSeconds` of
 * expiring — i.e. it should be refreshed before use. Tokens with no readable `exp` return
 * false (we can't tell; the reactive 401 path still covers them).
 */
export function isExpiredOrExpiring(
  token: string | undefined | null,
  skewSeconds = 60,
): boolean {
  const expMs = accessTokenExpiryMs(token);
  if (expMs === null) return false;
  return expMs - Date.now() <= skewSeconds * 1000;
}
