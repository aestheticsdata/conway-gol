import { CELL_STATE } from "@cell/constants";
import { CELL_SIZE, GRID, GRID_COLS, GRID_ROWS } from "@grid/constants";
import PatternService from "@services/PatternService";
import { species } from "./species/species";
import { DATA_TEXTS } from "./texts";

type PatternContent = {
  position?: number[];
  content: number[][];
};

/**
 * Data — factory for loading pattern files (.hxf) and building the initial
 * grid state as a plain number[][].
 *
 * After load() resolves, Data.grid is a GRID_ROWS×GRID_COLS array of
 * integers (0=DEAD, 1=ALIVE) ready to be passed to Simulation.seedFromGrid().
 * Data.comments holds the pattern's comment lines for display by the caller.
 *
 * No Cell objects are created here. No DOM manipulation happens here.
 */
class Data {
  /** Full-grid state: number[GRID_ROWS][GRID_COLS], values 0 or 1. */
  public grid: number[][] = [];
  public comments: string[] = [];
  private readonly _patternService = new PatternService();

  private async _makeEntity(entity: string, startIndex: number[], custom = false): Promise<void> {
    let pattern: PatternContent | null = null;

    try {
      const critterParsed = await this._patternService.getPattern(entity, custom);

      // Center the pattern on the grid
      const position = [
        Math.floor(((GRID.SIZE.Y / CELL_SIZE) >> 1) - (critterParsed.automata.length >> 1)),
        Math.floor(((GRID.SIZE.X / CELL_SIZE) >> 1) - (critterParsed.automata[0].length >> 1)),
      ];

      pattern = { position, content: critterParsed.automata };
      this.comments = critterParsed.comments;
    } catch (err) {
      console.error(DATA_TEXTS.errors.fetchingCritter, err);
      pattern = (species[entity] as PatternContent | undefined) ?? null;
      if (!pattern) {
        console.error(DATA_TEXTS.errors.speciesNotFound(entity));
        return;
      }
    }

    if (!pattern?.content) {
      console.error(DATA_TEXTS.errors.invalidCritterData, pattern);
      return;
    }

    const startPosition = pattern.position ?? startIndex;
    for (let row = 0; row < pattern.content.length; row++) {
      for (let col = 0; col < pattern.content[0].length; col++) {
        if (pattern.content[row][col] === 1) {
          this.grid[row + startPosition[0]][col + startPosition[1]] = CELL_STATE.ALIVE;
        }
      }
    }
  }

  /**
   * Build a blank GRID_ROWS×GRID_COLS grid, fetch the given pattern from the
   * server (or fall back to local species), and write alive cells into the grid.
   * After resolution, read Data.grid and Data.comments.
   *
   * @param entity     Pattern name (maps to a .hxf file on the server).
   * @param startIndex Fallback offset [row, col] if the pattern has no position.
   * @param custom     Set to true to load the user-custom variant from the server.
   */
  public async load(entity: string, startIndex: number[], custom = false): Promise<void> {
    // Build a blank grid first, then overlay the pattern cells.
    this.grid = Array.from({ length: GRID_ROWS }, () => new Array(GRID_COLS).fill(CELL_STATE.DEAD));
    await this._makeEntity(entity, startIndex, custom);
  }
}

export default Data;
