import { fillRect } from "@grid/seeding/randomPresetUtils/fillRect";

export function drawOrthogonalSegment(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  row0: number,
  col0: number,
  row1: number,
  col1: number,
  thickness: number,
): void {
  const band = Math.max(0, Math.floor(thickness / 2));

  if (row0 === row1) {
    fillRect(buffer, rows, cols, row0 - band, Math.min(col0, col1), band * 2 + 1, Math.abs(col1 - col0) + 1);
    return;
  }

  if (col0 === col1) {
    fillRect(buffer, rows, cols, Math.min(row0, row1), col0 - band, Math.abs(row1 - row0) + 1, band * 2 + 1);
    return;
  }

  const steps = Math.max(Math.abs(row1 - row0), Math.abs(col1 - col0));
  if (steps === 0) {
    fillRect(buffer, rows, cols, row0 - band, col0 - band, band * 2 + 1, band * 2 + 1);
    return;
  }

  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    const row = Math.round(row0 + (row1 - row0) * t);
    const col = Math.round(col0 + (col1 - col0) * t);
    fillRect(buffer, rows, cols, row - band, col - band, band * 2 + 1, band * 2 + 1);
  }
}
