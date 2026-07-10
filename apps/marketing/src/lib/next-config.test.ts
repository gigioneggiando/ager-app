import { describe, expect, it } from "vitest";
import nextConfigPromiseOrObject from "../../next.config";

describe("next.config.ts redirects", () => {
  it("defines the expected redirects", async () => {
    // next-intl might wrap config in a function or a promise, or it could be a direct object or function.
    const resolvedConfig =
      typeof nextConfigPromiseOrObject === "function"
        ? await (nextConfigPromiseOrObject as any)("phase", {
            defaultConfig: {},
          })
        : await nextConfigPromiseOrObject;

    expect(resolvedConfig.redirects).toBeDefined();
    const redirects = await resolvedConfig.redirects();

    expect(redirects).toContainEqual({
      source: "/form",
      destination: "https://forms.gle/pvRv8mokGeP8CePc9",
      permanent: false,
    });
    expect(redirects).toContainEqual({
      source: "/form/",
      destination: "https://forms.gle/pvRv8mokGeP8CePc9",
      permanent: false,
    });
    expect(redirects).toContainEqual({
      source: "/:locale(it|en)/form",
      destination: "https://forms.gle/pvRv8mokGeP8CePc9",
      permanent: false,
    });
    expect(redirects).toContainEqual({
      source: "/:locale(it|en)/form/",
      destination: "https://forms.gle/pvRv8mokGeP8CePc9",
      permanent: false,
    });
  });
});
