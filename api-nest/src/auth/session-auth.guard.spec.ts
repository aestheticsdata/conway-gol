import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { SessionAuthGuard } from "./session-auth.guard";

describe("SessionAuthGuard", () => {
  const guard = new SessionAuthGuard();

  it("allows requests with an authenticated session", () => {
    const context = createExecutionContext({ session: { userId: "user-1" } });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("rejects requests without an authenticated session", () => {
    const context = createExecutionContext({ session: {} });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});

function createExecutionContext(request: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}
