import { queryAll } from "@lib/dom/dom";

type TileButtonGroupOptions<T extends string> = {
  selector: string;
  root?: ParentNode;
  onChange?: (value: T, previous: T) => void;
  onChangeDelayMs?: number;
};

class TileButtonGroup<T extends string> {
  private readonly _buttons: HTMLButtonElement[];
  private readonly _onChange?: (value: T, previous: T) => void;
  private readonly _onChangeDelayMs: number;
  private _pendingChangeTimeoutId?: number;

  constructor(options: TileButtonGroupOptions<T>) {
    this._buttons = queryAll<HTMLButtonElement>(options.selector, options.root);
    this._onChange = options.onChange;
    this._onChangeDelayMs = options.onChangeDelayMs ?? 0;

    this._buttons.forEach((button) => {
      button.addEventListener("click", this._handleClick);
    });
  }

  public value(fallback?: T): T | undefined {
    const selectedButton = this._buttons.find((button) => button.classList.contains("is-selected"));
    return (selectedButton?.dataset.value as T | undefined) ?? fallback;
  }

  public select(value: T): boolean {
    let found = false;

    this._buttons.forEach((button) => {
      const selected = button.dataset.value === value;
      button.classList.toggle("is-selected", selected);
      found ||= selected;
    });

    return found;
  }

  private _handleClick = (event: Event): void => {
    const button = event.currentTarget;
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const value = button.dataset.value as T | undefined;
    if (!value || button.classList.contains("is-selected")) {
      return;
    }

    const fallbackFirst = this._buttons[0]?.dataset.value as T | undefined;
    const previous = (this.value(fallbackFirst) ?? fallbackFirst) as T;

    this.select(value);

    if (!this._onChange) {
      return;
    }

    if (this._pendingChangeTimeoutId !== undefined) {
      window.clearTimeout(this._pendingChangeTimeoutId);
      this._pendingChangeTimeoutId = undefined;
    }

    if (this._onChangeDelayMs <= 0) {
      this._onChange(value, previous);
      return;
    }

    this._pendingChangeTimeoutId = window.setTimeout(() => {
      this._pendingChangeTimeoutId = undefined;
      this._onChange?.(value, previous);
    }, this._onChangeDelayMs);
  };
}

export default TileButtonGroup;
