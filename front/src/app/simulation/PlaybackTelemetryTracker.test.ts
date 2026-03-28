import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import PlaybackTelemetryTracker from "./PlaybackTelemetryTracker";

type HxfPatternPayload = {
  automata: number[][];
};

function createCenteredState(pattern: number[][], rows = 25, cols = 25): Uint8Array {
  const state = new Uint8Array(rows * cols);
  const startRow = Math.floor((rows >> 1) - (pattern.length >> 1));
  const startCol = Math.floor((cols >> 1) - (pattern[0]?.length ?? 0) / 2);

  for (let row = 0; row < pattern.length; row++) {
    for (let col = 0; col < pattern[0].length; col++) {
      if (pattern[row]?.[col] === 1) {
        state[(row + startRow) * cols + (col + Math.floor(startCol))] = 1;
      }
    }
  }

  return state;
}

function tickState(current: Uint8Array, rows: number, cols: number): { changedCells: number; nextState: Uint8Array } {
  const nextState = new Uint8Array(rows * cols);
  let changedCells = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const prevRow = row === 0 ? rows - 1 : row - 1;
      const nextRow = row === rows - 1 ? 0 : row + 1;
      const prevCol = col === 0 ? cols - 1 : col - 1;
      const nextCol = col === cols - 1 ? 0 : col + 1;
      const index = row * cols + col;
      const livingNeighbours =
        current[prevRow * cols + prevCol] +
        current[prevRow * cols + col] +
        current[prevRow * cols + nextCol] +
        current[row * cols + prevCol] +
        current[row * cols + nextCol] +
        current[nextRow * cols + prevCol] +
        current[nextRow * cols + col] +
        current[nextRow * cols + nextCol];
      const nextValue =
        current[index] === 1
          ? livingNeighbours === 2 || livingNeighbours === 3
            ? 1
            : 0
          : livingNeighbours === 3
            ? 1
            : 0;

      nextState[index] = nextValue;
      if (nextValue !== current[index]) {
        changedCells++;
      }
    }
  }

  return { changedCells, nextState };
}

function runTracker(pattern: number[][], iterations: number, rows = 25, cols = 25): PlaybackTelemetryTracker {
  const tracker = new PlaybackTelemetryTracker();
  let state = createCenteredState(pattern, rows, cols);

  tracker.observe(0, state, null);

  for (let iteration = 1; iteration <= iterations; iteration++) {
    const { nextState, changedCells } = tickState(state, rows, cols);
    state = nextState;
    tracker.observe(iteration, state, changedCells);
  }

  return tracker;
}

function loadDinnerTablePattern(): number[][] {
  const file = new URL("../../../../api-nest/data/patterns/dinnertable.hxf", import.meta.url);
  const payload = JSON.parse(readFileSync(file, "utf8")) as HxfPatternPayload;
  return payload.automata;
}

describe("PlaybackTelemetryTracker", () => {
  it("marks a still life as stable from iteration 0", () => {
    const tracker = runTracker(
      [
        [1, 1],
        [1, 1],
      ],
      1,
    );

    expect(tracker.stableAfter).toBe(0);
    expect(tracker.cyclePeriod).toBeNull();
  });

  it("marks a lone cell as stable after its extinction settles", () => {
    const tracker = runTracker([[1]], 2);

    expect(tracker.stableAfter).toBe(1);
    expect(tracker.cyclePeriod).toBeNull();
  });

  it("detects a blinker as a period-2 oscillator", () => {
    const tracker = runTracker([[1, 1, 1]], 2);

    expect(tracker.stableAfter).toBeNull();
    expect(tracker.cyclePeriod).toBe(2);
  });

  it("detects dinnertable as a period-12 oscillator", () => {
    const tracker = runTracker(loadDinnerTablePattern(), 12, 167, 167);

    expect(tracker.stableAfter).toBeNull();
    expect(tracker.cyclePeriod).toBe(12);
  });
});
