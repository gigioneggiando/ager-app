import type { SourceDetail } from "@ager/api-client";

import { backendGet, proxyJson } from "@/lib/server/backend";

/** Same-origin proxy: GET ${API_BASE_URL}/api/sources (public source list). */
export async function GET() {
  // The contract declares no schema for the list; treat it as SourceDetailDto[].
  const result = await backendGet<SourceDetail[]>("/api/sources");
  return proxyJson(result);
}
