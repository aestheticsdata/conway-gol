import { beforeEach, describe, expect, it, vi } from "vitest";

describe("HttpClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("window", {
      location: {
        origin: "http://localhost:5173",
      },
    });
  });

  it("forwards 401 responses to the unauthorized handler", async () => {
    const { default: HttpClient } = await import("./HttpClient");
    const requestUse = vi.fn();
    let rejectedHandler: ((error: unknown) => Promise<never>) | undefined;
    const client = {
      interceptors: {
        request: {
          use: requestUse,
        },
        response: {
          use: vi.fn((_fulfilled, rejected) => {
            rejectedHandler = rejected;
          }),
        },
      },
    };
    const httpClient = new HttpClient(client as never);
    const unauthorizedHandler = vi.fn();
    httpClient.setUnauthorizedResponseHandler(unauthorizedHandler);

    await expect(rejectedHandler?.({ response: { status: 401 } })).rejects.toEqual({ response: { status: 401 } });

    expect(requestUse).toHaveBeenCalledTimes(1);
    expect(unauthorizedHandler).toHaveBeenCalledTimes(1);
  });

  it("does not forward non-401 responses to the unauthorized handler", async () => {
    const { default: HttpClient } = await import("./HttpClient");
    let rejectedHandler: ((error: unknown) => Promise<never>) | undefined;
    const client = {
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn((_fulfilled, rejected) => {
            rejectedHandler = rejected;
          }),
        },
      },
    };
    const httpClient = new HttpClient(client as never);
    const unauthorizedHandler = vi.fn();
    httpClient.setUnauthorizedResponseHandler(unauthorizedHandler);

    await expect(rejectedHandler?.({ response: { status: 403 } })).rejects.toEqual({ response: { status: 403 } });

    expect(unauthorizedHandler).not.toHaveBeenCalled();
  });
});
