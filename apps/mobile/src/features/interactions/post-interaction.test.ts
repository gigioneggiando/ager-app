import { apiClient } from "@/lib/api/client";

import { postInteraction } from "./post-interaction";

// jest hoists jest.mock above the imports, so the module is mocked before load.
jest.mock("@/lib/api/client", () => ({ apiClient: { POST: jest.fn() } }));

const post = jest.mocked(apiClient.POST);

describe("postInteraction", () => {
  beforeEach(() => post.mockReset());

  it("POSTs the interaction to /api/interactions and reports acceptance", async () => {
    post.mockResolvedValue({ response: { ok: true } } as never);

    const ok = await postInteraction(42, "OPENED_EXTERNAL");

    expect(ok).toBe(true);
    expect(post).toHaveBeenCalledWith("/api/interactions", {
      body: { articleId: 42, type: "OPENED_EXTERNAL", reason: undefined },
    });
  });

  it("passes a discard reason through", async () => {
    post.mockResolvedValue({ response: { ok: true } } as never);

    await postInteraction(7, "DISCARD", "clickbait");

    expect(post).toHaveBeenCalledWith("/api/interactions", {
      body: { articleId: 7, type: "DISCARD", reason: "clickbait" },
    });
  });

  it("returns false when the backend rejects (e.g. anonymous 401)", async () => {
    post.mockResolvedValue({ response: { ok: false } } as never);
    expect(await postInteraction(1, "SAVE")).toBe(false);
  });
});
