import type { ReadingList } from "@ager/api-client";

import { backendGet, proxyJson } from "@/lib/server/backend";

/** Public reading-list metadata by owner + slug (anonymous, cacheable). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ownerUserId: string; slug: string }> },
) {
  const { ownerUserId, slug } = await params;
  const result = await backendGet<ReadingList>(
    `/api/reading-lists/public/users/${encodeURIComponent(ownerUserId)}/${encodeURIComponent(slug)}`,
  );
  return proxyJson(result);
}
