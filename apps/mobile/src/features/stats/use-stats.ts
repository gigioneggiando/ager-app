import type { ReadingStats } from "@ager/api-client";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

/** The reading-variety windows the dashboard offers (mirrors the web). */
export const STATS_WINDOWS = ["7d", "14d", "30d"] as const;
export type StatsWindow = (typeof STATS_WINDOWS)[number];
export const DEFAULT_STATS_WINDOW: StatsWindow = "30d";

export function isStatsWindow(value: string): value is StatsWindow {
  return (STATS_WINDOWS as readonly string[]).includes(value);
}

/** 0–1 ratio → whole percent (0–100). */
export function toPercent(value: number | undefined): number {
  return Math.max(0, Math.min(100, Math.round((value ?? 0) * 100)));
}

/** Reading-variety stats for the caller over `window`. */
export function useStats(window: StatsWindow) {
  return useQuery({
    queryKey: ["me-stats", window],
    queryFn: async (): Promise<ReadingStats> => {
      const { data, error } = await apiClient.GET("/api/me/stats", {
        params: { query: { window } },
      });
      if (error || !data) throw new Error("stats_unavailable");
      return data;
    },
  });
}
