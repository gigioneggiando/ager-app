"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Interest, MyInterest, UserInterest } from "@ager/api-client";

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

async function fetchMyInterests(): Promise<MyInterest[]> {
  const res = await fetch("/api/me/interests", {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("my_interests_unavailable");
  return (await res.json()) as MyInterest[];
}

/** The user's CURRENT interests (server truth — onboarding state + editor pre-selection). */
export function useMyInterests() {
  return useQuery({
    queryKey: ["my-interests"],
    queryFn: fetchMyInterests,
    staleTime: 30 * 1000,
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
      // The personalized feed + the current-interests view depend on this.
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      void queryClient.invalidateQueries({ queryKey: ["my-interests"] });
    },
  });
}
