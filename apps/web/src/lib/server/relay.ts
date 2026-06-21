import { NextResponse } from "next/server";

/**
 * Relay a backend Response to the browser as a same-origin response: preserve the status
 * and JSON body (e.g. ProblemDetails on errors), drop hop-by-hop headers and any backend
 * Set-Cookie (the frontend manages its own cookies).
 */
export async function relayResponse(res: Response): Promise<NextResponse> {
  const contentType = res.headers.get("content-type") ?? "";
  if (res.status === 204 || res.status === 205 || !contentType) {
    return new NextResponse(null, { status: res.status });
  }
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": contentType },
  });
}
