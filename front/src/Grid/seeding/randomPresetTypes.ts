import type { RandomPresetId } from "@grid/randomPresets";

export type NoiseType =
  | "uniform"
  | "perlin-like"
  | "clusters"
  | "gradient"
  | "edge-bias"
  | "center-burst"
  | "interference"
  | "marbling";

export interface RandomSeedParams {
  density: number; // 0–1: shape count / frequency for patterns; alive probability for "noise"
  noiseType: NoiseType; // direct algorithm for "noise"; spatial mask for other presets
  seed: number | null; // null = auto (preset hash or Math.random())
}

export const DEFAULT_RANDOM_PARAMS: RandomSeedParams = {
  density: 0.09, // matches the UI default: 30% slider → 9% effective density
  noiseType: "uniform",
  seed: null,
};

export interface IRandomPresetSeeder {
  seedInto(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    preset: RandomPresetId,
    randomVariation: boolean,
    params?: RandomSeedParams,
  ): void;
}

export interface RandomPresetSeedContext {
  rng: () => number;
  density: number;
  randomizedLayout: boolean;
  cx: number;
  cy: number;
  noiseType: NoiseType;
}

export type RandomPresetSeedFn = (
  buffer: Uint8Array,
  rows: number,
  cols: number,
  context: RandomPresetSeedContext,
) => void;
