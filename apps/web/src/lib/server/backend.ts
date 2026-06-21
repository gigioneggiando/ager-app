import { NextResponse } from "next/server";

/**
 * SERVER-ONLY backend access. Imported by route handlers (the same-origin proxies) and
 * by server components — never by client components. `API_BASE_URL` stays server-side
 * (no CORS; backend URL never reaches the browser).
 */
const API_BASE = process.env.API_BASE_URL ?? "https://api.agerculture.com";

export type BackendResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; data: null };

/** GET a JSON resource from the backend with the shared cache policy. */
export async function backendGet<T>(
  path: string,
  search?: URLSearchParams,
): Promise<BackendResult<T>> {
  const url = new URL(path, API_BASE);
  if (search) {
    const qs = search.toString();
    if (qs) url.search = qs;
  }
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return { ok: false, status: res.status, data: null };
    return { ok: true, status: res.status, data: (await res.json()) as T };
  } catch {
    return { ok: false, status: 502, data: null };
  }
}

/**
 * Map a backend result to a same-origin proxy Response: pass through 404, collapse other
 * failures to 502, and attach the shared CDN cache headers on success.
 */
export function proxyJson<T>(result: BackendResult<T>): NextResponse {
  if (!result.ok) {
    const status = result.status === 404 ? 404 : 502;
    return NextResponse.json(
      { error: status === 404 ? "not_found" : "upstream_error" },
      { status },
    );
  }
  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
