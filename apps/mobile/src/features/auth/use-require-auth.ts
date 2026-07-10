import { useSession } from "@ager/auth";
import { useRouter } from "expo-router";
import { useCallback } from "react";

import { needsAuthPrompt, SIGN_IN_ROUTE } from "./auth-prompt";

export { needsAuthPrompt, SIGN_IN_ROUTE } from "./auth-prompt";

/**
 * Returns `requireAuth()`: `true` when signed in; otherwise routes to the sign-in modal
 * (the user returns to where they were on dismiss) and returns `false` so the caller aborts
 * the personal action. Used to gate Save / Hide / Mute for anonymous browsers.
 */
export function useRequireAuth(): () => boolean {
  const { status } = useSession();
  const router = useRouter();
  return useCallback(() => {
    if (!needsAuthPrompt(status)) return true;
    router.push(SIGN_IN_ROUTE);
    return false;
  }, [status, router]);
}
