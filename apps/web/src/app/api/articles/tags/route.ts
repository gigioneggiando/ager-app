import type { ArticleTag } from "@ager/api-client";

import { backendGet, proxyJson } from "@/lib/server/backend";

/** Same-origin proxy: GET ${API_BASE_URL}/api/articles/tags (the tag taxonomy). */
export async function GET() {
  const result = await backendGet<ArticleTag[]>("/api/articles/tags");
  return proxyJson(result);
}
