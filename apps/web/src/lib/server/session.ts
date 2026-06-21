import type { Session } from "@/lib/session-types";
import { readAccessToken, readRefreshToken } from "./auth-cookies";

export type { Session };

const ROLE_CLAIM_URI =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = Buffer.from(part, "base64url").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

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
