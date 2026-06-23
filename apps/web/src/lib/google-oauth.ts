/**
 * Client-side helpers for the Google OAuth redirect flow.
 *
 * Flow: ask our proxy for a one-time nonce → stash an anti-CSRF `state` (+ post-login
 * `next`) in sessionStorage → navigate to Google with `response_type=id_token`. Google
 * returns the id_token in the URL fragment of our callback page, which validates `state`
 * and POSTs the id_token to our exchange proxy. No Google JS is loaded.
 */

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
export const GOOGLE_OAUTH_CONFIGURED = GOOGLE_CLIENT_ID.length > 0;

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const STATE_KEY = "ager_oauth_state";

function randomToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Only allow same-origin app paths as the post-login redirect. */
function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

/**
 * Begin Google sign-in. Throws if the begin proxy fails; otherwise navigates away (this
 * function does not return on success).
 */
export async function startGoogleLogin(opts: {
  locale: string;
  next: string;
}): Promise<void> {
  const res = await fetch("/api/auth/oauth/google/begin", { method: "POST" });
  if (!res.ok) throw new Error("oauth_begin_failed");
  const data = (await res.json().catch(() => null)) as { nonce?: string } | null;
  if (!data?.nonce) throw new Error("oauth_begin_failed");

  const state = randomToken();
  sessionStorage.setItem(
    STATE_KEY,
    JSON.stringify({ state, next: safeNext(opts.next) }),
  );

  const redirectUri = `${window.location.origin}/${opts.locale}/oauth/callback`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "id_token",
    scope: "openid email profile",
    nonce: data.nonce,
    state,
    prompt: "select_account",
  });
  window.location.assign(`${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`);
}

export interface GoogleCallbackResult {
  idToken: string | null;
  error: string | null;
  /** True only when the returned `state` matches the one we stored before redirecting. */
  stateValid: boolean;
  /** Sanitized post-login redirect path. */
  next: string;
}

/** Parse the Google callback fragment and validate `state` against sessionStorage. */
export function readGoogleCallback(): GoogleCallbackResult {
  const rawHash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const frag = new URLSearchParams(rawHash);
  const idToken = frag.get("id_token");
  const state = frag.get("state");
  const error = frag.get("error");

  let stored: { state?: string; next?: string } | null = null;
  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    stored = raw ? (JSON.parse(raw) as { state?: string; next?: string }) : null;
  } catch {
    stored = null;
  }
  sessionStorage.removeItem(STATE_KEY);

  const stateValid = Boolean(state && stored?.state && state === stored.state);
  return { idToken, error, stateValid, next: safeNext(stored?.next) };
}

/**
 * Best-effort extraction of the email claim from an id_token, used only to prefill the
 * restore form when a deleted account tries to sign in. NOT a security check — the token
 * is validated server-side; this just reads an unverified claim for UX.
 */
export function decodeIdTokenEmail(idToken: string): string | null {
  try {
    const payload = idToken.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as { email?: unknown };
    return typeof claims.email === "string" ? claims.email : null;
  } catch {
    return null;
  }
}
