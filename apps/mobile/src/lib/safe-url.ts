/**
 * Returns the URL only when it is a safe absolute http(s) URL, otherwise `undefined`.
 *
 * Mirrors the web `safe-url.ts` guard: publisher-controlled URLs (article/og images, links)
 * may hold `javascript:` / `data:` / other schemes; never open or bind one without this
 * guard. Uses a scheme-anchored allowlist rather than `new URL()` because React Native's
 * URL implementation is unreliable. Case-insensitive per the URL spec.
 */
export function safeUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  return /^https?:\/\//i.test(u) ? u : undefined;
}
