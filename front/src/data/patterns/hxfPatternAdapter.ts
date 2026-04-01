/**
 * Adapts catalog .hxf payloads for UI: some archives store ConwayLife `.cells`-style
 * ASCII rows in `comments`, or leave `automata` empty while the pattern lives only
 * in those lines. Descriptions may start with `*.cells` filenames. This module does
 * not mutate API data; callers use these helpers when rendering cards.
 */

const ASCII_GRID_LINE_MIN_LENGTH = 12;

/** `.cells` source filename often stored as the first comment line. */
export function isHxfCatalogCellsFilenameLine(line: string): boolean {
  const t = line.trim();
  return t.length > 0 && /^[\w.-]+\.cells$/iu.test(t);
}

/**
 * A line that looks like a fixed-width Life ASCII row (dead/alive from `. * O o` and spaces).
 */
export function isHxfAsciiGridCommentLine(line: string): boolean {
  const t = line.trim();
  if (t.length < ASCII_GRID_LINE_MIN_LENGTH) {
    return false;
  }
  return /^[.*Oo\s]+$/u.test(t);
}

export function isHxfNoiseCommentLine(line: string): boolean {
  const t = line.trim();
  if (!t) {
    return false;
  }
  return isHxfCatalogCellsFilenameLine(t) || isHxfAsciiGridCommentLine(t);
}

function hasLiveCells(grid: number[][]): boolean {
  return grid.some((row) => row.some((c) => c === 1));
}

/** Same alive mapping as `parseAsciiPattern` in the preview module (kept here to avoid data→ui imports). */
function parseAsciiPatternLines(lines: string[]): number[][] {
  const trimmed = lines.map((line) => line.replace(/\s+$/g, "")).filter((line) => line.length > 0);
  return trimmed.map((line) => Array.from(line).map((ch) => (ch === "*" || ch === "O" || ch === "o" ? 1 : 0)));
}

/**
 * Uses `automata` when it contains live cells; otherwise tries to rebuild a grid from
 * consecutive `.cells`-style comment rows (e.g. corrupted or legacy catalog entries).
 */
export function resolveHxfDisplayAutomata(automata: number[][], comments: string[]): number[][] {
  if (!Array.isArray(automata) || automata.length === 0) {
    const fromComments = tryAutomataFromAsciiComments(comments);
    return fromComments ?? automata;
  }

  if (hasLiveCells(automata)) {
    return automata;
  }

  const fromComments = tryAutomataFromAsciiComments(comments);
  return fromComments ?? automata;
}

function tryAutomataFromAsciiComments(comments: string[]): number[][] | null {
  const gridLines = comments.map((c) => c.trim()).filter(isHxfAsciiGridCommentLine);
  if (gridLines.length === 0) {
    return null;
  }

  const parsed = parseAsciiPatternLines(gridLines);
  return hasLiveCells(parsed) ? parsed : null;
}
