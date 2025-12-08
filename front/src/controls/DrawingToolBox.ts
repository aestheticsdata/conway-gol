export type DrawingMode = "pencil" | "eraser";
type Observer = (drawingMode: DrawingMode) => void;

class DrawingToolBox {
  public toolboxDOM: HTMLElement = document.querySelector('.drawing-toolbox');
  private _selectedMode: DrawingMode;
  private _tools: { [tool: string]: HTMLElement } = {};
  private _activeColor: string = 'rgba(255,204,0,1)';
  private _observer: Observer;

  constructor() {
    this._selectedMode = "pencil";
    const tools = document.querySelectorAll('.drawing-toolbox .item');
    tools.forEach(tool => {
      this._tools[tool.classList[1]] = <HTMLElement>tool;
      this._tools[tool.classList[1]].addEventListener("click", this._onToolClick);
    });
    this._selectMode(this._tools.pencil);
  }

  get selectedMode(): DrawingMode {
    return this._selectedMode;
  }

  set selectedMode(value: DrawingMode) {
    this._selectedMode = value;
  }

  public register(cb: Observer) {
    this._observer = cb;
  }

  public show() {
    this.toolboxDOM.style.display = "block";
  }

  public hide() {
    this.toolboxDOM.style.display = "none";
  }

  private _selectMode(el) {
    for (const item in this._tools) {
      if(el.className.includes(item)) {
        el.style.backgroundColor = this._activeColor;
        this._selectedMode = <DrawingMode>item;
        // not clean, selected drawing mode initialization sequence
        // to be refactored
        // for now, at init this._observer is undefined
        // so the check below
        this._observer && this._observer(this.selectedMode);
      } else {
        (<HTMLElement>this._tools[item]).style.backgroundColor = 'transparent';
      }
    }
  }

  private _onToolClick = (e: Event) => {
    const el = <HTMLElement>e.currentTarget;
    this._selectMode(el);

  }
}

export default DrawingToolBox;
