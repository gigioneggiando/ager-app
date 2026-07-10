import type { Middleware } from "openapi-fetch";

import type { SessionController } from "./session-controller";

/**
 * openapi-fetch middleware that keeps authenticated requests signed and recovers from an
 * expired access token:
 *  - onRequest: proactively refresh a near-expiry token, then attach the bearer.
 *  - onResponse: on a 401, refresh once and retry the original request with the new token.
 *
 * A failed refresh signs the user out (inside the controller) and the original 401 is
 * surfaced. This middleware runs on the authenticated data client only — never on the
 * separate auth client the controller uses for login/refresh — so a refresh can't recurse.
 */
export function createAuthMiddleware(
  controller: SessionController,
): Middleware {
  // Clone each outgoing request so a 401 can be replayed with a fresh token (the sent
  // request's body is already consumed by the time onResponse runs).
  const pending = new Map<string, Request>();

  return {
    async onRequest({ request, id }) {
      const token = await controller.getFreshAccessToken();
      if (token) request.headers.set("Authorization", `Bearer ${token}`);
      pending.set(id, request.clone());
      return request;
    },

    async onResponse({ response, id }) {
      const original = pending.get(id);
      pending.delete(id);
      if (response.status !== 401 || !original) return undefined;

      const token = await controller.refresh();
      if (!token) return undefined; // refresh failed → controller signed out; surface the 401

      const retried = original.clone();
      retried.headers.set("Authorization", `Bearer ${token}`);
      return fetch(retried);
    },

    onError({ id }) {
      pending.delete(id);
    },
  };
}
