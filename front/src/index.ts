import axios from "axios";
import Grid from "@grid/Grid";
import { GRID } from "@grid/constants";
import {
  DEFAULT_RANDOM_PRESET,
  RANDOM_PRESETS,
  isRandomPresetId,
  type RandomPresetId,
} from "@grid/randomPresets";
import ZoomBox from "@grid/zoom/ZoomBox";
import DrawingToolBox from "@controls/DrawingToolBox";
import ModeSelector, { type Mode } from "@controls/ModeSelector";
import UserCustomSelector from "@controls/UserCustomSelector";
import ZooSelector from "@controls/ZooSelector";
import { getRequiredContext2D, queryRequired } from "@helpers/dom";
import { getRequestURL } from "@helpers/api";
import { URLS } from "@helpers/constants";
import {
  type NoiseType,
  type RandomSeedParams,
} from "@grid/seeding/RandomPresetSeeder";

class Main {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _stage: CanvasRenderingContext2D;
  private readonly _drawingCanvas: HTMLCanvasElement;
  private readonly _drawingContext: CanvasRenderingContext2D;
  private readonly _iterationCounter: HTMLElement;
  private readonly _pauseBtn: HTMLButtonElement;
  private readonly _speedSelector: HTMLInputElement;
  private readonly _commentsDOMSelector: HTMLElement;
  private readonly _zooPrimitivesDOMSelector: HTMLElement;
  private readonly _randomPresetContainer: HTMLElement;
  private readonly _randomPresetSelect: HTMLSelectElement;
  private readonly _randomGenerateBtn: HTMLButtonElement;
  private readonly _randomDensitySlider: HTMLInputElement;
  private readonly _randomDensityValue: HTMLSpanElement;
  private readonly _randomSeedSlider: HTMLInputElement;
  private readonly _randomSeedValue: HTMLSpanElement;
  private readonly _randomSeedAuto: HTMLInputElement;
  private readonly _customCursor: HTMLElement;
  private readonly _changeZoo: (species: string) => void;
  private _requestAnimationID = 0;
  private _isPlaying = false;
  private _grid: Grid | null = null;
  private _iterationCounterValue = 0;
  private _selectedMode: Mode = "random";
  private _zooSelector?: ZooSelector;
  private _fps = 12;
  private _fpsInterval = 0;
  private _now = 0;
  private _lastDrawTime = 0;
  private _elapsed = 0;
  private _selectedSpecies: string | null = null;
  private _critterList?: string[];
  private _drawingToolBox?: DrawingToolBox;
  private _zoomBox?: ZoomBox;
  private _userCustomSelector?: UserCustomSelector;

  constructor() {
    this._canvas = queryRequired<HTMLCanvasElement>("#canvasID");
    this._canvas.width = GRID.SIZE.X;
    this._canvas.height = GRID.SIZE.Y;
    this._stage = getRequiredContext2D(this._canvas);

    this._drawingCanvas = queryRequired<HTMLCanvasElement>("#canvas-drawing");
    this._drawingCanvas.width = GRID.SIZE.X;
    this._drawingCanvas.height = GRID.SIZE.Y;
    this._drawingContext = getRequiredContext2D(this._drawingCanvas);

    this._iterationCounter = queryRequired<HTMLElement>(".iteration-counter");
    this._pauseBtn = queryRequired<HTMLButtonElement>("button.pause");
    this._speedSelector = queryRequired<HTMLInputElement>("#speed-input");
    this._commentsDOMSelector = queryRequired<HTMLElement>(".critter-comments");
    this._zooPrimitivesDOMSelector = queryRequired<HTMLElement>(".zoo-selector");
    this._randomPresetContainer = queryRequired<HTMLElement>(".random-preset-selector");
    this._randomPresetSelect = queryRequired<HTMLSelectElement>("#random-preset");
    this._randomGenerateBtn = queryRequired<HTMLButtonElement>(".random-generate");
    this._randomDensitySlider = queryRequired<HTMLInputElement>("#random-density");
    this._randomDensityValue = queryRequired<HTMLSpanElement>("#random-density-value");
    this._randomSeedSlider = queryRequired<HTMLInputElement>("#random-seed");
    this._randomSeedValue = queryRequired<HTMLSpanElement>("#random-seed-value");
    this._randomSeedAuto = queryRequired<HTMLInputElement>("#random-seed-auto");
    this._customCursor = queryRequired<HTMLElement>(".custom-cursor");

    this._changeZoo = (species: string) => {
      this._selectedSpecies = species;
      void this._setup();
    };

    this._renderRandomPresetOptions();
    this._pauseBtn.addEventListener("click", this._togglePause);
    this._setFPS();
    this._pauseBtn.textContent = "start";
    this._resetIterationCounter();
    // Sync display values on init
    this._randomDensityValue.textContent = `${this._randomDensitySlider.value}%`;
    this._randomSeedValue.textContent = String(this._randomSeedSlider.value);

    new ModeSelector(this._changeMode);
    this._randomPresetSelect.addEventListener("change", this._onRandomPresetChange);
    this._randomGenerateBtn.addEventListener("click", this._onRandomPresetGenerate);
    this._randomDensitySlider.addEventListener("input", this._onRandomParamChange);
    this._randomSeedSlider.addEventListener("input", this._onRandomParamChange);
    this._randomSeedAuto.addEventListener("change", this._onRandomParamChange);
    document.querySelectorAll('input[name="random-noise-type"]').forEach((radio) => {
      radio.addEventListener("change", this._onRandomParamChange);
    });
  }

  private _changeMode = (mode: Mode): void => {
    this._selectedSpecies = null;
    this._selectedMode = mode;
    void this._setup();
  };

  private _renderRandomPresetOptions(): void {
    this._randomPresetSelect.replaceChildren(
      ...RANDOM_PRESETS.map(({ id, label }) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = label;
        option.selected = id === DEFAULT_RANDOM_PRESET;
        return option;
      }),
    );
  }

  private _currentRandomPreset(): RandomPresetId {
    const value = this._randomPresetSelect.value;
    return isRandomPresetId(value) ? value : DEFAULT_RANDOM_PRESET;
  }

  private _currentRandomParams(): RandomSeedParams {
    const t = Number(this._randomDensitySlider.value) / 100;
    const density = t * t; // quadratic curve: spreads the low end, 30% slider → 9% fill
    const noiseTypeRadio = document.querySelector<HTMLInputElement>('input[name="random-noise-type"]:checked');
    const noiseType = (noiseTypeRadio?.value ?? "uniform") as NoiseType;
    const seed = this._randomSeedAuto.checked ? null : Number(this._randomSeedSlider.value);
    return { density, noiseType, seed };
  }

  private _onRandomParamChange = (): void => {
    this._randomDensityValue.textContent = `${this._randomDensitySlider.value}%`;
    this._randomSeedValue.textContent = String(this._randomSeedSlider.value);
    if (this._selectedMode !== "random" || !this._grid) return;
    this._resetIterationCounter();
    this._grid.reseedRandomPreset(this._currentRandomPreset(), false, this._currentRandomParams());
  };

  private _resetIterationCounter(): void {
    this._iterationCounterValue = 0;
    this._iterationCounter.textContent = "0";
  }

  private _resetPlaybackControls(): void {
    this._resetIterationCounter();
    this._fps = 12;
    this._speedSelector.value = String(this._fps);
  }

  private _onRandomPresetChange = (): void => {
    if (this._selectedMode !== "random" || !this._grid) {
      return;
    }

    this._resetIterationCounter();
    this._grid.reseedRandomPreset(this._currentRandomPreset(), false, this._currentRandomParams());
  };

  private _onRandomPresetGenerate = (): void => {
    if (this._selectedMode !== "random" || !this._grid) {
      return;
    }

    this._resetIterationCounter();
    this._grid.reseedRandomPreset(this._currentRandomPreset(), true, this._currentRandomParams());
  };

  private _setFPS(): void {
    this._speedSelector.value = String(this._fps);
    this._speedSelector.addEventListener("keypress", this._handleEnterKey);
    this._speedSelector.addEventListener("change", (e: Event) => {
      const nextValue = Number.parseInt(
        (e.currentTarget as HTMLInputElement).value,
        10,
      );
      if (!Number.isNaN(nextValue)) {
        this._fps = nextValue;
      }
    });
  }

  private _handleEnterKey = (e: KeyboardEvent): void => {
    if (e.key !== "Enter") {
      return;
    }

    e.preventDefault();
    const input = e.currentTarget as HTMLInputElement;
    const requestedFps = Number(input.value);

    if (requestedFps > 60) {
      this._fps = 60;
      this._speedSelector.value = String(this._fps);
    } else if (requestedFps < 1) {
      this._fps = 1;
      this._speedSelector.value = String(this._fps);
    } else if (!Number.isNaN(requestedFps)) {
      this._fps = requestedFps;
    }

    input.blur();
  };

  private _renderGeneration(): void {
    this._grid?.processNextGeneration();
  }

  private _togglePause = (): void => {
    if (this._isPlaying) {
      this._stop();
      this._pauseBtn.textContent = "start";
    } else {
      this._pauseBtn.textContent = "pause";
      this._start();
    }
    this._isPlaying = !this._isPlaying;
  };

  private _step = (_timestamp: number): void => {
    this._fpsInterval = 1000 / this._fps;
    this._now = Date.now();
    this._elapsed = this._now - this._lastDrawTime;

    if (this._elapsed > this._fpsInterval) {
      this._lastDrawTime = this._now - (this._elapsed % this._fpsInterval);
      this._iterationCounterValue++;
      this._iterationCounter.textContent = String(this._iterationCounterValue);
      this._renderGeneration();
    }

    this._requestAnimationID = window.requestAnimationFrame(this._step);
  };

  private _start = (): void => {
    // https://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
    this._lastDrawTime = Date.now();
    this._requestAnimationID = window.requestAnimationFrame(this._step);
  };

  private _stop = (): void => {
    cancelAnimationFrame(this._requestAnimationID);
  };

  private _setDisplay(element: HTMLElement, visible: boolean): void {
    element.style.display = visible ? "block" : "none";
  }

  private async _loadCritterList(): Promise<string[] | undefined> {
    if (this._critterList) {
      return this._critterList;
    }

    try {
      this._critterList = (await axios.get<string[]>(
        `${getRequestURL(URLS.critterList)}`,
      )).data;
      return this._critterList;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }

  private async _setup(): Promise<void> {
    if (this._isPlaying) {
      this._togglePause();
    }

    this._grid?.destroyListener();

    switch (this._selectedMode) {
      case "random":
        this._drawingToolBox?.hide();
        this._setDisplay(this._zooPrimitivesDOMSelector, false);
        this._setDisplay(this._randomPresetContainer, true);
        this._commentsDOMSelector.replaceChildren();
        this._setDisplay(this._drawingCanvas, false);
        this._zoomBox?.hide();
        this._userCustomSelector?.hide();
        this._grid = new Grid({
          canvas: this._canvas,
          ctx: this._stage,
          mode: "random",
          randomPreset: this._currentRandomPreset(),
          randomParams: this._currentRandomParams(),
        });
        break;

      case "zoo": {
        const critterList = await this._loadCritterList();
        this._drawingToolBox?.hide();
        this._setDisplay(this._randomPresetContainer, false);
        this._zooSelector ??= new ZooSelector();
        this._zooSelector.createSelectButton(
          this._zooPrimitivesDOMSelector,
          this._changeZoo,
          critterList,
        );
        this._setDisplay(this._zooPrimitivesDOMSelector, true);
        this._setDisplay(this._drawingCanvas, false);
        this._zoomBox?.hide();
        this._userCustomSelector?.hide();
        this._grid = new Grid({
          canvas: this._canvas,
          ctx: this._stage,
          mode: "zoo",
          species: this._selectedSpecies ?? undefined,
          onLoad: (comments) => { this._renderComments(comments); },
        });
        break;
      }

      case "drawing":
        this._setDisplay(this._randomPresetContainer, false);
        this._setDisplay(this._zooPrimitivesDOMSelector, false);
        this._commentsDOMSelector.replaceChildren();
        this._setDisplay(this._drawingCanvas, true);
        this._drawingToolBox ??= new DrawingToolBox();
        this._zoomBox ??= new ZoomBox();
        this._userCustomSelector ??= new UserCustomSelector(this._changeZoo);
        this._drawingToolBox.show();
        this._zoomBox.show();
        this._userCustomSelector.show();
        this._grid = new Grid({
          canvas: this._canvas,
          ctx: this._stage,
          cursor: this._customCursor,
          drawingCanvas: this._drawingCanvas,
          drawingContext: this._drawingContext,
          drawingToolbox: this._drawingToolBox,
          mode: "drawing",
          species: this._selectedSpecies ?? undefined,
          userCustomSelector: this._userCustomSelector,
          zoombox: this._zoomBox,
          onLoad: (comments) => { this._renderComments(comments); },
        });
        this._grid.initListener();
        break;
    }

    this._resetPlaybackControls();
  }

  private _renderComments(comments: string[]): void {
    const nodes: Node[] = [];
    comments.forEach((line, i) => {
      if (i > 0) nodes.push(document.createElement("br"));
      if (line.startsWith("http://") || line.startsWith("https://")) {
        const a = document.createElement("a");
        a.href = line;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.title = line;
        a.textContent = `- ${line}`;
        nodes.push(a);
      } else {
        nodes.push(document.createTextNode(`- ${line}`));
      }
    });
    this._commentsDOMSelector.replaceChildren(...nodes);
  }

  public async init(): Promise<void> {
    const url = new URLSearchParams(window.location.search);
    if (url.get("drawing") === "1") {
      this._selectedMode = "drawing";
    }

    await this._setup();

    if (url.get("autostart") === "1") {
      this._togglePause();
    }
  }
}

void (new Main()).init();
