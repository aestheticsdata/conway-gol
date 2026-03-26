import type { BrushShape } from "./constants";

export type BrushOffset = {
  rowOffset: number;
  colOffset: number;
};

type CircleRaster = {
  filled: readonly BrushOffset[];
  outline: readonly BrushOffset[];
};

const brushOffsetCache = new Map<string, readonly BrushOffset[]>();
const circleRasterCache = new Map<number, CircleRaster>();

export function getBrushOffsets(shape: BrushShape, brushSize: number): readonly BrushOffset[] {
  const cacheKey = `${shape}:${brushSize}`;
  const cached = brushOffsetCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const offsets = Object.freeze(buildBrushOffsets(shape, brushSize));
  brushOffsetCache.set(cacheKey, offsets);
  return offsets;
}

function buildBrushOffsets(shape: BrushShape, brushSize: number): BrushOffset[] {
  switch (shape) {
    case "square":
      return buildSquareOffsets(brushSize);
    case "circle":
      return [...getCircleRaster(brushSize + 1).filled];
    case "hollow-circle":
      return [...getCircleRaster(brushSize + 1).outline];
    case "diamond":
    case "hollow-diamond":
      return buildGenericOffsets(shape, brushSize + 1);
    default:
      return buildGenericOffsets(shape, brushSize);
  }
}

function buildSquareOffsets(brushSize: number): BrushOffset[] {
  const start = -Math.floor((brushSize - 1) / 2);
  const end = start + brushSize - 1;
  const offsets: BrushOffset[] = [];

  for (let rowOffset = start; rowOffset <= end; rowOffset++) {
    for (let colOffset = start; colOffset <= end; colOffset++) {
      offsets.push({ rowOffset, colOffset });
    }
  }

  return offsets;
}

function buildGenericOffsets(
  shape: Exclude<BrushShape, "square" | "circle" | "hollow-circle">,
  radius: number,
): BrushOffset[] {
  const offsets: BrushOffset[] = [];

  for (let rowOffset = -radius; rowOffset <= radius; rowOffset++) {
    for (let colOffset = -radius; colOffset <= radius; colOffset++) {
      if (!matchesGenericShape(shape, rowOffset, colOffset, radius)) {
        continue;
      }
      offsets.push({ rowOffset, colOffset });
    }
  }

  return offsets;
}

function matchesGenericShape(
  shape: Exclude<BrushShape, "square" | "circle" | "hollow-circle">,
  rowOffset: number,
  colOffset: number,
  radius: number,
): boolean {
  switch (shape) {
    case "cross":
      return rowOffset === 0 || colOffset === 0;
    case "hollow-square":
      return Math.abs(rowOffset) === radius || Math.abs(colOffset) === radius;
    case "diamond":
      return Math.abs(rowOffset) + Math.abs(colOffset) <= radius;
    case "hollow-diamond":
      return Math.abs(rowOffset) + Math.abs(colOffset) === radius;
    case "hline":
      return rowOffset === 0;
    case "vline":
      return colOffset === 0;
    case "x":
      return Math.abs(rowOffset) === Math.abs(colOffset);
  }
}

function getCircleRaster(radius: number): CircleRaster {
  const cached = circleRasterCache.get(radius);
  if (cached) {
    return cached;
  }

  const outlineOffsets = buildCircleOutlineOffsets(radius);
  const filledOffsets = buildFilledCircleOffsets(outlineOffsets);
  const raster = {
    filled: Object.freeze(filledOffsets),
    outline: Object.freeze(outlineOffsets),
  };

  circleRasterCache.set(radius, raster);
  return raster;
}

/**
 * Midpoint circle rasterization gives a more circular discrete contour than
 * the previous "cell center inside radius" test, especially on small brushes.
 */
function buildCircleOutlineOffsets(radius: number): BrushOffset[] {
  const pointKeys = new Set<string>();
  let col = radius;
  let row = 0;
  let decision = 1 - radius;

  while (col >= row) {
    addCircleOctants(pointKeys, col, row);
    row += 1;

    if (decision < 0) {
      decision += 2 * row + 1;
      continue;
    }

    col -= 1;
    decision += 2 * (row - col) + 1;
  }

  return [...pointKeys].map(parseOffsetKey).sort(compareOffsets);
}

function buildFilledCircleOffsets(outlineOffsets: readonly BrushOffset[]): BrushOffset[] {
  const spansByRow = new Map<number, { minCol: number; maxCol: number }>();

  for (const { rowOffset, colOffset } of outlineOffsets) {
    const span = spansByRow.get(rowOffset);
    if (!span) {
      spansByRow.set(rowOffset, { minCol: colOffset, maxCol: colOffset });
      continue;
    }

    span.minCol = Math.min(span.minCol, colOffset);
    span.maxCol = Math.max(span.maxCol, colOffset);
  }

  const filledOffsets: BrushOffset[] = [];
  const rowOffsets = [...spansByRow.keys()].sort((a, b) => a - b);

  for (const rowOffset of rowOffsets) {
    const span = spansByRow.get(rowOffset);
    if (!span) {
      continue;
    }

    for (let colOffset = span.minCol; colOffset <= span.maxCol; colOffset++) {
      filledOffsets.push({ rowOffset, colOffset });
    }
  }

  return filledOffsets;
}

function addCircleOctants(pointKeys: Set<string>, col: number, row: number): void {
  const octants: BrushOffset[] = [
    { rowOffset: row, colOffset: col },
    { rowOffset: col, colOffset: row },
    { rowOffset: col, colOffset: -row },
    { rowOffset: row, colOffset: -col },
    { rowOffset: -row, colOffset: -col },
    { rowOffset: -col, colOffset: -row },
    { rowOffset: -col, colOffset: row },
    { rowOffset: -row, colOffset: col },
  ];

  for (const { rowOffset, colOffset } of octants) {
    pointKeys.add(toOffsetKey(rowOffset, colOffset));
  }
}

function toOffsetKey(rowOffset: number, colOffset: number): string {
  return `${rowOffset}:${colOffset}`;
}

function parseOffsetKey(key: string): BrushOffset {
  const [rowOffset, colOffset] = key.split(":").map(Number);
  return { rowOffset, colOffset };
}

function compareOffsets(a: BrushOffset, b: BrushOffset): number {
  return a.rowOffset - b.rowOffset || a.colOffset - b.colOffset;
}
