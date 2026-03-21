import axios from "axios";
import Grid from "@grid/Grid";
import { GRID, GRID_COLS, GRID_ROWS } from "@grid/constants";
import {
  DEFAULT_RANDOM_PRESET,
  RANDOM_PRESETS,
  isRandomPresetId,
  type RandomPresetId,
} from "@grid/randomPresets";
import ZoomBox from "@grid/zoom/ZoomBox";
import AliveVariationChart from "@controls/AliveVariationChart";
import AliveCountChart from "@controls/AliveCountChart";
import DrawingToolBox from "@controls/DrawingToolBox";
import ModeSelector, { type Mode } from "@controls/ModeSelector";
import UserCustomSelector from "@controls/UserCustomSelector";
import ZooSelector from "@controls/ZooSelector";
import type { SimulationStateStats } from "@grid/Simulation";
import { CONTROL_TEXTS } from "@controls/texts";
import { getRequiredContext2D, queryAll, queryRequired } from "@helpers/dom";
import { getRequestURL } from "@helpers/api";
import { URLS } from "@helpers/constants";
import {
  type NoiseType,
  type RandomSeedParams,
} from "@grid/seeding/RandomPresetSeeder";
import { APP_TEXTS } from "./texts";

class Main {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _stage: CanvasRenderingContext2D;
  private readonly _drawingCanvas: HTMLCanvasElement;
  private readonly _drawingContext: CanvasRenderingContext2D;
  private readonly _iterationCounter: HTMLElement;
  private readonly _aliveCellsCounter: HTMLElement;
  private readonly _deadCellsCounter: HTMLElement;
  private readonly _aliveVariationChart: AliveVariationChart;
  private readonly _aliveCountChart: AliveCountChart;
  private readonly _pauseBtn: HTMLButtonElement;
  private readonly _speedSlider: HTMLInputElement;
  private readonly _speedValue: HTMLElement;
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
  private _randomPresetVariation = false;
  private _randomAutoSeed: number | null = null;
  private _critterList?: string[];
  private _drawingToolBox?: DrawingToolBox;
  private _zoomBox?: ZoomBox;
  private _userCustomSelector?: UserCustomSelector;

  constructor() {
    document.title = APP_TEXTS.document.title;
    this._canvas = queryRequired<HTMLCanvasElement>("#canvasID");
    this._canvas.textContent = APP_TEXTS.canvas.unsupported;
    this._canvas.width = GRID.SIZE.X;
    this._canvas.height = GRID.SIZE.Y;
    this._stage = getRequiredContext2D(this._canvas);

    this._drawingCanvas = queryRequired<HTMLCanvasElement>("#canvas-drawing");
    this._drawingCanvas.textContent = APP_TEXTS.canvas.unsupported;
    this._drawingCanvas.width = GRID.SIZE.X;
    this._drawingCanvas.height = GRID.SIZE.Y;
    this._drawingContext = getRequiredContext2D(this._drawingCanvas);

    this._iterationCounter = queryRequired<HTMLElement>(".iteration-counter");
    this._aliveCellsCounter = queryRequired<HTMLElement>(".alive-cells-counter");
    this._deadCellsCounter = queryRequired<HTMLElement>(".dead-cells-counter");
    this._aliveVariationChart = new AliveVariationChart(
      queryRequired<HTMLCanvasElement>(".alive-variation-chart"),
    );
    this._aliveCountChart = new AliveCountChart(
      queryRequired<HTMLCanvasElement>(".alive-count-chart"),
    );
    this._pauseBtn = queryRequired<HTMLButtonElement>("button.pause");
    this._speedSlider = queryRequired<HTMLInputElement>("#speed-slider");
    this._speedValue = queryRequired<HTMLElement>(".speed-value");
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

    this._applyStaticTexts();
    this._renderRandomPresetOptions();
    this._pauseBtn.addEventListener("click", this._togglePause);
    this._setFPS();
    this._pauseBtn.textContent = APP_TEXTS.playback.start;
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

  private _applyStaticTexts(): void {
    queryRequired<HTMLLabelElement>('label[for="random"]').textContent = APP_TEXTS.modes.random;
    queryRequired<HTMLLabelElement>('label[for="zoo"]').textContent = APP_TEXTS.modes.zoo;
    queryRequired<HTMLLabelElement>('label[for="drawing"]').textContent = APP_TEXTS.modes.drawing;
    queryRequired<HTMLElement>(".iteration-label").textContent = `${APP_TEXTS.playback.iteration} `;
    queryRequired<HTMLElement>(".alive-cells-label").textContent = `${APP_TEXTS.playback.aliveCells} `;
    queryRequired<HTMLElement>(".dead-cells-label").textContent = `${APP_TEXTS.playback.deadCells} `;
    queryRequired<HTMLLabelElement>('label[for="speed-slider"]').textContent = `${APP_TEXTS.playback.fps} `;
    queryRequired<HTMLElement>(".alive-variation-legend").textContent = APP_TEXTS.playback.aliveVariation;
    queryRequired<HTMLElement>(".alive-count-legend").textContent = APP_TEXTS.playback.aliveCount;
    queryRequired<HTMLLabelElement>('label[for="random-preset"]').textContent = APP_TEXTS.random.preset;
    queryRequired<HTMLElement>("#random-density-label").textContent = `${APP_TEXTS.random.density} `;
    queryRequired<HTMLElement>("#random-noise-type-label").textContent = APP_TEXTS.random.noiseType;
    queryRequired<HTMLElement>("#random-noise-uniform-label").textContent =
      APP_TEXTS.random.noiseTypes.uniform;
    queryRequired<HTMLElement>("#random-noise-perlin-like-label").textContent =
      APP_TEXTS.random.noiseTypes.perlinLike;
    queryRequired<HTMLElement>("#random-noise-clusters-label").textContent =
      APP_TEXTS.random.noiseTypes.clusters;
    queryRequired<HTMLElement>("#random-seed-label").textContent = `${APP_TEXTS.random.seed} `;
    queryRequired<HTMLElement>("#random-seed-auto-label").textContent = APP_TEXTS.random.autoSeed;
    this._randomGenerateBtn.textContent = APP_TEXTS.random.generate;
    queryRequired<HTMLButtonElement>(".custom-drawing-files .save").textContent =
      CONTROL_TEXTS.drawing.saveButton;
    queryRequired<HTMLLabelElement>('label[for="custom-file"]').textContent =
      CONTROL_TEXTS.drawing.customDrawingLabel;
    queryRequired<HTMLLabelElement>('label[for="primitives"]').textContent =
      `${APP_TEXTS.zoo.species} `;

    queryAll<HTMLImageElement>('img[data-tool="pencil"]').forEach((img) => {
      img.alt = CONTROL_TEXTS.drawing.tools.pencilAlt;
    });
    queryAll<HTMLImageElement>('img[data-tool="eraser"]').forEach((img) => {
      img.alt = CONTROL_TEXTS.drawing.tools.eraserAlt;
    });
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
    const seed = this._randomSeedAuto.checked
      ? (this._randomPresetVariation ? (this._randomAutoSeed ??= this._nextRandomSeed()) : null)
      : Number(this._randomSeedSlider.value);
    return { density, noiseType, seed };
  }

  private _nextRandomSeed(): number {
    return Math.floor(Math.random() * 0x100000000) >>> 0;
  }

  private _onRandomParamChange = (event?: Event): void => {
    this._randomDensityValue.textContent = `${this._randomDensitySlider.value}%`;
    this._randomSeedValue.textContent = String(this._randomSeedSlider.value);
    if (event?.currentTarget === this._randomSeedSlider && this._randomSeedAuto.checked) {
      return;
    }
    if (this._selectedMode !== "random" || !this._grid) return;
    this._resetIterationCounter();
    this._aliveVariationChart.reset();
    this._aliveCountChart.reset();
    this._grid.reseedRandomPreset(
      this._currentRandomPreset(),
      this._randomPresetVariation,
      this._currentRandomParams(),
    );
  };

  private _resetIterationCounter(): void {
    this._iterationCounterValue = 0;
    this._iterationCounter.textContent = "0";
  }

  private _updateCellStats = (stats: Pick<SimulationStateStats, "alive" | "dead">): void => {
    this._aliveCellsCounter.textContent = String(stats.alive);
    this._deadCellsCounter.textContent = String(stats.dead);
  };

  private _handleStateChange = (stats: SimulationStateStats): void => {
    this._updateCellStats(stats);
    this._aliveVariationChart.push(stats.alive);
    this._aliveCountChart.push(stats.alive);
  };

  private _resetPlaybackControls(): void {
    this._resetIterationCounter();
    this._fps = 12;
    this._speedSlider.value = String(this._fps);
    this._speedValue.textContent = String(this._fps);
  }

  private _onRandomPresetChange = (): void => {
    if (this._selectedMode !== "random" || !this._grid) {
      return;
    }

    this._randomPresetVariation = false;
    this._randomAutoSeed = null;
    this._resetIterationCounter();
    this._aliveVariationChart.reset();
    this._aliveCountChart.reset();
    this._grid.reseedRandomPreset(
      this._currentRandomPreset(),
      false,
      this._currentRandomParams(),
    );
  };

  private _onRandomPresetGenerate = (): void => {
    if (this._selectedMode !== "random" || !this._grid) {
      return;
    }

    this._randomPresetVariation = true;
    this._randomAutoSeed = this._randomSeedAuto.checked ? this._nextRandomSeed() : null;
    this._resetIterationCounter();
    this._aliveVariationChart.reset();
    this._aliveCountChart.reset();
    this._grid.reseedRandomPreset(
      this._currentRandomPreset(),
      true,
      this._currentRandomParams(),
    );
  };

  private _setFPS(): void {
    this._speedSlider.value = String(this._fps);
    this._speedValue.textContent = String(this._fps);
    this._speedSlider.addEventListener("input", (e: Event) => {
      const nextValue = Number((e.currentTarget as HTMLInputElement).value);
      if (!Number.isNaN(nextValue)) {
        this._fps = Math.max(0, Math.min(60, nextValue));
        this._speedValue.textContent = String(this._fps);
      }
    });
  }

  private _renderGeneration(): void {
    this._grid?.processNextGeneration();
  }

  private _togglePause = (): void => {
    if (this._isPlaying) {
      this._stop();
      this._pauseBtn.textContent = APP_TEXTS.playback.start;
    } else {
      this._pauseBtn.textContent = APP_TEXTS.playback.pause;
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
    this._updateCellStats({
      alive: 0,
      dead: GRID_COLS * GRID_ROWS,
    });
    this._aliveVariationChart.reset();
    this._aliveCountChart.reset();

    switch (this._selectedMode) {
      case "random":
        this._drawingToolBox?.hide();
        this._setDisplay(this._zooPrimitivesDOMSelector, false);
        this._setDisplay(this._randomPresetContainer, true);
        this._commentsDOMSelector.replaceChildren();
        this._setDisplay(this._drawingCanvas, false);
        this._zoomBox?.hide();
        this._userCustomSelector?.hide();
        this._randomPresetVariation = false;
        this._randomAutoSeed = null;
        this._grid = new Grid({
          canvas: this._canvas,
          ctx: this._stage,
          mode: "random",
          randomPreset: this._currentRandomPreset(),
          randomParams: this._currentRandomParams(),
          onStateChange: this._handleStateChange,
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
          this._selectedSpecies ?? undefined,
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
          onStateChange: this._handleStateChange,
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
          onStateChange: this._handleStateChange,
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
        a.textContent = `${APP_TEXTS.comments.itemPrefix}${line}`;
        nodes.push(a);
      } else {
        nodes.push(document.createTextNode(`${APP_TEXTS.comments.itemPrefix}${line}`));
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
