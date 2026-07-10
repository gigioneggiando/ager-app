import { createApiClient } from "@ager/api-client";
import {
  createAuthMiddleware,
  expoSecureStorage,
  SessionController,
  TokenStore,
} from "@ager/auth";

import {
  apiClient,
  resolveMobileBaseUrl,
  setTokenProvider,
} from "@/lib/api/client";

/**
 * Assembles the auth session and wires it to the M1 api-client.
 *
 * `authClient` is a plain client with NO auth middleware — the SessionController uses it for
 * login / refresh / logout so a refresh can never recurse through the refresh-on-401 wrapper
 * on the shared `apiClient`. Importing this module (done by the root layout) performs the
 * one-time wiring below.
 */
const authClient = createApiClient({ baseUrl: resolveMobileBaseUrl() });
const tokenStore = new TokenStore(expoSecureStorage);

export const sessionController = new SessionController({
  authClient,
  tokenStore,
});

// Inject the current access token into M1's seam (sync) + add proactive refresh and
// refresh-and-retry-on-401 on the shared data client.
setTokenProvider(() => sessionController.getAccessToken());
apiClient.use(createAuthMiddleware(sessionController));
