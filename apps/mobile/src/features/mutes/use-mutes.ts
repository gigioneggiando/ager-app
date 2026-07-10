import type { MutedInterest, MutedSource } from "@ager/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

export const MUTED_INTERESTS_KEY = ["muted-interests"] as const;
export const MUTED_SOURCES_KEY = ["muted-sources"] as const;

/** Mute a topic feed-wide by interest id (body-keyed). Idempotent server-side. */
export async function muteInterest(interestId: number): Promise<boolean> {
  const { response } = await apiClient.POST("/api/me/muted-interests", {
    body: { interestId },
  });
  return response.ok;
}

/** Mute a source feed-wide by id (path-keyed, no body). Idempotent server-side. */
export async function muteSource(sourceId: number): Promise<boolean> {
  const { response } = await apiClient.POST(
    "/api/me/muted-sources/{sourceId}",
    {
      params: { path: { sourceId } },
    },
  );
  return response.ok;
}

// ── mute manager (M4b) ──────────────────────────────────────────────────────

export function useMutedInterests() {
  return useQuery({
    queryKey: MUTED_INTERESTS_KEY,
    queryFn: async (): Promise<MutedInterest[]> => {
      const { data, error } = await apiClient.GET("/api/me/muted-interests");
      if (error || !data) throw new Error("muted_interests_unavailable");
      return data;
    },
  });
}

export function useMutedSources() {
  return useQuery({
    queryKey: MUTED_SOURCES_KEY,
    queryFn: async (): Promise<MutedSource[]> => {
      const { data, error } = await apiClient.GET("/api/me/muted-sources");
      if (error || !data) throw new Error("muted_sources_unavailable");
      return data;
    },
  });
}

/** Un-mute a topic — refreshes the muted list + the (now wider) feed. */
export function useUnmuteInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (interestId: number) => {
      const { response } = await apiClient.DELETE(
        "/api/me/muted-interests/{interestId}",
        { params: { path: { interestId } } },
      );
      if (!response.ok) throw new Error("unmute_failed");
    },
    onMutate: async (interestId: number) => {
      await queryClient.cancelQueries({ queryKey: MUTED_INTERESTS_KEY });
      const previous =
        queryClient.getQueryData<MutedInterest[]>(MUTED_INTERESTS_KEY);
      queryClient.setQueryData<MutedInterest[]>(MUTED_INTERESTS_KEY, (list) =>
        (list ?? []).filter((m) => m.interestId !== interestId),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous)
        queryClient.setQueryData(MUTED_INTERESTS_KEY, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: MUTED_INTERESTS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

/** Un-mute a source — refreshes the muted sources + the (now wider) feed. */
export function useUnmuteSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sourceId: number) => {
      const { response } = await apiClient.DELETE(
        "/api/me/muted-sources/{sourceId}",
        { params: { path: { sourceId } } },
      );
      if (!response.ok) throw new Error("unmute_failed");
    },
    onMutate: async (sourceId: number) => {
      await queryClient.cancelQueries({ queryKey: MUTED_SOURCES_KEY });
      const previous =
        queryClient.getQueryData<MutedSource[]>(MUTED_SOURCES_KEY);
      queryClient.setQueryData<MutedSource[]>(MUTED_SOURCES_KEY, (list) =>
        (list ?? []).filter((m) => m.sourceId !== sourceId),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous)
        queryClient.setQueryData(MUTED_SOURCES_KEY, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: MUTED_SOURCES_KEY });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
