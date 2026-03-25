import TileButtonGroup from "../shared/TileButtonGroup";

export type Mode = "random" | "zoo" | "drawing";

class ModeSelector extends TileButtonGroup<Mode> {
  constructor(setMode: (mode: Mode) => void, parent: ParentNode = document) {
    super({
      selector: ".mode-selector .tile-selector__button",
      root: parent,
      onChange: setMode,
      onChangeDelayMs: 140,
    });
  }
}

export default ModeSelector;
