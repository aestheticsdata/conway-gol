import Cell from "../Cell/Cell";
import { CELL_STATE } from "../Cell/constants";
import type { CellGrid } from "../Grid/Grid";
import Grid from "../Grid/Grid";
import { species } from "./species/species";
import axios from "axios";
import Helpers from "../helpers/Helpers";
import { GRID } from "../Grid/constants";
import { URLS } from "../helpers/constants";

class Data {
  public grid: CellGrid = [];
  public comments: string[];
  public commentsDOMSelector: HTMLElement = document.querySelector('.critter-comments');

  private async makeEntity(entity: string, startIndex: number[]) {
    let o;
    const url = `${URLS.critter}/${entity}`;
    try {
      const critter = (await axios.get(`${Helpers.getRequestURL(url)}`)).data;
      const critterParsed = JSON.parse(critter);
      const position = [
        Math.floor((GRID.SIZE.Y/Cell.size)/2 - critterParsed.automata.length/2),
        Math.floor((GRID.SIZE.X/Cell.size)/2 - critterParsed.automata[0].length/2),
      ];
      o = {
        position,
        content: critterParsed.automata,
      };

      let commentsList = critterParsed.comments;
      commentsList = commentsList.map(line => {
        let tmpLine;
        if (line.includes('http')) {
          tmpLine = `<a href="${line}" target="_blank" title="${line}">- ${line}</a>`;
        } else {
          tmpLine = '- '+line;
        }
        return tmpLine;
      });
      this.commentsDOMSelector.innerHTML = commentsList.join('<br />');
    } catch (err) {
      o = species[entity];
    }

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
