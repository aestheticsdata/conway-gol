import { species } from "@data/species/species";
import { queryRequired } from "@helpers/dom";
import CustomSelect from "@ui/controls/shared/CustomSelect";

class ZooSelector {
  private _onSpeciesChange?: (speciesName: string) => void;
  private _customSelect?: CustomSelect;

  public createSelectButton(
    selector: HTMLElement,
    cb: (speciesName: string) => void,
    list?: string[],
    selectedSpecies?: string,
  ): void {
    this._onSpeciesChange = cb;

    const customRoot = queryRequired<HTMLElement>(".zoo-species-custom-select", selector);
    this._customSelect ??= new CustomSelect(customRoot, {
      onChange: (value) => {
        this._onSpeciesChange?.(value);
      },
      visibleOptionCount: 12,
    });

    const zoo = list ?? Object.keys(species);
    const activeSpecies = selectedSpecies ?? "canadagoose";

    this._customSelect.setOptions(
      zoo.map((primitive) => ({ value: primitive, label: primitive })),
      activeSpecies,
    );

    selector.style.display = "block";
  }

  public handleDocumentPointerDown(event: PointerEvent): void {
    this._customSelect?.handleDocumentPointerDown(event);
  }

  public handleDocumentKeyDown(event: KeyboardEvent): void {
    this._customSelect?.handleDocumentKeyDown(event);
  }

  public destroy(): void {
    this._customSelect?.destroy();
  }
}

export default ZooSelector;
