import { describe, expect, it } from "vitest";

import { normalizePatternPreviewSource, parseAsciiPattern } from "./patternPreview";

describe("patternPreview adapters", () => {
  it("parses ASCII previews into a square-cell grid", () => {
    expect(
      parseAsciiPattern(".*.\n***"),
    ).toEqual([
      [0, 1, 0],
      [1, 1, 1],
    ]);
  });

  it("normalizes ASCII and grid sources through the same preview contract", () => {
    const expected = [
      [1, 0, 1],
      [0, 1, 0],
    ];

    expect(
      normalizePatternPreviewSource({
        kind: "ascii",
        ascii: "O.O\n.*.",
      }),
    ).toEqual(expected);

    expect(
      normalizePatternPreviewSource({
        kind: "grid",
        pattern: expected,
      }),
    ).toEqual(expected);
  });
});
