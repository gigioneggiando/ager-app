/**
 * Shared Sentry configuration + PII scrubbing, used by both the client
 * (`instrumentation-client.ts`) and the server (`instrumentation.ts`) inits, and — for the
 * ingest-origin resolver — by `next.config.ts`.
 *
 * This module deliberately imports nothing from `@sentry/nextjs` (only the init files do),
 * so it stays runtime-light and safe to pull into the Next config and into unit tests.
 *
 * Privacy invariant (CLAUDE.md): tokens, cookies, OTP and passwords must never leave the
 * browser/server. `sendDefaultPii` is false and `beforeSend` scrubs every event.
 */

/** DSN from env. Empty/unset ⇒ Sentry stays fully disabled (init is skipped → no-op). */
export const SENTRY_DSN = (process.env.NEXT_PUBLIC_SENTRY_DSN ?? "").trim();

/** Sentry is only active when a non-empty DSN is configured. */
export const isSentryEnabled = SENTRY_DSN.length > 0;

/**
 * Origin of the ingest endpoint, for the CSP `connect-src`. Prefer an explicit override,
 * else derive it from the DSN host. Returns null when no DSN is set, so the CSP is a no-op.
 */
export function resolveSentryIngestOrigin(): string | null {
  const explicit = (process.env.NEXT_PUBLIC_SENTRY_INGEST_ORIGIN ?? "").trim();
  if (explicit) return explicit;
  if (!SENTRY_DSN) return null;
  try {
    return new URL(SENTRY_DSN).origin;
  } catch {
    return null;
  }
}

// Any key whose name hints at a secret is redacted wherever it appears in an event.
const SENSITIVE_KEY =
  /(cookie|authorization|auth|token|password|passwd|otp|secret|csrf|bearer|session)/i;

function redactInPlace(value: unknown, depth = 0): void {
  if (!value || typeof value !== "object" || depth > 8) return;
  if (Array.isArray(value)) {
    for (const v of value) redactInPlace(v, depth + 1);
    return;
  }
  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_KEY.test(key)) {
      obj[key] = "[redacted]";
    } else {
      redactInPlace(obj[key], depth + 1);
    }
  }
}

/**
 * `beforeSend` body: strip cookies + the Authorization header, drop the request bodies of
 * auth routes entirely, and redact any token/OTP/password/CSRF anywhere in the payload.
 * Mutates and returns the same event (Sentry expects the event or null). Exported for tests.
 */
export function scrubSentryEvent<T extends object>(event: T): T {
  const e = event as Record<string, unknown>;
  const req = e.request as
    | { cookies?: unknown; headers?: Record<string, unknown>; url?: unknown; data?: unknown }
    | undefined;

  if (req && typeof req === "object") {
    delete req.cookies;
    if (req.headers && typeof req.headers === "object") {
      for (const h of Object.keys(req.headers)) {
        if (/cookie|authorization/i.test(h)) delete req.headers[h];
      }
    }
    // Never transmit the request body of an auth/OTP route.
    if (typeof req.url === "string" && /\/api\/auth(\/|\?|$)/.test(req.url)) {
      delete req.data;
    }
  }

  // Redact secret-like keys wherever they survive (request data/headers, extra, contexts,
  // breadcrumb data).
  redactInPlace(e.request);
  redactInPlace(e.extra);
  redactInPlace(e.contexts);
  redactInPlace(e.breadcrumbs);

  return event;
}

/**
 * Common init options for both runtimes. Errors only (no performance tracing) to minimise
 * data collected. The caller only invokes `Sentry.init` when {@link isSentryEnabled}.
 */
export function buildSentryOptions(): {
  dsn: string;
  sendDefaultPii: false;
  tracesSampleRate: number;
  beforeSend: (event: object) => object;
} {
  return {
    dsn: SENTRY_DSN,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend: (event) => scrubSentryEvent(event),
  };
}
