"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Interest, UserInterest } from "@ager/api-client";

async function fetchInterests(): Promise<Interest[]> {
  const res = await fetch("/api/interests", {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("interests_unavailable");
  return (await res.json()) as Interest[];
}

/** The public interest taxonomy (macro topics + subtopics via parentId). */
export function useInterests() {
  return useQuery({
    queryKey: ["interests"],
    queryFn: fetchInterests,
    staleTime: 60 * 60 * 1000,
  });
}

async function saveInterests(interestIds: number[]): Promise<UserInterest[]> {
  const res = await fetch("/api/me/interests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ interestIds }),
  });
  if (!res.ok) throw new Error("save_failed");
  return (await res.json()) as UserInterest[];
}

export function useSaveInterests() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveInterests,
    onSuccess: () => {
      // The personalized feed depends on interests.
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
