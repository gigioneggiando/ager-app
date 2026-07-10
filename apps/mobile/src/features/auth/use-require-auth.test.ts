import { needsAuthPrompt, SIGN_IN_ROUTE } from "./auth-prompt";

describe("needsAuthPrompt", () => {
  it("prompts for anonymous and loading, not for authenticated", () => {
    expect(needsAuthPrompt("anonymous")).toBe(true);
    expect(needsAuthPrompt("loading")).toBe(true);
    expect(needsAuthPrompt("authenticated")).toBe(false);
  });

  it("routes to /sign-in", () => {
    expect(SIGN_IN_ROUTE).toBe("/sign-in");
  });
});
