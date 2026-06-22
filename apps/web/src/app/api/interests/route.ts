import { backendGet, proxyJson } from "@/lib/server/backend";
import type { Interest } from "@ager/api-client";

/** Public proxy: GET the interest taxonomy. */
export async function GET() {
  return proxyJson(await backendGet<Interest[]>("/api/interests"));
}
