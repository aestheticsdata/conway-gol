class DrawingToolBox {
  public toolboxDOM: HTMLElement = document.querySelector('.drawing-toolbox');

  constructor() {
  }

  public show() {
    console.log('show toolbox');
    this.toolboxDOM.style.display = "block";
  }
  public hide() {
    console.log('hide toolbox');
    this.toolboxDOM.style.display = "none";
  }
}

export default DrawingToolBox;
