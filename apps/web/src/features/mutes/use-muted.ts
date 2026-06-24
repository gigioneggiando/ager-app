"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MutedInterest } from "@ager/api-client";

async function fetchMutedInterests(): Promise<MutedInterest[]> {
  const res = await fetch("/api/me/muted-interests", {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("muted_interests_unavailable");
  return (await res.json()) as MutedInterest[];
}

/** The topics the caller has muted (server truth for the /me/muted manager). */
export function useMutedInterests() {
  return useQuery({
    queryKey: ["muted-interests"],
    queryFn: fetchMutedInterests,
    staleTime: 30 * 1000,
  });
}

/** Mute a topic by interest id. Idempotent server-side. */
export async function muteInterest(interestId: number): Promise<void> {
  const res = await fetch("/api/me/muted-interests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ interestId }),
  });
  if (!res.ok) throw new Error("mute_failed");
}

/** Un-mute a topic by interest id. Idempotent server-side. */
export async function unmuteInterest(interestId: number): Promise<void> {
  const res = await fetch(`/api/me/muted-interests/${interestId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("unmute_failed");
}

/** Un-mute mutation for the manager — refreshes the muted list + the (now wider) feed. */
export function useUnmuteInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unmuteInterest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["muted-interests"] });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
