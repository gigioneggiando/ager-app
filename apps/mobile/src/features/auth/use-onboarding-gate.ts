import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

/** Shared key so sign-out can drop the cached gate result for the next user. */
export const INTERESTS_QUERY_KEY = ["me", "interests"] as const;

export interface OnboardingGate {
  /** True once we know the answer (or decided to fail open). */
  resolved: boolean;
  needsOnboarding: boolean;
}

/**
 * Onboarding gate: after sign-in (and on restore), a user with zero interests is routed to
 * onboarding; everyone else goes to the feed. Fails OPEN — a transient interests-fetch error
 * must not trap a returning user on a spinner, so we let them into the app.
 */
export function useOnboardingGate(enabled: boolean): OnboardingGate {
  const query = useQuery({
    queryKey: INTERESTS_QUERY_KEY,
    enabled,
    retry: 1,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/me/interests");
      if (error) throw new Error("interests_fetch_failed");
      return data ?? [];
    },
  });

  if (!enabled) return { resolved: true, needsOnboarding: false };
  if (query.isSuccess) {
    return { resolved: true, needsOnboarding: query.data.length === 0 };
  }
  if (query.isError) {
    return { resolved: true, needsOnboarding: false };
  }
  return { resolved: false, needsOnboarding: false };
}
