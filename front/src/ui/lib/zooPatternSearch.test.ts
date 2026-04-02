import { describe, expect, it } from "vitest";
import { normalizeZooSearchText, zooSearchFieldMatches } from "./zooPatternSearch";

describe("zooPatternSearch", () => {
  it("normalizes queries so trans and trans- are equivalent", () => {
    expect(normalizeZooSearchText("trans")).toBe(normalizeZooSearchText("trans-"));
    expect(normalizeZooSearchText("Trans-")).toBe("trans");
  });

  it("matches display titles with hyphens against queries without hyphens", () => {
    const q = normalizeZooSearchText("trans");
    expect(zooSearchFieldMatches("Trans-barge with tail", q)).toBe(true);
    expect(zooSearchFieldMatches("transbargewithtail", q)).toBe(true);
  });

  it("collapses spaces in multi-word queries", () => {
    const q = normalizeZooSearchText("trans barge");
    expect(zooSearchFieldMatches("transbargewithtail", q)).toBe(true);
  });
});
