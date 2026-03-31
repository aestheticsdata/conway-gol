import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, type Mocked, vi } from "vitest";
import { AuthService } from "./auth.service";

import type { Request } from "express";
import type { AppSession } from "./session.d";

interface SessionCallbacks {
  destroy?: (callback: (error?: Error) => void) => void;
  regenerate?: (callback: (error?: Error) => void) => void;
  save?: (callback: (error?: Error) => void) => void;
}

function createSessionMock(
  callbacks: SessionCallbacks = {},
  initialState: Partial<AppSession> = {},
): Mocked<AppSession> {
  const session = {
    ...initialState,
    destroy: vi.fn((callback: (error?: Error) => void) => {
      if (callbacks.destroy) {
        callbacks.destroy(callback);
        return;
      }

      callback();
    }),
    regenerate: vi.fn((callback: (error?: Error) => void) => {
      if (callbacks.regenerate) {
        callbacks.regenerate(callback);
        return;
      }

      callback();
    }),
    save: vi.fn((callback: (error?: Error) => void) => {
      if (callbacks.save) {
        callbacks.save(callback);
        return;
      }

      callback();
    }),
  };

  return session as unknown as Mocked<AppSession>;
}

function createRequestWithSession(session: AppSession): Request {
  return {
    session,
  } as Request;
}

describe("AuthService", () => {
  const prisma = {
    user: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores the authenticated user in the session during login", async () => {
    const passwordHash = await bcrypt.hash("ValidPass#123", 8);
    prisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      username: "ada",
      avatarId: "node-grid",
      passwordHash,
    });
    const request = createRequestWithSession(createSessionMock());
    const service = new AuthService(prisma as never);

    const result = await service.login({ username: "ada", password: "ValidPass#123" }, request);

    expect(result.username).toBe("ada");
    expect(result.avatarId).toBe("node-grid");
    expect(result.csrfToken).toEqual(expect.any(String));
    expect(request.session.regenerate).toHaveBeenCalledTimes(1);
    expect(request.session.save).toHaveBeenCalledTimes(1);
    expect((request.session as AppSession).userId).toBe("user-1");
    expect((request.session as AppSession).csrfToken).toBe(result.csrfToken);
  });

  it("returns null avatarId when the stored value is not a known id", async () => {
    const passwordHash = await bcrypt.hash("ValidPass#123", 8);
    prisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      username: "ada",
      avatarId: "legacy-unknown-id",
      passwordHash,
    });
    const request = createRequestWithSession(createSessionMock());
    const service = new AuthService(prisma as never);

    const result = await service.login({ username: "ada", password: "ValidPass#123" }, request);

    expect(result.avatarId).toBeNull();
  });

  it("rejects invalid credentials during login", async () => {
    const passwordHash = await bcrypt.hash("ValidPass#123", 8);
    prisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      username: "ada",
      avatarId: "node-grid",
      passwordHash,
    });
    const service = new AuthService(prisma as never);

    await expect(
      service.login({ username: "ada", password: "wrong-password" }, createRequestWithSession(createSessionMock())),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("destroys the current session during logout", async () => {
    const session = createSessionMock();
    const service = new AuthService(prisma as never);

    await expect(service.logout(session)).resolves.toBeUndefined();

    expect(session.destroy).toHaveBeenCalledTimes(1);
  });

  it("writes auth data onto the regenerated request session", async () => {
    const passwordHash = await bcrypt.hash("ValidPass#123", 8);
    prisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      username: "ada",
      avatarId: "node-grid",
      passwordHash,
    });

    const originalSession = createSessionMock({
      regenerate: (callback) => {
        request.session = regeneratedSession;
        callback();
      },
    });
    const regeneratedSession = createSessionMock();
    const request = createRequestWithSession(originalSession);
    const service = new AuthService(prisma as never);

    const result = await service.login({ username: "ada", password: "ValidPass#123" }, request);

    expect(originalSession.save).not.toHaveBeenCalled();
    expect(regeneratedSession.save).toHaveBeenCalledTimes(1);
    expect((request.session as AppSession).userId).toBe("user-1");
    expect((request.session as AppSession).csrfToken).toBe(result.csrfToken);
  });
});
