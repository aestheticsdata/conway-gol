import { GRID_COLS, GRID_ROWS } from "@grid/constants";
import { queryRequired } from "@lib/dom/dom";
import { ACCEPTED_EXTENSIONS, floydSteinberg, ImageSeedError, seedFromImage } from "@lib/image/ImageSeeder";
import { syncSliderFill } from "@ui/components/slider/createSlider";
import Tooltip from "@ui/lib/Tooltip";
import Swal from "sweetalert2";

const DEFAULT_THRESHOLD = 128;
const FORMATS_LABEL = `(${ACCEPTED_EXTENSIONS.join(", ")})`;

const TEXTS = {
  button: "Import Image",
  thresholdLabel: "Threshold:",
  thresholdDisabledHint: "This threshold applies to the imported image",
  errorTitle: "Import failed",
  unsupported: `Unsupported format. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}`,
} as const;

class ImageImporter {
  private readonly _container: HTMLElement;
  private readonly _input: HTMLInputElement;
  private readonly _btn: HTMLButtonElement;
  private readonly _formatsLabel: HTMLElement;
  private readonly _thresholdField: HTMLElement;
  private readonly _thresholdSlider: HTMLInputElement;
  private readonly _thresholdTooltipTarget: HTMLElement;
  private readonly _thresholdValue: HTMLElement;
  private readonly _tooltip: Tooltip;
  private readonly _onImport: (grid: number[][]) => void;
  private _grayscale: Float32Array | null = null;
  private _hasImportedImage = false;
  private _isPlaybackActive = false;

  constructor(onImport: (grid: number[][]) => void) {
    this._container = queryRequired<HTMLElement>(".image-import");
    this._input = queryRequired<HTMLInputElement>("#image-import-input", this._container);
    this._btn = queryRequired<HTMLButtonElement>(".image-import-btn", this._container);
    this._formatsLabel = queryRequired<HTMLElement>(".image-import-formats", this._container);
    this._thresholdField = queryRequired<HTMLElement>(".image-import-threshold", this._container);
    this._thresholdSlider = queryRequired<HTMLInputElement>("#image-threshold-slider", this._container);
    this._thresholdTooltipTarget = queryRequired<HTMLElement>(
      ".image-threshold-slider__tooltip-target",
      this._container,
    );
    this._thresholdValue = queryRequired<HTMLElement>("#image-threshold-value", this._container);
    this._tooltip = new Tooltip();
    this._onImport = onImport;

    this._btn.textContent = TEXTS.button;
    this._formatsLabel.textContent = FORMATS_LABEL;
    queryRequired<HTMLElement>("#image-threshold-label", this._container).textContent = TEXTS.thresholdLabel;
    this._syncThresholdAvailability();
    syncSliderFill(this._thresholdSlider);

    this._btn.addEventListener("click", () => this._input.click());
    this._input.addEventListener("change", this._onFileChange);
    this._thresholdSlider.addEventListener("input", this._onThresholdChange);
    this._thresholdTooltipTarget.addEventListener("pointerenter", this._showTooltip);
    this._thresholdTooltipTarget.addEventListener("pointermove", this._showTooltip);
    this._thresholdTooltipTarget.addEventListener("pointerleave", this._hideTooltip);
    this._thresholdTooltipTarget.addEventListener("pointercancel", this._hideTooltip);
  }

  public show(): void {
    this._container.style.display = "block";
  }

  public hide(): void {
    this._container.style.display = "none";
    this._tooltip.hide();
    this._grayscale = null;
    this._hasImportedImage = false;
    this._isPlaybackActive = false;
    this._thresholdSlider.value = String(DEFAULT_THRESHOLD);
    this._thresholdValue.textContent = String(DEFAULT_THRESHOLD);
    this._syncThresholdAvailability();
    syncSliderFill(this._thresholdSlider);
  }

  public setPlaybackActive(isActive: boolean): void {
    this._isPlaybackActive = isActive;
    this._syncThresholdAvailability();

    if (isActive) {
      this._tooltip.hide();
    }
  }

  public destroy(): void {
    this._thresholdTooltipTarget.removeEventListener("pointerenter", this._showTooltip);
    this._thresholdTooltipTarget.removeEventListener("pointermove", this._showTooltip);
    this._thresholdTooltipTarget.removeEventListener("pointerleave", this._hideTooltip);
    this._thresholdTooltipTarget.removeEventListener("pointercancel", this._hideTooltip);
    this._tooltip.destroy();
  }

  private _showTooltip = (e: PointerEvent): void => {
    if (e.pointerType === "touch" || !this._thresholdSlider.disabled) {
      this._tooltip.hide();
      return;
    }
    this._tooltip.show(TEXTS.thresholdDisabledHint, { clientX: e.clientX, clientY: e.clientY });
  };

  private _hideTooltip = (): void => {
    this._tooltip.hide();
  };

  private _syncThresholdAvailability(): void {
    const isEnabled = this._hasImportedImage && !this._isPlaybackActive;
    this._thresholdSlider.disabled = !isEnabled;
    this._thresholdField.classList.toggle("is-disabled", !isEnabled);
    this._thresholdTooltipTarget.style.display = this._hasImportedImage ? "none" : "";
  }

  private _onFileChange = async (e: Event): Promise<void> => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";

    if (!file) return;

    try {
      const { grid, grayscale } = await seedFromImage(file, GRID_COLS, GRID_ROWS, DEFAULT_THRESHOLD);
      this._grayscale = grayscale;
      this._hasImportedImage = true;
      this._thresholdSlider.value = String(DEFAULT_THRESHOLD);
      this._thresholdValue.textContent = String(DEFAULT_THRESHOLD);
      this._syncThresholdAvailability();
      syncSliderFill(this._thresholdSlider);
      this._onImport(grid);
    } catch (err) {
      const text = err instanceof ImageSeedError ? err.message : TEXTS.unsupported;
      void Swal.fire({ icon: "error", title: TEXTS.errorTitle, text });
    }
  };

  private _onThresholdChange = (e: Event): void => {
    if (!this._grayscale) return;
    const threshold = Number((e.currentTarget as HTMLInputElement).value);
    this._thresholdValue.textContent = String(threshold);
    syncSliderFill(this._thresholdSlider);
    const grid = floydSteinberg(this._grayscale, GRID_COLS, GRID_ROWS, threshold);
    this._onImport(grid);
  };
}

export default ImageImporter;
