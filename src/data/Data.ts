import Cell from "../Cell/Cell";
import { CELL_STATE } from "../Cell/constants";
import type { CellGrid } from "../Grid/Grid";
import Grid from "../Grid/Grid";
import { species } from "./species/species";
import axios from "axios";

class Data {
  public grid: CellGrid = []

  private async makeEntity(entity: string, startIndex: number[]) {
    const critter = (await axios.get(`http://localhost:5000/critter/${entity}`)).data;
    const critterParsed = JSON.parse(critter);

    // const o = species[entity];
    const o = {
      position: [5, 5],
      content: critterParsed.automata,
    };


    const startPosition = o.position ?? startIndex;
    for (let j=0; j<o.content.length; j++) {
      for (let i=0; i<o.content[0].length; i++) {
        if (o.content[j][i] === 1) {
          this.grid[j+startPosition[0]][i+startPosition[1]].state = CELL_STATE.ALIVE
        }
      }
    }
  }

  public async factory(entity, startIndex: number[]) {
    for (let i=0; i<Grid.gridSize; i++) {
      this.grid.push([])
      for (let j=0; j<Grid.gridSize; j++) {
        this.grid[i].push(new Cell(CELL_STATE.DEAD))
      }
    }
    await this.makeEntity(entity, startIndex)
  }
}

export default Data
