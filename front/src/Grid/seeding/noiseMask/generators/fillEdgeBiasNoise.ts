import { clamp01, smoothstep01 } from "@grid/seeding/noiseMask/math";

export function fillEdgeBiasNoise(mask: Float32Array, rows: number, cols: number, rng: () => number): void {
  const maxEdgeDistance = Math.max(Math.min((rows - 1) / 2, (cols - 1) / 2), 1);
  let idx = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const nearestEdge = Math.min(row, rows - 1 - row, col, cols - 1 - col) / maxEdgeDistance;
      const bias = smoothstep01(nearestEdge);
      mask[idx++] = clamp01(bias * 0.45 + rng() * 0.55);
    }
  }
}
