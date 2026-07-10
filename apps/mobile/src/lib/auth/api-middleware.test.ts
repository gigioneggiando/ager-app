import { createAuthMiddleware, type SessionController } from "@ager/auth";

// jest hoists jest.mock above the imports, so the native module is stubbed before load.
jest.mock("expo-secure-store", () => ({
  getItemAsync: async () => null,
  setItemAsync: async () => undefined,
  deleteItemAsync: async () => undefined,
}));

// --- minimal Request fake: just headers.set/get + clone (all the middleware touches) ------
interface FakeRequest {
  url: string;
  headers: {
    set(key: string, value: string): void;
    get(key: string): string | null;
  };
  clone(): FakeRequest;
}

function makeFakeRequest(url = "https://api.ager/test"): FakeRequest {
  const store = new Map<string, string>();
  return {
    url,
    headers: {
      set: (key, value) => {
        store.set(key, value);
      },
      get: (key) => store.get(key) ?? null,
    },
    clone() {
      const copy = makeFakeRequest(url);
      store.forEach((value, key) => copy.headers.set(key, value));
      return copy;
    },
  };
}

type MiddlewareShape = {
  onRequest: (params: Record<string, unknown>) => Promise<unknown>;
  onResponse: (params: Record<string, unknown>) => Promise<unknown>;
};

describe("createAuthMiddleware (refresh-on-401)", () => {
  const getFreshAccessToken = jest.fn();
  const refresh = jest.fn();
  const controller = {
    getFreshAccessToken,
    refresh,
  } as unknown as SessionController;
  const fetchMock = jest.fn();

  let mw: MiddlewareShape;

  beforeEach(() => {
    getFreshAccessToken.mockReset();
    refresh.mockReset();
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    mw = createAuthMiddleware(controller) as unknown as MiddlewareShape;
  });

  function onRequest(request: FakeRequest, id: string) {
    return mw.onRequest({
      request,
      id,
      schemaPath: "",
      params: {},
      options: {},
    });
  }
  function onResponse(request: FakeRequest, status: number, id: string) {
    return mw.onResponse({
      request,
      response: { status } as unknown as Response,
      id,
      schemaPath: "",
      params: {},
      options: {},
    });
  }

  it("attaches the proactively-refreshed bearer on each request", async () => {
    getFreshAccessToken.mockResolvedValue("access-1");
    const req = makeFakeRequest();

    await onRequest(req, "1");

    expect(getFreshAccessToken).toHaveBeenCalledTimes(1);
    expect(req.headers.get("Authorization")).toBe("Bearer access-1");
  });

  it("passes a non-401 response through without refreshing", async () => {
    getFreshAccessToken.mockResolvedValue("access-1");
    const req = makeFakeRequest();
    await onRequest(req, "2");

    const result = await onResponse(req, 200, "2");

    expect(result).toBeUndefined();
    expect(refresh).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("on 401, refreshes once and retries with the new bearer", async () => {
    getFreshAccessToken.mockResolvedValue("access-1");
    refresh.mockResolvedValue("access-2");
    fetchMock.mockResolvedValue({ status: 200 });
    const req = makeFakeRequest();
    await onRequest(req, "3");

    const result = await onResponse(req, 401, "3");

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const retried = fetchMock.mock.calls[0]?.[0] as FakeRequest;
    expect(retried.headers.get("Authorization")).toBe("Bearer access-2");
    expect(result).toEqual({ status: 200 });
  });

  it("surfaces the 401 (no retry) when refresh fails", async () => {
    getFreshAccessToken.mockResolvedValue("access-1");
    refresh.mockResolvedValue(null);
    const req = makeFakeRequest();
    await onRequest(req, "4");

    const result = await onResponse(req, 401, "4");

    expect(result).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
