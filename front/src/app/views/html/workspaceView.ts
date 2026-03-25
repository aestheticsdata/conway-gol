import { DRAWING_ROUTE, SIMULATION_ROUTE, ZOO_ROUTE } from "@app/routes";
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
import { createTileSelectorButton } from "@views/html/tileSelector";

import type { WorkspaceRoute } from "@app/routes";
import type { NoiseType } from "@grid/seeding/RandomPresetSeeder";
import type { TileSelectorButtonOptions } from "@views/html/tileSelector";

type ModeSelectorOption = Omit<TileSelectorButtonOptions, "dataAttributeName" | "selected"> & {
  route: WorkspaceRoute;
};

type RandomNoiseOption = {
  value: NoiseType;
  icon: string;
  selected?: boolean;
  title: string;
  ariaLabel: string;
};

type DrawingTool = "pencil" | "eraser";

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

const DRAWING_TOOL_ICON_PATHS: Record<DrawingTool, string> = {
  pencil: "assets/pencil/icons8-pencil-24.png",
  eraser: "assets/eraser/icons8-erase-24.png",
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

function createWorkspaceHeader(route: WorkspaceRoute): string {
  return `
    <header class="workspace-header">
      <div class="workspace-brand" aria-label="${APP_TEXTS.workspace.studioTitle}">
        <span class="workspace-brand__mark" aria-hidden="true"></span>
        <strong class="workspace-brand__title">${APP_TEXTS.workspace.studioTitle}</strong>
      </div>
      <div class="workspace-header__nav">
        <div class="workspace-mode-selector mode-selector tile-selector" aria-label="${APP_TEXTS.modes.label}">
          ${createModeSelector(route)}
        </div>
      </div>
      ${createButton({
        className: "workspace-login-link",
        label: APP_TEXTS.workspace.exitStudio,
      })}
    </header>
  `;
}

function createIterationSection(): string {
  return `
    <div class="pane-section pane-section--separated">
      <div class="iteration">
        <span class="iteration-label"></span>
        <span class="iteration-counter"></span>
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
      <div class="telemetry-chart-legend alive-variation-legend"></div>
      <canvas class="telemetry-chart alive-count-chart"></canvas>
      <div class="telemetry-chart-legend alive-count-legend"></div>
    </div>
  `;
}

function createSpeedSection(): string {
  return `
    <div class="pane-section pane-section--separated">
      <div class="speed-selector">
        <div class="speed-header">
          <label for="speed-slider" class="speed-label"></label>
          <span class="speed-value"></span>
        </div>
        <input type="range" id="speed-slider" min="0" max="60" value="12" step="1">
      </div>
    </div>
  `;
}

function createPlaybackControls(): string {
  return `
    <div class="pane-section pane-section--separated playback-controls">
      ${createButton({ className: "pause" })}
    </div>
  `;
}

function createWorkspaceSidebar(): string {
  return `
    <aside class="left-pane">
      ${createIterationSection()}
      ${createTelemetrySection()}
      ${createSpeedSection()}
      ${createPlaybackControls()}
    </aside>
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
        <div class="random-param random-param--separated">
          <label for="random-density">
            <span id="random-density-label"></span>
            <span id="random-density-value"></span>
          </label>
          <input type="range" id="random-density" min="0" max="100" value="30" step="1">
        </div>
        <div class="random-param random-param--separated">
          <label for="random-rotation">
            <span id="random-rotation-label"></span>
            <span id="random-rotation-value"></span>
          </label>
          <input type="range" id="random-rotation" min="-180" max="180" value="0" step="1">
        </div>
        <div class="random-param random-param--separated">
          <label for="random-zoom">
            <span id="random-zoom-label"></span>
            <span id="random-zoom-value"></span>
          </label>
          <input type="range" id="random-zoom" min="-100" max="100" value="0" step="1">
        </div>
        <div class="random-param random-param--separated">
          <label id="random-noise-type-label"></label>
          <div class="random-noise-type-group tile-selector">
            ${createRandomNoiseSelector()}
          </div>
        </div>
        <div class="random-param">
          <label for="random-noise-level">
            <span id="random-noise-level-label"></span>
            <span id="random-noise-level-value"></span>
          </label>
          <input type="range" id="random-noise-level" min="0" max="100" value="50" step="1">
        </div>
        <div class="random-param random-param--seed">
          <label for="random-seed">
            <span id="random-seed-label"></span>
            <span id="random-seed-value"></span>
          </label>
          <div class="random-seed-slider">
            <input type="range" id="random-seed" min="0" max="9999999" value="0" step="1">
            <span class="random-seed-slider__tooltip-target" aria-hidden="true" hidden></span>
          </div>
          <label class="random-seed-random">
            <input type="checkbox" id="random-seed-auto" checked>
            <span id="random-seed-auto-label"></span>
          </label>
        </div>
      </div>
      <div class="random-generate-wrapper">
        ${createButton({ className: "random-generate", width: "block" })}
        ${createButton({ className: "random-save", width: "block" })}
        ${createButton({ className: "random-reset", width: "block" })}
      </div>
    </div>
  `;
}

function createDrawingFiles(): string {
  return `
    <div class="custom-drawing-files" style="display: none">
      ${createButton({ className: "save", width: "block" })}
      <div class="user-select-container">
        <div class="selectButton">
          <label for="custom-file"></label>
          <select name="custom-file" id="custom-file"></select>
        </div>
      </div>
    </div>
  `;
}

function createDrawingTool(tool: DrawingTool): string {
  const iconPath = DRAWING_TOOL_ICON_PATHS[tool];

  return `
    <div class="item ${tool}">
      <img src="${iconPath}" alt="" data-tool="${tool}">
    </div>
  `;
}

function createDrawingToolbox(): string {
  return `
    <div class="drawing-toolbox" style="display: none">
      ${createDrawingTool("pencil")}
      ${createDrawingTool("eraser")}
    </div>
  `;
}

function createCustomCursor(): string {
  return `
    <div class="custom-cursor" style="display: none">
      <img class="cursor pencil" src="${DRAWING_TOOL_ICON_PATHS.pencil}" alt="" data-tool="pencil" style="display: none">
      <img class="cursor eraser" src="${DRAWING_TOOL_ICON_PATHS.eraser}" alt="" data-tool="eraser" style="display: none">
    </div>
  `;
}

function createZooSelector(): string {
  return `
    <div class="zoo-selector" style="display: none">
      <label for="zoo-species-trigger"></label>
      <div class="custom-select zoo-species-custom-select">
        <button
          type="button"
          id="zoo-species-trigger"
          class="custom-select__trigger"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-controls="zoo-species-options"
        >
          <span class="custom-select__value"></span>
        </button>
        <div class="custom-select__menu" hidden>
          <div
            id="zoo-species-options"
            class="custom-select__options"
            role="listbox"
            aria-labelledby="zoo-species-trigger"
          ></div>
        </div>
        <select id="zoo-species-native" name="zoo-species" class="custom-select__native" tabindex="-1" aria-hidden="true"></select>
      </div>
      <div class="critter-comments"></div>
    </div>
  `;
}

function createImageImport(): string {
  return `
    <div class="image-import" style="display: none">
      <input type="file" id="image-import-input" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif" style="display: none">
      ${createButton({ className: "image-import-btn", width: "block" })}
      <span class="image-import-formats"></span>
      <div class="random-param random-param--separated image-import-threshold">
        <label for="image-threshold-slider">
          <span id="image-threshold-label"></span>
          <span id="image-threshold-value">128</span>
        </label>
        <div class="image-threshold-slider">
          <input type="range" id="image-threshold-slider" min="0" max="255" value="128" step="1">
          <span class="image-threshold-slider__tooltip-target" aria-hidden="true"></span>
        </div>
      </div>
    </div>
  `;
}

function createWorkspaceInspector(): string {
  return `
    <aside class="right-pane">
      ${createRandomControls()}
      ${createZooSelector()}
      ${createDrawingFiles()}
      <div class="zoombox-container"></div>
      ${createDrawingToolbox()}
      ${createCustomCursor()}
      ${createImageImport()}
    </aside>
  `;
}

export function createWorkspaceView(route: WorkspaceRoute): string {
  return `
    <section class="workspace-screen">
      <div class="workspace-shell">
        ${createWorkspaceHeader(route)}
        <div class="container">
          ${createWorkspaceSidebar()}
          ${createCanvasArea()}
          ${createWorkspaceInspector()}
        </div>
      </div>
    </section>
  `;
}
