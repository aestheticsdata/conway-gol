import { CELL_STATE } from "@cell/constants";
import { INITIAL_DENSITY } from "@grid/constants";
import type { RandomPresetId } from "@grid/randomPresets";

/** Writes random-mode initial states into a flat cell buffer (ALIVE/DEAD). */
export interface IRandomPresetSeeder {
  seedInto(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    preset: RandomPresetId,
    randomVariation: boolean,
  ): void;
}

function presetSeed(preset: RandomPresetId): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < preset.length; i++) {
    h ^= preset.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h || 1;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STAR_MOTIFS = [
  [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ],
  [
    [0, 0],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ],
  [
    [0, 0],
    [-1, 0],
    [-2, 0],
    [1, 0],
    [2, 0],
    [0, -1],
    [0, -2],
    [0, 1],
    [0, 2],
  ],
  [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ],
  [
    [0, 0],
    [0, -2],
    [-1, -1],
    [-2, 0],
    [-1, 1],
    [0, 2],
    [1, 1],
    [2, 0],
    [1, -1],
  ],
  [
    [0, 0],
    [-2, 0],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
    [2, 0],
  ],
  [
    [0, 0],
    [-1, -1],
    [-2, -2],
    [1, 1],
    [2, 2],
    [-1, 1],
    [-2, 2],
    [1, -1],
    [2, -2],
  ],
] as const;

function stampStarMotif(
  buf: Uint8Array,
  rows: number,
  cols: number,
  centerR: number,
  centerC: number,
  motif: readonly (readonly [number, number])[],
  quarterTurns: number,
): void {
  const q = ((quarterTurns % 4) + 4) % 4;
  for (const [dr0, dc0] of motif) {
    let dr = dr0;
    let dc = dc0;
    for (let t = 0; t < q; t++) {
      const ndr = -dc;
      const ndc = dr;
      dr = ndr;
      dc = ndc;
    }
    const r = centerR + dr;
    const c = centerC + dc;
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      buf[r * cols + c] = CELL_STATE.ALIVE;
    }
  }
}

/**
 * Fills a buffer with named random-mode presets (stable default vs. randomised variant).
 */
export class RandomPresetSeeder implements IRandomPresetSeeder {
  public seedInto(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    preset: RandomPresetId,
    randomVariation: boolean,
  ): void {
    const rng = randomVariation ? () => Math.random() : mulberry32(presetSeed(preset));
    const cx = (cols - 1) / 2;
    const cy = (rows - 1) / 2;

    switch (preset) {
      case "noise":
        this._seedNoise(buffer, rng);
        break;
      case "stars":
        this._seedStars(buffer, rows, cols, rng, randomVariation);
        break;
      case "circles":
        this._seedCircles(buffer, rows, cols, randomVariation);
        break;
      case "sinus":
        this._seedSinus(buffer, rows, cols, randomVariation);
        break;
      case "rings":
        this._seedRings(buffer, rows, cols, cx, cy, randomVariation);
        break;
      case "stripes":
        this._seedStripes(buffer, rows, cols, randomVariation);
        break;
      case "checker":
        this._seedChecker(buffer, rows, cols, randomVariation);
        break;
      case "clusters":
        this._seedClusters(buffer, rows, cols, randomVariation);
        break;
      case "diagonal":
        this._seedDiagonal(buffer, rows, cols, randomVariation);
        break;
      case "cross":
        this._seedCross(buffer, rows, cols, cx, cy, randomVariation);
        break;
    }
  }

  private _seedNoise(buffer: Uint8Array, rng: () => number): void {
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = rng() < INITIAL_DENSITY ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    }
  }

  private _seedStars(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    rng: () => number,
    randomVariation: boolean,
  ): void {
    buffer.fill(CELL_STATE.DEAD);
    const pick = randomVariation ? () => Math.random() : rng;
    const numStars = randomVariation ? 5 + Math.floor(Math.random() * 28) : 16;
    const minDistSq = randomVariation
      ? (3 + Math.floor(Math.random() * 7)) ** 2
      : 5 * 5;
    const maxAttempts = Math.max(600, numStars * 100);
    const centers: { r: number; c: number; m: number; rot: number }[] = [];
    let attempts = 0;
    while (centers.length < numStars && attempts < maxAttempts) {
      attempts++;
      const r = Math.floor(pick() * rows);
      const c = Math.floor(pick() * cols);
      if (centers.some((p) => (p.r - r) ** 2 + (p.c - c) ** 2 < minDistSq)) {
        continue;
      }
      const m = Math.floor(
        (randomVariation ? Math.random() : rng()) * STAR_MOTIFS.length,
      );
      const rot = Math.floor(
        (randomVariation ? Math.random() : rng()) * 4,
      );
      centers.push({ r, c, m, rot });
    }
    for (const { r, c, m, rot } of centers) {
      stampStarMotif(buffer, rows, cols, r, c, STAR_MOTIFS[m], rot);
    }
  }

  private _seedCircles(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    randomVariation: boolean,
  ): void {
    const k = randomVariation ? 0.12 + Math.random() * 0.08 : 0.15;
    const ph = randomVariation ? Math.random() * Math.PI * 2 : 0;
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const v = Math.sin(row * k + ph) * Math.cos(col * k - ph * 0.7);
        buffer[i++] = v > 0.15 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      }
    }
  }

  private _seedSinus(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    randomVariation: boolean,
  ): void {
    const margin = rows * 0.06;
    const usableH = rows - 2 * margin;
    const numWaves = randomVariation ? 3 + Math.floor(Math.random() * 6) : 5;
    const k = randomVariation
      ? 0.05 + Math.random() * 0.28
      : (3 * 2 * Math.PI) / Math.max(cols, 1);
    const amp = randomVariation ? 5 + Math.random() * 20 : 12;
    const band = randomVariation ? 1 + Math.floor(Math.random() * 2) : 2;
    const y0: number[] = [];
    const phases: number[] = [];
    for (let w = 0; w < numWaves; w++) {
      if (randomVariation) {
        y0.push(margin + Math.random() * usableH);
        phases.push(Math.random() * Math.PI * 2);
      } else {
        y0.push(margin + (usableH * (w + 1)) / (numWaves + 1));
        phases.push((w * 2 * Math.PI) / numWaves);
      }
    }
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let alive = false;
        for (let w = 0; w < numWaves; w++) {
          const curve = y0[w] + amp * Math.sin(k * col + phases[w]);
          if (Math.abs(row - curve) <= band) {
            alive = true;
            break;
          }
        }
        buffer[i++] = alive ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      }
    }
  }

  private _seedRings(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    cx: number,
    cy: number,
    randomVariation: boolean,
  ): void {
    const spacing = randomVariation ? 2.5 + Math.random() * 2.2 : 3.2;
    const phaseShift = randomVariation ? Math.random() * spacing : 0;
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const dx = col - cx;
        const dy = row - cy;
        const r = Math.sqrt(dx * dx + dy * dy);
        buffer[i++] =
          Math.floor((r + phaseShift) / spacing) % 2 === 0
            ? CELL_STATE.ALIVE
            : CELL_STATE.DEAD;
      }
    }
  }

  private _seedStripes(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    randomVariation: boolean,
  ): void {
    const period = randomVariation ? 4 + Math.floor(Math.random() * 4) : 6;
    const thick = randomVariation ? 1 + Math.floor(Math.random() * 2) : 2;
    const vertical = randomVariation ? Math.random() < 0.5 : false;
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const t = vertical ? col : row;
        buffer[i++] = t % period < thick ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      }
    }
  }

  private _seedChecker(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    randomVariation: boolean,
  ): void {
    const shift = randomVariation ? Math.floor(Math.random() * 2) : 0;
    const scale = randomVariation ? 1 + Math.floor(Math.random() * 3) : 1;
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const a = Math.floor(row / scale);
        const b = Math.floor(col / scale);
        buffer[i++] =
          (a + b + shift) % 2 === 0 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      }
    }
  }

  private _seedClusters(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    randomVariation: boolean,
  ): void {
    if (!randomVariation) {
      const stepsR = 4;
      const stepsC = 4;
      const rad = 7;
      const centers: { r: number; c: number; rad: number }[] = [];
      for (let gi = 0; gi < stepsR; gi++) {
        for (let gj = 0; gj < stepsC; gj++) {
          centers.push({
            r: ((gi + 0.5) * rows) / stepsR,
            c: ((gj + 0.5) * cols) / stepsC,
            rad,
          });
        }
      }
      let i = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          let falloff = 0;
          for (const { r, c, rad: R } of centers) {
            const d = (row - r) ** 2 + (col - c) ** 2;
            const r2 = R * R;
            if (d < r2) {
              falloff = Math.max(falloff, 1 - d / r2);
            }
          }
          buffer[i++] = falloff > 0.38 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
        }
      }
      return;
    }
    const num = 10 + Math.floor(Math.random() * 14);
    const centers: { r: number; c: number; rad: number }[] = [];
    for (let k = 0; k < num; k++) {
      centers.push({
        r: Math.random() * rows,
        c: Math.random() * cols,
        rad: 4 + Math.random() * 9,
      });
    }
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let falloff = 0;
        for (const { r, c, rad: R } of centers) {
          const d = (row - r) ** 2 + (col - c) ** 2;
          const r2 = R * R;
          if (d < r2) {
            falloff = Math.max(falloff, 1 - d / r2);
          }
        }
        buffer[i++] =
          falloff > 0 && Math.random() < 0.22 + 0.72 * falloff
            ? CELL_STATE.ALIVE
            : CELL_STATE.DEAD;
      }
    }
  }

  private _seedDiagonal(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    randomVariation: boolean,
  ): void {
    const period = randomVariation ? 5 + Math.floor(Math.random() * 5) : 7;
    const band = randomVariation ? 1 + Math.floor(Math.random() * 2) : 2;
    const offset = randomVariation ? Math.floor(Math.random() * period) : 0;
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const t = (row + col + offset) % period;
        buffer[i++] = t < band ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      }
    }
  }

  private _seedCross(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    cx: number,
    cy: number,
    randomVariation: boolean,
  ): void {
    const thick = randomVariation ? 2 + Math.floor(Math.random() * 2) : 3;
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const onH = Math.abs(row - cy) < thick;
        const onV = Math.abs(col - cx) < thick;
        const onCross = onH || onV;
        const hole = randomVariation && onCross && Math.random() < 0.08;
        buffer[i++] = onCross && !hole ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      }
    }
  }
}
