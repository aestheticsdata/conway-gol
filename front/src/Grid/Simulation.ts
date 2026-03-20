import { CELL_STATE } from "../Cell/constants";
import { GRID_COLS, GRID_ROWS, INITIAL_DENSITY } from "./constants";

/**
 * Pure Conway's Game of Life simulation engine.
 *
 * Owns all domain logic: neighbour counting, rule application, state seeding.
 * Completely decoupled from rendering — no canvas, no colors, no DOM.
 *
 * Uses two flat Uint8Array buffers (current + next generation) that are swapped
 * on each tick. This avoids any heap allocation during the simulation loop and
 * replaces the previous cloneDeep(Cell[][]) approach.
 *
 * Cell states are plain integers (see Cell/constants.ts):
 *   0 = DEAD, 1 = ALIVE
 * (BORDER and OUTSIDE are renderer-only states used by ZoomBox.)
 *
 * Flat index formula: index = row * cols + col
 */
class Simulation {
  private _current: Uint8Array;
  private _next: Uint8Array;
  public readonly rows: number;
  public readonly cols: number;

  constructor(rows: number = GRID_ROWS, cols: number = GRID_COLS) {
    this.rows = rows;
    this.cols = cols;
    this._current = new Uint8Array(rows * cols);
    this._next = new Uint8Array(rows * cols);
  }

  // ── State accessors ────────────────────────────────────────────────────────

  public getCell(row: number, col: number): number {
    return this._current[row * this.cols + col];
  }

  public setCell(row: number, col: number, value: number): void {
    this._current[row * this.cols + col] = value;
  }

  // ── Seeding ────────────────────────────────────────────────────────────────

  /** Fill the grid randomly according to INITIAL_DENSITY. */
  public seedRandom(): void {
    for (let i = 0; i < this._current.length; i++) {
      this._current[i] = Math.random() < INITIAL_DENSITY ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    }
  }

  /** Fill the grid with all DEAD cells (blank canvas). */
  public seedDead(): void {
    this._current.fill(CELL_STATE.DEAD);
  }

  /**
   * Seed from a pre-built full-grid number[][] (156×156, values 0/1).
   * Used when Data has already computed centering and applied the pattern offset.
   */
  public seedFromGrid(grid: number[][]): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this._current[row * this.cols + col] = grid[row][col];
      }
    }
  }

  // ── Simulation step ────────────────────────────────────────────────────────

  /**
   * Advance the simulation by one generation.
   *
   * Conway's rules:
   *   - A live cell with 2 or 3 live neighbours survives.
   *   - A live cell with < 2 or > 3 live neighbours dies.
   *   - A dead cell with exactly 3 live neighbours becomes alive.
   *
   * The grid is toroidal: edges wrap around, so neighbour counting never needs
   * boundary special-cases beyond the index calculation.
   *
   * After computing _next, the two buffers are swapped in O(1) — no copying.
   */
  public tick(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const n = this._countLivingNeighbours(row, col);
        const current = this._current[row * this.cols + col];
        // ALIVE=1 and DEAD=0, so we can directly sum neighbour values
        this._next[row * this.cols + col] =
          current === CELL_STATE.ALIVE
            ? (n === 2 || n === 3 ? CELL_STATE.ALIVE : CELL_STATE.DEAD)
            : (n === 3 ? CELL_STATE.ALIVE : CELL_STATE.DEAD);
      }
    }
    // O(1) swap — no memory allocation
    [this._current, this._next] = [this._next, this._current];
  }

  // ── Serialization ──────────────────────────────────────────────────────────

  /**
   * Export current state as a 2D number[][] for saving to the server.
   * Values are 0 (DEAD) or 1 (ALIVE) — matches the .hxf automata format.
   */
  public toGrid(): number[][] {
    const result: number[][] = [];
    for (let row = 0; row < this.rows; row++) {
      result.push(
        Array.from(this._current.subarray(row * this.cols, (row + 1) * this.cols))
      );
    }
    return result;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Count live neighbours for a given cell using toroidal wrapping.
   * Since ALIVE=1 and DEAD=0, we can sum the 8 neighbour values directly.
   */
  private _countLivingNeighbours(row: number, col: number): number {
    const prevRow = row === 0 ? this.rows - 1 : row - 1;
    const nextRow = row === this.rows - 1 ? 0 : row + 1;
    const prevCol = col === 0 ? this.cols - 1 : col - 1;
    const nextCol = col === this.cols - 1 ? 0 : col + 1;

    return (
      this._current[prevRow * this.cols + prevCol] +
      this._current[prevRow * this.cols + col] +
      this._current[prevRow * this.cols + nextCol] +
      this._current[row    * this.cols + prevCol] +
      this._current[row    * this.cols + nextCol] +
      this._current[nextRow * this.cols + prevCol] +
      this._current[nextRow * this.cols + col] +
      this._current[nextRow * this.cols + nextCol]
    );
  }
}

export default Simulation;
