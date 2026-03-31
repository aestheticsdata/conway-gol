import { queryRequired } from "@lib/dom/dom";

export type CustomSelectOption = {
  value: string;
  label: string;
  /** Optional HTML string rendered inside the option button and the trigger value. Falls back to label text when absent. */
  html?: string;
};

type CustomSelectConfig = {
  onChange?: (value: string) => void;
  placeholder?: string;
  visibleOptionCount?: number;
};

class CustomSelect {
  private readonly _root: HTMLElement;
  private readonly _nativeSelect: HTMLSelectElement;
  private readonly _trigger: HTMLButtonElement;
  private readonly _value: HTMLElement;
  private readonly _menu: HTMLElement;
  private readonly _options: HTMLElement;
  private readonly _onChange?: (value: string) => void;
  private readonly _placeholder?: string;
  private _items: readonly CustomSelectOption[] = [];

  constructor(root: HTMLElement, config: CustomSelectConfig = {}) {
    this._root = root;
    this._onChange = config.onChange;
    this._placeholder = config.placeholder;
    this._nativeSelect = queryRequired<HTMLSelectElement>("select.custom-select__native", root);
    this._trigger = queryRequired<HTMLButtonElement>(".custom-select__trigger", root);
    this._value = queryRequired<HTMLElement>(".custom-select__value", root);
    this._menu = queryRequired<HTMLElement>(".custom-select__menu", root);
    this._options = queryRequired<HTMLElement>(".custom-select__options", root);

    this.setVisibleOptionCount(config.visibleOptionCount ?? 10);
    this._setMenuOpen(false);

    this._trigger.addEventListener("click", this._toggleMenu);
    this._nativeSelect.addEventListener("change", this._handleSelectChange);
    this._nativeSelect.addEventListener("mousedown", this._preventNativeSelectMouse);
    this._options.addEventListener("click", this._handleOptionClick);
  }

  public destroy(): void {
    this._trigger.removeEventListener("click", this._toggleMenu);
    this._nativeSelect.removeEventListener("change", this._handleSelectChange);
    this._nativeSelect.removeEventListener("mousedown", this._preventNativeSelectMouse);
    this._options.removeEventListener("click", this._handleOptionClick);
  }

  public setVisibleOptionCount(count: number): void {
    const visibleOptionCount = Math.max(1, Math.round(Number.isFinite(count) ? count : 10));
    const styles = getComputedStyle(this._root);
    const optionHeight = Number.parseFloat(styles.getPropertyValue("--custom-select-option-height")) || 36;
    const optionGap = Number.parseFloat(styles.getPropertyValue("--custom-select-option-gap")) || 2;
    const maxHeight = visibleOptionCount * optionHeight + Math.max(0, visibleOptionCount - 1) * optionGap;

    this._root.style.setProperty("--custom-select-visible-options", String(visibleOptionCount));
    this._root.style.setProperty("--custom-select-menu-max-height", `${maxHeight}px`);
  }

  public setOptions(options: readonly CustomSelectOption[], selectedValue?: string): void {
    this._items = options;
    const fallbackValue = options[0]?.value ?? "";
    const nextValue =
      selectedValue !== undefined
        ? options.some((option) => option.value === selectedValue)
          ? selectedValue
          : ""
        : options.some((option) => option.value === this._nativeSelect.value)
          ? this._nativeSelect.value
          : fallbackValue;

    this._nativeSelect.replaceChildren(
      ...options.map(({ value, label }) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        return option;
      }),
    );
    this._applyValue(nextValue);

    this._options.replaceChildren(
      ...options.map(({ value, label, html }) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "custom-select__option";
        option.dataset.value = value;
        option.setAttribute("role", "option");
        option.setAttribute("aria-label", label);
        if (html) {
          option.innerHTML = html;
        } else {
          option.textContent = label;
        }
        return option;
      }),
    );

    this._syncUI();
  }

  public setValue(value: string, emitChange = false): void {
    const nextValue = this._items.some((option) => option.value === value)
      ? value
      : value === "" && this._placeholder
        ? ""
        : (this._items[0]?.value ?? "");
    this._applyValue(nextValue);
    this._syncUI();
    this._setMenuOpen(false);

    if (emitChange) {
      this._nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  public value(): string {
    const currentValue = this._nativeSelect.value;
    return this._items.some((option) => option.value === currentValue) ? currentValue : "";
  }

  public handleDocumentPointerDown(event: PointerEvent): void {
    if (this._menu.hidden) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!this._root.contains(target)) {
      this._setMenuOpen(false);
    }
  }

  public handleDocumentKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Escape" || this._menu.hidden) {
      return;
    }

    this._setMenuOpen(false);
    this._trigger.focus();
  }

  private _toggleMenu = (): void => {
    this._setMenuOpen(this._menu.hidden);
  };

  private _setMenuOpen(open: boolean): void {
    this._menu.hidden = !open;
    this._trigger.setAttribute("aria-expanded", open ? "true" : "false");
    this._root.classList.toggle("custom-select--open", open);
  }

  private _applyValue(value: string): void {
    if (value) {
      this._nativeSelect.value = value;
      return;
    }

    this._nativeSelect.selectedIndex = -1;
  }

  private _syncUI(): void {
    const currentValue = this.value();
    const currentOption = this._items.find((option) => option.value === currentValue);
    const isPlaceholder = !currentOption && Boolean(this._placeholder);

    if (currentOption?.html) {
      this._value.innerHTML = currentOption.html;
    } else if (currentOption) {
      this._value.textContent = currentOption.label;
    } else {
      this._value.textContent = this._placeholder ?? "";
    }
    this._root.classList.toggle("custom-select--placeholder", isPlaceholder);

    Array.from(this._options.children).forEach((child) => {
      const option = child as HTMLElement;
      const selected = option.dataset.value === currentValue;
      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-selected", selected ? "true" : "false");
    });
  }

  private _handleSelectChange = (): void => {
    this._syncUI();
    this._onChange?.(this._nativeSelect.value);
  };

  private _handleOptionClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const option = target.closest<HTMLElement>(".custom-select__option");
    const value = option?.dataset.value;
    if (!value) {
      return;
    }

    this.setValue(value, true);
  };

  private _preventNativeSelectMouse = (event: MouseEvent): void => {
    event.preventDefault();
  };
}

export default CustomSelect;
