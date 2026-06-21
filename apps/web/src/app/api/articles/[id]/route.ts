import type { Article } from "@ager/api-client";

import { backendGet, proxyJson } from "@/lib/server/backend";

/** Same-origin proxy: GET ${API_BASE_URL}/api/articles/{id}. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await backendGet<Article>(
    `/api/articles/${encodeURIComponent(id)}`,
  );
  return proxyJson(result);
}
