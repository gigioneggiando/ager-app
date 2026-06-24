import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, GOOGLE_OAUTH_ORIGIN } from "./csp";

function directive(csp: string, name: string): string {
  const part = csp.split(";").map((s) => s.trim()).find((s) => s.startsWith(name + " "));
  return part ?? "";
}

describe("buildContentSecurityPolicy", () => {
  const csp = buildContentSecurityPolicy(false);

  it("still loads first-party styles and scripts (inline allowed for Next/Tailwind)", () => {
    expect(directive(csp, "style-src")).toBe("style-src 'self' 'unsafe-inline'");
    expect(directive(csp, "script-src")).toBe("script-src 'self' 'unsafe-inline'");
  });

  it("does NOT loosen script-src for Google (redirect flow loads no Google JS)", () => {
    expect(directive(csp, "script-src")).not.toContain(GOOGLE_OAUTH_ORIGIN);
  });

  it("allows the Google origin for the OAuth provider hand-off", () => {
    expect(directive(csp, "connect-src")).toContain(GOOGLE_OAUTH_ORIGIN);
    expect(directive(csp, "frame-src")).toContain(GOOGLE_OAUTH_ORIGIN);
    expect(directive(csp, "form-action")).toContain(GOOGLE_OAUTH_ORIGIN);
  });

  it("keeps clickjacking + base hardening intact", () => {
    expect(directive(csp, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(csp, "object-src")).toBe("object-src 'none'");
    expect(directive(csp, "base-uri")).toBe("base-uri 'self'");
  });

  it("adds dev-only relaxations only in development", () => {
    expect(buildContentSecurityPolicy(true)).toContain("'unsafe-eval'");
    expect(buildContentSecurityPolicy(true)).toContain("ws:");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain("ws:");
  });

  it("leaves connect-src untouched when no Sentry ingest origin is configured", () => {
    expect(directive(csp, "connect-src")).toBe(
      `connect-src 'self' ${GOOGLE_OAUTH_ORIGIN}`,
    );
    expect(directive(buildContentSecurityPolicy(false, null), "connect-src")).toBe(
      `connect-src 'self' ${GOOGLE_OAUTH_ORIGIN}`,
    );
  });

  it("adds the Sentry ingest origin to connect-src (only) when configured", () => {
    const ingest = "https://o123.ingest.example.com";
    const withSentry = buildContentSecurityPolicy(false, ingest);
    expect(directive(withSentry, "connect-src")).toBe(
      `connect-src 'self' ${GOOGLE_OAUTH_ORIGIN} ${ingest}`,
    );
    // No other directive is loosened by the Sentry origin.
    expect(directive(withSentry, "script-src")).toBe("script-src 'self' 'unsafe-inline'");
    expect(directive(withSentry, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(withSentry, "default-src")).toBe("default-src 'self'");
  });
});
