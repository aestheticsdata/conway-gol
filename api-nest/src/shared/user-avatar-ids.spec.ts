import { describe, expect, it } from "vitest";

import { resolveCanonicalAvatarId } from "./user-avatar-ids";

describe("user-avatar-ids", () => {
  it("normalizes session/DB values for API responses", () => {
    expect(resolveCanonicalAvatarId(null)).toBeNull();
    expect(resolveCanonicalAvatarId(undefined)).toBeNull();
    expect(resolveCanonicalAvatarId("")).toBeNull();
    expect(resolveCanonicalAvatarId("node-grid")).toBe("node-grid");
    expect(resolveCanonicalAvatarId("not-a-real-id")).toBeNull();
  });
});
