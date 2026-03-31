export function fillUniformNoise(mask: Float32Array, rng: () => number): void {
  for (let i = 0; i < mask.length; i++) {
    mask[i] = rng();
  }
}
