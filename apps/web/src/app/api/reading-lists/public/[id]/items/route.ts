import type { ReadingListItemsPage } from "@ager/api-client";

import { backendGet, proxyJson } from "@/lib/server/backend";

/** Items of a public reading list (anonymous, cursor-paginated, cacheable). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const incoming = new URL(request.url).searchParams;
  const search = new URLSearchParams();
  const cursor = incoming.get("cursor");
  const limit = incoming.get("limit");
  if (cursor) search.set("cursor", cursor);
  if (limit) search.set("limit", limit);

  const result = await backendGet<ReadingListItemsPage>(
    `/api/reading-lists/public/${encodeURIComponent(id)}/items`,
    search,
  );
  return proxyJson(result);
}
