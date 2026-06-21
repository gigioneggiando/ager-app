import type { SourceDetail } from "@ager/api-client";

import { backendGet } from "@/lib/server/backend";

/** Fetch the public source list. Empty array on failure. */
export async function getSources(): Promise<SourceDetail[]> {
  const result = await backendGet<SourceDetail[]>("/api/sources");
  return result.ok && Array.isArray(result.data) ? result.data : [];
}

/** Fetch a single source profile. Null when missing. */
export async function getSource(id: string): Promise<SourceDetail | null> {
  const result = await backendGet<SourceDetail>(
    `/api/sources/${encodeURIComponent(id)}`,
  );
  return result.ok ? result.data : null;
}
