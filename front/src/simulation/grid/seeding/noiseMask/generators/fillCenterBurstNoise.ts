import { clamp01, smoothstep01 } from "@grid/seeding/noiseMask/math";

export function fillCenterBurstNoise(mask: Float32Array, rows: number, cols: number, rng: () => number): void {
  const centerX = (cols - 1) / 2;
  const centerY = (rows - 1) / 2;
  const maxDistance = Math.max(Math.hypot(centerX, centerY), 1);
  let idx = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const distance = Math.hypot(col - centerX, row - centerY) / maxDistance;
      const bias = smoothstep01(distance);
      mask[idx++] = clamp01(bias * 0.45 + rng() * 0.55);
    }
  }
}
