import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { openArticle, openInBrowser } from "./open-at-source";

// jest hoists jest.mock above the imports, so the modules are mocked before load.
jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }));
jest.mock("expo-linking", () => ({ openURL: jest.fn() }));

describe("openArticle (link-first open + OPENED_EXTERNAL)", () => {
  const open = jest.fn().mockResolvedValue(undefined);
  const track = jest.fn();

  beforeEach(() => {
    open.mockClear();
    track.mockClear();
  });

  it("opens a safe URL and fires OPENED_EXTERNAL for a signed-in user", async () => {
    const opened = await openArticle(
      { articleId: 5, url: "https://pub.com/a", displayMode: null },
      { isAuthenticated: true, open, track },
    );
    expect(opened).toBe(true);
    expect(open).toHaveBeenCalledWith("https://pub.com/a", null);
    expect(track).toHaveBeenCalledWith(5);
  });

  it("opens but does NOT fire for anonymous users", async () => {
    const opened = await openArticle(
      { articleId: 5, url: "https://pub.com/a" },
      { isAuthenticated: false, open, track },
    );
    expect(opened).toBe(true);
    expect(open).toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it("blocks an unsafe URL — nothing opens or fires", async () => {
    const opened = await openArticle(
      { articleId: 5, url: "javascript:alert(1)" },
      { isAuthenticated: true, open, track },
    );
    expect(opened).toBe(false);
    expect(open).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it("falls back to canonicalUrl", async () => {
    await openArticle(
      { articleId: 7, url: null, canonicalUrl: "https://c.com" },
      { isAuthenticated: true, open, track },
    );
    expect(open).toHaveBeenCalledWith("https://c.com", null);
    expect(track).toHaveBeenCalledWith(7);
  });
});

describe("openInBrowser (respects displayMode)", () => {
  const openBrowserAsync = jest.mocked(WebBrowser.openBrowserAsync);
  const openURL = jest.mocked(Linking.openURL);

  beforeEach(() => {
    openBrowserAsync.mockReset().mockResolvedValue(true as never);
    openURL.mockReset().mockResolvedValue(undefined as never);
  });

  it("uses the in-app browser for webview / default", async () => {
    await openInBrowser("https://x.com", "webview");
    expect(openBrowserAsync).toHaveBeenCalledWith("https://x.com");
    expect(openURL).not.toHaveBeenCalled();
  });

  it("hands off to the system browser for redirect", async () => {
    await openInBrowser("https://x.com", "redirect");
    expect(openURL).toHaveBeenCalledWith("https://x.com");
    expect(openBrowserAsync).not.toHaveBeenCalled();
  });
});
