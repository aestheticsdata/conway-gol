export function fillValueNoise(mask: Float32Array, rows: number, cols: number, rng: () => number, scale = 10): void {
  const gRows = Math.ceil(rows / scale) + 2;
  const gCols = Math.ceil(cols / scale) + 2;
  const grid = new Float32Array(gRows * gCols);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = rng();
  }

  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const gx = col / scale;
      const gy = row / scale;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const fx = gx - x0;
      const fy = gy - y0;
      const ux = fx * fx * (3 - 2 * fx);
      const uy = fy * fy * (3 - 2 * fy);
      const x1 = Math.min(x0 + 1, gCols - 1);
      const y1 = Math.min(y0 + 1, gRows - 1);
      const v00 = grid[y0 * gCols + x0];
      const v10 = grid[y0 * gCols + x1];
      const v01 = grid[y1 * gCols + x0];
      const v11 = grid[y1 * gCols + x1];
      mask[idx++] = v00 * (1 - ux) * (1 - uy) + v10 * ux * (1 - uy) + v01 * (1 - ux) * uy + v11 * ux * uy;
    }
  }
}
