class DrawingToolBox {
  public toolboxDOM: HTMLElement = document.querySelector('.drawing-toolbox');

  constructor() {
    this.toolboxDOM.style.visibility = "visible";
  }

  public hide() {
    this.toolboxDOM.style.visibility = "hidden";
  }
}

export default DrawingToolBox;
