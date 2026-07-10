import type { AgerClient, AuthResult } from "@ager/api-client";

import { AuthError } from "./errors";
import { isExpiredOrExpiring, userFromToken, type AuthUser } from "./jwt";
import type { TokenStore } from "./token-store";

export type SessionStatus = "loading" | "authenticated" | "anonymous";

export interface SessionState {
  status: SessionStatus;
  user: AuthUser | null;
  /** Current access token snapshot (may be near/at expiry — the client refreshes on use). */
  accessToken: string | null;
}

export interface SessionControllerDeps {
  /** A plain @ager/api-client with NO auth middleware — used for the auth endpoints so a
   *  refresh call can never recurse through the refresh-on-401 wrapper. */
  authClient: AgerClient;
  tokenStore: TokenStore;
}

const INITIAL: SessionState = {
  status: "loading",
  user: null,
  accessToken: null,
};

/**
 * Framework-agnostic session core. Owns the in-memory token snapshot + status, persists the
 * rotated token pair to secure storage, and exposes single-flight refresh. React binds to it
 * via `subscribe`/`getSnapshot` (see session-context.tsx); the api-client binds via
 * `getFreshAccessToken`/`refresh` (see api-middleware.ts).
 */
export class SessionController {
  private state: SessionState = INITIAL;
  private refreshToken: string | null = null;
  private refreshInFlight: Promise<string | null> | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly deps: SessionControllerDeps) {}

  // --- external-store binding (stable refs for useSyncExternalStore) ------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): SessionState => this.state;

  private setState(patch: Partial<SessionState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }

  // --- token accessors (used by the api-client middleware) ---------------------------

  /** Current access token, synchronously — feeds M1's setTokenProvider seam. */
  getAccessToken(): string | null {
    return this.state.accessToken;
  }

  /** Proactive: refresh first when the token is missing/expiring, then return it. */
  async getFreshAccessToken(): Promise<string | null> {
    const token = this.state.accessToken;
    if (token && !isExpiredOrExpiring(token)) return token;
    if (this.refreshToken) {
      const refreshed = await this.refresh();
      if (refreshed) return refreshed;
    }
    return this.state.accessToken;
  }

  // --- lifecycle ---------------------------------------------------------------------

  /** Load persisted tokens on app start and resolve the initial status. */
  async restore(): Promise<void> {
    const [access, refresh] = await Promise.all([
      this.deps.tokenStore.getAccessToken(),
      this.deps.tokenStore.getRefreshToken(),
    ]);
    this.refreshToken = refresh;

    if (access) {
      // Optimistically authenticated even if the access token is stale — the next request
      // proactively refreshes it (mirrors the web session).
      this.setAuthenticated(access);
      return;
    }
    if (refresh) {
      // Only the refresh token survived; report authenticated with no token yet — the first
      // request refreshes before it goes out.
      this.setState({ status: "authenticated", user: null, accessToken: null });
      return;
    }
    this.setState({ status: "anonymous", user: null, accessToken: null });
  }

  // --- sign-in flow ------------------------------------------------------------------

  async requestOtp(email: string): Promise<void> {
    let response: Response | undefined;
    try {
      const result = await this.deps.authClient.POST(
        "/api/auth/login/request-code",
        {
          body: { email },
        },
      );
      response = result.response;
    } catch {
      throw new AuthError("network");
    }
    if (!response.ok) {
      throw new AuthError(
        response.status === 429 ? "rate_limit" : "request_failed",
      );
    }
  }

  async verifyOtp(email: string, code: string): Promise<void> {
    let data: AuthResult | undefined;
    let response: Response | undefined;
    try {
      const result = await this.deps.authClient.POST("/api/auth/login", {
        body: { email, otpCode: code },
      });
      data = result.data;
      response = result.response;
    } catch {
      throw new AuthError("network");
    }
    if (!response.ok || !data) {
      if (response.status === 429) throw new AuthError("rate_limit");
      if (response.status === 401) throw new AuthError("invalid_code");
      throw new AuthError("request_failed");
    }
    await this.applyAuthResult(data);
  }

  // --- refresh (single-flight) -------------------------------------------------------

  /** Refresh the token pair. Returns the new access token, or null on failure. A definitive
   *  rejection (invalid/expired/reused refresh token → 401/403/404) forces a sign-out; a
   *  transient failure (network/5xx) keeps the session so the next request can retry. */
  refresh(): Promise<string | null> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.doRefresh().finally(() => {
        this.refreshInFlight = null;
      });
    }
    return this.refreshInFlight;
  }

  private async doRefresh(): Promise<string | null> {
    const refreshToken =
      this.refreshToken ?? (await this.deps.tokenStore.getRefreshToken());
    if (!refreshToken) {
      await this.clearSession();
      return null;
    }

    let data: AuthResult | undefined;
    let status: number;
    try {
      const result = await this.deps.authClient.POST("/api/auth/refresh", {
        body: { refreshToken },
      });
      data = result.data;
      status = result.response.status;
    } catch {
      return null; // network blip — keep the session, retry on the next call
    }

    if (status === 401 || status === 403 || status === 404) {
      // Refresh token invalid / expired / revoked / reuse-detected → really logged out.
      await this.clearSession();
      return null;
    }
    if (!data?.accessToken || !data.refreshToken) {
      return null; // transient/unexpected — keep the session
    }
    await this.applyAuthResult(data);
    return data.accessToken;
  }

  // --- sign-out ----------------------------------------------------------------------

  /** Best-effort backend revoke of the refresh token, then clear local session. */
  async signOut(): Promise<void> {
    const refreshToken = this.refreshToken;
    if (refreshToken) {
      try {
        await this.deps.authClient.POST("/api/auth/logout", {
          body: { refreshToken },
        });
      } catch {
        // ignore — local sign-out proceeds regardless
      }
    }
    await this.clearSession();
  }

  // --- internals ---------------------------------------------------------------------

  private async applyAuthResult(auth: AuthResult): Promise<void> {
    const accessToken = auth.accessToken;
    const refreshToken = auth.refreshToken;
    if (!accessToken || !refreshToken) throw new AuthError("request_failed");
    await this.deps.tokenStore.setTokens({ accessToken, refreshToken });
    this.refreshToken = refreshToken;
    this.setAuthenticated(accessToken);
  }

  private setAuthenticated(accessToken: string): void {
    this.setState({
      status: "authenticated",
      user: userFromToken(accessToken),
      accessToken,
    });
  }

  private async clearSession(): Promise<void> {
    await this.deps.tokenStore.clear();
    this.refreshToken = null;
    this.setState({ status: "anonymous", user: null, accessToken: null });
  }
}
