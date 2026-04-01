import { describe, expect, it } from "vitest";
import {
  isHxfAsciiGridCommentLine,
  isHxfCatalogCellsFilenameLine,
  isHxfNoiseCommentLine,
  resolveHxfDisplayAutomata,
} from "./hxfPatternAdapter";
import { extractHxfPatternCardMeta } from "./patternCardMeta";

describe("hxfPatternAdapter", () => {
  it("detects ConwayLife .cells filename comments", () => {
    expect(isHxfCatalogCellsFilenameLine("180degreekickback.cells")).toBe(true);
    expect(isHxfCatalogCellsFilenameLine("1x256schickengine.cells")).toBe(true);
    expect(isHxfCatalogCellsFilenameLine("Name: still life")).toBe(false);
  });

  it("detects ASCII grid comment lines", () => {
    expect(isHxfAsciiGridCommentLine("........................**........")).toBe(true);
    expect(isHxfAsciiGridCommentLine("...**...")).toBe(false);
    expect(isHxfAsciiGridCommentLine("Catalog pattern from archive.")).toBe(false);
  });

  it("marks noise lines for description extraction", () => {
    expect(isHxfNoiseCommentLine("foo.cells")).toBe(true);
    expect(isHxfNoiseCommentLine("..........**..........")).toBe(true);
    expect(isHxfNoiseCommentLine("Approximately the 32nd-most common oscillator.")).toBe(false);
  });

  it("keeps automata when it already has live cells", () => {
    const automata = [
      [0, 1, 0],
      [0, 0, 1],
    ];
    expect(resolveHxfDisplayAutomata(automata, ["noise.cells", "https://example.com"])).toBe(automata);
  });

  it("rebuilds automata from comment ASCII when grid is all dead", () => {
    const automata = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const comments = ["............", "....**......", "...*.*......", "............"];
    const resolved = resolveHxfDisplayAutomata(automata, comments);
    expect(resolved).toEqual([
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ]);
  });

  it("returns empty automata when there is nothing to recover", () => {
    expect(resolveHxfDisplayAutomata([], [])).toEqual([]);
  });
});

describe("extractHxfPatternCardMeta with adapter", () => {
  const fbAuthor = "Unknown";
  const fbDesc = "Fallback description";

  it("skips .cells filename for description and keeps wiki link", () => {
    const meta = extractHxfPatternCardMeta({
      patternName: "180degreekickback",
      remotePattern: {
        comments: ["180degreekickback.cells", "https://conwaylife.com/wiki/180-degree_kickback"],
        automata: [
          [0, 0, 1],
          [0, 1, 0],
        ],
      },
      fallbackAuthor: fbAuthor,
      fallbackDescription: fbDesc,
    });
    expect(meta.description).toBe(fbDesc);
    expect(meta.links).toHaveLength(1);
    expect(meta.pattern).toEqual([
      [0, 0, 1],
      [0, 1, 0],
    ]);
  });

  it("uses the first non-noise prose line as description when present", () => {
    const meta = extractHxfPatternCardMeta({
      patternName: "x",
      remotePattern: {
        comments: ["x.cells", "https://conwaylife.com/wiki/Foo", "Short catalog note for this pattern."],
        automata: [[1]],
      },
      fallbackAuthor: fbAuthor,
      fallbackDescription: fbDesc,
    });
    expect(meta.description).toBe("Short catalog note for this pattern.");
  });

  it("uses display automata parsed from comments when catalog automata is empty", () => {
    const meta = extractHxfPatternCardMeta({
      patternName: "broken",
      remotePattern: {
        comments: ["............", "....**......", "....**......", "............"],
        automata: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
      },
      fallbackAuthor: fbAuthor,
      fallbackDescription: fbDesc,
    });
    expect(meta.pattern.some((row) => row.some((c) => c === 1))).toBe(true);
    expect(meta.description).toBe(fbDesc);
  });
});
