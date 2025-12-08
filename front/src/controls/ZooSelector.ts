import { species } from "../data/species/species";

class ZooSelector {
  private _created: boolean = false;

  public createSelectButton(selector, cb, list?) {
    const zoo = (list ? list : Object.keys(species));

    if (!this._created) {
      // https://stackoverflow.com/a/49461484/5671836
      zoo.forEach(primitive => {
        const option = `<option name="${primitive}" ${primitive === 'canadagoose' && 'selected'}>${primitive}</option>`;
        selector.children[0].children[1].insertAdjacentHTML('beforeend', option);
      });

      (<HTMLInputElement>selector).style.display = "block";

      selector.addEventListener('change', function (e) {
        e.preventDefault();
        cb((<HTMLSelectElement>e.target).value);
      });
      this._created = true;
    }
  };
}

export default ZooSelector;
