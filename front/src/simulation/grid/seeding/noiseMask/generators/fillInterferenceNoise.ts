import { clamp01 } from "@grid/seeding/noiseMask/math";

/** Moiré-style beats from two slightly mis-tuned oriented wave grids (strong patterns at high density). */
export function fillInterferenceNoise(mask: Float32Array, rows: number, cols: number, rng: () => number): void {
  const cycles1 = 5 + rng() * 18;
  const cycles2 = cycles1 * (0.92 + rng() * 0.16);
  const theta1 = rng() * Math.PI * 2;
  const theta2 = theta1 + (rng() * 0.38 - 0.19) * Math.PI;
  const ph1 = rng() * Math.PI * 2;
  const ph2 = rng() * Math.PI * 2;
  let idx = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const nx = cols <= 1 ? 0 : col / (cols - 1);
      const ny = rows <= 1 ? 0 : row / (rows - 1);
      const u1 = nx * Math.cos(theta1) + ny * Math.sin(theta1);
      const u2 = nx * Math.cos(theta2) + ny * Math.sin(theta2);
      const w1 = Math.sin(2 * Math.PI * cycles1 * u1 + ph1);
      const w2 = Math.sin(2 * Math.PI * cycles2 * u2 + ph2);
      const moire = 0.5 + 0.48 * w1 * w2;
      mask[idx++] = clamp01(moire * 0.88 + rng() * 0.12);
    }
  }
}
