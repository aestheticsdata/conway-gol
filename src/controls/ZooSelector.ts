import { species } from "../data/species/species";

class ZooSelector {
  private _created: boolean = false

  public createSelectButton(selector, cb, list?) {
    const zoo = (list ? list : Object.keys(species));
    if (!this._created) {
      // https://stackoverflow.com/a/49461484/5671836
      zoo.forEach(primitive => {
        const option = `<option name="${primitive}" ${primitive === 'canadagoose' && 'selected'}>${primitive}</option>`;
        selector.insertAdjacentHTML('beforeend', option);
      });
      (selector as HTMLInputElement).style.visibility = "visible";
      (<HTMLInputElement>selector.previousElementSibling).style.visibility = "visible";
      selector.addEventListener('change', function (e) {
        e.preventDefault();
        cb((<HTMLSelectElement>e.currentTarget).value);
      });
      this._created = true
    }
  };
}

export default ZooSelector
