"use client";

import { useQuery } from "@tanstack/react-query";
import type { IngestionLogAdmin, IngestionLogStats } from "@ager/api-client";

export type IngestionFilter = "all" | "errors";
export const INGESTION_PAGE_SIZE = 50;

const KEY = ["admin-ingestion"] as const;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`request_failed_${res.status}`);
  return (await res.json()) as T;
}

/** Ingestion-log list, offset-paginated (the API returns a plain array per page). */
export function useIngestionList(filter: IngestionFilter, page: number) {
  return useQuery({
    queryKey: [...KEY, "list", filter, page],
    placeholderData: (prev) => prev,
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(INGESTION_PAGE_SIZE),
      });
      if (filter === "errors") params.set("errorsOnly", "true");
      return getJson<IngestionLogAdmin[]>(`/api/admin/ingestion-log?${params}`);
    },
  });
}

/** 14-day (default) ingestion stats for the chart. */
export function useIngestionStats(days = 14) {
  return useQuery({
    queryKey: [...KEY, "stats", days],
    queryFn: () =>
      getJson<IngestionLogStats>(`/api/admin/ingestion-log/stats?days=${days}`),
  });
}

export function useIngestionDetail(id: number) {
  return useQuery({
    queryKey: [...KEY, "detail", id],
    queryFn: () => getJson<IngestionLogAdmin>(`/api/admin/ingestion-log/${id}`),
  });
}
