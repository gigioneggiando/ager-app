import * as Sentry from "@sentry/nextjs";

/**
 * Capture a server-side (BFF / route-handler) failure into Sentry. These failures are
 * caught and collapsed to a 502 (or relayed as a 5xx) without ever throwing out of the
 * route, so Next's automatic `onRequestError` never sees them — hence this explicit hook.
 *
 * No-op when Sentry has no DSN (init was skipped), so it is safe to call unconditionally.
 * The global `beforeSend` strips cookies/Authorization/tokens; the context attached here
 * (route path, upstream status) is non-sensitive.
 */
export function captureUpstreamError(
  error: unknown,
  context: { path: string; upstreamStatus?: number; phase: string },
): void {
  Sentry.captureException(error, {
    tags: { area: "bff", phase: context.phase },
    extra: { path: context.path, upstreamStatus: context.upstreamStatus },
  });
}
