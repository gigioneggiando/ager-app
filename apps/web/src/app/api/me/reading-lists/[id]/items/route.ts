import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** List a reading list's items (expanded to article cards). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams({ expand: "article" });
  const cursor = incoming.get("cursor");
  if (cursor) query.set("cursor", cursor);

  return relayResponse(
    await authedBackendFetch(
      `/api/me/reading-lists/${encodeURIComponent(id)}/items?${query.toString()}`,
    ),
  );
}

/** Add an article to a reading list. Body: { articleId, note? }. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.text();
  return relayResponse(
    await authedBackendFetch(
      `/api/me/reading-lists/${encodeURIComponent(id)}/items`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      },
    ),
  );
}
