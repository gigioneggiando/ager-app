import type { SessionStatus } from "@ager/auth";

/** The sign-in route (the (auth) group presents modally). */
export const SIGN_IN_ROUTE = "/sign-in";

/** Pure: does a personal action need the sign-in prompt for this session status? */
export function needsAuthPrompt(status: SessionStatus): boolean {
  return status !== "authenticated";
}
