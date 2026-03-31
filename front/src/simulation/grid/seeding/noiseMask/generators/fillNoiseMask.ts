import { fillCenterBurstNoise } from "@grid/seeding/noiseMask/generators/fillCenterBurstNoise";
import { fillClusterNoise } from "@grid/seeding/noiseMask/generators/fillClusterNoise";
import { fillEdgeBiasNoise } from "@grid/seeding/noiseMask/generators/fillEdgeBiasNoise";
import { fillGradientNoise } from "@grid/seeding/noiseMask/generators/fillGradientNoise";
import { fillInterferenceNoise } from "@grid/seeding/noiseMask/generators/fillInterferenceNoise";
import { fillMarblingNoise } from "@grid/seeding/noiseMask/generators/fillMarblingNoise";
import { fillUniformNoise } from "@grid/seeding/noiseMask/generators/fillUniformNoise";
import { fillValueNoise } from "@grid/seeding/noiseMask/generators/fillValueNoise";
import { applyNoiseLevelMix } from "@grid/seeding/noiseMask/math";

import type { NoiseType } from "@grid/seeding/randomPresetTypes";

export function fillNoiseMask(
  mask: Float32Array,
  rows: number,
  cols: number,
  rng: () => number,
  noiseType: NoiseType,
  noiseLevel: number,
): void {
  switch (noiseType) {
    case "uniform":
      fillUniformNoise(mask, rng);
      break;
    case "perlin-like":
      fillValueNoise(mask, rows, cols, rng);
      break;
    case "clusters":
      fillClusterNoise(mask, rows, cols, rng);
      break;
    case "gradient":
      fillGradientNoise(mask, rows, cols, rng);
      break;
    case "edge-bias":
      fillEdgeBiasNoise(mask, rows, cols, rng);
      break;
    case "center-burst":
      fillCenterBurstNoise(mask, rows, cols, rng);
      break;
    case "interference":
      fillInterferenceNoise(mask, rows, cols, rng);
      break;
    case "marbling":
      fillMarblingNoise(mask, rows, cols, rng);
      break;
  }
  applyNoiseLevelMix(mask, noiseLevel);
}
