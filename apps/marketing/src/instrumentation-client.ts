import * as Sentry from "@sentry/nextjs";

import { buildSentryOptions, isSentryEnabled } from "@/lib/observability/sentry-shared";

// Browser-side Sentry init. Fully no-op when no DSN is configured.
if (isSentryEnabled) {
  Sentry.init(buildSentryOptions() as Parameters<typeof Sentry.init>[0]);
}

// Ties App Router navigations to captured errors (Next 16). No-op until init runs.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
