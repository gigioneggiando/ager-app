"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateMyProfileRequest, UserProfile } from "@ager/api-client";

/** PATCH /api/me. Updates the ["me"] cache with the returned profile. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateMyProfileRequest): Promise<UserProfile> => {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const code = await res
          .json()
          .then((b: { error?: string; code?: string }) => b.error ?? b.code)
          .catch(() => undefined);
        throw new Error(code ?? `update_failed_${res.status}`);
      }
      return (await res.json()) as UserProfile;
    },
    onSuccess: (data) => queryClient.setQueryData(["me"], data),
  });
}

/** DELETE /api/me (soft-delete; backend revokes refresh tokens). */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/me", { method: "DELETE" });
      if (!res.ok) throw new Error(`delete_failed_${res.status}`);
    },
  });
}

/**
 * GET /api/me/export → download the GDPR JSON. Throws "rate_limited" on the 1-per-24h 429 so
 * the UI can message it. The blob download is guarded for non-browser/test environments.
 */
export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/me/export", {
        headers: { accept: "application/json" },
      });
      if (res.status === 429) throw new Error("rate_limited");
      if (!res.ok) throw new Error("export_failed");

      const blob = await res.blob();
      if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = `ager-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);
      }
    },
  });
}
