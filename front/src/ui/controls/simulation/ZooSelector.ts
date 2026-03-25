import { species } from "@data/species/species";
import { queryRequired } from "@helpers/dom";

class ZooSelector {
  private _container?: HTMLElement;
  private _onSpeciesChange?: (speciesName: string) => void;
  private _select?: HTMLSelectElement;
  private _trigger?: HTMLButtonElement;
  private _value?: HTMLElement;
  private _menu?: HTMLElement;
  private _options?: HTMLElement;
  private _wired = false;

  public createSelectButton(
    selector: HTMLElement,
    cb: (speciesName: string) => void,
    list?: string[],
    selectedSpecies?: string,
  ): void {
    this._container = selector;
    this._onSpeciesChange = cb;
    this._select = queryRequired<HTMLSelectElement>("#zoo-species-native", selector);
    this._trigger = queryRequired<HTMLButtonElement>("#zoo-species-trigger", selector);
    const customRoot = queryRequired<HTMLElement>(".zoo-species-custom-select", selector);
    this._value = queryRequired<HTMLElement>(".custom-select__value", customRoot);
    this._menu = queryRequired<HTMLElement>(".custom-select__menu", customRoot);
    this._options = queryRequired<HTMLElement>("#zoo-species-options", selector);

    this._setMenuOpen(false);

    const zoo = list ?? Object.keys(species);
    const activeSpecies = selectedSpecies ?? "canadagoose";
    this._select.replaceChildren(
      ...zoo.map((primitive) => {
        const option = document.createElement("option");
        option.value = primitive;
        option.textContent = primitive;
        option.selected = primitive === activeSpecies;
        return option;
      }),
    );

    this._options.replaceChildren(
      ...zoo.map((primitive) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "custom-select__option";
        option.dataset.value = primitive;
        option.setAttribute("role", "option");
        option.textContent = primitive;
        option.addEventListener("click", () => {
          this._selectSpecies(primitive);
        });
        return option;
      }),
    );

    this._syncUI();

    if (!this._wired) {
      this._trigger.addEventListener("click", this._toggleMenu);
      this._select.addEventListener("change", this._handleSelectChange);
      this._select.addEventListener("mousedown", this._preventNativeSelectMouse);
      this._wired = true;
    }

    selector.style.display = "block";
  }

  public handleDocumentPointerDown(event: PointerEvent): void {
    if (!this._menu || this._menu.hidden || !this._container) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (!this._container.contains(target)) {
      this._setMenuOpen(false);
    }
  }

  public handleDocumentKeyDown(event: KeyboardEvent): void {
    if (!this._menu || this._menu.hidden) {
      return;
    }
    if (event.key === "Escape") {
      this._setMenuOpen(false);
      this._trigger?.focus();
    }
  }

  private _toggleMenu = (): void => {
    if (!this._menu) {
      return;
    }
    this._setMenuOpen(this._menu.hidden);
  };

  private _setMenuOpen(open: boolean): void {
    if (!this._menu || !this._trigger || !this._container) {
      return;
    }
    this._menu.hidden = !open;
    this._trigger.setAttribute("aria-expanded", open ? "true" : "false");
    this._container.classList.toggle("custom-select--open", open);
  }

  private _selectSpecies(value: string): void {
    if (!this._select) {
      return;
    }
    this._select.value = value;
    this._syncUI();
    this._setMenuOpen(false);
    this._select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  private _syncUI(): void {
    if (!this._select || !this._value || !this._options) {
      return;
    }
    const currentValue = this._select.value;
    this._value.textContent = currentValue;

    Array.from(this._options.children).forEach((child) => {
      const option = child as HTMLElement;
      const selected = option.dataset.value === currentValue;
      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-selected", selected ? "true" : "false");
    });
  }

  private _handleSelectChange = (): void => {
    this._syncUI();
    const value = this._select?.value;
    if (value !== undefined && this._onSpeciesChange) {
      this._onSpeciesChange(value);
    }
  };

  /** Avoid opening the OS-native menu if the hidden select receives a click */
  private _preventNativeSelectMouse = (event: MouseEvent): void => {
    event.preventDefault();
  };
}

export default ZooSelector;
