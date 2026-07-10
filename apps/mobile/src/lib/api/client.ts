import { createApiClient, type AgerClient } from "@ager/api-client";

/**
 * Mobile API client.
 *
 * Wraps the framework-agnostic @ager/api-client for React Native: base URL comes from
 * EXPO_PUBLIC_API_BASE_URL, and a middleware attaches `Authorization: Bearer <token>` to
 * every request. The native client talks to the backend with a plain bearer header — no
 * cookies, no CSRF (per D2).
 *
 * TOKEN STORE IS A PLACEHOLDER. M2 introduces the expo-secure-store-backed session and
 * registers the real accessor via `setTokenProvider`, then wraps this client with
 * refresh-on-401. Until then `getToken()` returns null and requests go out anonymously.
 */

export type TokenProvider = () => string | null | undefined;

let getToken: TokenProvider = () => null;

/** M2 registers the secure-store-backed token accessor here. */
export function setTokenProvider(provider: TokenProvider): void {
  getToken = provider;
}

/** Resolve the backend base URL from Expo's public env, falling back to production. */
export function resolveMobileBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.agerculture.com";
}

export function createMobileApiClient(): AgerClient {
  const client = createApiClient({ baseUrl: resolveMobileBaseUrl() });

  client.use({
    onRequest({ request }) {
      const token = getToken();
      if (token) {
        request.headers.set("Authorization", `Bearer ${token}`);
      }
      return request;
    },
  });

  return client;
}

/** Shared client instance for the app. */
export const apiClient: AgerClient = createMobileApiClient();
