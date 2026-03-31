import { clamp01 } from "@grid/seeding/noiseMask/math";

/** Domain-warped product of sines — marble / wood-grain veins when many cells are on. */
export function fillMarblingNoise(mask: Float32Array, rows: number, cols: number, rng: () => number): void {
  const warp = 0.08 + rng() * 0.14;
  const wf = 1.2 + rng() * 2.5;
  const bf = 3 + rng() * 5;
  const p = [0, 1, 2, 3, 4, 5].map(() => rng() * Math.PI * 2);
  let idx = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const nx = cols <= 1 ? 0.5 : col / (cols - 1);
      const ny = rows <= 1 ? 0.5 : row / (rows - 1);
      const u =
        nx +
        warp * Math.sin(2 * Math.PI * wf * ny + p[0]) +
        warp * 0.55 * Math.sin(2 * Math.PI * wf * 0.5 * (nx + ny) + p[1]);
      const v =
        ny +
        warp * Math.cos(2 * Math.PI * wf * nx + p[2]) +
        warp * 0.55 * Math.cos(2 * Math.PI * wf * 0.5 * (nx - ny) + p[3]);
      const s = Math.sin(2 * Math.PI * bf * u + p[4]) * Math.sin(2 * Math.PI * bf * v + p[5]);
      mask[idx++] = clamp01(0.5 + 0.48 * s * 0.92 + rng() * 0.08);
    }
  }
}
