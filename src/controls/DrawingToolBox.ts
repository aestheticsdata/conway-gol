class DrawingToolBox {
  public toolboxDOM: HTMLElement = document.querySelector('.drawing-toolbox');

  constructor() {
  }

  public show() {
    this.toolboxDOM.style.display = "block";
  }
  public hide() {
    this.toolboxDOM.style.display = "none";
  }
}

export default DrawingToolBox;
