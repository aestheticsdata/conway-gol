import {
  BRUSH_SHAPE_CIRCLE_ICON,
  BRUSH_SHAPE_CROSS_ICON,
  BRUSH_SHAPE_DIAMOND_ICON,
  BRUSH_SHAPE_FRAME_ICON,
  BRUSH_SHAPE_HLINE_ICON,
  BRUSH_SHAPE_HOLLOW_CIRCLE_ICON,
  BRUSH_SHAPE_HOLLOW_DIAMOND_ICON,
  BRUSH_SHAPE_SQUARE_ICON,
  BRUSH_SHAPE_VLINE_ICON,
  BRUSH_SHAPE_X_ICON,
} from "@assets/icons/brushShapeIcons";
import { queryRequired } from "@helpers/dom";
import { syncSliderFill } from "@ui/components/slider/createSlider";
import CustomSelect from "@ui/controls/shared/CustomSelect";
import { DEFAULT_BRUSH_SHAPE, DEFAULT_BRUSH_SIZE, MAX_BRUSH_SIZE, MIN_BRUSH_SIZE } from "./constants";
import { CONTROL_TEXTS } from "./texts";

import type { CustomSelectOption } from "@ui/controls/shared/CustomSelect";
import type { BrushShape } from "./constants";

export type DrawingMode = "pencil" | "eraser" | "hand";
type Observer = (drawingMode: DrawingMode) => void;
type BrushSizeObserver = (brushSize: number) => void;
type BrushShapeObserver = (brushShape: BrushShape) => void;

function shapeOptionHtml(icon: string, label: string): string {
  return `<span class="custom-select__option-content"><span class="custom-select__option-icon" aria-hidden="true">${icon}</span><span class="custom-select__option-label">${label}</span></span>`;
}

const BRUSH_SHAPE_OPTIONS: CustomSelectOption[] = [
  {
    value: "square",
    label: CONTROL_TEXTS.drawing.shapes.square,
    html: shapeOptionHtml(BRUSH_SHAPE_SQUARE_ICON, CONTROL_TEXTS.drawing.shapes.square),
  },
  {
    value: "hollow-square",
    label: CONTROL_TEXTS.drawing.shapes.hollowSquare,
    html: shapeOptionHtml(BRUSH_SHAPE_FRAME_ICON, CONTROL_TEXTS.drawing.shapes.hollowSquare),
  },
  {
    value: "cross",
    label: CONTROL_TEXTS.drawing.shapes.cross,
    html: shapeOptionHtml(BRUSH_SHAPE_CROSS_ICON, CONTROL_TEXTS.drawing.shapes.cross),
  },
  {
    value: "circle",
    label: CONTROL_TEXTS.drawing.shapes.circle,
    html: shapeOptionHtml(BRUSH_SHAPE_CIRCLE_ICON, CONTROL_TEXTS.drawing.shapes.circle),
  },
  {
    value: "hollow-circle",
    label: CONTROL_TEXTS.drawing.shapes.hollowCircle,
    html: shapeOptionHtml(BRUSH_SHAPE_HOLLOW_CIRCLE_ICON, CONTROL_TEXTS.drawing.shapes.hollowCircle),
  },
  {
    value: "diamond",
    label: CONTROL_TEXTS.drawing.shapes.diamond,
    html: shapeOptionHtml(BRUSH_SHAPE_DIAMOND_ICON, CONTROL_TEXTS.drawing.shapes.diamond),
  },
  {
    value: "hollow-diamond",
    label: CONTROL_TEXTS.drawing.shapes.hollowDiamond,
    html: shapeOptionHtml(BRUSH_SHAPE_HOLLOW_DIAMOND_ICON, CONTROL_TEXTS.drawing.shapes.hollowDiamond),
  },
  {
    value: "hline",
    label: CONTROL_TEXTS.drawing.shapes.hline,
    html: shapeOptionHtml(BRUSH_SHAPE_HLINE_ICON, CONTROL_TEXTS.drawing.shapes.hline),
  },
  {
    value: "vline",
    label: CONTROL_TEXTS.drawing.shapes.vline,
    html: shapeOptionHtml(BRUSH_SHAPE_VLINE_ICON, CONTROL_TEXTS.drawing.shapes.vline),
  },
  {
    value: "x",
    label: CONTROL_TEXTS.drawing.shapes.x,
    html: shapeOptionHtml(BRUSH_SHAPE_X_ICON, CONTROL_TEXTS.drawing.shapes.x),
  },
];

class DrawingToolBox {
  public readonly toolboxDOM: HTMLElement;
  private _selectedMode: DrawingMode = "pencil";
  private _selectedBrushSize = DEFAULT_BRUSH_SIZE;
  private _selectedBrushShape: BrushShape = DEFAULT_BRUSH_SHAPE;
  private readonly _tools: Record<DrawingMode, HTMLElement>;
  private readonly _brushShapeSelect: CustomSelect;
  private readonly _brushSizeLabel: HTMLElement;
  private readonly _brushSizeSlider: HTMLInputElement;
  private readonly _brushSizeValue: HTMLElement;
  private _observer?: Observer;
  private _brushSizeObserver?: BrushSizeObserver;
  private _brushShapeObserver?: BrushShapeObserver;

  constructor() {
    this.toolboxDOM = queryRequired<HTMLElement>(".drawing-toolbox");
    this._tools = {
      pencil: queryRequired<HTMLElement>(".item.pencil", this.toolboxDOM),
      eraser: queryRequired<HTMLElement>(".item.eraser", this.toolboxDOM),
      hand: queryRequired<HTMLElement>(".item.hand", this.toolboxDOM),
    };
    this._brushShapeSelect = new CustomSelect(
      queryRequired<HTMLElement>(".drawing-brush-shape-select", this.toolboxDOM),
      { onChange: (value) => this._onShapeChange(value as BrushShape) },
    );
    this._brushShapeSelect.setOptions(BRUSH_SHAPE_OPTIONS, DEFAULT_BRUSH_SHAPE);
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

  get selectedBrushShape(): BrushShape {
    return this._selectedBrushShape;
  }

  public register(cb: Observer): void {
    this._observer = cb;
  }

  public registerBrushSize(cb: BrushSizeObserver): void {
    this._brushSizeObserver = cb;
  }

  public registerBrushShape(cb: BrushShapeObserver): void {
    this._brushShapeObserver = cb;
  }

  public show(): void {
    this.toolboxDOM.style.display = "flex";
  }

  public hide(): void {
    this.toolboxDOM.style.display = "none";
  }

  public destroy(): void {
    this._brushShapeSelect.destroy();
  }

  public handleDocumentPointerDown(event: PointerEvent): void {
    this._brushShapeSelect.handleDocumentPointerDown(event);
  }

  public handleDocumentKeyDown(event: KeyboardEvent): void {
    this._brushShapeSelect.handleDocumentKeyDown(event);
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

  private _onShapeChange(shape: BrushShape): void {
    this._selectedBrushShape = shape;
    this._brushShapeObserver?.(shape);
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
