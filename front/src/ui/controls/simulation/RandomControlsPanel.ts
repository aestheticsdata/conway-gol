import { DEFAULT_RANDOM_PRESET, isRandomPresetId, RANDOM_PRESETS } from "@grid/randomPresets";
import { DEFAULT_NOISE_LEVELS } from "@grid/seeding/randomPresetTypes";
import { queryRequired } from "@lib/dom/dom";
import { APP_TEXTS, CONTROL_TEXTS } from "@texts";
import { syncSliderFill } from "@ui/components/slider/createSlider";
import CustomSelect from "@ui/controls/shared/CustomSelect";
import NoiseTypeSelector from "@ui/controls/simulation/NoiseTypeSelector";
import Tooltip from "@ui/lib/Tooltip";

import type { RandomPresetId } from "@grid/randomPresets";
import type { NoiseType } from "@grid/seeding/randomPresetTypes";

type RandomControlsPanelOptions = {
  root: HTMLElement;
  onPresetChange: () => void;
  onRandomizePane: () => void;
  onGeometrize: () => void;
  onGenerate: () => void;
  onSave: () => void;
  onParamsChange: () => void;
  onRotationChange: (deg: number) => void;
  onZoomChange: (level: number) => void;
  onReset: () => void;
  onRestorePlayback: () => void;
};

/** Minimum density % when randomizing — 0 % on "noise" yields an empty grid. */
const MIN_RANDOM_DENSITY_PERCENT = 8;

const NOISE_TYPE_TILE_LABELS: readonly { value: NoiseType; label: string }[] = [
  { value: "uniform", label: APP_TEXTS.random.noiseTypeTiles.uniform },
  { value: "perlin-like", label: APP_TEXTS.random.noiseTypeTiles.perlinLike },
  { value: "clusters", label: APP_TEXTS.random.noiseTypeTiles.clusters },
  { value: "gradient", label: APP_TEXTS.random.noiseTypeTiles.gradient },
  { value: "edge-bias", label: APP_TEXTS.random.noiseTypeTiles.edgeBias },
  { value: "center-burst", label: APP_TEXTS.random.noiseTypeTiles.centerBurst },
  { value: "interference", label: APP_TEXTS.random.noiseTypeTiles.interference },
  { value: "marbling", label: APP_TEXTS.random.noiseTypeTiles.marbling },
] as const;

class RandomControlsPanel {
  public readonly element: HTMLElement;
  private readonly _onPresetChange: () => void;
  private readonly _onRandomizePane: () => void;
  private readonly _onGeometrize: () => void;
  private readonly _onGenerate: () => void;
  private readonly _onSave: () => void;
  private readonly _onParamsChange: () => void;
  private readonly _onRotationChange: (deg: number) => void;
  private readonly _onZoomChange: (level: number) => void;
  private readonly _onReset: () => void;
  private readonly _onRestorePlayback: () => void;
  private readonly _randomPresetSelect: CustomSelect;
  private readonly _randomizePaneBtn: HTMLButtonElement;
  private readonly _geometrizeTooltipHost: HTMLElement;
  private readonly _geometrizePaneBtn: HTMLButtonElement;
  private readonly _randomGenerateBtn: HTMLButtonElement;
  private readonly _randomSaveBtn: HTMLButtonElement;
  private readonly _randomSaveTooltipTarget: HTMLSpanElement;
  private readonly _randomResetBtn: HTMLButtonElement;
  private readonly _randomRestoreBtn: HTMLButtonElement;
  private readonly _randomDensitySlider: HTMLInputElement;
  private readonly _randomDensityValue: HTMLSpanElement;
  private readonly _randomRotationSlider: HTMLInputElement;
  private readonly _randomRotationValue: HTMLSpanElement;
  private readonly _randomZoomSlider: HTMLInputElement;
  private readonly _randomZoomValue: HTMLSpanElement;
  private readonly _randomSeedSlider: HTMLInputElement;
  private readonly _randomSeedSliderTooltipTarget: HTMLSpanElement;
  private readonly _randomSeedValue: HTMLSpanElement;
  private readonly _randomSeedAuto: HTMLInputElement;
  private readonly _seedDisabledTooltip: Tooltip;
  private readonly _saveDisabledTooltip: Tooltip;
  private readonly _geometrizeTooltip: Tooltip;
  private readonly _noiseTypeSelector: NoiseTypeSelector;
  private readonly _randomNoiseLevelSlider: HTMLInputElement;
  private readonly _randomNoiseLevelValue: HTMLSpanElement;
  private _noiseLevels: Record<NoiseType, number> = { ...DEFAULT_NOISE_LEVELS };
  private _saveEnabled = true;
  private _saveDisabledHint = "";

  constructor(options: RandomControlsPanelOptions) {
    this.element = queryRequired<HTMLElement>(".random-preset-selector", options.root);
    this._onPresetChange = options.onPresetChange;
    this._onRandomizePane = options.onRandomizePane;
    this._onGeometrize = options.onGeometrize;
    this._onGenerate = options.onGenerate;
    this._onSave = options.onSave;
    this._onParamsChange = options.onParamsChange;
    this._onRotationChange = options.onRotationChange;
    this._onZoomChange = options.onZoomChange;
    this._onReset = options.onReset;
    this._onRestorePlayback = options.onRestorePlayback;
    this._randomPresetSelect = new CustomSelect(
      queryRequired<HTMLElement>(".random-preset-custom-select", this.element),
      {
        onChange: this._handlePresetChange,
        visibleOptionCount: 8,
      },
    );
    this._randomizePaneBtn = queryRequired<HTMLButtonElement>(".random-pane-randomize", this.element);
    this._geometrizeTooltipHost = queryRequired<HTMLElement>(".random-geometrize-tooltip-host", this.element);
    this._geometrizePaneBtn = queryRequired<HTMLButtonElement>(".random-pane-geometrize", this.element);
    this._randomGenerateBtn = queryRequired<HTMLButtonElement>(".random-generate", this.element);
    this._randomSaveBtn = queryRequired<HTMLButtonElement>(".random-save", this.element);
    this._randomSaveTooltipTarget = queryRequired<HTMLSpanElement>(".random-save-tooltip-target", this.element);
    this._randomResetBtn = queryRequired<HTMLButtonElement>(".random-reset", this.element);
    this._randomRestoreBtn = queryRequired<HTMLButtonElement>(".random-restore", this.element);
    this._randomDensitySlider = queryRequired<HTMLInputElement>("#random-density", this.element);
    this._randomDensityValue = queryRequired<HTMLSpanElement>("#random-density-value", this.element);
    this._randomRotationSlider = queryRequired<HTMLInputElement>("#random-rotation", this.element);
    this._randomRotationValue = queryRequired<HTMLSpanElement>("#random-rotation-value", this.element);
    this._randomZoomSlider = queryRequired<HTMLInputElement>("#random-zoom", this.element);
    this._randomZoomValue = queryRequired<HTMLSpanElement>("#random-zoom-value", this.element);
    this._randomSeedSlider = queryRequired<HTMLInputElement>("#random-seed", this.element);
    this._randomSeedSliderTooltipTarget = queryRequired<HTMLSpanElement>(
      ".random-seed-slider__tooltip-target",
      this.element,
    );
    this._randomSeedValue = queryRequired<HTMLSpanElement>("#random-seed-value", this.element);
    this._randomSeedAuto = queryRequired<HTMLInputElement>("#random-seed-auto", this.element);
    this._seedDisabledTooltip = new Tooltip();
    this._saveDisabledTooltip = new Tooltip();
    this._geometrizeTooltip = new Tooltip();
    this._randomNoiseLevelSlider = queryRequired<HTMLInputElement>("#random-noise-level", this.element);
    this._randomNoiseLevelValue = queryRequired<HTMLSpanElement>("#random-noise-level-value", this.element);
    this._noiseTypeSelector = new NoiseTypeSelector((noiseType, previous) => {
      this._noiseLevels[previous] = this._noiseLevel01FromSlider();
      this._setNoiseLevelSliderFromStored(noiseType);
      this._updateValueLabels();
      this._onParamsChange();
    }, this.element);

    this._applyStaticTexts();
    this._renderPresetOptions();
    this._updateValueLabels();
    this._syncSeedState();

    this._randomizePaneBtn.addEventListener("click", this._onRandomizePane);
    this._geometrizePaneBtn.addEventListener("click", this._onGeometrizeClick);
    this._randomGenerateBtn.addEventListener("click", this._onGenerate);
    this._randomSaveBtn.addEventListener("click", this._onSave);
    this._randomResetBtn.addEventListener("click", this._handleReset);
    this._randomRestoreBtn.addEventListener("click", this._onRestorePlaybackClick);
    this._randomDensitySlider.addEventListener("input", this._handleDensityInput);
    this._randomRotationSlider.addEventListener("input", this._handleRotationInput);
    this._randomZoomSlider.addEventListener("input", this._handleZoomInput);
    this._randomSeedSlider.addEventListener("input", this._handleSeedInput);
    this._randomSeedAuto.addEventListener("change", this._handleAutoSeedChange);
    this._randomSeedSliderTooltipTarget.addEventListener("pointerenter", this._handleSeedTooltipPointerEnter);
    this._randomSeedSliderTooltipTarget.addEventListener("pointermove", this._handleSeedTooltipPointerMove);
    this._randomSeedSliderTooltipTarget.addEventListener("pointerleave", this._hideSeedTooltip);
    this._randomSeedSliderTooltipTarget.addEventListener("pointercancel", this._hideSeedTooltip);
    this._randomSaveTooltipTarget.addEventListener("pointerenter", this._handleSaveTooltipPointerEnter);
    this._randomSaveTooltipTarget.addEventListener("pointermove", this._handleSaveTooltipPointerMove);
    this._randomSaveTooltipTarget.addEventListener("pointerleave", this._hideSaveTooltip);
    this._randomSaveTooltipTarget.addEventListener("pointercancel", this._hideSaveTooltip);
    this._geometrizeTooltipHost.addEventListener("pointerenter", this._handleGeometrizeTooltipPointerEnter);
    this._geometrizeTooltipHost.addEventListener("pointermove", this._handleGeometrizeTooltipPointerMove);
    this._geometrizeTooltipHost.addEventListener("pointerleave", this._hideGeometrizeTooltip);
    this._geometrizeTooltipHost.addEventListener("pointercancel", this._hideGeometrizeTooltip);
    this._randomNoiseLevelSlider.addEventListener("input", this._handleNoiseLevelInput);
  }

  public show(): void {
    this.element.style.display = "block";
  }

  public hide(): void {
    this.element.style.display = "none";
    this._seedDisabledTooltip.hide();
    this._saveDisabledTooltip.hide();
    this._geometrizeTooltip.hide();
  }

  public setPlaybackActive(isPlaying: boolean): void {
    this._randomGenerateBtn.disabled = isPlaying;
    this._geometrizePaneBtn.disabled = isPlaying;
    this._randomSaveBtn.disabled = isPlaying || !this._saveEnabled;
  }

  public setSaveEnabled(enabled: boolean, title = ""): void {
    this._saveEnabled = enabled;
    this._randomSaveBtn.disabled = !enabled;
    this._saveDisabledHint = enabled ? "" : title;
    this._randomSaveTooltipTarget.hidden = enabled;
    if (enabled) {
      this._saveDisabledTooltip.hide();
    }
  }

  public destroy(): void {
    this._randomPresetSelect.destroy();
    this._randomizePaneBtn.removeEventListener("click", this._onRandomizePane);
    this._geometrizePaneBtn.removeEventListener("click", this._onGeometrizeClick);
    this._randomGenerateBtn.removeEventListener("click", this._onGenerate);
    this._randomSaveBtn.removeEventListener("click", this._onSave);
    this._randomResetBtn.removeEventListener("click", this._handleReset);
    this._randomRestoreBtn.removeEventListener("click", this._onRestorePlaybackClick);
    this._randomDensitySlider.removeEventListener("input", this._handleDensityInput);
    this._randomRotationSlider.removeEventListener("input", this._handleRotationInput);
    this._randomZoomSlider.removeEventListener("input", this._handleZoomInput);
    this._randomSeedSlider.removeEventListener("input", this._handleSeedInput);
    this._randomSeedAuto.removeEventListener("change", this._handleAutoSeedChange);
    this._randomSeedSliderTooltipTarget.removeEventListener("pointerenter", this._handleSeedTooltipPointerEnter);
    this._randomSeedSliderTooltipTarget.removeEventListener("pointermove", this._handleSeedTooltipPointerMove);
    this._randomSeedSliderTooltipTarget.removeEventListener("pointerleave", this._hideSeedTooltip);
    this._randomSeedSliderTooltipTarget.removeEventListener("pointercancel", this._hideSeedTooltip);
    this._randomSaveTooltipTarget.removeEventListener("pointerenter", this._handleSaveTooltipPointerEnter);
    this._randomSaveTooltipTarget.removeEventListener("pointermove", this._handleSaveTooltipPointerMove);
    this._randomSaveTooltipTarget.removeEventListener("pointerleave", this._hideSaveTooltip);
    this._randomSaveTooltipTarget.removeEventListener("pointercancel", this._hideSaveTooltip);
    this._geometrizeTooltipHost.removeEventListener("pointerenter", this._handleGeometrizeTooltipPointerEnter);
    this._geometrizeTooltipHost.removeEventListener("pointermove", this._handleGeometrizeTooltipPointerMove);
    this._geometrizeTooltipHost.removeEventListener("pointerleave", this._hideGeometrizeTooltip);
    this._geometrizeTooltipHost.removeEventListener("pointercancel", this._hideGeometrizeTooltip);
    this._randomNoiseLevelSlider.removeEventListener("input", this._handleNoiseLevelInput);
    this._seedDisabledTooltip.destroy();
    this._saveDisabledTooltip.destroy();
    this._geometrizeTooltip.destroy();
  }

  public currentPreset(): RandomPresetId {
    const value = this._randomPresetSelect.value();
    return isRandomPresetId(value) ? value : DEFAULT_RANDOM_PRESET;
  }

  public currentDensity(): number {
    const t = Number(this._randomDensitySlider.value) / 100;
    return t * t;
  }

  public currentRotation(): number {
    return Number(this._randomRotationSlider.value);
  }

  public currentZoom(): number {
    return Number(this._randomZoomSlider.value);
  }

  public currentNoiseType(): NoiseType {
    return this._noiseTypeSelector.value("uniform") ?? "uniform";
  }

  public currentNoiseLevels(): Record<NoiseType, number> {
    const t = this.currentNoiseType();
    return { ...this._noiseLevels, [t]: this._noiseLevel01FromSlider() };
  }

  public currentSeedValue(): number {
    return Number(this._randomSeedSlider.value);
  }

  public seedBounds(): { min: number; max: number } {
    return {
      min: Number(this._randomSeedSlider.min) || 0,
      max: Number(this._randomSeedSlider.max) || 0,
    };
  }

  public isAutoSeedEnabled(): boolean {
    return this._randomSeedAuto.checked;
  }

  public setSeedValue(value: number): void {
    const { min, max } = this.seedBounds();
    const boundedValue = Math.min(max, Math.max(min, Math.round(value)));
    this._randomSeedSlider.value = String(boundedValue);
    this._updateValueLabels();
  }

  public randomizeControls(): void {
    this._noiseLevels[this.currentNoiseType()] = this._noiseLevel01FromSlider();

    this._randomPresetSelect.setValue(this._pickRandom(RANDOM_PRESETS).id);
    this._randomDensitySlider.value = String(
      Math.max(MIN_RANDOM_DENSITY_PERCENT, this._randomIntFromInput(this._randomDensitySlider)),
    );
    this._randomRotationSlider.value = String(this._randomIntFromInput(this._randomRotationSlider));
    this._randomZoomSlider.value = String(this._randomIntFromInput(this._randomZoomSlider));

    const nextNoiseType = this._pickRandom(NOISE_TYPE_TILE_LABELS).value;
    const nextNoiseLevel = this._randomIntFromInput(this._randomNoiseLevelSlider);
    this._noiseTypeSelector.select(nextNoiseType);
    this._noiseLevels[nextNoiseType] = nextNoiseLevel / 100;
    this._randomNoiseLevelSlider.value = String(nextNoiseLevel);
    this._syncNoiseLevelLabel();

    const nextAutoSeedEnabled = Math.random() < 0.5;
    this._randomSeedAuto.checked = nextAutoSeedEnabled;
    if (!nextAutoSeedEnabled) {
      this.setSeedValue(this._randomIntInRange(this.seedBounds().min, this.seedBounds().max));
    }

    this._syncSeedState();
    this._updateValueLabels();
  }

  /** Last-resort visible configuration when random spatial masks still yield an empty grid. */
  public applyFallbackNoiseConfiguration(): void {
    this._randomPresetSelect.setValue("noise");
    this._randomDensitySlider.value = "35";
    this._randomRotationSlider.value = "0";
    this._randomZoomSlider.value = "0";
    this._noiseTypeSelector.select("uniform");
    this._noiseLevels = { ...DEFAULT_NOISE_LEVELS };
    this._setNoiseLevelSliderFromStored("uniform");
    this._syncSeedState();
    this._updateValueLabels();
    this._syncSliderFills();
  }

  /** After geometrize, the grid stores an untransformed pattern — keep sliders in sync. */
  public resetRotationZoomAfterGeometrize(): void {
    this._randomRotationSlider.value = "0";
    this._randomZoomSlider.value = "0";
    this._updateValueLabels();
  }

  /** Sync rotation/zoom sliders after restoring the grid (no callbacks to the grid — caller updates Grid first). */
  public syncRotationZoomSliders(rotationDeg: number, zoomLevel: number): void {
    this._randomRotationSlider.value = String(Math.round(rotationDeg));
    this._randomZoomSlider.value = String(Math.round(zoomLevel));
    this._updateValueLabels();
    this._syncSliderFills();
  }

  public handleDocumentPointerDown(event: PointerEvent): void {
    this._randomPresetSelect.handleDocumentPointerDown(event);
  }

  public handleDocumentKeyDown(event: KeyboardEvent): void {
    this._randomPresetSelect.handleDocumentKeyDown(event);
  }

  private _applyStaticTexts(): void {
    queryRequired<HTMLLabelElement>('label[for="random-preset-trigger"]', this.element).textContent =
      APP_TEXTS.random.preset;
    queryRequired<HTMLElement>("#random-density-label", this.element).textContent = APP_TEXTS.random.density;
    queryRequired<HTMLElement>("#random-rotation-label", this.element).textContent = APP_TEXTS.random.rotation;
    queryRequired<HTMLElement>("#random-zoom-label", this.element).textContent = APP_TEXTS.random.zoom;
    queryRequired<HTMLElement>("#random-noise-type-label", this.element).textContent = APP_TEXTS.random.noiseType;
    for (const { value, label } of NOISE_TYPE_TILE_LABELS) {
      queryRequired<HTMLElement>(`[data-noise-type="${value}"]`, this.element).textContent = label;
    }
    this._syncNoiseLevelLabel();
    queryRequired<HTMLElement>("#random-seed-label", this.element).textContent = APP_TEXTS.random.seed;
    queryRequired<HTMLElement>("#random-seed-auto-label", this.element).textContent = APP_TEXTS.random.autoSeed;
    this._randomizePaneBtn.textContent = APP_TEXTS.random.randomizePane;
    this._geometrizePaneBtn.textContent = APP_TEXTS.random.geometrizePane;
    this._randomGenerateBtn.textContent = APP_TEXTS.random.generate;
    this._randomSaveBtn.textContent = APP_TEXTS.random.save;
    this._randomResetBtn.textContent = APP_TEXTS.random.reset;
    this._randomRestoreBtn.textContent = CONTROL_TEXTS.drawing.restoreButton;
  }

  private _renderPresetOptions(): void {
    this._randomPresetSelect.setOptions(
      RANDOM_PRESETS.map(({ id, label }) => ({ value: id, label })),
      DEFAULT_RANDOM_PRESET,
    );
  }

  private _updateValueLabels(): void {
    this._randomDensityValue.textContent = `${this._randomDensitySlider.value}%`;
    this._randomRotationValue.textContent = `${this._randomRotationSlider.value}°`;
    const level = Number(this._randomZoomSlider.value);
    const minZoom = 0.05;
    const maxZoom = 16;
    const scale = level >= 0 ? maxZoom ** (level / 100) : minZoom ** (-level / 100);
    this._randomZoomValue.textContent = `×${scale.toFixed(2)}`;
    this._randomSeedValue.textContent = String(this._randomSeedSlider.value);
    this._randomNoiseLevelValue.textContent = `${this._randomNoiseLevelSlider.value}%`;
    this._syncSliderFills();
  }

  private _syncNoiseLevelLabel(): void {
    const noiseType = this.currentNoiseType();
    const noiseTypeLabel = NOISE_TYPE_TILE_LABELS.find((tile) => tile.value === noiseType)?.label ?? noiseType;
    queryRequired<HTMLElement>("#random-noise-level-label", this.element).textContent =
      `${APP_TEXTS.random.noiseLevel} (${noiseTypeLabel})`;
  }

  private _syncSeedState(): void {
    const isAutoSeedEnabled = this._randomSeedAuto.checked;
    this._randomSeedSlider.disabled = isAutoSeedEnabled;
    this._randomSeedSliderTooltipTarget.hidden = !isAutoSeedEnabled;
    this._randomSeedSlider.removeAttribute("title");
    if (!isAutoSeedEnabled) {
      this._seedDisabledTooltip.hide();
    }
  }

  private _handlePresetChange = (): void => {
    this._onPresetChange();
  };

  private _onGeometrizeClick = (): void => {
    this._onGeometrize();
  };

  private _handleDensityInput = (): void => {
    this._updateValueLabels();
    this._onParamsChange();
  };

  private _handleRotationInput = (): void => {
    this._updateValueLabels();
    this._onRotationChange(this.currentRotation());
  };

  private _handleZoomInput = (): void => {
    this._updateValueLabels();
    this._onZoomChange(this.currentZoom());
  };

  private _onRestorePlaybackClick = (): void => {
    this._onRestorePlayback();
  };

  private _handleReset = (): void => {
    this._randomPresetSelect.setValue(DEFAULT_RANDOM_PRESET);
    this._randomDensitySlider.value = "30";
    this._randomRotationSlider.value = "0";
    this._randomZoomSlider.value = "0";
    this._noiseTypeSelector.select("uniform");
    this._noiseLevels = { ...DEFAULT_NOISE_LEVELS };
    this._setNoiseLevelSliderFromStored("uniform");
    this._randomSeedSlider.value = "0";
    this._randomSeedAuto.checked = true;
    this._syncSeedState();
    this._updateValueLabels();
    this._onReset();
  };

  private _handleSeedInput = (): void => {
    this._updateValueLabels();
    if (this._randomSeedAuto.checked) {
      return;
    }
    this._onParamsChange();
  };

  private _handleAutoSeedChange = (): void => {
    this._syncSeedState();
    this._onParamsChange();
  };

  private _noiseLevel01FromSlider(): number {
    return Math.max(0, Math.min(1, Number(this._randomNoiseLevelSlider.value) / 100));
  }

  private _setNoiseLevelSliderFromStored(noiseType: NoiseType): void {
    const t = this._noiseLevels[noiseType];
    const pct = Math.round(100 * Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0.5)));
    this._randomNoiseLevelSlider.value = String(pct);
    this._syncNoiseLevelLabel();
  }

  private _handleNoiseLevelInput = (): void => {
    this._noiseLevels[this.currentNoiseType()] = this._noiseLevel01FromSlider();
    this._updateValueLabels();
    this._onParamsChange();
  };

  private _handleSeedTooltipPointerEnter = (event: PointerEvent): void => {
    this._showSeedTooltip(event);
  };

  private _handleSeedTooltipPointerMove = (event: PointerEvent): void => {
    this._showSeedTooltip(event);
  };

  private _handleSaveTooltipPointerEnter = (event: PointerEvent): void => {
    this._showSaveTooltip(event);
  };

  private _handleSaveTooltipPointerMove = (event: PointerEvent): void => {
    this._showSaveTooltip(event);
  };

  private _handleGeometrizeTooltipPointerEnter = (event: PointerEvent): void => {
    this._showGeometrizeTooltip(event);
  };

  private _handleGeometrizeTooltipPointerMove = (event: PointerEvent): void => {
    this._showGeometrizeTooltip(event);
  };

  private _hideSeedTooltip = (): void => {
    this._seedDisabledTooltip.hide();
  };

  private _hideSaveTooltip = (): void => {
    this._saveDisabledTooltip.hide();
  };

  private _hideGeometrizeTooltip = (): void => {
    this._geometrizeTooltip.hide();
  };

  private _showSeedTooltip(event: PointerEvent): void {
    if (event.pointerType === "touch" || !this._randomSeedAuto.checked) {
      this._seedDisabledTooltip.hide();
      return;
    }

    this._seedDisabledTooltip.show(APP_TEXTS.random.seedSliderDisabledHint, {
      clientX: event.clientX,
      clientY: event.clientY,
    });
  }

  private _showSaveTooltip(event: PointerEvent): void {
    if (event.pointerType === "touch" || !this._randomSaveBtn.disabled || !this._saveDisabledHint) {
      this._saveDisabledTooltip.hide();
      return;
    }

    this._saveDisabledTooltip.show(this._saveDisabledHint, {
      clientX: event.clientX,
      clientY: event.clientY,
    });
  }

  private _showGeometrizeTooltip(event: PointerEvent): void {
    if (event.pointerType === "touch") {
      this._geometrizeTooltip.hide();
      return;
    }

    this._geometrizeTooltip.show(APP_TEXTS.random.geometrizeExperimentalHint, {
      clientX: event.clientX,
      clientY: event.clientY,
    });
  }

  private _syncSliderFills(): void {
    syncSliderFill(this._randomDensitySlider);
    syncSliderFill(this._randomRotationSlider);
    syncSliderFill(this._randomZoomSlider);
    syncSliderFill(this._randomNoiseLevelSlider);
    syncSliderFill(this._randomSeedSlider);
  }

  private _randomIntFromInput(input: HTMLInputElement): number {
    return this._randomIntInRange(Number(input.min) || 0, Number(input.max) || 0);
  }

  private _randomIntInRange(min: number, max: number): number {
    const boundedMin = Math.ceil(Math.min(min, max));
    const boundedMax = Math.floor(Math.max(min, max));
    return Math.floor(Math.random() * (boundedMax - boundedMin + 1)) + boundedMin;
  }

  private _pickRandom<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)] ?? items[0];
  }
}

export default RandomControlsPanel;
