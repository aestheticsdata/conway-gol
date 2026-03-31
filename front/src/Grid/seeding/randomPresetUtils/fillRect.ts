import { CELL_STATE } from "@cell/constants";

export function fillRect(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  topRow: number,
  leftCol: number,
  height: number,
  width: number,
): void {
  if (height <= 0 || width <= 0) {
    return;
  }

  const rowStart = Math.max(0, Math.floor(topRow));
  const colStart = Math.max(0, Math.floor(leftCol));
  const rowEnd = Math.min(rows - 1, Math.ceil(topRow + height - 1));
  const colEnd = Math.min(cols - 1, Math.ceil(leftCol + width - 1));

  if (rowStart > rowEnd || colStart > colEnd) {
    return;
  }

  for (let row = rowStart; row <= rowEnd; row++) {
    buffer.fill(CELL_STATE.ALIVE, row * cols + colStart, row * cols + colEnd + 1);
  }
}
