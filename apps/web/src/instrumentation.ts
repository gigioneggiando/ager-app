import * as Sentry from "@sentry/nextjs";

import { buildSentryOptions, isSentryEnabled } from "@/lib/observability/sentry-shared";

/**
 * Server-side Sentry init (Node + Edge runtimes). Next calls `register()` once at server
 * startup. Fully no-op when no DSN is configured (init is skipped).
 */
export async function register() {
  if (!isSentryEnabled) return;
  Sentry.init(buildSentryOptions() as Parameters<typeof Sentry.init>[0]);
}

// Captures errors thrown in Server Components, route handlers, and middleware (Next 16).
// No-op until Sentry has been initialised.
export const onRequestError = Sentry.captureRequestError;
