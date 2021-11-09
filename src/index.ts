import Cell from "./Cell/Cell"

class Main {
  private readonly _canvas: HTMLCanvasElement
  private readonly _stage: CanvasRenderingContext2D
  private _requestAnimationID: number
  private _isPlaying: boolean
  private _cellsMatrix: Cell[][] = []

  constructor() {
    this._canvas = document.querySelector('canvas')
    this._stage = this._canvas.getContext('2d')
  }

  private _createCells() {
    for (let i=0; i<this._canvas.height / Cell.height; i++) {
      this._cellsMatrix.push([])
      for (let j=0; j<this._canvas.width / Cell.width; j++) {
        this._cellsMatrix[i].push(new Cell())
      }
    }
    console.log('cell matrix: ', this._cellsMatrix)
  }

  private _renderGeneration() {

  }

  // private _togglePause = () => {
  //   this._isPlaying ? this._stop() : this._start();
  //   this._isPlaying = !this._isPlaying;
  // }

  private _step = (_timestamp) => {
    this._renderGeneration();
    this._requestAnimationID = window.requestAnimationFrame(this._step);
  }

  private _start = () => {
    this._requestAnimationID = window.requestAnimationFrame(this._step);
  }

  private _stop = () => {
    cancelAnimationFrame(this._requestAnimationID);
  }

  init() {
    console.log('init')
    this._stage.fillStyle = 'rgb(177,231,95)'
    this._stage.fillRect(0, 0, this._canvas.width, this._canvas.height)
    this._createCells();
    // this._start()
  }
}

(new Main).init()
