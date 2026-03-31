import { mulberry32 } from "@grid/seeding/randomPresetUtils/mulberry32";
import { presetSeed } from "@grid/seeding/randomPresetUtils/presetSeed";

import type { RandomPresetId } from "@grid/randomPresets";

export function createPresetRng(preset: RandomPresetId, randomVariation: boolean, seed: number | null): () => number {
  if (seed !== null) {
    return mulberry32(seed >>> 0);
  }

  return randomVariation ? () => Math.random() : mulberry32(presetSeed(preset));
}
