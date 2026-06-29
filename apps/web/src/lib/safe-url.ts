/**
 * Returns the URL only when it is a safe http(s) absolute URL, otherwise `undefined`.
 *
 * Existing DB rows (avatars, article / og images, publisher links) may still hold
 * `javascript:` / `data:` / internal-scheme URLs written before the backend added
 * write-time scheme validation. Never bind a user- or publisher-controlled URL into
 * `src` / `href` / `style` without passing it through this guard first.
 */
export function safeUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  try {
    const parsed = new URL(u);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? u
      : undefined;
  } catch {
    return undefined;
  }
}
