import { NextResponse } from "next/server";
import type { FeedPage } from "@ager/api-client";

import { authedBackendFetch } from "@/lib/server/backend";
import { readAccessToken } from "@/lib/server/auth-cookies";

// Reads the session cookie and personalizes per user → always run on request, never
// statically optimize or cache the route itself.
export const dynamic = "force-dynamic";

/**
 * Server-side proxy for the feed. Same-origin (no CORS); backend base URL stays
 * server-only. Goes through `authedBackendFetch`, which attaches the user's Bearer from the
 * session cookie (refreshing on 401) and forces `no-store` so the per-user request always
 * reaches the backend as that user → PERSONALIZED ranking + `recommendation_events` with the
 * user_id/mode set. Anonymous (no cookie) → no Bearer → cold-start. Forwards cursor/limit/mode.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = new URLSearchParams();
  const cursor = searchParams.get("cursor");
  const limit = searchParams.get("limit");
  const mode = searchParams.get("mode");
  if (cursor) query.set("cursor", cursor);
  if (limit) query.set("limit", limit);
  if (mode) query.set("mode", mode);
  const qs = query.toString();
  const path = `/api/feed${qs ? `?${qs}` : ""}`;

  const authenticated = Boolean(await readAccessToken());

  let res: Response;
  try {
    res = await authedBackendFetch(path);
  } catch {
    return NextResponse.json({ error: "feed_unavailable" }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: "feed_unavailable" }, { status: 502 });
  }

  const data = (await res.json()) as FeedPage;
  return NextResponse.json(data, {
    headers: {
      // Personalized feeds are per-user → never CDN-cache them. Cold-start is cacheable.
      "Cache-Control": authenticated
        ? "private, no-store"
        : "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
