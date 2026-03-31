export function fillClusterNoise(mask: Float32Array, rows: number, cols: number, rng: () => number): void {
  const numClusters = 6 + Math.floor(rng() * 10);
  const baseRadius = Math.min(rows, cols) * 0.12;
  const centers: { r: number; c: number; r2: number }[] = [];

  for (let k = 0; k < numClusters; k++) {
    const radius = baseRadius * (0.5 + rng());
    centers.push({ r: rng() * rows, c: rng() * cols, r2: radius * radius });
  }

  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let minMask = 1.0;
      for (const { r, c, r2 } of centers) {
        const d2 = (row - r) ** 2 + (col - c) ** 2;
        if (d2 < r2) {
          minMask = Math.min(minMask, d2 / r2);
        }
      }
      mask[idx++] = minMask;
    }
  }
}
