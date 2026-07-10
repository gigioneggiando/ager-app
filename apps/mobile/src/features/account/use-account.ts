import { useMutation } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { apiClient } from "@/lib/api/client";

/** Deterministic export filename from an ISO timestamp (pure — testable). */
export function exportFileName(isoDate: string): string {
  return `ager-export-${isoDate.slice(0, 10)}.json`;
}

/** DELETE /api/me — soft-delete; the backend revokes refresh tokens. */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { response } = await apiClient.DELETE("/api/me");
      if (!response.ok) throw new Error("delete_failed");
    },
  });
}

/**
 * GET /api/me/export → save the GDPR JSON to a cache file and open the OS share sheet
 * (save / send elsewhere). 429 (1-per-24h) surfaces as "rate_limited". The export contains
 * PII — it is written to a file + shared, never logged.
 */
export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const { data, response } = await apiClient.GET("/api/me/export");
      if (response.status === 429) throw new Error("rate_limited");
      if (!response.ok || !data) throw new Error("export_failed");

      const name = exportFileName(new Date().toISOString());
      const uri = `${FileSystem.cacheDirectory}${name}`;
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(data, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/json",
          dialogTitle: name,
          UTI: "public.json",
        });
      }
    },
  });
}
