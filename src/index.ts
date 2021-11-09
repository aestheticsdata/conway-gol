import Grid from "./Grid/Grid";

class Main {
  private readonly _canvas: HTMLCanvasElement
  private readonly _stage: CanvasRenderingContext2D
  private _requestAnimationID: number
  private _isPlaying: boolean
  private _grid: Grid;

  constructor() {
    this._canvas = document.querySelector('canvas')
    this._stage = this._canvas.getContext('2d')
    this._grid = new Grid(this._stage, this._canvas)
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
    // this._start()
  }
}

(new Main()).init()
