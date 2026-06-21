import { NextResponse } from "next/server";
import type { FeedPage } from "@ager/api-client";

/**
 * Server-side proxy for the public feed. The browser calls this SAME-ORIGIN route
 * (`/api/feed`) instead of the backend directly — no CORS, and the backend base URL
 * stays server-only. This establishes the proxy pattern reused by auth/CSRF in PR4.
 *
 * Anonymous (no auth header) → backend returns cold-start. Forwards cursor + limit.
 */
const API_BASE = process.env.API_BASE_URL ?? "https://api.agerculture.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const upstream = new URL("/api/feed", API_BASE);
  const cursor = searchParams.get("cursor");
  const limit = searchParams.get("limit");
  if (cursor) upstream.searchParams.set("cursor", cursor);
  if (limit) upstream.searchParams.set("limit", limit);

  let res: Response;
  try {
    res = await fetch(upstream, {
      headers: { accept: "application/json" },
      // Cache upstream responses ~60s (Next data cache).
      next: { revalidate: 60 },
    });
  } catch {
    return NextResponse.json({ error: "feed_unavailable" }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: "feed_unavailable" }, { status: 502 });
  }

  const data = (await res.json()) as FeedPage;
  return NextResponse.json(data, {
    headers: {
      // Let the CDN serve the feed for ~60s and refresh in the background.
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
