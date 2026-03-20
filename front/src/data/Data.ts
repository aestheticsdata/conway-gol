import { CELL_STATE } from "../Cell/constants";
import { GRID_COLS, GRID_ROWS, CELL_SIZE } from "../Grid/constants";
import { species } from "./species/species";
import axios from "axios";
import Helpers from "../helpers/Helpers";
import { GRID } from "../Grid/constants";
import { URLS } from "../helpers/constants";

/**
 * Data — factory for loading pattern files (.hxf) and building the initial
 * grid state as a plain number[][].
 *
 * After factory() resolves, Data.grid is a GRID_ROWS×GRID_COLS array of
 * integers (0=DEAD, 1=ALIVE) ready to be passed to Simulation.seedFromGrid().
 *
 * No Cell objects are created here. Centering logic is preserved as-is.
 */
class Data {
  /** Full-grid state: number[GRID_ROWS][GRID_COLS], values 0 or 1. */
  public grid: number[][] = [];
  public comments: string[];
  public commentsDOMSelector: HTMLElement = document.querySelector(".critter-comments");

  private async _makeEntity(entity: string, startIndex: number[], custom?: string) {
    let o;
    const url = custom
      ? `${URLS.pattern}${entity}-custom`
      : `${URLS.pattern}${entity}`;

    try {
      const critter = (await axios.get(`${Helpers.getRequestURL(url)}`)).data;
      const critterParsed = typeof critter === 'string' ? JSON.parse(critter) : critter;

      // Center the pattern on the grid
      const position = [
        Math.floor(((GRID.SIZE.Y / CELL_SIZE) >> 1) - (critterParsed.automata.length >> 1)),
        Math.floor(((GRID.SIZE.X / CELL_SIZE) >> 1) - (critterParsed.automata[0].length >> 1)),
      ];

      o = { position, content: critterParsed.automata };

      let commentsList = critterParsed.comments;
      commentsList = commentsList.map((line: string) => {
        if (line.includes("http")) {
          return `<a href="${line}" target="_blank" title="${line}">- ${line}</a>`;
        }
        return "- " + line;
      });
      this.commentsDOMSelector.innerHTML = commentsList.join("<br />");
    } catch (err) {
      console.error("Error fetching critter:", err);
      o = species[entity];
      if (!o) {
        console.error(`Species "${entity}" not found in API or local species`);
        return;
      }
    }

    if (!o || !o.content) {
      console.error("Invalid critter data:", o);
      return;
    }

    const startPosition = o.position ?? startIndex;
    for (let row = 0; row < o.content.length; row++) {
      for (let col = 0; col < o.content[0].length; col++) {
        if (o.content[row][col] === 1) {
          this.grid[row + startPosition[0]][col + startPosition[1]] = CELL_STATE.ALIVE;
        }
      }
    }
  }

  /**
   * Build a blank GRID_ROWS×GRID_COLS grid, fetch the given pattern from the
   * server (or fall back to local species), and write alive cells into the grid.
   *
   * @param entity     Pattern name (maps to a .hxf file on the server).
   * @param startIndex Fallback offset [row, col] if the pattern has no position.
   * @param custom     Pass "custom" to look in the user-custom subdirectory.
   */
  public async factory(entity: string, startIndex: number[], custom?: string) {
    // Build a blank grid first, then overlay the pattern cells.
    this.grid = Array.from({ length: GRID_ROWS }, () =>
      new Array(GRID_COLS).fill(CELL_STATE.DEAD)
    );
    await this._makeEntity(entity, startIndex, custom);
  }
}

export default Data;
