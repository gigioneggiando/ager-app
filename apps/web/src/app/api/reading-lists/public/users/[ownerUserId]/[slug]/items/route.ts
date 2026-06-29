import type { ReadingListItemsPage } from "@ager/api-client";

import { backendGet, proxyJson } from "@/lib/server/backend";

/**
 * Items of a Public OR Unlisted reading list, addressed by owner + slug (anonymous,
 * cursor-paginated, cacheable). Unlisted lists are reachable only via this unguessable
 * route — the numeric-id route serves Public lists only (backend security PR #86), so
 * the share view must always use this route to avoid 404s on Unlisted shares.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ ownerUserId: string; slug: string }> },
) {
  const { ownerUserId, slug } = await params;
  const incoming = new URL(request.url).searchParams;
  const search = new URLSearchParams();
  const cursor = incoming.get("cursor");
  const limit = incoming.get("limit");
  if (cursor) search.set("cursor", cursor);
  if (limit) search.set("limit", limit);

  const result = await backendGet<ReadingListItemsPage>(
    `/api/reading-lists/public/users/${encodeURIComponent(ownerUserId)}/${encodeURIComponent(slug)}/items`,
    search,
  );
  return proxyJson(result);
}
