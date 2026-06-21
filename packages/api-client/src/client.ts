import createClient, { type ClientOptions, type Client } from "openapi-fetch";
import type { paths } from "./generated/schema";

/**
 * Default API base URL. Overridable via NEXT_PUBLIC_API_BASE_URL so the same client
 * works in the browser, in Next route handlers, and in tests. Falls back to production.
 */
export const DEFAULT_API_BASE_URL = "https://api.agerculture.com";

export function resolveBaseUrl(explicit?: string): string {
  return (
    explicit ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_API_BASE_URL
  );
}

export type AgerClient = Client<paths>;

/**
 * Create a typed AGER API client. Pass `baseUrl` to override; otherwise resolves from
 * NEXT_PUBLIC_API_BASE_URL → production default. Extra openapi-fetch options
 * (headers, fetch, middleware) are forwarded.
 */
export function createApiClient(
  options: ClientOptions = {},
): AgerClient {
  const { baseUrl, ...rest } = options;
  return createClient<paths>({
    baseUrl: resolveBaseUrl(baseUrl),
    ...rest,
  });
}

/**
 * Shared, lazily-resolved client for public reads (feed / articles / sources).
 * For anything needing cookies/CSRF/secrets, create a request-scoped client inside a
 * Next route handler instead.
 */
export const apiClient: AgerClient = createApiClient();
