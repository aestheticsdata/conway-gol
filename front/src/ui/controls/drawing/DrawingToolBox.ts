import { queryRequired } from "@helpers/dom";
import { syncSliderFill } from "@ui/components/slider/createSlider";
import { DEFAULT_BRUSH_SIZE, MAX_BRUSH_SIZE, MIN_BRUSH_SIZE } from "./constants";
import { CONTROL_TEXTS } from "./texts";

export type DrawingMode = "pencil" | "eraser";
type Observer = (drawingMode: DrawingMode) => void;
type BrushSizeObserver = (brushSize: number) => void;

class DrawingToolBox {
  public readonly toolboxDOM: HTMLElement;
  private _selectedMode: DrawingMode = "pencil";
  private _selectedBrushSize = DEFAULT_BRUSH_SIZE;
  private readonly _tools: Record<DrawingMode, HTMLElement>;
  private readonly _brushSizeLabel: HTMLElement;
  private readonly _brushSizeSlider: HTMLInputElement;
  private readonly _brushSizeValue: HTMLElement;
  private _observer?: Observer;
  private _brushSizeObserver?: BrushSizeObserver;

  constructor() {
    this.toolboxDOM = queryRequired<HTMLElement>(".drawing-toolbox");
    this._tools = {
      pencil: queryRequired<HTMLElement>(".item.pencil", this.toolboxDOM),
      eraser: queryRequired<HTMLElement>(".item.eraser", this.toolboxDOM),
    };
    this._brushSizeLabel = queryRequired<HTMLElement>("#drawing-brush-size-label", this.toolboxDOM);
    this._brushSizeSlider = queryRequired<HTMLInputElement>("#drawing-brush-size-slider", this.toolboxDOM);
    this._brushSizeValue = queryRequired<HTMLElement>("#drawing-brush-size-value", this.toolboxDOM);
    (Object.values(this._tools) as HTMLElement[]).forEach((tool) => {
      tool.addEventListener("click", this._onToolClick);
      tool.addEventListener("keydown", this._onToolKeyDown);
    });
    this._brushSizeLabel.textContent = CONTROL_TEXTS.drawing.brushSizeLabel;
    this._brushSizeSlider.min = String(MIN_BRUSH_SIZE);
    this._brushSizeSlider.max = String(MAX_BRUSH_SIZE);
    this._brushSizeSlider.step = "1";
    this._brushSizeSlider.addEventListener("input", this._onBrushSizeInput);
    this._setBrushSize(DEFAULT_BRUSH_SIZE, false);
    this._selectMode("pencil");
  }

  get selectedMode(): DrawingMode {
    return this._selectedMode;
  }

  get selectedBrushSize(): number {
    return this._selectedBrushSize;
  }

  public register(cb: Observer): void {
    this._observer = cb;
  }

  public registerBrushSize(cb: BrushSizeObserver): void {
    this._brushSizeObserver = cb;
  }

  public show(): void {
    this.toolboxDOM.style.display = "flex";
  }

  public hide(): void {
    this.toolboxDOM.style.display = "none";
  }

  private _selectMode(modeToSelect: DrawingMode): void {
    (Object.entries(this._tools) as [DrawingMode, HTMLElement][]).forEach(([mode, tool]) => {
      const selected = mode === modeToSelect;
      tool.classList.toggle("is-selected", selected);
      tool.setAttribute("aria-pressed", selected ? "true" : "false");
      if (selected) {
        this._selectedMode = mode;
      }
    });
    this._observer?.(this.selectedMode);
  }

  private _setBrushSize(nextSize: number, notify = true): void {
    const brushSize = Math.max(MIN_BRUSH_SIZE, Math.min(MAX_BRUSH_SIZE, Math.round(nextSize)));
    this._selectedBrushSize = brushSize;
    this._brushSizeSlider.value = String(brushSize);
    this._brushSizeValue.textContent = String(brushSize);
    syncSliderFill(this._brushSizeSlider);

    if (notify) {
      this._brushSizeObserver?.(brushSize);
    }
  }

  private _onToolClick = (e: Event): void => {
    const el = e.currentTarget;
    if (!(el instanceof HTMLElement)) {
      return;
    }
    const mode = this._modeFromElement(el);
    if (mode) {
      this._selectMode(mode);
    }
  };

  private _onToolKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== "Enter" && e.key !== " ") {
      return;
    }

    const el = e.currentTarget;
    if (!(el instanceof HTMLElement)) {
      return;
    }

    const mode = this._modeFromElement(el);
    if (!mode) {
      return;
    }

    e.preventDefault();
    this._selectMode(mode);
  };

  private _onBrushSizeInput = (e: Event): void => {
    const size = Number((e.currentTarget as HTMLInputElement).value);
    this._setBrushSize(size);
  };

  private _modeFromElement(el: HTMLElement): DrawingMode | null {
    return (Object.entries(this._tools) as [DrawingMode, HTMLElement][]).find(([, tool]) => tool === el)?.[0] ?? null;
  }
}

export default DrawingToolBox;
