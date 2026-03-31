import { DRAWING_ROUTE, SIMULATION_ROUTE, ZOO_ROUTE } from "@app/routes";
import { ERASER_ICON } from "@assets/icons/eraserIcon";
import { HAND_ICON } from "@assets/icons/handIcon";
import { NOISE_CENTER_BURST_ICON } from "@assets/icons/noiseCenterBurstIcon";
import { NOISE_CLUSTERS_ICON } from "@assets/icons/noiseClustersIcon";
import { NOISE_EDGE_BIAS_ICON } from "@assets/icons/noiseEdgeBiasIcon";
import { NOISE_GRADIENT_ICON } from "@assets/icons/noiseGradientIcon";
import { NOISE_INTERFERENCE_ICON } from "@assets/icons/noiseInterferenceIcon";
import { NOISE_MARBLING_ICON } from "@assets/icons/noiseMarblingIcon";
import { NOISE_PERLIN_ICON } from "@assets/icons/noisePerlinIcon";
import { NOISE_UNIFORM_ICON } from "@assets/icons/noiseUniformIcon";
import { PAW_ICON } from "@assets/icons/pawIcon";
import { PENCIL_ICON } from "@assets/icons/pencilIcon";
import { SHUFFLE_ICON } from "@assets/icons/shuffleIcon";
import { APP_TEXTS } from "@texts";
import { createButton } from "@ui/components/button/createButton";
import { createSliderField } from "@ui/components/slider/createSlider";
import { DEFAULT_BRUSH_SIZE, MAX_BRUSH_SIZE, MIN_BRUSH_SIZE } from "@ui/controls/drawing/constants";
import { CONTROL_TEXTS } from "@ui/controls/drawing/texts";
import { createConnectedHeader } from "@views/html/appHeader";
import { createTileSelectorButton } from "@views/html/tileSelector";

import type { WorkspaceRoute } from "@app/routes";
import type { NoiseType } from "@grid/seeding/RandomPresetSeeder";
import type { SessionViewer } from "@services/AuthSessionService";
import type { TileSelectorButtonOptions } from "@views/html/tileSelector";

type ModeSelectorOption = Omit<TileSelectorButtonOptions, "dataAttributeName" | "selected"> & {
  route: WorkspaceRoute;
};

interface RandomNoiseOption {
  value: NoiseType;
  icon: string;
  selected?: boolean;
  title: string;
  ariaLabel: string;
}

type DrawingTool = "pencil" | "eraser" | "hand";

const MODE_SELECTOR_OPTIONS: ModeSelectorOption[] = [
  {
    value: "random",
    route: SIMULATION_ROUTE,
    size: "md",
    icon: SHUFFLE_ICON,
    dataAttributeValue: "random",
  },
  {
    value: "zoo",
    route: ZOO_ROUTE,
    size: "md",
    icon: PAW_ICON,
    dataAttributeValue: "zoo",
  },
  {
    value: "drawing",
    route: DRAWING_ROUTE,
    size: "md",
    icon: PENCIL_ICON,
    dataAttributeValue: "drawing",
  },
];

const RANDOM_NOISE_OPTIONS: readonly RandomNoiseOption[] = [
  {
    value: "uniform",
    title: APP_TEXTS.random.noiseTypes.uniform,
    ariaLabel: APP_TEXTS.random.noiseTypes.uniform,
    selected: true,
    icon: NOISE_UNIFORM_ICON,
  },
  {
    value: "perlin-like",
    title: APP_TEXTS.random.noiseTypes.perlinLike,
    ariaLabel: APP_TEXTS.random.noiseTypes.perlinLike,
    icon: NOISE_PERLIN_ICON,
  },
  {
    value: "clusters",
    title: APP_TEXTS.random.noiseTypes.clusters,
    ariaLabel: APP_TEXTS.random.noiseTypes.clusters,
    icon: NOISE_CLUSTERS_ICON,
  },
  {
    value: "gradient",
    title: APP_TEXTS.random.noiseTypes.gradient,
    ariaLabel: APP_TEXTS.random.noiseTypes.gradient,
    icon: NOISE_GRADIENT_ICON,
  },
  {
    value: "edge-bias",
    title: APP_TEXTS.random.noiseTypes.edgeBias,
    ariaLabel: APP_TEXTS.random.noiseTypes.edgeBias,
    icon: NOISE_EDGE_BIAS_ICON,
  },
  {
    value: "center-burst",
    title: APP_TEXTS.random.noiseTypes.centerBurst,
    ariaLabel: APP_TEXTS.random.noiseTypes.centerBurst,
    icon: NOISE_CENTER_BURST_ICON,
  },
  {
    value: "interference",
    title: APP_TEXTS.random.noiseTypes.interference,
    ariaLabel: APP_TEXTS.random.noiseTypes.interference,
    icon: NOISE_INTERFERENCE_ICON,
  },
  {
    value: "marbling",
    title: APP_TEXTS.random.noiseTypes.marbling,
    ariaLabel: APP_TEXTS.random.noiseTypes.marbling,
    icon: NOISE_MARBLING_ICON,
  },
];

const DRAWING_TOOL_ICONS: Record<DrawingTool, string> = {
  pencil: PENCIL_ICON,
  eraser: ERASER_ICON,
  hand: HAND_ICON,
};

function createModeSelector(route: WorkspaceRoute): string {
  return MODE_SELECTOR_OPTIONS.map((option) =>
    createTileSelectorButton({
      ...option,
      dataAttributeName: "mode",
      selected: route === option.route,
    }),
  ).join("");
}

function createWorkspaceHeader(route: WorkspaceRoute, viewer: SessionViewer): string {
  return createConnectedHeader({
    avatarId: viewer.avatarId,
    currentPath: route,
    sessionMode: viewer.mode,
    username: viewer.username,
    navContent: `
      <div class="workspace-mode-selector mode-selector tile-selector" aria-label="${APP_TEXTS.modes.label}">
        ${createModeSelector(route)}
      </div>
    `,
  });
}

function createIterationSection(): string {
  return `
    <div class="pane-section pane-section--separated">
      <div class="iteration">
        <span class="iteration-label"></span>
        <span class="iteration-counter"></span>
      </div>
      <div class="iteration iteration--secondary">
        <span class="stabilization-label"></span>
        <span class="stabilization-counter"></span>
      </div>
      <div class="iteration iteration--secondary">
        <span class="cycle-detected-label"></span>
        <span class="cycle-detected-counter"></span>
      </div>
    </div>
  `;
}

function createTelemetrySection(): string {
  return `
    <div class="pane-section pane-section--separated">
      <div class="cell-stats">
        <div class="cell-stat">
          <span class="cell-stat-label alive-cells-label"></span>
          <span class="alive-cells-counter"></span>
        </div>
        <div class="cell-stat">
          <span class="cell-stat-label dead-cells-label"></span>
          <span class="dead-cells-counter"></span>
        </div>
      </div>
      <canvas class="telemetry-chart alive-variation-chart"></canvas>
      <div class="telemetry-chart-legend alive-variation-legend">
        <span class="telemetry-chart-legend-label alive-variation-legend-label"></span>
        <span class="telemetry-chart-legend-value telemetry-chart-legend-value--neutral alive-variation-legend-value">0</span>
      </div>
      <canvas class="telemetry-chart alive-count-chart"></canvas>
      <div class="telemetry-chart-legend alive-count-legend">
        <span class="telemetry-chart-legend-label alive-count-legend-label"></span>
        <span class="telemetry-chart-legend-value telemetry-chart-legend-value--neutral alive-count-legend-value">0</span>
      </div>
    </div>
  `;
}

function createSpeedSection(): string {
  return `
    <div class="pane-section pane-section--separated">
      <div class="speed-selector">
        ${createSliderField({
          className: "speed-slider-field",
          id: "speed-slider",
          labelClassName: "speed-label",
          labelId: "speed-label",
          max: 60,
          min: 0,
          value: 12,
          valueClassName: "speed-value",
        })}
      </div>
    </div>
  `;
}

function createPlaybackControls(): string {
  return `
    <div class="pane-section pane-section--separated playback-controls">
      ${createButton({ className: "pause", icon: "play", label: APP_TEXTS.playback.start })}
    </div>
  `;
}

function createDrawingHxfActions(): string {
  return `
    <div class="drawing-hxf-actions">
      <div class="drawing-hxf-actions__row">
        ${createButton({
          className: "drawing-hxf-export",
          label: CONTROL_TEXTS.drawing.exportButton,
        })}
        ${createButton({
          className: "drawing-hxf-import",
          label: CONTROL_TEXTS.drawing.importHxfButton,
        })}
      </div>
      <input type="file" id="drawing-hxf-import-input" class="drawing-hxf-import-input" accept=".hxf,application/json" hidden>
    </div>
  `;
}

function createDrawingHxfImageDelimiter(): string {
  return `<div class="drawing-actions-pane__hxf-image-delimiter" aria-hidden="true"></div>`;
}

function createDrawingActionsSidebar(route: WorkspaceRoute): string {
  const fadeInClass = route === DRAWING_ROUTE ? " route-pane-fade-in" : "";

  return `
    <aside class="drawing-actions-pane${fadeInClass}" style="display: none">
      ${createDrawingHxfActions()}
      ${createDrawingHxfImageDelimiter()}
      ${createImageImport()}
    </aside>
  `;
}

function createWorkspaceSidebar(route: WorkspaceRoute): string {
  return `
    <div class="left-column">
      <aside class="left-pane">
        ${createIterationSection()}
        ${createTelemetrySection()}
        ${createSpeedSection()}
        ${createPlaybackControls()}
      </aside>
      ${createDrawingActionsSidebar(route)}
    </div>
  `;
}

function createCanvasArea(): string {
  return `
    <main class="workspace-stage">
      <div class="workspace-stage__frame">
        <div class="canvas-wrapper">
          <div class="canvas-stack">
            <canvas id="canvasID"></canvas>
            <canvas id="canvas-drawing"></canvas>
          </div>
        </div>
      </div>
    </main>
  `;
}

function createRandomNoiseSelector(): string {
  return RANDOM_NOISE_OPTIONS.map((option) =>
    createTileSelectorButton({
      ...option,
      size: "md",
      dataAttributeName: "noise-type",
      dataAttributeValue: option.value,
    }),
  ).join("");
}

function createRandomControls(): string {
  return `
    <div class="random-preset-selector" style="display: none">
      <div class="random-pane-randomizer">
        ${createButton({ className: "random-pane-randomize" })}
        <div class="random-geometrize-tooltip-host">
          ${createButton({ className: "random-pane-geometrize", labelSize: "sm" })}
        </div>
      </div>
      <label for="random-preset-trigger"></label>
      <div class="custom-select random-preset-custom-select">
        <button
          type="button"
          id="random-preset-trigger"
          class="custom-select__trigger"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-controls="random-preset-options"
        >
          <span class="custom-select__value"></span>
        </button>
        <div class="custom-select__menu" hidden>
          <div
            id="random-preset-options"
            class="custom-select__options"
            role="listbox"
            aria-labelledby="random-preset-trigger"
          ></div>
        </div>
        <select id="random-preset" name="random-preset" class="custom-select__native" tabindex="-1" aria-hidden="true"></select>
      </div>
      <div class="random-params">
        ${createSliderField({
          className: "random-param random-param--separated",
          id: "random-density",
          labelId: "random-density-label",
          max: 100,
          min: 0,
          value: 30,
          valueId: "random-density-value",
        })}
        ${createSliderField({
          className: "random-param random-param--separated",
          id: "random-rotation",
          labelId: "random-rotation-label",
          max: 180,
          min: -180,
          value: 0,
          valueId: "random-rotation-value",
        })}
        ${createSliderField({
          className: "random-param random-param--separated",
          id: "random-zoom",
          labelId: "random-zoom-label",
          max: 100,
          min: -100,
          value: 0,
          valueId: "random-zoom-value",
        })}
        <div class="random-param random-param--separated">
          <label id="random-noise-type-label"></label>
          <div class="random-noise-type-group tile-selector">
            ${createRandomNoiseSelector()}
          </div>
        </div>
        ${createSliderField({
          className: "random-param",
          id: "random-noise-level",
          labelId: "random-noise-level-label",
          max: 100,
          min: 0,
          value: 50,
          valueId: "random-noise-level-value",
        })}
        ${createSliderField({
          afterControlHtml: `
            <label class="random-seed-random">
              <input type="checkbox" id="random-seed-auto" checked>
              <span id="random-seed-auto-label"></span>
            </label>
          `,
          className: "random-param random-param--seed",
          controlClassName: "random-seed-slider",
          id: "random-seed",
          labelId: "random-seed-label",
          max: 9999999,
          min: 0,
          overlayHtml: '<span class="random-seed-slider__tooltip-target" aria-hidden="true" hidden></span>',
          value: 0,
          valueId: "random-seed-value",
        })}
      </div>
      <div class="random-generate-wrapper">
        ${createButton({ className: "random-generate" })}
        <div class="ui-button-tooltip-wrapper">
          ${createButton({ className: "random-save" })}
          <span class="ui-button-tooltip-target random-save-tooltip-target" aria-hidden="true" hidden></span>
        </div>
        ${createButton({ className: "random-reset" })}
        <div class="random-restore-wrapper">
          ${createButton({ className: "random-restore" })}
          <span class="random-restore-tooltip-target" aria-hidden="true"></span>
        </div>
      </div>
    </div>
  `;
}

function createDrawingFiles(): string {
  return `
    <div class="custom-drawing-files" style="display: none">
      <div class="user-select-container">
        <label for="custom-file-trigger"></label>
        <div class="custom-select custom-drawing-custom-select">
          <button
            type="button"
            id="custom-file-trigger"
            class="custom-select__trigger"
            aria-haspopup="listbox"
            aria-expanded="false"
            aria-controls="custom-file-options"
          >
            <span class="custom-select__value"></span>
          </button>
          <div class="custom-select__menu" hidden>
            <div
              id="custom-file-options"
              class="custom-select__options"
              role="listbox"
              aria-labelledby="custom-file-trigger"
            ></div>
          </div>
          <select id="custom-file" name="custom-file" class="custom-select__native" tabindex="-1" aria-hidden="true"></select>
        </div>
      </div>
    </div>
  `;
}

function createDrawingSaveAction(): string {
  return `
    <div class="drawing-save-action">
      <div class="ui-button-tooltip-wrapper">
        ${createButton({ className: "save" })}
        <span class="ui-button-tooltip-target drawing-save-tooltip-target" aria-hidden="true" hidden></span>
      </div>
    </div>
  `;
}

function createDrawingClearAction(): string {
  return `
    <div class="drawing-clear-action">
      ${createButton({
        className: "drawing-clear",
        label: CONTROL_TEXTS.drawing.clearCanvasButton,
      })}
      <div class="drawing-restore-wrapper">
        ${createButton({
          className: "drawing-restore",
          disabled: true,
          label: CONTROL_TEXTS.drawing.restoreButton,
        })}
        <span class="drawing-restore-tooltip-target" aria-hidden="true"></span>
      </div>
      ${createDrawingSaveAction()}
    </div>
  `;
}

function createDrawingTool(tool: DrawingTool): string {
  const icon = DRAWING_TOOL_ICONS[tool];

  return `
    <div class="item ${tool}" data-tool="${tool}" role="button" tabindex="0" aria-pressed="false">
      <span class="drawing-toolbox__icon" aria-hidden="true">${icon}</span>
    </div>
  `;
}

function createDrawingToolbox(): string {
  return `
    <div class="drawing-toolbox" style="display: none">
      <div class="drawing-toolbox__tools" role="toolbar" aria-label="Drawing tools">
        ${createDrawingTool("pencil")}
        ${createDrawingTool("eraser")}
        ${createDrawingTool("hand")}
      </div>
      <div class="custom-select drawing-brush-shape-select">
        <button
          type="button"
          id="drawing-brush-shape-trigger"
          class="custom-select__trigger"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-controls="drawing-brush-shape-options"
        >
          <span class="custom-select__value"></span>
        </button>
        <div class="custom-select__menu" hidden>
          <div
            id="drawing-brush-shape-options"
            class="custom-select__options"
            role="listbox"
            aria-labelledby="drawing-brush-shape-trigger"
          ></div>
        </div>
        <select id="drawing-brush-shape-native" name="drawing-brush-shape" class="custom-select__native" tabindex="-1" aria-hidden="true"></select>
      </div>
      ${createSliderField({
        className: "drawing-toolbox__size",
        controlClassName: "drawing-toolbox__size-control",
        displayValue: String(DEFAULT_BRUSH_SIZE),
        id: "drawing-brush-size-slider",
        label: CONTROL_TEXTS.drawing.brushSizeLabel,
        labelId: "drawing-brush-size-label",
        max: MAX_BRUSH_SIZE,
        min: MIN_BRUSH_SIZE,
        step: 1,
        value: DEFAULT_BRUSH_SIZE,
        valueId: "drawing-brush-size-value",
      })}
    </div>
  `;
}

function createDrawingCursorCoordinates(): string {
  return `
    <div class="drawing-cursor-coordinates" aria-label="${CONTROL_TEXTS.drawing.cursorCoordinatesLabel}">
      <div class="drawing-cursor-coordinates__heading">${CONTROL_TEXTS.drawing.cursorCoordinatesLabel}</div>
      <div class="drawing-cursor-coordinates__values">
        <div class="drawing-cursor-coordinate">
          <span class="drawing-cursor-coordinate__label">${CONTROL_TEXTS.drawing.cursorXAxisLabel}</span>
          <span class="drawing-cursor-coordinate__value drawing-cursor-x-value">--</span>
        </div>
        <div class="drawing-cursor-coordinate">
          <span class="drawing-cursor-coordinate__label">${CONTROL_TEXTS.drawing.cursorYAxisLabel}</span>
          <span class="drawing-cursor-coordinate__value drawing-cursor-y-value">--</span>
        </div>
      </div>
    </div>
  `;
}

function createCustomCursor(): string {
  return `
    <div class="custom-cursor" aria-hidden="true" style="display: none">
      <span class="cursor pencil" data-tool="pencil" style="display: none">${DRAWING_TOOL_ICONS.pencil}</span>
      <span class="cursor eraser" data-tool="eraser" style="display: none">${DRAWING_TOOL_ICONS.eraser}</span>
      <span class="cursor hand" data-tool="hand" style="display: none">${DRAWING_TOOL_ICONS.hand}</span>
    </div>
  `;
}

function createZooSelector(): string {
  return `
    <div class="zoo-selector" style="display: none">
      <label for="zoo-species-trigger"></label>
      <div id="zoo-species-trigger" class="zoo-selected-pattern" aria-live="polite">
        <span class="zoo-selected-pattern__value"></span>
      </div>
      <div class="critter-comments"></div>
    </div>
  `;
}

function createZooPatternListsAction(): string {
  return `
    <div class="zoo-pattern-lists-action" style="display: none">
      ${createButton({ className: "zoo-pattern-lists", label: APP_TEXTS.zoo.patternListsButton, size: "compact" })}
    </div>
  `;
}

function createImageImport(): string {
  return `
    <div class="image-import" style="display: none">
      <input type="file" id="image-import-input" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif" style="display: none">
      ${createButton({ className: "image-import-btn" })}
      <span class="image-import-formats"></span>
      ${createSliderField({
        className: "random-param random-param--separated image-import-threshold",
        controlClassName: "image-threshold-slider",
        id: "image-threshold-slider",
        labelId: "image-threshold-label",
        max: 255,
        min: 0,
        overlayHtml: '<span class="image-threshold-slider__tooltip-target" aria-hidden="true"></span>',
        value: 128,
        valueId: "image-threshold-value",
      })}
    </div>
  `;
}

function createWorkspaceInspector(): string {
  return `
    <aside class="right-pane route-pane-fade-in">
      ${createRandomControls()}
      ${createZooSelector()}
      ${createZooPatternListsAction()}
      <div class="drawing-pane" style="display: none">
        ${createDrawingFiles()}
        <div class="zoombox-container"></div>
        ${createDrawingToolbox()}
        ${createDrawingClearAction()}
        ${createDrawingCursorCoordinates()}
      </div>
      ${createCustomCursor()}
    </aside>
  `;
}

export function createWorkspaceView(route: WorkspaceRoute, viewer: SessionViewer): string {
  return `
    <section class="workspace-screen">
      <div class="workspace-shell">
        ${createWorkspaceHeader(route, viewer)}
        <div class="container">
          ${createWorkspaceSidebar(route)}
          ${createCanvasArea()}
          ${createWorkspaceInspector()}
        </div>
      </div>
    </section>
  `;
}
