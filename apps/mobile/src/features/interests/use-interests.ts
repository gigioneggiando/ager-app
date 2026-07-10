import type { Interest, MyInterest } from "@ager/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

export const INTERESTS_QUERY_KEY = ["interests"] as const;
export const MY_INTERESTS_QUERY_KEY = ["my-interests"] as const;

/** The public interest taxonomy — the editor's catalog + topic→id resolution for mutes. */
export function useInterests() {
  return useQuery({
    queryKey: INTERESTS_QUERY_KEY,
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<Interest[]> => {
      const { data, error } = await apiClient.GET("/api/interests");
      if (error || !data) throw new Error("interests_unavailable");
      return data;
    },
  });
}

/** The user's CURRENT interests (server truth — onboarding state + editor pre-selection). */
export function useMyInterests() {
  return useQuery({
    queryKey: MY_INTERESTS_QUERY_KEY,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<MyInterest[]> => {
      const { data, error } = await apiClient.GET("/api/me/interests");
      if (error || !data) throw new Error("my_interests_unavailable");
      return data;
    },
  });
}

/** Save the chosen interest ids (the backend rejects an empty set → the picker enforces ≥1). */
export function useSaveInterests() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (interestIds: number[]) => {
      const { error } = await apiClient.POST("/api/me/interests", {
        body: { interestIds },
      });
      if (error) throw new Error("save_failed");
    },
    onSuccess: () => {
      // The personalized feed + the current-interests view depend on this.
      void queryClient.invalidateQueries({ queryKey: MY_INTERESTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export interface MutableTopic {
  label: string;
  interestId: number;
}

/**
 * Resolve a card's topic labels to interest ids (the mute API is keyed by interestId). Match
 * against both slug and name; keep only topics we can actually mute. Pure — testable.
 */
export function resolveMutableTopics(
  topics: string[],
  interests: Interest[] | undefined,
): MutableTopic[] {
  if (!interests) return [];
  return topics
    .map((label) => {
      const match = interests.find(
        (i) => norm(i.slug) === norm(label) || norm(i.name) === norm(label),
      );
      return match?.id != null ? { label, interestId: match.id } : null;
    })
    .filter((x): x is MutableTopic => x !== null);
}
