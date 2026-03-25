import { FRACTAL_RANDOM_PRESET_SEEDERS } from "@grid/seeding/randomPresetFractalSeeders";
import { applySpatialNoiseMask, seedNoisePreset } from "@grid/seeding/randomPresetNoise";
import { SHAPE_RANDOM_PRESET_SEEDERS } from "@grid/seeding/randomPresetShapeSeeders";
import { DEFAULT_RANDOM_PARAMS } from "@grid/seeding/randomPresetTypes";
import { createPresetRng } from "@grid/seeding/randomPresetUtils";

import type { RandomPresetId } from "@grid/randomPresets";
import type {
  IRandomPresetSeeder,
  RandomPresetSeedContext,
  RandomPresetSeedFn,
  RandomSeedParams,
} from "@grid/seeding/randomPresetTypes";

export { DEFAULT_NOISE_LEVELS, DEFAULT_RANDOM_PARAMS } from "@grid/seeding/randomPresetTypes";

export type { IRandomPresetSeeder, NoiseType, RandomSeedParams } from "./randomPresetTypes";

const RANDOM_PRESET_SEEDERS = {
  noise: seedNoisePreset,
  ...SHAPE_RANDOM_PRESET_SEEDERS,
  ...FRACTAL_RANDOM_PRESET_SEEDERS,
} satisfies Record<RandomPresetId, RandomPresetSeedFn>;

/**
 * Fills a buffer with named random-mode presets.
 *
 * density controls the NUMBER / FREQUENCY of shapes for pattern presets:
 *   - stars/clusters/sinus/sierpinski/cantor/hilbert: object count and scale
 *   - rings/stripes/diagonal: frequency (inverse of period)
 *   - circles: number of circles
 *   - checker: square size is inversely proportional to density
 *   - cross: arm thickness
 *   - noise: alive-cell probability; noiseType = generation algorithm
 *   - conway: cell count per constellation (1→~80 cells); noiseType = spatial placement filter
 *
 * seed overrides the RNG for any preset (deterministic replay when non-null).
 */
export class RandomPresetSeeder implements IRandomPresetSeeder {
  public seedInto(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    preset: RandomPresetId,
    randomVariation: boolean,
    params: RandomSeedParams = DEFAULT_RANDOM_PARAMS,
  ): void {
    const rng = createPresetRng(preset, randomVariation, params.seed);
    const randomizedLayout = randomVariation || params.seed !== null;
    const rawLevel = params.noiseLevels[params.noiseType];
    const noiseLevel = Number.isFinite(rawLevel) ? Math.max(0, Math.min(1, rawLevel)) : 0.5;
    const context: RandomPresetSeedContext = {
      rng,
      density: params.density,
      randomizedLayout,
      cx: (cols - 1) / 2,
      cy: (rows - 1) / 2,
      noiseType: params.noiseType,
      noiseLevel,
    };

    RANDOM_PRESET_SEEDERS[preset](buffer, rows, cols, context);

    if (preset !== "noise") {
      applySpatialNoiseMask(buffer, rows, cols, context);
    }
  }
}
