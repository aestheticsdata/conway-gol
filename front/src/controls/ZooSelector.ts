import { species } from "../data/species/species";
import { queryRequired } from "../helpers/dom";

class ZooSelector {
  public createSelectButton(
    selector: HTMLElement,
    cb: (speciesName: string) => void,
    list?: string[],
  ): void {
    const zoo = list ?? Object.keys(species);
    const select = queryRequired<HTMLSelectElement>("#primitives", selector);
    select.replaceChildren(
      ...zoo.map((primitive) => {
        const option = document.createElement("option");
        option.value = primitive;
        option.textContent = primitive;
        option.selected = primitive === "canadagoose";
        return option;
      }),
    );

    select.onchange = (e: Event) => {
      cb((e.currentTarget as HTMLSelectElement).value);
    };
    selector.style.display = "block";
  }
}

export default ZooSelector;
