import type { Session } from "@/lib/session-types";
import { readAccessToken, readRefreshToken } from "./auth-cookies";
import { decodeJwtPayload } from "./jwt";

export type { Session };

const ROLE_CLAIM_URI =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/**
 * Read the current session from the HttpOnly cookies (server-side). Returns null when not
 * logged in. A present access token (even if expired) yields full claims; if only the
 * refresh token survives, we still report an authenticated session with minimal info (the
 * next API call refreshes it).
 */
export async function getSession(): Promise<Session | null> {
  const access = await readAccessToken();
  if (access) {
    const payload = decodeJwtPayload(access);
    if (payload) {
      return {
        userId: asString(payload.sub) ?? "",
        email: asString(payload.email),
        role: asString(payload[ROLE_CLAIM_URI]) ?? asString(payload.role) ?? "user",
      };
    }
  }

  const refresh = await readRefreshToken();
  if (refresh) {
    return { userId: "", email: null, role: "user" };
  }
  return null;
}
