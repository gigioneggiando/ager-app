import type { Article } from "@ager/api-client";

import { backendGet } from "@/lib/server/backend";

/** Fetch a single article projection (metadata only — link-first). Null when missing. */
export async function getArticle(id: string): Promise<Article | null> {
  const result = await backendGet<Article>(
    `/api/articles/${encodeURIComponent(id)}`,
  );
  return result.ok ? result.data : null;
}
