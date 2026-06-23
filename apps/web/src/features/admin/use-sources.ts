"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  RssProbeResponse,
  SourceAdmin,
  SourceAdminCreate,
  SourceAdminUpdate,
} from "@ager/api-client";

/** Wire enum values the backend accepts/returns (exact casing). */
export const SOURCE_TYPES = ["RSS", "MANUAL", "API", "AGENCY"] as const;
export const LICENSING_STATUSES = [
  "licensed_direct",
  "licensed_via_agency",
  "rss_permissive",
  "rss_silent",
  "rss_restrictive",
  "no_agreement_linking_only",
  "opted_out",
] as const;
export const NEGOTIATION_STATUSES = [
  "none",
  "initiated",
  "in_progress",
  "agreed",
  "declined",
] as const;

/** Server-side list filters (map to the backend's expiringIn / tdmOptout / negotiation params). */
export type SourceServerFilter = "all" | "expiring" | "tdmOptout" | "negotiating";

const SOURCES_KEY = ["admin-sources"] as const;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`request_failed_${res.status}`);
  return (await res.json()) as T;
}

export function useSourceList(filter: SourceServerFilter) {
  return useQuery({
    queryKey: [...SOURCES_KEY, "list", filter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filter === "expiring") params.set("expiringIn", "30");
      if (filter === "tdmOptout") params.set("tdmOptout", "true");
      if (filter === "negotiating") params.set("negotiation", "in_progress");
      const qs = params.toString();
      return getJson<SourceAdmin[]>(`/api/admin/sources${qs ? `?${qs}` : ""}`);
    },
  });
}

export function useSourceDetail(id: number) {
  return useQuery({
    queryKey: [...SOURCES_KEY, "detail", id],
    queryFn: () => getJson<SourceAdmin>(`/api/admin/sources/${id}`),
  });
}

export function useProbeRss() {
  return useMutation({
    mutationFn: async (rssUrl: string): Promise<RssProbeResponse> => {
      const res = await fetch("/api/admin/sources/probe-rss", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rssUrl }),
      });
      if (!res.ok) throw new Error("probe_failed");
      return (await res.json()) as RssProbeResponse;
    },
  });
}

export function useCreateSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SourceAdminCreate): Promise<{ id: number }> => {
      const res = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        // 409 duplicate_url · 400 invalid_url — surface the code for messaging.
        const code = await res
          .json()
          .then((b: { code?: string; error?: string }) => b.code ?? b.error)
          .catch(() => undefined);
        throw new Error(code ?? `create_failed_${res.status}`);
      }
      return (await res.json()) as { id: number };
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: SOURCES_KEY }),
  });
}

export function useUpdateSource(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SourceAdminUpdate) => {
      const res = await fetch(`/api/admin/sources/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`update_failed_${res.status}`);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: SOURCES_KEY }),
  });
}

/** Enable / disable / refresh-tos all POST to a sub-path and invalidate the source caches. */
function useSourceAction(id: number, path: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/sources/${id}/${path}`, { method: "POST" });
      if (!res.ok) throw new Error(`${path}_failed_${res.status}`);
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: SOURCES_KEY }),
  });
}

export function useEnableSource(id: number) {
  return useSourceAction(id, "enable");
}
export function useDisableSource(id: number) {
  return useSourceAction(id, "disable");
}

export interface RefreshTosResult {
  previousHash: string | null;
  currentHash: string | null;
  changed: boolean;
}

export function useRefreshTos(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<RefreshTosResult> => {
      const res = await fetch(`/api/admin/sources/${id}/refresh-tos`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("refresh_tos_failed");
      return (await res.json()) as RefreshTosResult;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: SOURCES_KEY }),
  });
}
