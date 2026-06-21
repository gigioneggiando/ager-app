import type { SourceDetail } from "@ager/api-client";

import { backendGet, proxyJson } from "@/lib/server/backend";

/** Same-origin proxy: GET ${API_BASE_URL}/api/sources/{sourceId}. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await backendGet<SourceDetail>(
    `/api/sources/${encodeURIComponent(id)}`,
  );
  return proxyJson(result);
}
