import { DRAWING_ROUTE, SIMULATION_ROUTE, ZOO_ROUTE } from "@app/routes";
import { NOISE_CENTER_BURST_ICON } from "@assets/icons/noiseCenterBurstIcon";
import { NOISE_CLUSTERS_ICON } from "@assets/icons/noiseClustersIcon";
import { NOISE_EDGE_BIAS_ICON } from "@assets/icons/noiseEdgeBiasIcon";
import { NOISE_GRADIENT_ICON } from "@assets/icons/noiseGradientIcon";
import { NOISE_PERLIN_ICON } from "@assets/icons/noisePerlinIcon";
import { NOISE_UNIFORM_ICON } from "@assets/icons/noiseUniformIcon";
import { PAW_ICON } from "@assets/icons/pawIcon";
import { PENCIL_ICON } from "@assets/icons/pencilIcon";
import { SHUFFLE_ICON } from "@assets/icons/shuffleIcon";
import { APP_TEXTS } from "@texts";
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

function createModeSection(route: WorkspaceRoute): string {
  return `
    <div class="pane-section pane-section--mode">
      <div class="pane-section-label mode-selector-label" data-ui="mode-label"></div>
      <div class="mode-selector tile-selector">
        ${createModeSelector(route)}
      </div>
    </div>
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
      <button type="button" class="pause"></button>
    </div>
  `;
}

function createWorkspaceSidebar(route: WorkspaceRoute): string {
  return `
    <aside class="left-pane">
      ${createModeSection(route)}
      ${createIterationSection()}
      ${createTelemetrySection()}
      ${createSpeedSection()}
      ${createPlaybackControls()}
    </aside>
  `;
}

function createCanvasArea(): string {
  return `
    <div class="canvas-wrapper">
      <div class="canvas-stack">
        <canvas id="canvasID"></canvas>
        <canvas id="canvas-drawing"></canvas>
      </div>
    </div>
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
          <label id="random-noise-type-label"></label>
          <div class="random-noise-type-group tile-selector">
            ${createRandomNoiseSelector()}
          </div>
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
        <button type="button" class="random-generate"></button>
      </div>
    </div>
  `;
}

function createDrawingFiles(): string {
  return `
    <div class="custom-drawing-files" style="display: none">
      <button type="button" class="save"></button>
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
    <div class="zoo-selector">
      <div id="selectButton">
        <label for="primitives"></label>
        <select id="primitives"></select>
      </div>
      <div class="critter-comments"></div>
    </div>
  `;
}

function createWorkspaceInspector(): string {
  return `
    <aside class="right-pane">
      ${createRandomControls()}
      ${createDrawingFiles()}
      <div class="zoombox-container"></div>
      ${createDrawingToolbox()}
      ${createCustomCursor()}
      ${createZooSelector()}
    </aside>
  `;
}

export function createWorkspaceView(route: WorkspaceRoute): string {
  return `
    <section class="workspace-screen">
      <button type="button" class="workspace-login-link">Back to login</button>
      <div class="container">
        ${createWorkspaceSidebar(route)}
        ${createCanvasArea()}
        ${createWorkspaceInspector()}
      </div>
    </section>
  `;
}
