"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SuggestedInterest } from "@ager/api-client";

import { useSession } from "@/components/auth/auth-provider";

async function fetchSuggestedInterests(): Promise<SuggestedInterest[]> {
  const res = await fetch("/api/me/suggested-interests", {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("suggested_interests_unavailable");
  return (await res.json()) as SuggestedInterest[];
}

/**
 * Implicit-learning candidates past the notify threshold — the "vuoi allargare il feed?"
 * nudge (Recommender §13.3). Authed-only: gated on the session so anonymous visitors on the
 * public feed never fire a doomed 401.
 */
export function useSuggestedInterests() {
  const { isAuthenticated } = useSession();
  return useQuery({
    queryKey: ["suggested-interests"],
    queryFn: fetchSuggestedInterests,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

/** Promote a suggestion to an explicit interest (weight 3.0, confidence 1.0). */
export async function confirmSuggestedInterest(interestId: number): Promise<void> {
  const res = await fetch(`/api/me/suggested-interests/${interestId}/confirm`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("confirm_failed");
}

/** Dismiss a suggestion (records the rejection and purges its recent signals). */
export async function dismissSuggestedInterest(interestId: number): Promise<void> {
  const res = await fetch(`/api/me/suggested-interests/${interestId}/dismiss`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("dismiss_failed");
}

/** Confirm mutation — refreshes the suggestion list, the user's interests, and the feed. */
export function useConfirmSuggestedInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmSuggestedInterest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["suggested-interests"] });
      void queryClient.invalidateQueries({ queryKey: ["my-interests"] });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

/** Dismiss mutation — refreshes the suggestion list only. */
export function useDismissSuggestedInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dismissSuggestedInterest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["suggested-interests"] });
    },
  });
}
