import { queryRequired } from "../helpers/dom";

export type DrawingMode = "pencil" | "eraser";
type Observer = (drawingMode: DrawingMode) => void;

class DrawingToolBox {
  public readonly toolboxDOM: HTMLElement;
  private _selectedMode: DrawingMode = "pencil";
  private readonly _tools: Record<DrawingMode, HTMLElement>;
  private _activeColor: string = 'rgba(255,204,0,1)';
  private _observer?: Observer;

  constructor() {
    this.toolboxDOM = queryRequired<HTMLElement>('.drawing-toolbox');
    this._tools = {
      pencil: queryRequired<HTMLElement>('.item.pencil', this.toolboxDOM),
      eraser: queryRequired<HTMLElement>('.item.eraser', this.toolboxDOM),
    };
    (Object.values(this._tools) as HTMLElement[]).forEach((tool) => {
      tool.addEventListener("click", this._onToolClick);
    });
    this._selectMode(this._tools.pencil);
  }

  get selectedMode(): DrawingMode {
    return this._selectedMode;
  }

  set selectedMode(value: DrawingMode) {
    this._selectedMode = value;
  }

  public register(cb: Observer): void {
    this._observer = cb;
  }

  public show(): void {
    this.toolboxDOM.style.display = "block";
  }

  public hide(): void {
    this.toolboxDOM.style.display = "none";
  }

  private _selectMode(el: HTMLElement): void {
    (Object.entries(this._tools) as [DrawingMode, HTMLElement][]).forEach(
      ([mode, tool]) => {
        if (tool === el) {
          tool.style.backgroundColor = this._activeColor;
          this._selectedMode = mode;
          this._observer?.(this.selectedMode);
        } else {
          tool.style.backgroundColor = 'transparent';
        }
      },
    );
  }

  private _onToolClick = (e: Event): void => {
    const el = e.currentTarget;
    if (!(el instanceof HTMLElement)) {
      return;
    }
    this._selectMode(el);
  }
}

export default DrawingToolBox;
