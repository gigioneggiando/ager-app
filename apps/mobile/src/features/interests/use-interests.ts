import type { Interest } from "@ager/api-client";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

export const INTERESTS_QUERY_KEY = ["interests"] as const;

/** The public interest taxonomy — used to resolve a card's topic labels to interest ids. */
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
