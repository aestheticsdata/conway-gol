import { beforeEach, describe, expect, it, vi } from "vitest";

describe("AuthSessionService", () => {
  const auth = {
    logout: vi.fn(),
    me: vi.fn(),
  };
  const session = {
    clear: vi.fn(),
    getAvatarIdOrFallback: vi.fn(() => "avatar-default"),
    getUsernameOrFallback: vi.fn(() => "ada"),
    setAvatarId: vi.fn(),
    setUsername: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubGlobal("window", {
      location: {
        origin: "http://localhost:5173",
      },
    });
  });

  it("switches to guest and notifies listeners when an authenticated session becomes unauthorized", async () => {
    const { default: AuthSessionService } = await import("./AuthSessionService");
    const service = new AuthSessionService(auth as never, session as never);
    const listener = vi.fn();
    service.subscribe(listener);

    service.setAuthenticatedUser({
      username: "ada",
      avatarId: "node-grid",
      csrfToken: "csrf-token",
    });
    listener.mockClear();

    service.handleUnauthorizedSession();

    expect(service.mode()).toBe("guest");
    expect(session.clear).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      reason: "unauthorized",
      viewer: {
        mode: "guest",
        username: "Guest",
        avatarId: "avatar-default",
        capabilities: {
          canAccessSettings: false,
          canFavoritePatterns: false,
          canSaveDrawings: false,
        },
      },
    });
  });

  it("ignores unauthorized notifications while already in guest mode", async () => {
    const { default: AuthSessionService } = await import("./AuthSessionService");
    const service = new AuthSessionService(auth as never, session as never);
    const listener = vi.fn();
    service.subscribe(listener);

    service.handleUnauthorizedSession();

    expect(session.clear).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
  });
});
