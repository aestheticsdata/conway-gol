import { CELL_STATE } from "@cell/constants";
import {
  fillCenterBurstNoise,
  fillClusterNoise,
  fillEdgeBiasNoise,
  fillGradientNoise,
  fillInterferenceNoise,
  fillMarblingNoise,
  fillNoiseMask,
  fillValueNoise,
} from "@grid/seeding/noiseMask/generators";
import { applyNoiseLevelMix, clamp01 } from "@grid/seeding/noiseMask/math";

import type { RandomPresetSeedContext } from "@grid/seeding/randomPresetTypes";

function applyLowMaskPreference(buffer: Uint8Array, mask: Float32Array, threshold: number): void {
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === CELL_STATE.ALIVE && mask[i] >= threshold) {
      buffer[i] = CELL_STATE.DEAD;
    }
  }
}

export function seedNoisePreset(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  context: RandomPresetSeedContext,
): void {
  const { density, rng, noiseType, noiseLevel } = context;

  if (density <= 0) {
    buffer.fill(CELL_STATE.DEAD);
    return;
  }

  if (density >= 1) {
    buffer.fill(CELL_STATE.ALIVE);
    return;
  }

  const mask = new Float32Array(buffer.length);
  fillNoiseMask(mask, rows, cols, rng, noiseType, noiseLevel);

  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = mask[i] < density ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
  }
}

export function applySpatialNoiseMask(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  context: RandomPresetSeedContext,
): void {
  const mask = new Float32Array(rows * cols);
  const threshold = 1 - 0.5 * clamp01(context.noiseLevel);

  if (context.noiseType === "uniform") {
    for (let i = 0; i < mask.length; i++) {
      mask[i] = context.rng();
    }
    applyNoiseLevelMix(mask, context.noiseLevel);
    applyLowMaskPreference(buffer, mask, threshold);
    return;
  }

  if (context.noiseType === "perlin-like") {
    fillValueNoise(mask, rows, cols, context.rng, 30);
    applyNoiseLevelMix(mask, context.noiseLevel);
    const cut = 0.5 * clamp01(context.noiseLevel);
    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i] === CELL_STATE.ALIVE && mask[i] < cut) {
        buffer[i] = CELL_STATE.DEAD;
      }
    }
    return;
  }

  switch (context.noiseType) {
    case "clusters":
      fillClusterNoise(mask, rows, cols, context.rng);
      applyNoiseLevelMix(mask, context.noiseLevel);
      applyLowMaskPreference(buffer, mask, threshold);
      return;
    case "gradient":
      fillGradientNoise(mask, rows, cols, context.rng);
      applyNoiseLevelMix(mask, context.noiseLevel);
      applyLowMaskPreference(buffer, mask, Math.max(0, threshold - 0.02));
      return;
    case "edge-bias":
      fillEdgeBiasNoise(mask, rows, cols, context.rng);
      applyNoiseLevelMix(mask, context.noiseLevel);
      applyLowMaskPreference(buffer, mask, threshold);
      return;
    case "center-burst":
      fillCenterBurstNoise(mask, rows, cols, context.rng);
      applyNoiseLevelMix(mask, context.noiseLevel);
      applyLowMaskPreference(buffer, mask, threshold);
      return;
    case "interference":
      fillInterferenceNoise(mask, rows, cols, context.rng);
      applyNoiseLevelMix(mask, context.noiseLevel);
      applyLowMaskPreference(buffer, mask, threshold);
      return;
    case "marbling":
      fillMarblingNoise(mask, rows, cols, context.rng);
      applyNoiseLevelMix(mask, context.noiseLevel);
      applyLowMaskPreference(buffer, mask, threshold);
      return;
  }
}
