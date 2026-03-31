import { ForbiddenException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthController } from "./auth.controller";
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from "./session.constants";

import type { Request, Response } from "express";
import type { AppSession } from "./session.d";

describe("AuthController", () => {
  const authService = {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    register: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    verifyPassphrase: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears the session cookie on logout", async () => {
    authService.logout.mockResolvedValue(undefined);
    const controller = new AuthController(authService as never);
    const session = {
      userId: "user-1",
      csrfToken: "csrf-token",
    } as AppSession;
    const request = {
      headers: {
        "x-csrf-token": "csrf-token",
      },
      session,
    } as unknown as Request;
    const response = {
      clearCookie: vi.fn(),
    } as unknown as Response;

    await controller.logout(request, response);

    expect(authService.logout).toHaveBeenCalledWith(session);
    expect(response.clearCookie).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      getSessionCookieOptions(process.env.NODE_ENV === "production"),
    );
  });

  it("rejects logout when the csrf token is missing or invalid", async () => {
    const controller = new AuthController(authService as never);
    const request = {
      headers: {},
      session: {
        userId: "user-1",
        csrfToken: "csrf-token",
      },
    } as unknown as Request;
    const response = {
      clearCookie: vi.fn(),
    } as unknown as Response;

    await expect(controller.logout(request, response)).rejects.toThrow(ForbiddenException);
    expect(authService.logout).not.toHaveBeenCalled();
    expect(response.clearCookie).not.toHaveBeenCalled();
  });
});
