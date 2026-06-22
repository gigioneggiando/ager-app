"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReadingStats } from "@ager/api-client";

/** The reading-variety windows the dashboard offers. */
export const STATS_WINDOWS = ["7d", "14d", "30d"] as const;
export type StatsWindow = (typeof STATS_WINDOWS)[number];
export const DEFAULT_STATS_WINDOW: StatsWindow = "30d";

/** Reading-variety stats for the caller, via the same-origin authed proxy. */
export function useStats(window: StatsWindow) {
  return useQuery({
    queryKey: ["me-stats", window],
    queryFn: async (): Promise<ReadingStats> => {
      const res = await fetch(`/api/me/stats?window=${encodeURIComponent(window)}`, {
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error("stats_unavailable");
      return (await res.json()) as ReadingStats;
    },
  });
}
