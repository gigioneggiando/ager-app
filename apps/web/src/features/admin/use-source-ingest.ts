"use client";

import { useMutation } from "@tanstack/react-query";

/** Admin: force an immediate ingestion of every active source. */
export function usePullAllSources() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ingestion/pull-all", { method: "POST" });
      if (!res.ok) throw new Error(`pull_all_failed_${res.status}`);
    },
  });
}

/** Admin: force an immediate ingestion of a single source. */
export function usePullSource(id: number) {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/ingestion/sources/${id}/pull`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`pull_source_failed_${res.status}`);
    },
  });
}
