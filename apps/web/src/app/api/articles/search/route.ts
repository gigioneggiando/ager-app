import type { ArticleSearchResultsPage } from "@ager/api-client";

import { backendGet, proxyJson } from "@/lib/server/backend";

/** Same-origin proxy: GET ${API_BASE_URL}/api/articles/search (full-text, offset-paged). */
export async function GET(request: Request) {
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of ["q", "page", "pageSize", "lang"]) {
    const value = incoming.get(key);
    if (value) query.set(key, value);
  }

  const result = await backendGet<ArticleSearchResultsPage>(
    "/api/articles/search",
    query,
  );
  return proxyJson(result);
}
