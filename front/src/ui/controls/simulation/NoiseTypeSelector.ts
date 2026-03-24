import type { NoiseType } from "@grid/seeding/RandomPresetSeeder";
import TileButtonGroup from "../shared/TileButtonGroup";

class NoiseTypeSelector extends TileButtonGroup<NoiseType> {
  constructor(onChange: (noiseType: NoiseType) => void, parent: ParentNode = document) {
    super({
      selector: ".random-noise-type-group .tile-selector__button",
      root: parent,
      onChange,
    });
  }
}

export default NoiseTypeSelector;
