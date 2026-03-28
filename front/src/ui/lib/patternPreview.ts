import { getRequiredContext2D } from "@helpers/dom";

export type PatternPreviewSource =
  | {
      kind: "ascii";
      ascii: string;
    }
  | {
      kind: "grid";
      pattern: number[][];
    };

export function parseAsciiPattern(ascii: string): number[][] {
  const lines = ascii
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .filter((line) => line.trim().length > 0);

  return lines.map((line) =>
    Array.from(line).map((character) => (character === "*" || character === "O" || character === "o" ? 1 : 0)),
  );
}

export function normalizePatternPreviewSource(source: PatternPreviewSource): number[][] {
  if (source.kind === "ascii") {
    return parseAsciiPattern(source.ascii);
  }

  return source.pattern;
}

export function drawPatternPreview(canvas: HTMLCanvasElement, pattern: number[][]): void {
  const context = getRequiredContext2D(canvas);
  context.clearRect(0, 0, canvas.width, canvas.height);

  const rows = pattern.length;
  const cols = pattern.reduce((max, row) => Math.max(max, row.length), 0);
  if (rows === 0 || cols === 0) {
    return;
  }

  const padding = 18;
  const usableWidth = canvas.width - padding * 2;
  const usableHeight = canvas.height - padding * 2;
  const cellSize = Math.min(usableWidth / cols, usableHeight / rows, 18);
  const drawSize = cellSize >= 4 ? cellSize - 1 : cellSize * 0.92;
  const offsetX = (canvas.width - cols * cellSize) / 2;
  const offsetY = (canvas.height - rows * cellSize) / 2;

  if (cellSize >= 2) {
    context.shadowColor = "rgba(37, 219, 255, 0.22)";
    context.shadowBlur = Math.min(16, cellSize * 1.2);
  } else {
    context.shadowBlur = 0;
  }

  context.fillStyle = "rgba(112, 186, 223, 0.96)";

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    const row = pattern[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      if (row[colIndex] !== 1) {
        continue;
      }

      const x = offsetX + colIndex * cellSize + (cellSize - drawSize) / 2;
      const y = offsetY + rowIndex * cellSize + (cellSize - drawSize) / 2;
      context.fillRect(x, y, drawSize, drawSize);
    }
  }

  context.shadowBlur = 0;
}
