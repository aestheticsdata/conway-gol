import Grid from "./Grid/Grid"
import ModeSelector from "./controls/ModeSelector"
import type { Mode } from "./controls/ModeSelector"
import ZooSelector from "./controls/ZooSelector";
import axios from 'axios';
import Helpers from "./helpers/Helpers";
import DrawingToolBox from "./controls/DrawingToolBox";
import { GRID } from "./Grid/constants";
import ZoomBox from "./Grid/zoom/ZoomBox";
import UserCustomSelector from "./controls/UserCustomSelector";
import { URLS } from "./helpers/constants";

class Main {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _stage: CanvasRenderingContext2D;
  private readonly _drawingCanvas: HTMLCanvasElement;
  private readonly _drawingContext: CanvasRenderingContext2D;
  private _requestAnimationID: number;
  private _isPlaying: boolean = false;
  private _grid: Grid;
  private _iterationCounterValue: number = 0;
  private _iterationCounter: HTMLElement = document.querySelector('.iteration-counter');
  private _pauseBtn: HTMLButtonElement = document.querySelector('button');
  private _speedSelector: HTMLInputElement = document.querySelector('#speed-input');
  public commentsDOMSelector: HTMLElement = document.querySelector('.critter-comments');
  private _zooPrimitivesDOMSelector = document.querySelector('.zoo-selector');
  private _modeSelector: ModeSelector;
  private _selectedMode: Mode = "random";
  private _zooSelector: ZooSelector;
  private _fps = 12;
  private _fpsInterval;
  private _startTime;
  private _now;
  private _lastDrawTime;
  private _elapsed;
  private readonly _changeZoo;
  private _selectedSpecies: string;
  private _critterList: Promise<string[]>;
  private _drawingToolBox: DrawingToolBox;
  private _zoomBox: ZoomBox;
  private _userCustomSelector: UserCustomSelector;

  constructor() {
    this._canvas = document.querySelector('#canvasID');
    this._canvas.width = GRID.SIZE.X;
    this._canvas.height = GRID.SIZE.Y;
    this._stage = this._canvas.getContext('2d');
    this._drawingCanvas = document.querySelector('#canvas-drawing');
    this._drawingCanvas.width = GRID.SIZE.X;
    this._drawingCanvas.height = GRID.SIZE.Y;
    this._drawingContext = this._drawingCanvas.getContext('2d');
    this._pauseBtn.addEventListener('click', this._togglePause);
    this._setFPS();
    this._pauseBtn.textContent = 'start';
    this._iterationCounter.textContent = String(this._iterationCounterValue);
    this._modeSelector = new ModeSelector(this._changeMode);
    this._changeZoo = (species) => {
      this._selectedSpecies = species;
      this._setup();
    }
  }

  private _changeMode = (mode: Mode) => {
      this._selectedMode = mode;
      this._setup();
  }

  private _setFPS() {
    this._speedSelector.value = String(this._fps)
    this._speedSelector.addEventListener('keypress', this._handleEnterKey)
    this._speedSelector.addEventListener('change', (e: Event) => {
      this._fps = parseInt((e.currentTarget as HTMLInputElement).value)
    })
  }

  private _handleEnterKey = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (Number((e.currentTarget as HTMLInputElement).value) > 60) {
        this._fps = 60
        this._speedSelector.value = String(this._fps)
      }
      if (Number((e.currentTarget as HTMLInputElement).value) < 1) {
        this._fps = 1
        this._speedSelector.value = String(this._fps)
      }
      (e.currentTarget as HTMLInputElement).blur();
    }
  }

  private _renderGeneration() {
    this._grid.processNextGeneration(this._stage)
  }

  private _togglePause = () => {
    if (this._isPlaying){
      this._stop()
      this._pauseBtn.textContent = 'start'
    } else {
      this._pauseBtn.textContent = 'pause'
      this._start()
    }
    this._isPlaying = !this._isPlaying
  }

  private _step = (_timestamp) => {
    this._fpsInterval = 1000 / this._fps
    this._now = Date.now();
    this._elapsed = this._now - this._lastDrawTime
    if (this._elapsed > this._fpsInterval) {
      this._lastDrawTime = this._now - (this._elapsed % this._fpsInterval)
      this._iterationCounterValue++
      this._iterationCounter.textContent = String(this._iterationCounterValue)
      this._renderGeneration()
    }
    this._requestAnimationID = window.requestAnimationFrame(this._step)
  }

  private _start = () => {
    // https://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
    this._lastDrawTime = Date.now()
    this._startTime = this._lastDrawTime
    this._requestAnimationID = window.requestAnimationFrame(this._step)
  }

  private _stop = () => {
    cancelAnimationFrame(this._requestAnimationID)
  }

  private async _setup() {
    try {
      this._critterList = (await axios.get(`${Helpers.getRequestURL(URLS.critterList)}`)).data;
    } catch (err) {
      console.log(err);
    }
    // call togglePause only if switching from one mode to another
    // not the first time start is clicked
    if (this._isPlaying === true) {
      this._togglePause()
    }
    switch (this._selectedMode) {
      case "random":
        this._drawingToolBox?.hide();
        this._grid?.destroyListener();
        (<HTMLInputElement>this._zooPrimitivesDOMSelector).style.display = "none";
        (<HTMLElement>this.commentsDOMSelector).innerHTML = "";
        (<HTMLCanvasElement>this._drawingCanvas).style.display = "none";
        this._zoomBox?.hide();
        this._userCustomSelector?.hide();
        this._grid = new Grid(this._stage, this._canvas, this._selectedMode);
        break;
      case "zoo":
        this._drawingToolBox?.hide();
        this._grid?.destroyListener();
        if (!this._zooSelector) this._zooSelector = new ZooSelector();
        this._zooSelector.createSelectButton(this._zooPrimitivesDOMSelector, this._changeZoo, this._critterList);
        (<HTMLInputElement>this._zooPrimitivesDOMSelector).style.display = "block";
        (<HTMLCanvasElement>this._drawingCanvas).style.display = "none";
        this._zoomBox?.hide();
        this._userCustomSelector?.hide();
        this._grid = new Grid(this._stage, this._canvas, this._selectedMode, this._selectedSpecies);
        break;
      case "drawing":
        (<HTMLInputElement>this._zooPrimitivesDOMSelector).style.display = "none";
        (<HTMLElement>this.commentsDOMSelector).innerHTML = "";
        (<HTMLCanvasElement>this._drawingCanvas).style.display = "block";
        this._drawingToolBox = new DrawingToolBox();
        this._drawingToolBox.show();
        this._zoomBox = new ZoomBox();
        this._zoomBox.show();
        this._userCustomSelector = new UserCustomSelector();
        await this._userCustomSelector.getCustomList();
        this._userCustomSelector.show();
        this._grid = new Grid(this._stage, this._canvas, this._selectedMode, "", this._drawingContext, this._drawingCanvas, this._drawingToolBox, this._userCustomSelector);
        this._grid.zoombox = this._zoomBox;
        this._grid.initListener();
        break;
    }
    this._iterationCounterValue = 0;
    this._fps = 12;
    this._speedSelector.value = String(this._fps);
    this._iterationCounter.textContent = String(this._iterationCounterValue);
  }

  init() {
    this._setup()
    const url = new URLSearchParams(window.location.search)
    if (url.get('autostart') === '1') {
      this._togglePause()
    }
    if (url.get('drawing') === '1') {
      this._changeMode("drawing");
    }
  }
}

(new Main()).init()
