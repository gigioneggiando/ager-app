import { NextResponse } from "next/server";

import { appendRow } from "@/lib/beta/signup-store";
import { parseBetaSignup } from "@/lib/beta/signup-schema";

/**
 * Beta signup: append-only.
 *
 * This endpoint can add a row to the signup spreadsheet and nothing else —
 * there is no route that reads the collected addresses back, so the site cannot
 * leak them even if this handler is abused. The address never reaches the logs.
 */

export const runtime = "nodejs";

const GENERIC_ERROR = { error: "invalid_request" } as const;

/** Same-origin only: the form is served from this site and nowhere else. */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  // The request URL is the authority here; the Host header is only a fallback.
  let host: string;
  try {
    host = new URL(request.url).host;
  } catch {
    host = request.headers.get("host") ?? "";
  }
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Structured, PII-free: the event, never the address. */
function logSignupEvent(level: "info" | "error", event: string, fields: Record<string, unknown>) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    severity: level,
    event_name: event,
    service_name: "ager-marketing",
    ...fields,
  });

  if (level === "error") console.error(line);
  else console.log(line);
}

export async function POST(request: Request) {
  const startedAt = Date.now();

  if (!isSameOrigin(request)) {
    return NextResponse.json(GENERIC_ERROR, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(GENERIC_ERROR, { status: 400 });
  }

  // A filled honeypot, a too-fast submission and a malformed address are all
  // answered identically on purpose: a bot learns nothing about which check it
  // tripped.
  const signup = parseBetaSignup(payload);
  if (!signup) {
    return NextResponse.json(GENERIC_ERROR, { status: 400 });
  }

  try {
    const result = await appendRow([
      new Date().toISOString(),
      signup.email,
      signup.contactConsent ? "si" : "no",
      signup.updatesConsent ? "si" : "no",
      signup.locale,
      "onboarding-beta",
    ]);

    // Locally an unconfigured spreadsheet is fine; in production it would mean
    // silently dropping every address, so it has to fail loudly instead.
    if (result === "not-configured" && process.env.NODE_ENV === "production") {
      throw new Error("Beta signup storage is not configured");
    }

    logSignupEvent("info", "beta_signup_completed", {
      status_code: 200,
      duration_ms: Date.now() - startedAt,
      storage: result,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // The error carries no address, but it can carry spreadsheet details:
    // log the event, not the exception body.
    logSignupEvent("error", "beta_signup_failed", {
      status_code: 502,
      duration_ms: Date.now() - startedAt,
    });

    return NextResponse.json({ error: "storage_unavailable" }, { status: 502 });
  }
}
