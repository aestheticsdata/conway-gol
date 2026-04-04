import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "./session.constants";

describe("session cookie options", () => {
  it("uses a non-secure cookie in development", () => {
    expect(getSessionCookieOptions(false)).toEqual({
      httpOnly: true,
      path: "/",
      secure: false,
      sameSite: "lax",
    });
  });

  it("uses secure auto-detection in production", () => {
    expect(getSessionCookieOptions(true)).toEqual({
      httpOnly: true,
      path: "/",
      secure: true,
      sameSite: "lax",
    });
  });
});
