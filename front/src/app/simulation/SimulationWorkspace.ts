import { MODE_TO_WORKSPACE_ROUTE, WORKSPACE_ROUTE_TO_MODE } from "@app/routes";
import { CANVAS_PX_HEIGHT, CANVAS_PX_WIDTH, GRID_COLS, GRID_ROWS } from "@grid/constants";
import Grid from "@grid/Grid";
import { DEFAULT_RANDOM_PRESET, isRandomPresetId } from "@grid/randomPresets";
import ZoomBox from "@grid/zoom/ZoomBox";
import { getRequiredContext2D, queryRequired } from "@helpers/dom";
import CritterService from "@services/CritterService";
import UserCustomService from "@services/UserCustomService";
import { APP_TEXTS } from "@texts";
import { syncSliderFill } from "@ui/components/slider/createSlider";
import DrawingToolBox from "@ui/controls/drawing/DrawingToolBox";
import ImageImporter from "@ui/controls/drawing/ImageImporter";
import { CONTROL_TEXTS } from "@ui/controls/drawing/texts";
import UserCustomSelector from "@ui/controls/drawing/UserCustomSelector";
import ModeSelector, { type Mode } from "@ui/controls/simulation/ModeSelector";
import RandomControlsPanel from "@ui/controls/simulation/RandomControlsPanel";
import ZooSelector from "@ui/controls/simulation/ZooSelector";
import AliveCountChart from "@ui/controls/telemetry/AliveCountChart";
import AliveVariationChart from "@ui/controls/telemetry/AliveVariationChart";
import SavePresetModal from "@ui/lib/SavePresetModal";

import type { WorkspaceRoute } from "@app/routes";
import type { RandomPresetId } from "@grid/randomPresets";
import type { SimulationStateStats } from "@grid/Simulation";
import type { RandomSeedParams } from "@grid/seeding/RandomPresetSeeder";

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
  private readonly _critterService = new CritterService();
  private readonly _userCustomService = new UserCustomService();
  private readonly _savePresetModal = new SavePresetModal();
  private readonly _pauseBtn: HTMLButtonElement;
  private readonly _pauseBtnLabel: HTMLElement;
  private readonly _speedSlider: HTMLInputElement;
  private readonly _speedValue: HTMLElement;
  private readonly _commentsDOMSelector: HTMLElement;
  private readonly _zooPrimitivesDOMSelector: HTMLElement;
  private readonly _drawingInspectorDOMSelector: HTMLElement;
  private readonly _drawingActionsSidebar: HTMLElement;
  private readonly _randomControls: RandomControlsPanel;
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
  private _imageImporter?: ImageImporter;

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
    this._aliveCountChart = new AliveCountChart(queryRequired<HTMLCanvasElement>(".alive-count-chart", this._root));
    this._pauseBtn = queryRequired<HTMLButtonElement>("button.pause", this._root);
    this._pauseBtnLabel = queryRequired<HTMLElement>(".ui-button__label", this._pauseBtn);
    this._speedSlider = queryRequired<HTMLInputElement>("#speed-slider", this._root);
    this._speedValue = queryRequired<HTMLElement>(".speed-value", this._root);
    this._commentsDOMSelector = queryRequired<HTMLElement>(".critter-comments", this._root);
    this._zooPrimitivesDOMSelector = queryRequired<HTMLElement>(".zoo-selector", this._root);
    this._drawingInspectorDOMSelector = queryRequired<HTMLElement>(".drawing-pane", this._root);
    this._drawingActionsSidebar = queryRequired<HTMLElement>(".drawing-actions-pane", this._root);
    this._randomControls = new RandomControlsPanel({
      root: this._root,
      onPresetChange: this._onRandomPresetChange,
      onRandomizePane: this._onRandomPaneRandomize,
      onGenerate: this._onRandomPresetGenerate,
      onSave: this._onRandomPresetSave,
      onParamsChange: this._onRandomParamChange,
      onRotationChange: this._onRotationChange,
      onZoomChange: this._onZoomChange,
      onReset: this._onReset,
    });
    this._customCursor = queryRequired<HTMLElement>(".custom-cursor", this._root);

    this._changeZoo = (species: string) => {
      this._selectedSpecies = species;
      void this._setup();
    };

    this._applyStaticTexts();
    this._pauseBtn.addEventListener("click", this._togglePause);
    this._setFPS();
    this._setPlaybackButtonState(false);
    this._resetIterationCounter();

    new ModeSelector(this._changeMode, this._root);
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
    this._randomControls.destroy();
    this._zooSelector?.destroy();
    this._userCustomSelector?.destroy();
    this._drawingToolBox?.destroy();
    this._savePresetModal.destroy();
    this._imageImporter?.destroy();
    document.removeEventListener("pointerdown", this._handleDocumentPointerDown);
    document.removeEventListener("keydown", this._handleDocumentKeyDown);
  }

  private _changeMode = (mode: Mode): void => {
    this._selectedSpecies = null;
    this._onRouteModeChange(MODE_TO_WORKSPACE_ROUTE[mode]);
  };

  private _applyStaticTexts(): void {
    queryRequired<HTMLElement>('.tile-selector__text[data-mode="random"]', this._root).textContent =
      APP_TEXTS.modes.random;
    queryRequired<HTMLElement>('.tile-selector__text[data-mode="zoo"]', this._root).textContent = APP_TEXTS.modes.zoo;
    queryRequired<HTMLElement>('.tile-selector__text[data-mode="drawing"]', this._root).textContent =
      APP_TEXTS.modes.drawing;
    queryRequired<HTMLElement>(".iteration-label", this._root).textContent = `${APP_TEXTS.playback.iteration} `;
    queryRequired<HTMLElement>(".alive-cells-label", this._root).textContent = `${APP_TEXTS.playback.aliveCells} `;
    queryRequired<HTMLElement>(".dead-cells-label", this._root).textContent = `${APP_TEXTS.playback.deadCells} `;
    queryRequired<HTMLElement>("#speed-label", this._root).textContent = APP_TEXTS.playback.fps;
    queryRequired<HTMLElement>(".alive-variation-legend", this._root).textContent = APP_TEXTS.playback.aliveVariation;
    queryRequired<HTMLElement>(".alive-count-legend", this._root).textContent = APP_TEXTS.playback.aliveCount;
    queryRequired<HTMLButtonElement>(".drawing-save-action .save", this._root).textContent =
      CONTROL_TEXTS.drawing.saveButton;
    queryRequired<HTMLLabelElement>('label[for="custom-file-trigger"]', this._root).textContent =
      CONTROL_TEXTS.drawing.customDrawingLabel;
    queryRequired<HTMLLabelElement>('label[for="zoo-species-trigger"]', this._root).textContent = APP_TEXTS.zoo.species;

    queryRequired<HTMLElement>('.drawing-toolbox .item[data-tool="pencil"]', this._root).setAttribute(
      "aria-label",
      CONTROL_TEXTS.drawing.tools.pencilAlt,
    );
    queryRequired<HTMLElement>('.drawing-toolbox .item[data-tool="eraser"]', this._root).setAttribute(
      "aria-label",
      CONTROL_TEXTS.drawing.tools.eraserAlt,
    );
  }

  private _currentRandomPreset(): RandomPresetId {
    const value = this._randomControls.currentPreset();
    return isRandomPresetId(value) ? value : DEFAULT_RANDOM_PRESET;
  }

  private _handleDocumentPointerDown = (event: PointerEvent): void => {
    this._randomControls.handleDocumentPointerDown(event);
    this._zooSelector?.handleDocumentPointerDown(event);
    this._userCustomSelector?.handleDocumentPointerDown(event);
    this._drawingToolBox?.handleDocumentPointerDown(event);
  };

  private _handleDocumentKeyDown = (event: KeyboardEvent): void => {
    this._randomControls.handleDocumentKeyDown(event);
    this._zooSelector?.handleDocumentKeyDown(event);
    this._userCustomSelector?.handleDocumentKeyDown(event);
    this._drawingToolBox?.handleDocumentKeyDown(event);
  };

  private _currentRandomParams(): RandomSeedParams {
    const density = this._randomControls.currentDensity();
    const noiseType = this._randomControls.currentNoiseType();
    const seed = this._randomControls.isAutoSeedEnabled()
      ? this._ensureAutoSeed()
      : this._randomControls.currentSeedValue();
    const noiseLevels = this._randomControls.currentNoiseLevels();
    return { density, noiseType, seed, noiseLevels };
  }

  private _ensureAutoSeed(): number {
    if (this._randomAutoSeed === null) {
      this._randomAutoSeed = this._nextRandomSeed();
      this._randomControls.setSeedValue(this._randomAutoSeed);
    }
    return this._randomAutoSeed;
  }

  private _refreshAutoSeed(): number | null {
    if (!this._randomControls.isAutoSeedEnabled()) {
      this._randomAutoSeed = null;
      return null;
    }

    this._randomAutoSeed = this._nextRandomSeed();
    this._randomControls.setSeedValue(this._randomAutoSeed);
    return this._randomAutoSeed;
  }

  private _nextRandomSeed(): number {
    const { min, max } = this._randomControls.seedBounds();
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private _onRotationChange = (deg: number): void => {
    if (this._selectedMode !== "random" || !this._grid) return;
    this._grid.setRotation(deg);
  };

  private _onZoomChange = (level: number): void => {
    if (this._selectedMode !== "random" || !this._grid) return;
    this._grid.setZoom(level);
  };

  private _onReset = (): void => {
    if (this._selectedMode !== "random" || !this._grid) return;
    this._randomPresetVariation = false;
    this._randomAutoSeed = null;
    this._resetIterationCounter();
    this._aliveVariationChart.reset();
    this._aliveCountChart.reset();
    this._grid.resetTransforms();
    this._grid.reseedRandomPreset(this._currentRandomPreset(), false, this._currentRandomParams());
  };

  private _onRandomParamChange = (): void => {
    if (this._selectedMode !== "random" || !this._grid) return;
    if (!this._randomControls.isAutoSeedEnabled()) {
      this._randomAutoSeed = null;
    }
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
    this._refreshAutoSeed();
    this._resetIterationCounter();
    this._aliveVariationChart.reset();
    this._aliveCountChart.reset();
    this._grid.reseedRandomPreset(this._currentRandomPreset(), false, this._currentRandomParams());
  };

  private _onRandomPresetGenerate = (): void => {
    if (this._selectedMode !== "random" || !this._grid) {
      return;
    }

    this._randomPresetVariation = true;
    this._refreshAutoSeed();
    this._resetIterationCounter();
    this._aliveVariationChart.reset();
    this._aliveCountChart.reset();
    this._grid.reseedRandomPreset(this._currentRandomPreset(), true, this._currentRandomParams());
  };

  private _onRandomPaneRandomize = (): void => {
    if (this._selectedMode !== "random" || !this._grid) {
      return;
    }

    this._randomControls.randomizeControls();
    this._randomPresetVariation = true;

    if (this._randomControls.isAutoSeedEnabled()) {
      this._refreshAutoSeed();
    } else {
      this._randomAutoSeed = null;
    }

    this._resetIterationCounter();
    this._aliveVariationChart.reset();
    this._aliveCountChart.reset();
    this._grid.syncTransforms(this._randomControls.currentRotation(), this._randomControls.currentZoom());
    this._grid.reseedRandomPreset(this._currentRandomPreset(), true, this._currentRandomParams());
  };

  private _onRandomPresetSave = async (): Promise<void> => {
    if (this._selectedMode !== "random" || !this._grid) {
      return;
    }

    const filename = await this._savePresetModal.open({
      title: CONTROL_TEXTS.userCustomSelector.prompt.title,
      inputPlaceholder: CONTROL_TEXTS.userCustomSelector.prompt.inputPlaceholder,
      saveLabel: CONTROL_TEXTS.userCustomSelector.prompt.confirmButtonText,
      cancelLabel: CONTROL_TEXTS.userCustomSelector.prompt.cancelButtonText,
      nameRequired: CONTROL_TEXTS.userCustomSelector.prompt.filenameRequired,
      closeLabel: CONTROL_TEXTS.userCustomSelector.prompt.closeButtonLabel,
    });

    if (!filename) {
      return;
    }

    await this._userCustomService.postCustomDrawing(this._grid.toGrid(), filename);
    await this._userCustomSelector?.getCustomList();
  };

  private _setFPS(): void {
    this._speedSlider.value = String(this._fps);
    this._speedValue.textContent = String(this._fps);
    syncSliderFill(this._speedSlider);
    this._speedSlider.addEventListener("input", (e: Event) => {
      const nextValue = Number((e.currentTarget as HTMLInputElement).value);
      if (!Number.isNaN(nextValue)) {
        this._fps = Math.max(0, Math.min(60, nextValue));
        this._speedValue.textContent = String(this._fps);
        syncSliderFill(this._speedSlider);
      }
    });
  }

  private _renderGeneration(): void {
    this._grid?.processNextGeneration();
  }

  private _setPlaybackButtonState(isPlaying: boolean): void {
    this._pauseBtn.dataset.icon = isPlaying ? "pause" : "play";
    this._pauseBtnLabel.textContent = isPlaying ? APP_TEXTS.playback.pause : APP_TEXTS.playback.start;
  }

  private _togglePause = (): void => {
    if (this._isPlaying) {
      this._stop();
      this._setPlaybackButtonState(false);
    } else {
      this._setPlaybackButtonState(true);
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
      this._critterList = await this._critterService.getCritterList();
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
        this._drawingInspectorDOMSelector.style.display = "none";
        this._setDisplay(this._drawingActionsSidebar, false);
        this._randomControls.show();
        this._commentsDOMSelector.replaceChildren();
        this._setDisplay(this._drawingCanvas, false);
        this._zoomBox?.hide();
        this._userCustomSelector?.hide();
        this._imageImporter?.hide();
        this._randomPresetVariation = false;
        this._refreshAutoSeed();
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
        this._randomControls.hide();
        this._zooSelector ??= new ZooSelector();
        this._drawingInspectorDOMSelector.style.display = "none";
        this._setDisplay(this._drawingActionsSidebar, false);
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
        this._imageImporter?.hide();
        this._grid = new Grid({
          canvas: this._canvas,
          ctx: this._stage,
          mode: "zoo",
          species: this._selectedSpecies ?? undefined,
          onStateChange: this._handleStateChange,
          onLoad: (comments) => {
            this._renderComments(comments);
          },
        });
        break;
      }

      case "drawing": {
        this._randomControls.hide();
        this._setDisplay(this._zooPrimitivesDOMSelector, false);
        this._drawingInspectorDOMSelector.style.display = "flex";
        this._setDisplay(this._drawingActionsSidebar, true);
        this._commentsDOMSelector.replaceChildren();
        this._setDisplay(this._drawingCanvas, true);
        this._drawingToolBox ??= new DrawingToolBox();
        this._zoomBox ??= new ZoomBox();
        this._userCustomSelector ??= new UserCustomSelector(this._changeZoo, this._savePresetModal);
        this._drawingToolBox.show();
        this._zoomBox.show();
        this._userCustomSelector.show();
        await this._userCustomSelector.getCustomList();
        this._selectedSpecies = this._userCustomSelector.currentValue() || null;
        this._imageImporter ??= new ImageImporter((grid) => {
          this._grid?.seedFromGrid(grid);
        });
        this._imageImporter.show();
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
          onLoad: (comments) => {
            this._renderComments(comments);
          },
        });
        this._grid.initListener();
        break;
      }
    }

    this._resetPlaybackControls();
  }

  private _renderComments(comments: string[]): void {
    const nodes = comments
      .map((line) => this._createCommentNode(line.trim()))
      .filter((node): node is HTMLElement => node !== null);

    this._commentsDOMSelector.replaceChildren(...nodes);
  }

  private _createCommentNode(line: string): HTMLElement | null {
    if (!line) {
      return null;
    }

    if (line.startsWith("http://") || line.startsWith("https://")) {
      const { row, content } = this._createCommentRow("link");
      const anchor = document.createElement("a");
      anchor.href = line;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.title = line;
      anchor.textContent = line;
      content.append(anchor);
      return row;
    }

    const meta = this._parseCommentMeta(line);
    if (meta) {
      const { row, content } = this._createCommentRow("meta");
      const label = document.createElement("span");
      label.className = "critter-comment__label";
      label.textContent = `${meta.label}:`;

      const value = document.createElement("span");
      value.className = "critter-comment__value";
      value.textContent = meta.value;

      content.append(label, value);
      return row;
    }

    const { row, content } = this._createCommentRow("body");
    const value = document.createElement("span");
    value.className = "critter-comment__value";
    value.textContent = line;
    content.append(value);
    return row;
  }

  private _createCommentRow(kind: "meta" | "body" | "link"): {
    row: HTMLDivElement;
    content: HTMLDivElement;
  } {
    const row = document.createElement("div");
    row.className = `critter-comment critter-comment--${kind}`;

    const bullet = document.createElement("span");
    bullet.className = "critter-comment__bullet";
    bullet.setAttribute("aria-hidden", "true");
    bullet.textContent = APP_TEXTS.comments.itemPrefix.trim() || "-";

    const content = document.createElement("div");
    content.className = "critter-comment__content";

    row.append(bullet, content);
    return { row, content };
  }

  private _parseCommentMeta(line: string): { label: string; value: string } | null {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (!match) {
      return null;
    }

    const label = match[1]?.trim();
    const value = match[2]?.trim();
    if (!label || !value) {
      return null;
    }

    return { label, value };
  }
}
