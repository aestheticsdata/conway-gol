import { clamp01, smoothstep01 } from "@grid/seeding/noiseMask/math";

export function fillGradientNoise(mask: Float32Array, rows: number, cols: number, rng: () => number): void {
  const angle = rng() * Math.PI * 2;
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const corners = [
    { x: -0.5, y: -0.5 },
    { x: 0.5, y: -0.5 },
    { x: -0.5, y: 0.5 },
    { x: 0.5, y: 0.5 },
  ];
  let minProjection = Number.POSITIVE_INFINITY;
  let maxProjection = Number.NEGATIVE_INFINITY;

  for (const corner of corners) {
    const projection = corner.x * ux + corner.y * uy;
    minProjection = Math.min(minProjection, projection);
    maxProjection = Math.max(maxProjection, projection);
  }

  const range = Math.max(1e-6, maxProjection - minProjection);
  let idx = 0;

  for (let row = 0; row < rows; row++) {
    const y = rows <= 1 ? 0 : row / (rows - 1) - 0.5;
    for (let col = 0; col < cols; col++) {
      const x = cols <= 1 ? 0 : col / (cols - 1) - 0.5;
      const projection = x * ux + y * uy;
      const gradient = smoothstep01((projection - minProjection) / range);
      mask[idx++] = clamp01(gradient * 0.45 + rng() * 0.55);
    }
  }
}
