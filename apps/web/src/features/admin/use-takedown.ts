"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TakedownRequestAdmin } from "@ager/api-client";

/** Queue filters (mirror the backend's pending / recentDays params). */
export type TakedownFilter = "pending" | "recent" | "all";

/** Resolution actions the backend accepts (lowercase, bound by name). */
export const TAKEDOWN_ACTIONS = ["removed", "disputed", "referred", "none"] as const;
export type TakedownActionValue = (typeof TAKEDOWN_ACTIONS)[number];

const ADMIN_TAKEDOWN_KEY = ["admin-takedown"] as const;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`request_failed_${res.status}`);
  return (await res.json()) as T;
}

/** The admin takedown queue, filtered. */
export function useTakedownList(filter: TakedownFilter) {
  return useQuery({
    queryKey: [...ADMIN_TAKEDOWN_KEY, "list", filter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filter === "pending") params.set("pending", "true");
      if (filter === "recent") params.set("recentDays", "30");
      const qs = params.toString();
      return getJson<TakedownRequestAdmin[]>(
        `/api/admin/takedown${qs ? `?${qs}` : ""}`,
      );
    },
  });
}

/** A single takedown request. */
export function useTakedownDetail(id: number) {
  return useQuery({
    queryKey: [...ADMIN_TAKEDOWN_KEY, "detail", id],
    queryFn: () => getJson<TakedownRequestAdmin>(`/api/admin/takedown/${id}`),
  });
}

/**
 * Resolve a request. The backend cascades "removed"/"disputed" to the target article's
 * takedown status, so no separate article call is needed.
 */
export function useResolveTakedown(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      actionTaken: TakedownActionValue;
      responseNotes?: string;
    }) => {
      const res = await fetch(`/api/admin/takedown/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          actionTaken: input.actionTaken,
          responseNotes: input.responseNotes?.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("resolve_failed");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_TAKEDOWN_KEY });
    },
  });
}
