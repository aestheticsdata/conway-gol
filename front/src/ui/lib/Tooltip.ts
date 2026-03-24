interface TooltipPoint {
  clientX: number;
  clientY: number;
}

interface TooltipOptions {
  className?: string;
  offsetX?: number;
  offsetY?: number;
  viewportPadding?: number;
  root?: HTMLElement;
}

class Tooltip {
  private readonly _element: HTMLDivElement;
  private readonly _offsetX: number;
  private readonly _offsetY: number;
  private readonly _viewportPadding: number;

  constructor(options: TooltipOptions = {}) {
    this._element = document.createElement("div");
    this._element.className = "ui-tooltip";
    if (options.className) {
      this._element.classList.add(options.className);
    }
    this._element.setAttribute("role", "tooltip");
    this._element.hidden = true;

    this._offsetX = options.offsetX ?? 16;
    this._offsetY = options.offsetY ?? 22;
    this._viewportPadding = options.viewportPadding ?? 12;

    (options.root ?? document.body).append(this._element);
  }

  public show(content: string, point: TooltipPoint): void {
    if (!content) {
      this.hide();
      return;
    }

    this._element.textContent = content;
    if (this._element.hidden) {
      this._element.hidden = false;
    }
    this.move(point);
    this._element.classList.add("is-visible");
  }

  public move(point: TooltipPoint): void {
    if (this._element.hidden) {
      return;
    }

    const { left, top } = this._computePosition(point);
    this._element.style.setProperty("--tooltip-x", `${left}px`);
    this._element.style.setProperty("--tooltip-y", `${top}px`);
  }

  public hide(): void {
    this._element.classList.remove("is-visible");
    this._element.hidden = true;
  }

  public destroy(): void {
    this.hide();
    this._element.remove();
  }

  private _computePosition(point: TooltipPoint): { left: number; top: number } {
    const rect = this._element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = point.clientX + this._offsetX;
    let top = point.clientY + this._offsetY;

    if (left + rect.width + this._viewportPadding > viewportWidth) {
      left = point.clientX - rect.width - this._offsetX;
    }
    if (top + rect.height + this._viewportPadding > viewportHeight) {
      top = point.clientY - rect.height - this._offsetY;
    }

    left = Math.max(this._viewportPadding, Math.min(left, viewportWidth - rect.width - this._viewportPadding));
    top = Math.max(this._viewportPadding, Math.min(top, viewportHeight - rect.height - this._viewportPadding));

    return { left, top };
  }
}

export default Tooltip;
