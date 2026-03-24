import { queryAll } from "@helpers/dom";

type TileButtonGroupOptions<T extends string> = {
  selector: string;
  root?: ParentNode;
  onChange?: (value: T) => void;
};

class TileButtonGroup<T extends string> {
  private readonly _buttons: HTMLButtonElement[];
  private readonly _onChange?: (value: T) => void;

  constructor(options: TileButtonGroupOptions<T>) {
    this._buttons = queryAll<HTMLButtonElement>(options.selector, options.root);
    this._onChange = options.onChange;

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

    this.select(value);
    this._onChange?.(value);
  };
}

export default TileButtonGroup;
