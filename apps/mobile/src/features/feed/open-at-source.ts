import type { FeedItem } from "@ager/api-client";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { safeUrl } from "@/lib/safe-url";

/**
 * Link-first "open at source". Ager's job is to send the reader to the publisher, so opening
 * an article launches the publisher's page — never an in-app article body. `OPENED_EXTERNAL`
 * (fired by the caller) is the primary positive engagement signal.
 */

/** The article projection open-at-source needs. */
export type OpenableArticle = Pick<
  FeedItem,
  "articleId" | "url" | "canonicalUrl" | "displayMode"
>;

/**
 * Launch the publisher URL, respecting `displayMode`:
 * - `redirect` → hand off to the system browser (leaves the app).
 * - `webview` / `reader_optin` / default → in-app browser tab (stays in the app, link-first).
 * The URL is assumed already safe-guarded by the caller.
 */
export async function openInBrowser(
  url: string,
  displayMode: string | null,
): Promise<void> {
  if (displayMode === "redirect") {
    await Linking.openURL(url);
    return;
  }
  await WebBrowser.openBrowserAsync(url);
}

export interface OpenArticleDeps {
  isAuthenticated: boolean;
  /** Launch the URL (defaults to openInBrowser; injected in tests). */
  open: (url: string, displayMode: string | null) => Promise<void>;
  /** Fire OPENED_EXTERNAL for the given article (injected in tests). */
  track: (articleId: number) => void;
}

/**
 * Open an article at its source and, when it actually opens for a signed-in user, fire the
 * OPENED_EXTERNAL signal. Unsafe/absent URLs (non-http(s)) are blocked and nothing fires.
 * Returns true when the article was opened.
 */
export async function openArticle(
  item: OpenableArticle,
  deps: OpenArticleDeps,
): Promise<boolean> {
  const url = safeUrl(item.url ?? item.canonicalUrl ?? undefined);
  if (!url) return false;

  await deps.open(url, item.displayMode ?? null);

  if (deps.isAuthenticated && item.articleId != null) {
    deps.track(item.articleId);
  }
  return true;
}
