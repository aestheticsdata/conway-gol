import Cell from "../Cell/Cell";
import { CELL_STATE } from "../Cell/constants";
import type { CellGrid } from "../Grid/Grid";
import Grid from "../Grid/Grid";
import { species } from "./species/species";

class Data {
  public grid: CellGrid = []

  private makeEntity(entity: string, startIndex: number[]) {
    const o = species[entity];
    const startPosition = o.position ?? startIndex;
    for (let j=0; j<o.content.length; j++) {
      for (let i=0; i<o.content[0].length; i++) {
        if (o.content[j][i] === 1) {
          this.grid[j+startPosition[0]][i+startPosition[1]].state = CELL_STATE.ALIVE
        }
      }
    }
  }

  public factory(entity, startIndex: number[]) {
    for (let i=0; i<Grid.gridSize; i++) {
      this.grid.push([])
      for (let j=0; j<Grid.gridSize; j++) {
        this.grid[i].push(new Cell(CELL_STATE.DEAD))
      }
    }
    this.makeEntity(entity, startIndex)
  }
}

export default Data
