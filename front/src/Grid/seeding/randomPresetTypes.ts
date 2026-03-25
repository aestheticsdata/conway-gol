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
  /** 0–1 per noise type: blends spatial mask toward 0.5 (lower = smoother / less contrast). */
  noiseLevels: Record<NoiseType, number>;
}

export const DEFAULT_NOISE_LEVELS: Record<NoiseType, number> = {
  uniform: 0.5,
  "perlin-like": 0.5,
  clusters: 0.5,
  gradient: 0.5,
  "edge-bias": 0.5,
  "center-burst": 0.5,
  interference: 0.5,
  marbling: 0.5,
};

export const DEFAULT_RANDOM_PARAMS: RandomSeedParams = {
  density: 0.09, // matches the UI default: 30% slider → 9% effective density
  noiseType: "uniform",
  seed: null,
  noiseLevels: { ...DEFAULT_NOISE_LEVELS },
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
  /** 0–1 for the active `noiseType` (mask blend toward 0.5). */
  noiseLevel: number;
}

export type RandomPresetSeedFn = (
  buffer: Uint8Array,
  rows: number,
  cols: number,
  context: RandomPresetSeedContext,
) => void;
