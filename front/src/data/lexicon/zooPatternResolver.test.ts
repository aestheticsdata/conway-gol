import { describe, expect, it } from "vitest";
import { resolveLexiconPatternCandidate, resolveLexiconPatternToZooPattern } from "./zooPatternResolver";

describe("resolveLexiconPatternCandidate", () => {
  it("returns a synchronous candidate for direct lexicon-to-zoo navigation", () => {
    expect(resolveLexiconPatternCandidate("101")).toBe("101");
    expect(resolveLexiconPatternCandidate("AK94 gun")).toBe("ak94");
    expect(resolveLexiconPatternCandidate("p256 gun")).toBe("period256glidergun");
  });
});

describe("resolveLexiconPatternToZooPattern", () => {
  const availablePatterns = [
    "ak94",
    "beacon",
    "clock2",
    "heavyweightemulator",
    "octagon2",
    "period256glidergun",
    "p8bouncer",
  ] as const;

  it("resolves exact catalog names without modification", () => {
    expect(resolveLexiconPatternToZooPattern("beacon", availablePatterns)).toBe("beacon");
  });

  it("resolves normalized lexicon names to HXF filenames", () => {
    expect(resolveLexiconPatternToZooPattern("AK94", availablePatterns)).toBe("ak94");
  });

  it("supports explicit aliases for lexicon names that differ from catalog filenames", () => {
    expect(resolveLexiconPatternToZooPattern("AK94 gun", availablePatterns)).toBe("ak94");
    expect(resolveLexiconPatternToZooPattern("clock II", availablePatterns)).toBe("clock2");
  });

  it("supports lightweight period-pattern naming heuristics", () => {
    expect(resolveLexiconPatternToZooPattern("p256 gun", availablePatterns)).toBe("period256glidergun");
    expect(resolveLexiconPatternToZooPattern("p8 bouncer", availablePatterns)).toBe("p8bouncer");
  });

  it("returns null when no safe catalog match exists", () => {
    expect(resolveLexiconPatternToZooPattern("Cordership", availablePatterns)).toBeNull();
  });
});
