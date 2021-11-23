import { CELL_STATE } from "./constants";
import { v1 as uuidv1 } from 'uuid';

type CellState = typeof CELL_STATE.DEAD | typeof CELL_STATE.ALIVE | typeof CELL_STATE.BORDER;

class Cell {
  public static size: number = 5;
  private _state: CellState;
  public color: string;
  public id: string;

  constructor(state?: CellState) {
    this._state = state ?? this._randomState()
    if (state !== undefined) {
      this.color = this._getColor(state);
    }
    this.id = uuidv1();
  }

  private _getColor(state: CellState) {
    let color;
    switch (state) {
      case CELL_STATE.ALIVE:
        color = CELL_STATE.ALIVE_COLOR;
        break;
      case CELL_STATE.DEAD:
        color = CELL_STATE.DEAD_COLOR;
        break;
      case CELL_STATE.BORDER:
        color = CELL_STATE.BORDER_COLOR;
        break;
    }
    return color;
  }

  private _randomState(): number {
    const rnd = Math.ceil(Math.random()*100)
    const isAlive = rnd >= 82
    this.color = (isAlive ? this._getColor(CELL_STATE.ALIVE) : this._getColor(CELL_STATE.DEAD))
    return (isAlive ? CELL_STATE.ALIVE : CELL_STATE.DEAD)
  }

  public get state() {
    return this._state
  }

  public set state(cs: CellState) {
    this._state = cs
    this.color = (this.state === CELL_STATE.ALIVE ? this._getColor(CELL_STATE.ALIVE) : this._getColor(CELL_STATE.DEAD))
  }
}

export default Cell
