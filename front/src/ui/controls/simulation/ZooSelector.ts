import { species } from "@data/species/species";
import { queryRequired } from "@lib/dom/dom";
import ZooPatternModal from "@ui/lib/ZooPatternModal";

class ZooSelector {
  private _onSpeciesChange?: (speciesName: string) => void;
  private readonly _patternModal = new ZooPatternModal();
  private _patternNames: string[] = [];
  private _selectedSpecies = "canadagoose";
  private _selectedPatternValue?: HTMLElement;
  private _patternListsButton?: HTMLButtonElement;

  public createSelectButton(
    selector: HTMLElement,
    cb: (speciesName: string) => void,
    list?: string[],
    selectedSpecies?: string,
  ): void {
    this._onSpeciesChange = cb;
    this._patternNames = list && list.length > 0 ? list : Object.keys(species);
    this._selectedSpecies = this._resolveActiveSpecies(selectedSpecies);

    this._selectedPatternValue ??= queryRequired<HTMLElement>(".zoo-selected-pattern__value", selector);
    this._selectedPatternValue.textContent = this._selectedSpecies;

    const buttonRoot = selector.parentElement ?? selector;
    const nextButton = queryRequired<HTMLButtonElement>(".zoo-pattern-lists", buttonRoot);
    if (this._patternListsButton !== nextButton) {
      this._patternListsButton?.removeEventListener("click", this._handlePatternListsClick);
      this._patternListsButton = nextButton;
      this._patternListsButton.addEventListener("click", this._handlePatternListsClick);
    }

    selector.style.display = "block";
  }

  public hide(): void {
    this._patternModal.close({ restoreFocus: false });
  }

  public handleDocumentPointerDown(_event: PointerEvent): void {}

  public handleDocumentKeyDown(_event: KeyboardEvent): void {}

  public destroy(): void {
    this._patternListsButton?.removeEventListener("click", this._handlePatternListsClick);
    this._patternModal.destroy();
  }

  private _handlePatternListsClick = (): void => {
    this._patternModal.open({
      onSelect: (patternName) => {
        this._selectedSpecies = patternName;
        if (this._selectedPatternValue) {
          this._selectedPatternValue.textContent = patternName;
        }
        this._onSpeciesChange?.(patternName);
      },
      patterns: this._patternNames,
      selectedPattern: this._selectedSpecies,
    });
  };

  private _resolveActiveSpecies(selectedSpecies?: string): string {
    if (selectedSpecies && this._patternNames.includes(selectedSpecies)) {
      return selectedSpecies;
    }

    if (this._patternNames.includes("canadagoose")) {
      return "canadagoose";
    }

    return this._patternNames[0] ?? selectedSpecies ?? "canadagoose";
  }
}

export default ZooSelector;
