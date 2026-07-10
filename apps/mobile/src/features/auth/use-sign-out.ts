import { useSession } from "@ager/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Sign out + wipe cached queries so the next user never sees the previous session's data
 * (e.g. the onboarding gate result). The session flip routes back to the auth stack.
 */
export function useSignOut(): () => Promise<void> {
  const { signOut } = useSession();
  const queryClient = useQueryClient();
  return useCallback(async () => {
    await signOut();
    queryClient.clear();
  }, [signOut, queryClient]);
}
