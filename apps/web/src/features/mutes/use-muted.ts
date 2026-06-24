"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MutedInterest, MutedSource } from "@ager/api-client";

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

// ───────────────────────────── source mute ─────────────────────────────

async function fetchMutedSources(): Promise<MutedSource[]> {
  const res = await fetch("/api/me/muted-sources", {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("muted_sources_unavailable");
  return (await res.json()) as MutedSource[];
}

/** The sources the caller has muted (server truth for the /me/muted manager). */
export function useMutedSources() {
  return useQuery({
    queryKey: ["muted-sources"],
    queryFn: fetchMutedSources,
    staleTime: 30 * 1000,
  });
}

/** Mute a source by id (path-keyed, no body). Idempotent server-side. */
export async function muteSource(sourceId: number): Promise<void> {
  const res = await fetch(`/api/me/muted-sources/${sourceId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("mute_source_failed");
}

/** Un-mute a source by id. Idempotent server-side. */
export async function unmuteSource(sourceId: number): Promise<void> {
  const res = await fetch(`/api/me/muted-sources/${sourceId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("unmute_source_failed");
}

/** Un-mute mutation for the manager — refreshes the muted sources + the (now wider) feed. */
export function useUnmuteSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unmuteSource,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["muted-sources"] });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
