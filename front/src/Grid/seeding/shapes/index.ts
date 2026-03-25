import type { RandomPresetId } from "@grid/randomPresets";
import type { RandomPresetSeedFn } from "../randomPresetTypes";

import { seedConway } from "./conway";
import { seedChecker, seedCross, seedDiagonal, seedRings, seedStripes } from "./field";
import { seedCircles, seedClusters, seedSinus, seedStars } from "./stamp";

type ShapePresetId = Exclude<RandomPresetId, "noise" | "sierpinski" | "cantor" | "hilbert">;

export const SHAPE_RANDOM_PRESET_SEEDERS = {
  stars: seedStars,
  circles: seedCircles,
  sinus: seedSinus,
  rings: seedRings,
  stripes: seedStripes,
  checker: seedChecker,
  clusters: seedClusters,
  diagonal: seedDiagonal,
  cross: seedCross,
  conway: seedConway,
} satisfies Record<ShapePresetId, RandomPresetSeedFn>;
