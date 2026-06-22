import { NextResponse } from "next/server";
import type { FeedPage } from "@ager/api-client";

import { authedBackendFetch } from "@/lib/server/backend";
import { readAccessToken } from "@/lib/server/auth-cookies";

/**
 * Server-side proxy for the feed. Same-origin (no CORS); backend base URL stays
 * server-only. When a session exists the proxy attaches the user's Bearer (refreshing on
 * 401) → the backend returns the PERSONALIZED feed; anonymous requests get cold-start.
 * Forwards cursor + limit.
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
