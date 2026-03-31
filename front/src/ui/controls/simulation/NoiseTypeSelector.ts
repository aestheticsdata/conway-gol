import TileButtonGroup from "@ui/controls/shared/TileButtonGroup";

import type { NoiseType } from "@grid/seeding/randomPresetTypes";

class NoiseTypeSelector extends TileButtonGroup<NoiseType> {
  constructor(onChange: (noiseType: NoiseType, previous: NoiseType) => void, parent: ParentNode = document) {
    super({
      selector: ".random-noise-type-group .tile-selector__button",
      root: parent,
      onChange,
    });
  }
}

export default NoiseTypeSelector;
