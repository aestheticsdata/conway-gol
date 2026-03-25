import { queryRequired } from "@helpers/dom";

export type DrawingMode = "pencil" | "eraser";
type Observer = (drawingMode: DrawingMode) => void;

class DrawingToolBox {
  public readonly toolboxDOM: HTMLElement;
  private _selectedMode: DrawingMode = "pencil";
  private readonly _tools: Record<DrawingMode, HTMLElement>;
  private _observer?: Observer;

  constructor() {
    this.toolboxDOM = queryRequired<HTMLElement>(".drawing-toolbox");
    this._tools = {
      pencil: queryRequired<HTMLElement>(".item.pencil", this.toolboxDOM),
      eraser: queryRequired<HTMLElement>(".item.eraser", this.toolboxDOM),
    };
    (Object.values(this._tools) as HTMLElement[]).forEach((tool) => {
      tool.addEventListener("click", this._onToolClick);
      tool.addEventListener("keydown", this._onToolKeyDown);
    });
    this._selectMode("pencil");
  }

  get selectedMode(): DrawingMode {
    return this._selectedMode;
  }

  public register(cb: Observer): void {
    this._observer = cb;
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

  private _modeFromElement(el: HTMLElement): DrawingMode | null {
    return (Object.entries(this._tools) as [DrawingMode, HTMLElement][]).find(([, tool]) => tool === el)?.[0] ?? null;
  }
}

export default DrawingToolBox;
