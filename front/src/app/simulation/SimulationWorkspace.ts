import axios from "axios";
import Grid from "@grid/Grid";
import {
  CANVAS_PX_HEIGHT,
  CANVAS_PX_WIDTH,
  GRID,
  GRID_COLS,
  GRID_ROWS,
} from "@grid/constants";
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
import {
  MODE_TO_WORKSPACE_ROUTE,
  WORKSPACE_ROUTE_TO_MODE,
  type WorkspaceRoute,
} from "@app/routes";
import { APP_TEXTS } from "@texts";

type SimulationWorkspaceOptions = {
  root: HTMLElement;
  route: WorkspaceRoute;
  onRouteModeChange: (route: WorkspaceRoute) => void;
};

export class SimulationWorkspace {
  private readonly _root: HTMLElement;
  private readonly _route: WorkspaceRoute;
  private readonly _onRouteModeChange: (route: WorkspaceRoute) => void;
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
  private readonly _randomPresetTrigger: HTMLButtonElement;
  private readonly _randomPresetValue: HTMLElement;
  private readonly _randomPresetMenu: HTMLElement;
  private readonly _randomPresetOptions: HTMLElement;
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
  private _selectedMode: Mode;
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

  constructor(options: SimulationWorkspaceOptions) {
    this._root = options.root;
    this._route = options.route;
    this._onRouteModeChange = options.onRouteModeChange;
    this._selectedMode = WORKSPACE_ROUTE_TO_MODE[this._route];

    document.title = APP_TEXTS.document.title;
    this._canvas = queryRequired<HTMLCanvasElement>("#canvasID", this._root);
    this._canvas.textContent = APP_TEXTS.canvas.unsupported;
    this._canvas.width = CANVAS_PX_WIDTH;
    this._canvas.height = CANVAS_PX_HEIGHT;
    this._stage = getRequiredContext2D(this._canvas);

    this._drawingCanvas = queryRequired<HTMLCanvasElement>("#canvas-drawing", this._root);
    this._drawingCanvas.textContent = APP_TEXTS.canvas.unsupported;
    this._drawingCanvas.width = CANVAS_PX_WIDTH;
    this._drawingCanvas.height = CANVAS_PX_HEIGHT;
    this._drawingContext = getRequiredContext2D(this._drawingCanvas);

    this._iterationCounter = queryRequired<HTMLElement>(".iteration-counter", this._root);
    this._aliveCellsCounter = queryRequired<HTMLElement>(".alive-cells-counter", this._root);
    this._deadCellsCounter = queryRequired<HTMLElement>(".dead-cells-counter", this._root);
    this._aliveVariationChart = new AliveVariationChart(
      queryRequired<HTMLCanvasElement>(".alive-variation-chart", this._root),
    );
    this._aliveCountChart = new AliveCountChart(
      queryRequired<HTMLCanvasElement>(".alive-count-chart", this._root),
    );
    this._pauseBtn = queryRequired<HTMLButtonElement>("button.pause", this._root);
    this._speedSlider = queryRequired<HTMLInputElement>("#speed-slider", this._root);
    this._speedValue = queryRequired<HTMLElement>(".speed-value", this._root);
    this._commentsDOMSelector = queryRequired<HTMLElement>(".critter-comments", this._root);
    this._zooPrimitivesDOMSelector = queryRequired<HTMLElement>(".zoo-selector", this._root);
    this._randomPresetContainer = queryRequired<HTMLElement>(".random-preset-selector", this._root);
    this._randomPresetSelect = queryRequired<HTMLSelectElement>("#random-preset", this._root);
    this._randomPresetTrigger = queryRequired<HTMLButtonElement>("#random-preset-trigger", this._root);
    this._randomPresetValue = queryRequired<HTMLElement>(".custom-select__value", this._randomPresetContainer);
    this._randomPresetMenu = queryRequired<HTMLElement>(".custom-select__menu", this._randomPresetContainer);
    this._randomPresetOptions = queryRequired<HTMLElement>(".custom-select__options", this._randomPresetContainer);
    this._randomGenerateBtn = queryRequired<HTMLButtonElement>(".random-generate", this._root);
    this._randomDensitySlider = queryRequired<HTMLInputElement>("#random-density", this._root);
    this._randomDensityValue = queryRequired<HTMLSpanElement>("#random-density-value", this._root);
    this._randomSeedSlider = queryRequired<HTMLInputElement>("#random-seed", this._root);
    this._randomSeedValue = queryRequired<HTMLSpanElement>("#random-seed-value", this._root);
    this._randomSeedAuto = queryRequired<HTMLInputElement>("#random-seed-auto", this._root);
    this._customCursor = queryRequired<HTMLElement>(".custom-cursor", this._root);

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
    this._randomDensityValue.textContent = `${this._randomDensitySlider.value}%`;
    this._randomSeedValue.textContent = String(this._randomSeedSlider.value);

    new ModeSelector(this._changeMode, this._root);
    this._randomPresetTrigger.addEventListener("click", this._toggleRandomPresetMenu);
    this._randomPresetSelect.addEventListener("change", this._onRandomPresetChange);
    this._randomGenerateBtn.addEventListener("click", this._onRandomPresetGenerate);
    this._randomDensitySlider.addEventListener("input", this._onRandomParamChange);
    this._randomSeedSlider.addEventListener("input", this._onRandomParamChange);
    this._randomSeedAuto.addEventListener("change", this._onRandomParamChange);
    this._root
      .querySelectorAll('input[name="random-noise-type"]')
      .forEach((radio) => {
        radio.addEventListener("change", this._onRandomParamChange);
      });
    document.addEventListener("pointerdown", this._handleDocumentPointerDown);
    document.addEventListener("keydown", this._handleDocumentKeyDown);
  }

  public async init(query: URLSearchParams): Promise<void> {
    await this._setup();

    if (query.get("autostart") === "1") {
      this._togglePause();
    }
  }

  public destroy(): void {
    this._stop();
    this._isPlaying = false;
    this._grid?.destroyListener();
    document.removeEventListener("pointerdown", this._handleDocumentPointerDown);
    document.removeEventListener("keydown", this._handleDocumentKeyDown);
  }

  private _changeMode = (mode: Mode): void => {
    this._selectedSpecies = null;
    this._onRouteModeChange(MODE_TO_WORKSPACE_ROUTE[mode]);
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
    this._randomPresetOptions.replaceChildren(
      ...RANDOM_PRESETS.map(({ id, label }) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "custom-select__option";
        option.dataset.value = id;
        option.setAttribute("role", "option");
        option.textContent = label;
        option.addEventListener("click", () => {
          this._selectRandomPreset(id);
        });
        return option;
      }),
    );
    this._syncRandomPresetUI();
  }

  private _applyStaticTexts(): void {
    queryRequired<HTMLElement>('[data-ui="mode-label"]', this._root).textContent = APP_TEXTS.modes.label;
    queryRequired<HTMLElement>('.mode-selector__text[data-mode="random"]', this._root).textContent =
      APP_TEXTS.modes.random;
    queryRequired<HTMLElement>('.mode-selector__text[data-mode="zoo"]', this._root).textContent =
      APP_TEXTS.modes.zoo;
    queryRequired<HTMLElement>('.mode-selector__text[data-mode="drawing"]', this._root).textContent =
      APP_TEXTS.modes.drawing;
    queryRequired<HTMLElement>(".iteration-label", this._root).textContent = `${APP_TEXTS.playback.iteration} `;
    queryRequired<HTMLElement>(".alive-cells-label", this._root).textContent = `${APP_TEXTS.playback.aliveCells} `;
    queryRequired<HTMLElement>(".dead-cells-label", this._root).textContent = `${APP_TEXTS.playback.deadCells} `;
    queryRequired<HTMLLabelElement>('label[for="speed-slider"]', this._root).textContent = `${APP_TEXTS.playback.fps} `;
    queryRequired<HTMLElement>(".alive-variation-legend", this._root).textContent = APP_TEXTS.playback.aliveVariation;
    queryRequired<HTMLElement>(".alive-count-legend", this._root).textContent = APP_TEXTS.playback.aliveCount;
    queryRequired<HTMLLabelElement>('label[for="random-preset-trigger"]', this._root).textContent =
      APP_TEXTS.random.preset;
    queryRequired<HTMLElement>("#random-density-label", this._root).textContent = `${APP_TEXTS.random.density} `;
    queryRequired<HTMLElement>("#random-noise-type-label", this._root).textContent = APP_TEXTS.random.noiseType;
    queryRequired<HTMLElement>("#random-noise-uniform-label", this._root).textContent =
      APP_TEXTS.random.noiseTypes.uniform;
    queryRequired<HTMLElement>("#random-noise-perlin-like-label", this._root).textContent =
      APP_TEXTS.random.noiseTypes.perlinLike;
    queryRequired<HTMLElement>("#random-noise-clusters-label", this._root).textContent =
      APP_TEXTS.random.noiseTypes.clusters;
    queryRequired<HTMLElement>("#random-seed-label", this._root).textContent = `${APP_TEXTS.random.seed} `;
    queryRequired<HTMLElement>("#random-seed-auto-label", this._root).textContent = APP_TEXTS.random.autoSeed;
    this._randomGenerateBtn.textContent = APP_TEXTS.random.generate;
    queryRequired<HTMLButtonElement>(".custom-drawing-files .save", this._root).textContent =
      CONTROL_TEXTS.drawing.saveButton;
    queryRequired<HTMLLabelElement>('label[for="custom-file"]', this._root).textContent =
      CONTROL_TEXTS.drawing.customDrawingLabel;
    queryRequired<HTMLLabelElement>('label[for="primitives"]', this._root).textContent =
      `${APP_TEXTS.zoo.species} `;

    queryAll<HTMLImageElement>('img[data-tool="pencil"]', this._root).forEach((img) => {
      img.alt = CONTROL_TEXTS.drawing.tools.pencilAlt;
    });
    queryAll<HTMLImageElement>('img[data-tool="eraser"]', this._root).forEach((img) => {
      img.alt = CONTROL_TEXTS.drawing.tools.eraserAlt;
    });
  }

  private _currentRandomPreset(): RandomPresetId {
    const value = this._randomPresetSelect.value;
    return isRandomPresetId(value) ? value : DEFAULT_RANDOM_PRESET;
  }

  private _toggleRandomPresetMenu = (): void => {
    this._setRandomPresetMenuOpen(this._randomPresetMenu.hidden);
  };

  private _setRandomPresetMenuOpen(open: boolean): void {
    this._randomPresetMenu.hidden = !open;
    this._randomPresetTrigger.setAttribute("aria-expanded", open ? "true" : "false");
    this._randomPresetContainer.classList.toggle("custom-select--open", open);
  }

  private _selectRandomPreset(value: string): void {
    this._randomPresetSelect.value = value;
    this._syncRandomPresetUI();
    this._setRandomPresetMenuOpen(false);
    this._randomPresetSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  private _syncRandomPresetUI(): void {
    const currentValue = this._randomPresetSelect.value;
    const currentOption = RANDOM_PRESETS.find(({ id }) => id === currentValue)
      ?? RANDOM_PRESETS.find(({ id }) => id === DEFAULT_RANDOM_PRESET)
      ?? RANDOM_PRESETS[0];

    this._randomPresetValue.textContent = currentOption?.label ?? "";

    Array.from(this._randomPresetOptions.children).forEach((child) => {
      const option = child as HTMLElement;
      const selected = option.dataset.value === currentValue;
      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-selected", selected ? "true" : "false");
    });
  }

  private _handleDocumentPointerDown = (event: PointerEvent): void => {
    if (this._randomPresetMenu.hidden) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (!this._randomPresetContainer.contains(target)) {
      this._setRandomPresetMenuOpen(false);
    }
  };

  private _handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && !this._randomPresetMenu.hidden) {
      this._setRandomPresetMenuOpen(false);
      this._randomPresetTrigger.focus();
    }
  };

  private _currentRandomParams(): RandomSeedParams {
    const t = Number(this._randomDensitySlider.value) / 100;
    const density = t * t;
    const noiseTypeRadio = this._root.querySelector<HTMLInputElement>('input[name="random-noise-type"]:checked');
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
    this._syncRandomPresetUI();
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
}
