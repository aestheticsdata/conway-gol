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
import HxfImportSavingOverlay from "@ui/lib/HxfImportSavingOverlay";
import SavePresetModal from "@ui/lib/SavePresetModal";
import Tooltip from "@ui/lib/Tooltip";
import Swal from "sweetalert2";

import type { WorkspaceRoute } from "@app/routes";
import type { DrawingCursorPosition, GridStateChangeStats } from "@grid/Grid";
import type { RandomPresetId } from "@grid/randomPresets";
import type { RandomSeedParams } from "@grid/seeding/RandomPresetSeeder";

type SimulationWorkspaceOptions = {
  root: HTMLElement;
  route: WorkspaceRoute;
  onRouteModeChange: (route: WorkspaceRoute) => void;
};

type SeenStateEntry = {
  iteration: number;
  state: Uint32Array;
};

type HxfPatternPayload = {
  comments: string[];
  automata: number[][];
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
  private readonly _stabilizationCounter: HTMLElement;
  private readonly _cycleDetectedCounter: HTMLElement;
  private readonly _aliveCellsCounter: HTMLElement;
  private readonly _deadCellsCounter: HTMLElement;
  private readonly _aliveVariationLegendValue: HTMLElement;
  private readonly _aliveCountLegendValue: HTMLElement;
  private readonly _aliveVariationChart: AliveVariationChart;
  private readonly _aliveCountChart: AliveCountChart;
  private readonly _critterService = new CritterService();
  private readonly _userCustomService = new UserCustomService();
  private readonly _savePresetModal = new SavePresetModal();
  private readonly _hxfImportSavingOverlay = new HxfImportSavingOverlay();
  private readonly _pauseBtn: HTMLButtonElement;
  private readonly _pauseBtnLabel: HTMLElement;
  private readonly _drawingClearButton: HTMLButtonElement;
  private readonly _drawingRestoreButton: HTMLButtonElement;
  private readonly _drawingHxfExportButton: HTMLButtonElement;
  private readonly _drawingHxfImportButton: HTMLButtonElement;
  private readonly _drawingHxfImportInput: HTMLInputElement;
  private readonly _drawingRestoreTooltipTarget: HTMLElement;
  private readonly _drawingRestoreTooltip: Tooltip;
  private readonly _drawingCursorXValue: HTMLElement;
  private readonly _drawingCursorYValue: HTMLElement;
  private readonly _speedSlider: HTMLInputElement;
  private readonly _speedValue: HTMLElement;
  private readonly _commentsDOMSelector: HTMLElement;
  private readonly _zooPrimitivesDOMSelector: HTMLElement;
  private readonly _zooPatternListsAction: HTMLElement;
  private readonly _drawingInspectorDOMSelector: HTMLElement;
  private readonly _drawingActionsSidebar: HTMLElement;
  private readonly _randomControls: RandomControlsPanel;
  private readonly _customCursor: HTMLElement;
  private readonly _changeZoo: (species: string) => void;
  private _requestAnimationID = 0;
  private _isPlaying = false;
  private _grid: Grid | null = null;
  private _iterationCounterValue = 0;
  private _stabilizationIterationValue: number | null = null;
  private _cycleDetectedIterationValue: number | null = null;
  private _legendLastAliveCount: number | null = null;
  private readonly _seenStates = new Map<string, SeenStateEntry[]>();
  private _previousPackedState: Uint32Array | null = null;
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
  private _drawingInitialGridSnapshot: number[][] | null = null;
  private _drawingInitialStateSnapshot: Uint8Array | null = null;
  private _currentPatternComments: string[] = [];
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
    this._stabilizationCounter = queryRequired<HTMLElement>(".stabilization-counter", this._root);
    this._cycleDetectedCounter = queryRequired<HTMLElement>(".cycle-detected-counter", this._root);
    this._aliveCellsCounter = queryRequired<HTMLElement>(".alive-cells-counter", this._root);
    this._deadCellsCounter = queryRequired<HTMLElement>(".dead-cells-counter", this._root);
    this._aliveVariationLegendValue = queryRequired<HTMLElement>(".alive-variation-legend-value", this._root);
    this._aliveCountLegendValue = queryRequired<HTMLElement>(".alive-count-legend-value", this._root);
    this._aliveVariationChart = new AliveVariationChart(
      queryRequired<HTMLCanvasElement>(".alive-variation-chart", this._root),
    );
    this._aliveCountChart = new AliveCountChart(queryRequired<HTMLCanvasElement>(".alive-count-chart", this._root));
    this._pauseBtn = queryRequired<HTMLButtonElement>("button.pause", this._root);
    this._pauseBtnLabel = queryRequired<HTMLElement>(".ui-button__label", this._pauseBtn);
    this._drawingClearButton = queryRequired<HTMLButtonElement>(".drawing-clear", this._root);
    this._drawingRestoreButton = queryRequired<HTMLButtonElement>(".drawing-restore", this._root);
    this._drawingHxfExportButton = queryRequired<HTMLButtonElement>(".drawing-hxf-export", this._root);
    this._drawingHxfImportButton = queryRequired<HTMLButtonElement>(".drawing-hxf-import", this._root);
    this._drawingHxfImportInput = queryRequired<HTMLInputElement>("#drawing-hxf-import-input", this._root);
    this._drawingRestoreTooltipTarget = queryRequired<HTMLElement>(".drawing-restore-tooltip-target", this._root);
    this._drawingRestoreTooltip = new Tooltip();
    this._drawingCursorXValue = queryRequired<HTMLElement>(".drawing-cursor-x-value", this._root);
    this._drawingCursorYValue = queryRequired<HTMLElement>(".drawing-cursor-y-value", this._root);
    this._speedSlider = queryRequired<HTMLInputElement>("#speed-slider", this._root);
    this._speedValue = queryRequired<HTMLElement>(".speed-value", this._root);
    this._commentsDOMSelector = queryRequired<HTMLElement>(".critter-comments", this._root);
    this._zooPrimitivesDOMSelector = queryRequired<HTMLElement>(".zoo-selector", this._root);
    this._zooPatternListsAction = queryRequired<HTMLElement>(".zoo-pattern-lists-action", this._root);
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
    this._drawingClearButton.addEventListener("click", this._onClearCanvas);
    this._drawingRestoreButton.addEventListener("click", this._onRestoreDrawing);
    this._drawingHxfExportButton.addEventListener("click", this._onDrawingHxfExportClick);
    this._drawingHxfImportButton.addEventListener("click", this._onDrawingHxfImportButtonClick);
    this._drawingHxfImportInput.addEventListener("change", this._onDrawingHxfImportFileChange);
    this._drawingRestoreTooltipTarget.addEventListener("pointerenter", this._handleRestoreTooltipPointerEnter);
    this._drawingRestoreTooltipTarget.addEventListener("pointermove", this._handleRestoreTooltipPointerMove);
    this._drawingRestoreTooltipTarget.addEventListener("pointerleave", this._hideRestoreTooltip);
    this._drawingRestoreTooltipTarget.addEventListener("pointercancel", this._hideRestoreTooltip);
    this._setFPS();
    this._setPlaybackButtonState(false);
    this._updateDrawingRestoreButton();
    this._resetSimulationPlaybackState();

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
    this._hxfImportSavingOverlay.destroy();
    this._imageImporter?.destroy();
    this._drawingRestoreTooltip.destroy();
    this._pauseBtn.removeEventListener("click", this._togglePause);
    this._drawingClearButton.removeEventListener("click", this._onClearCanvas);
    this._drawingRestoreButton.removeEventListener("click", this._onRestoreDrawing);
    this._drawingHxfExportButton.removeEventListener("click", this._onDrawingHxfExportClick);
    this._drawingHxfImportButton.removeEventListener("click", this._onDrawingHxfImportButtonClick);
    this._drawingHxfImportInput.removeEventListener("change", this._onDrawingHxfImportFileChange);
    this._drawingRestoreTooltipTarget.removeEventListener("pointerenter", this._handleRestoreTooltipPointerEnter);
    this._drawingRestoreTooltipTarget.removeEventListener("pointermove", this._handleRestoreTooltipPointerMove);
    this._drawingRestoreTooltipTarget.removeEventListener("pointerleave", this._hideRestoreTooltip);
    this._drawingRestoreTooltipTarget.removeEventListener("pointercancel", this._hideRestoreTooltip);
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
    queryRequired<HTMLElement>(".stabilization-label", this._root).textContent = `${APP_TEXTS.playback.stabilization} `;
    queryRequired<HTMLElement>(".cycle-detected-label", this._root).textContent =
      `${APP_TEXTS.playback.cycleDetected} `;
    queryRequired<HTMLElement>(".alive-cells-label", this._root).textContent = `${APP_TEXTS.playback.aliveCells} `;
    queryRequired<HTMLElement>(".dead-cells-label", this._root).textContent = `${APP_TEXTS.playback.deadCells} `;
    queryRequired<HTMLElement>("#speed-label", this._root).textContent = APP_TEXTS.playback.fps;
    queryRequired<HTMLElement>(".alive-variation-legend-label", this._root).textContent =
      APP_TEXTS.playback.aliveVariation;
    queryRequired<HTMLElement>(".alive-count-legend-label", this._root).textContent = APP_TEXTS.playback.aliveCount;
    queryRequired<HTMLButtonElement>(".drawing-save-action .save", this._root).textContent =
      CONTROL_TEXTS.drawing.saveButton;
    queryRequired<HTMLLabelElement>('label[for="custom-file-trigger"]', this._root).textContent =
      CONTROL_TEXTS.drawing.savedPatternsLabel;
    queryRequired<HTMLLabelElement>('label[for="zoo-species-trigger"]', this._root).textContent = APP_TEXTS.zoo.species;

    queryRequired<HTMLElement>('.drawing-toolbox .item[data-tool="pencil"]', this._root).setAttribute(
      "aria-label",
      CONTROL_TEXTS.drawing.tools.pencilAlt,
    );
    queryRequired<HTMLElement>('.drawing-toolbox .item[data-tool="eraser"]', this._root).setAttribute(
      "aria-label",
      CONTROL_TEXTS.drawing.tools.eraserAlt,
    );
    queryRequired<HTMLElement>('.drawing-toolbox .item[data-tool="hand"]', this._root).setAttribute(
      "aria-label",
      CONTROL_TEXTS.drawing.tools.handAlt,
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

  private _handleDrawingPointerCellChange = (position: DrawingCursorPosition | null): void => {
    this._updateDrawingCursorCoordinates(position);
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
    this._stopPlayback();
    this._setPlaybackButtonState(false);
    if (this._selectedMode !== "random" || !this._grid) return;
    this._randomPresetVariation = false;
    this._randomAutoSeed = null;
    this._resetSimulationPlaybackState();
    this._grid.resetTransforms();
    this._grid.reseedRandomPreset(this._currentRandomPreset(), false, this._currentRandomParams());
  };

  private _onRandomParamChange = (): void => {
    if (this._selectedMode !== "random" || !this._grid) return;
    if (!this._randomControls.isAutoSeedEnabled()) {
      this._randomAutoSeed = null;
    }
    this._resetSimulationPlaybackState();
    this._grid.reseedRandomPreset(
      this._currentRandomPreset(),
      this._randomPresetVariation,
      this._currentRandomParams(),
    );
  };

  private _onClearCanvas = (): void => {
    if (this._selectedMode !== "drawing" || !this._grid) {
      return;
    }

    this._stopPlayback();
    this._setPlaybackButtonState(false);
    this._resetSimulationPlaybackState();
    this._grid.clearCanvas();
  };

  private _onRestoreDrawing = (): void => {
    if (this._selectedMode !== "drawing" || !this._grid || !this._drawingInitialGridSnapshot) {
      return;
    }

    this._stopPlayback();
    this._setPlaybackButtonState(false);
    this._resetSimulationPlaybackState();
    this._grid.seedFromGrid(this._drawingInitialGridSnapshot);
  };

  private _onDrawingHxfExportClick = async (): Promise<void> => {
    if (this._selectedMode !== "drawing" || !this._grid) {
      return;
    }

    const defaultBasename = this._getDrawingExportFilename().replace(/\.hxf$/iu, "");
    const rawName = await this._savePresetModal.open(
      {
        title: CONTROL_TEXTS.drawing.exportModalTitle,
        inputPlaceholder: CONTROL_TEXTS.drawing.exportModalPlaceholder,
        saveLabel: CONTROL_TEXTS.drawing.exportModalConfirm,
        cancelLabel: CONTROL_TEXTS.drawing.exportModalCancel,
        nameRequired: CONTROL_TEXTS.userCustomSelector.prompt.filenameRequired,
        closeLabel: CONTROL_TEXTS.drawing.exportModalClose,
      },
      { initialValue: defaultBasename },
    );

    if (!rawName) {
      return;
    }

    const downloadName = this._sanitizeHxfBasename(rawName);
    const payload: HxfPatternPayload = {
      comments: this._currentPatternComments.length > 0 ? [...this._currentPatternComments] : [""],
      automata: this._grid.toGrid(),
    };

    this._triggerHxfDownload(payload, `${downloadName}.hxf`);
  };

  private _onDrawingHxfImportButtonClick = (): void => {
    if (this._selectedMode !== "drawing") {
      return;
    }

    this._drawingHxfImportInput.click();
  };

  private _onDrawingHxfImportFileChange = async (event: Event): Promise<void> => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";

    if (!file || this._selectedMode !== "drawing" || !this._grid) {
      return;
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      void Swal.fire({
        icon: "error",
        title: CONTROL_TEXTS.drawing.hxfImportErrorTitle,
        text: CONTROL_TEXTS.drawing.hxfImportParseError,
      });
      return;
    }

    let automata: number[][];
    try {
      automata = this._parseHxfImportAutomata(text);
    } catch (err) {
      const isGridError = err instanceof Error && err.message === "grid";
      void Swal.fire({
        icon: "error",
        title: CONTROL_TEXTS.drawing.hxfImportErrorTitle,
        text: isGridError ? CONTROL_TEXTS.drawing.hxfImportGridError : CONTROL_TEXTS.drawing.hxfImportParseError,
      });
      return;
    }

    this._clearDrawingRestoreSnapshot();
    this._grid.seedFromGrid(automata);

    const patternName = this._patternNameFromImportFile(file);

    this._hxfImportSavingOverlay.showLoading();
    try {
      await this._userCustomService.postCustomDrawing(automata, patternName);
      this._userCustomSelector?.setCurrentValue(patternName);
      await this._userCustomSelector?.getCustomList();
      this._hxfImportSavingOverlay.showImportComplete();
    } catch (err) {
      console.error(err);
      this._hxfImportSavingOverlay.showImportFailed(
        err instanceof Error ? err.message : CONTROL_TEXTS.drawing.hxfImportParseError,
      );
    }
  };

  private _patternNameFromImportFile(file: File): string {
    const stripped = file.name.replace(/\.(hxf|json)$/iu, "").trim();
    return this._sanitizeHxfBasename(stripped);
  }

  private _parseHxfImportAutomata(text: string): number[][] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("parse");
    }

    if (!parsed || typeof parsed !== "object" || !("automata" in parsed)) {
      throw new Error("parse");
    }

    const automata = (parsed as { automata: unknown }).automata;
    if (!Array.isArray(automata) || automata.length !== GRID_ROWS) {
      throw new Error("grid");
    }

    for (let row = 0; row < GRID_ROWS; row++) {
      const line = automata[row];
      if (!Array.isArray(line) || line.length !== GRID_COLS) {
        throw new Error("grid");
      }

      for (let col = 0; col < GRID_COLS; col++) {
        const cell = line[col];
        if (cell !== 0 && cell !== 1) {
          throw new Error("grid");
        }
      }
    }

    return automata as number[][];
  }

  private _triggerHxfDownload(payload: HxfPatternPayload, filename: string): void {
    const blob = new Blob([JSON.stringify(payload)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private _sanitizeHxfBasename(raw: string): string {
    const baseName = raw.replace(/\.hxf$/iu, "").trim();
    const sanitizedName = baseName.replace(/[\\/:*?"<>|]/gu, "-").replace(/\s+/gu, " ").trim();
    return sanitizedName || "drawing";
  }

  private _resetIterationCounter(): void {
    this._iterationCounterValue = 0;
    this._iterationCounter.textContent = "0";
  }

  private _resetStabilizationCounter(): void {
    this._stabilizationIterationValue = null;
    this._stabilizationCounter.textContent = "-";
  }

  private _resetCycleDetectedCounter(): void {
    this._cycleDetectedIterationValue = null;
    this._cycleDetectedCounter.textContent = "-";
  }

  private _resetStabilizationTracking(): void {
    this._resetStabilizationCounter();
    this._resetCycleDetectedCounter();
    this._seenStates.clear();
    this._previousPackedState = null;
  }

  private _resetTelemetryLegendValues(): void {
    this._legendLastAliveCount = null;
    this._setTelemetryLegendValue(this._aliveVariationLegendValue, "0", "neutral");
    this._setTelemetryLegendValue(this._aliveCountLegendValue, "0", "neutral");
  }

  private _updateCellStats = (stats: Pick<GridStateChangeStats, "alive" | "dead">): void => {
    this._aliveCellsCounter.textContent = String(stats.alive);
    this._deadCellsCounter.textContent = String(stats.dead);
  };

  private _updateTelemetryLegendValues(stats: GridStateChangeStats): void {
    const previousAliveCount = this._legendLastAliveCount;
    const aliveVariation =
      stats.changedCells === null || previousAliveCount === null ? 0 : stats.alive - previousAliveCount;

    this._legendLastAliveCount = stats.alive;

    this._setTelemetryLegendValue(
      this._aliveVariationLegendValue,
      this._formatSignedValue(aliveVariation),
      this._toneForValue(aliveVariation),
    );
    this._setTelemetryLegendValue(
      this._aliveCountLegendValue,
      String(stats.alive),
      stats.alive > 0 ? "positive" : "neutral",
    );
  }

  private _setTelemetryLegendValue(
    element: HTMLElement,
    value: string,
    tone: "positive" | "negative" | "neutral",
  ): void {
    element.textContent = value;
    element.classList.remove(
      "telemetry-chart-legend-value--positive",
      "telemetry-chart-legend-value--negative",
      "telemetry-chart-legend-value--neutral",
    );
    element.classList.add(`telemetry-chart-legend-value--${tone}`);
  }

  private _formatSignedValue(value: number): string {
    if (value > 0) {
      return `+${value}`;
    }
    return String(value);
  }

  private _toneForValue(value: number): "positive" | "negative" | "neutral" {
    if (value > 0) {
      return "positive";
    }
    if (value < 0) {
      return "negative";
    }
    return "neutral";
  }

  private _updateStabilizationCounter(stats: GridStateChangeStats): void {
    const currentSnapshot = this._grid?.copyState();
    if (!currentSnapshot) {
      return;
    }

    const packedState = this._packState(currentSnapshot);

    if (stats.changedCells === null) {
      this._resetStabilizationTracking();
      this._rememberState(this._iterationCounterValue, packedState);
      this._previousPackedState = packedState;
      return;
    }

    if (
      this._stabilizationIterationValue === null &&
      this._previousPackedState !== null &&
      this._packedStatesEqual(this._previousPackedState, packedState)
    ) {
      this._stabilizationIterationValue = Math.max(0, this._iterationCounterValue - 1);
      this._stabilizationCounter.textContent = String(this._stabilizationIterationValue);
      this._previousPackedState = packedState;
      return;
    }

    if (this._cycleDetectedIterationValue === null) {
      const cycleDetectedAtIteration = this._findSeenStateIteration(packedState, this._iterationCounterValue - 1);
      if (cycleDetectedAtIteration !== null) {
        this._cycleDetectedIterationValue = cycleDetectedAtIteration;
        this._cycleDetectedCounter.textContent = String(cycleDetectedAtIteration);
        this._previousPackedState = packedState;
        return;
      }
    }

    this._rememberState(this._iterationCounterValue, packedState);
    this._previousPackedState = packedState;
  }

  private _findSeenStateIteration(state: Uint32Array, maxIteration: number): number | null {
    const bucket = this._seenStates.get(this._hashPackedState(state));
    if (!bucket) {
      return null;
    }

    for (const entry of bucket) {
      if (entry.iteration <= maxIteration && this._packedStatesEqual(entry.state, state)) {
        return entry.iteration;
      }
    }

    return null;
  }

  private _rememberState(iteration: number, state: Uint32Array): void {
    const hash = this._hashPackedState(state);
    const bucket = this._seenStates.get(hash);
    if (bucket) {
      bucket.push({ iteration, state });
      return;
    }

    this._seenStates.set(hash, [{ iteration, state }]);
  }

  private _packState(state: Uint8Array): Uint32Array {
    const packed = new Uint32Array(Math.ceil(state.length / 32));
    for (let index = 0; index < state.length; index++) {
      if (state[index] === 0) {
        continue;
      }

      packed[index >>> 5] |= 1 << (index & 31);
    }
    return packed;
  }

  private _hashPackedState(state: Uint32Array): string {
    let hash = 2166136261;
    for (let index = 0; index < state.length; index++) {
      hash ^= state[index] >>> 0;
      hash = Math.imul(hash, 16777619) >>> 0;
    }

    return hash.toString(16);
  }

  private _packedStatesEqual(left: Uint32Array, right: Uint32Array): boolean {
    if (left.length !== right.length) {
      return false;
    }

    for (let index = 0; index < left.length; index++) {
      if (left[index] !== right[index]) {
        return false;
      }
    }

    return true;
  }

  private _handleStateChange = (stats: GridStateChangeStats): void => {
    this._updateCellStats(stats);
    this._syncDrawingRestoreButton();
    if (this._cycleDetectedIterationValue === null) {
      this._updateTelemetryLegendValues(stats);
      this._aliveVariationChart.push(stats.alive);
      this._aliveCountChart.push(stats.alive);
    }
    this._updateStabilizationCounter(stats);
  };

  private _resetPlaybackControls(): void {
    this._resetSimulationPlaybackState();
    this._fps = 12;
    this._speedSlider.value = String(this._fps);
    this._speedValue.textContent = String(this._fps);
  }

  private _resetSimulationPlaybackState(): void {
    this._resetIterationCounter();
    this._resetStabilizationTracking();
    this._resetTelemetryLegendValues();
    this._aliveVariationChart.reset();
    this._aliveCountChart.reset();
  }

  private _onRandomPresetChange = (): void => {
    if (this._selectedMode !== "random" || !this._grid) {
      return;
    }

    this._randomPresetVariation = false;
    this._refreshAutoSeed();
    this._resetSimulationPlaybackState();
    this._grid.reseedRandomPreset(this._currentRandomPreset(), false, this._currentRandomParams());
  };

  private _onRandomPresetGenerate = (): void => {
    if (this._selectedMode !== "random" || !this._grid) {
      return;
    }

    this._randomPresetVariation = true;
    this._refreshAutoSeed();
    this._resetSimulationPlaybackState();
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

    this._resetSimulationPlaybackState();
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

  private _setDrawingPlaybackState(isPlaying: boolean): void {
    this._imageImporter?.setPlaybackActive(isPlaying);
    this._grid?.setDrawingPlaybackActive(isPlaying);
    this._randomControls.setPlaybackActive(isPlaying);
  }

  private _togglePause = (): void => {
    if (this._isPlaying) {
      this._stopPlayback();
      this._setPlaybackButtonState(false);
      return;
    } else {
      this._captureDrawingRestoreSnapshot();
      this._setPlaybackButtonState(true);
      this._start();
      this._isPlaying = true;
      this._setDrawingPlaybackState(true);
      return;
    }
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

  private _stopPlayback(): void {
    this._stop();
    this._isPlaying = false;
    this._setDrawingPlaybackState(false);
  }

  private _captureDrawingRestoreSnapshot(): void {
    if (this._selectedMode !== "drawing" || !this._grid) {
      return;
    }

    this._drawingInitialGridSnapshot = this._grid.toGrid();
    this._drawingInitialStateSnapshot = this._grid.copyState();
    this._updateDrawingRestoreButton(false);
  }

  private _clearDrawingRestoreSnapshot(): void {
    this._drawingInitialGridSnapshot = null;
    this._drawingInitialStateSnapshot = null;
    this._updateDrawingRestoreButton();
  }

  private _syncDrawingRestoreButton(): void {
    if (this._selectedMode !== "drawing" || !this._grid || !this._drawingInitialStateSnapshot) {
      this._updateDrawingRestoreButton();
      return;
    }

    this._updateDrawingRestoreButton(!this._statesEqual(this._grid.copyState(), this._drawingInitialStateSnapshot));
  }

  private _updateDrawingRestoreButton(hasChanges = false): void {
    const isDisabled = this._drawingInitialStateSnapshot === null || !hasChanges;
    this._drawingRestoreButton.disabled = isDisabled;
    this._drawingRestoreTooltipTarget.hidden = !isDisabled;

    if (!isDisabled) {
      this._drawingRestoreTooltip.hide();
    }
  }

  private _statesEqual(left: Uint8Array, right: Uint8Array): boolean {
    if (left.length !== right.length) {
      return false;
    }

    for (let index = 0; index < left.length; index++) {
      if (left[index] !== right[index]) {
        return false;
      }
    }

    return true;
  }

  private _handleRestoreTooltipPointerEnter = (event: PointerEvent): void => {
    this._showRestoreTooltip(event);
  };

  private _handleRestoreTooltipPointerMove = (event: PointerEvent): void => {
    this._showRestoreTooltip(event);
  };

  private _hideRestoreTooltip = (): void => {
    this._drawingRestoreTooltip.hide();
  };

  private _showRestoreTooltip(event: PointerEvent): void {
    if (event.pointerType === "touch" || !this._drawingRestoreButton.disabled) {
      this._drawingRestoreTooltip.hide();
      return;
    }

    this._drawingRestoreTooltip.show(CONTROL_TEXTS.drawing.restoreDisabledHint, {
      clientX: event.clientX,
      clientY: event.clientY,
    });
  }

  private _setDisplay(element: HTMLElement, visible: boolean): void {
    element.style.display = visible ? "block" : "none";
  }

  private _updateDrawingCursorCoordinates(position: DrawingCursorPosition | null): void {
    this._drawingCursorXValue.textContent = position ? String(position.x) : "--";
    this._drawingCursorYValue.textContent = position ? String(position.y) : "--";
  }

  private _getDrawingExportFilename(): string {
    const rawName = (this._userCustomSelector?.currentValue() || this._selectedSpecies || "drawing").trim();
    return `${this._sanitizeHxfBasename(rawName)}.hxf`;
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
    this._clearDrawingRestoreSnapshot();
    this._currentPatternComments = [];
    this._updateDrawingCursorCoordinates(null);
    this._updateCellStats({
      alive: 0,
      dead: GRID_COLS * GRID_ROWS,
    });
    this._resetSimulationPlaybackState();

    switch (this._selectedMode) {
      case "random":
        this._drawingToolBox?.hide();
        this._zooSelector?.hide();
        this._setDisplay(this._zooPrimitivesDOMSelector, false);
        this._setDisplay(this._zooPatternListsAction, false);
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
        const defaultSpecies = critterList?.includes("canadagoose") ? "canadagoose" : (critterList?.[0] ?? "canadagoose");
        const activeSpecies = this._selectedSpecies ?? defaultSpecies;
        this._selectedSpecies = activeSpecies;
        this._drawingToolBox?.hide();
        this._randomControls.hide();
        this._zooSelector ??= new ZooSelector();
        this._drawingInspectorDOMSelector.style.display = "none";
        this._setDisplay(this._drawingActionsSidebar, false);
        this._zooSelector.createSelectButton(
          this._zooPrimitivesDOMSelector,
          this._changeZoo,
          critterList,
          activeSpecies,
        );
        this._setDisplay(this._zooPrimitivesDOMSelector, true);
        this._setDisplay(this._zooPatternListsAction, true);
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
        this._zooSelector?.hide();
        this._setDisplay(this._zooPrimitivesDOMSelector, false);
        this._setDisplay(this._zooPatternListsAction, false);
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
        this._userCustomSelector.setCurrentValue(this._selectedSpecies ?? "");
        await this._userCustomSelector.getCustomList();
        this._imageImporter ??= new ImageImporter((grid) => {
          this._clearDrawingRestoreSnapshot();
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
          onPointerCellChange: this._handleDrawingPointerCellChange,
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
    this._currentPatternComments = [...comments];
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
      anchor.className = "critter-comment__link";
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
