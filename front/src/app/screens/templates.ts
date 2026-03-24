import type { WorkspaceRoute } from "@app/routes";
import {
  DRAWING_ROUTE,
  SIMULATION_ROUTE,
  ZOO_ROUTE,
} from "@app/routes";
import { NOISE_CLUSTERS_ICON } from "@assets/icons/noiseClustersIcon";
import { NOISE_PERLIN_ICON } from "@assets/icons/noisePerlinIcon";
import { NOISE_UNIFORM_ICON } from "@assets/icons/noiseUniformIcon";
import { PAW_ICON } from "@assets/icons/pawIcon";
import { PENCIL_ICON } from "@assets/icons/pencilIcon";
import { SHUFFLE_ICON } from "@assets/icons/shuffleIcon";

type TileSelectorSize = "md" | "sm";

function createTileLabel(
  icon: string,
  dataAttributeName: string,
  dataAttributeValue: string,
): string {
  return `
    <span class="tile-selector__icon" aria-hidden="true">${icon}</span>
    <span class="tile-selector__text" data-${dataAttributeName}="${dataAttributeValue}"></span>
  `;
}

function createTileSelectorOption(options: {
  id: string;
  name: string;
  value: string;
  checked?: boolean;
  size?: TileSelectorSize;
  icon: string;
  dataAttributeName: string;
  dataAttributeValue: string;
  title?: string;
  ariaLabel?: string;
}): string {
  const {
    id,
    name,
    value,
    checked = false,
    size = "md",
    icon,
    dataAttributeName,
    dataAttributeValue,
    title,
    ariaLabel,
  } = options;

  return `
    <div class="tile-selector__option" data-size="${size}">
      <input type="radio" id="${id}" name="${name}" value="${value}"${checked ? " checked" : ""}${ariaLabel ? ` aria-label="${ariaLabel}"` : ""}>
      <label for="${id}"${title ? ` title="${title}"` : ""}>${createTileLabel(icon, dataAttributeName, dataAttributeValue)}</label>
    </div>
  `;
}

export function createLoginMarkup(): string {
  return `
    <section class="auth-screen">
      <div class="auth-screen__grid"></div>
      <div class="auth-card">
        <div class="auth-card__eyebrow">Portfolio Demo</div>
        <h1 class="auth-card__title">Login to Conway</h1>
        <p class="auth-card__copy">
          Fake auth for now. This route validates the client-side router,
          the future connected mode, and the app shell separation.
        </p>
        <form class="auth-form">
          <label class="auth-field">
            <span>Email</span>
            <input type="email" name="email" placeholder="you@example.com" value="demo@conway.local">
          </label>
          <label class="auth-field">
            <span>Password</span>
            <input type="password" name="password" placeholder="••••••••" value="demo-password">
          </label>
          <button type="submit" class="auth-submit">Enter Simulation</button>
        </form>
      </div>
    </section>
  `;
}

export function createWorkspaceMarkup(route: WorkspaceRoute): string {
  return `
    <section class="workspace-screen">
      <button type="button" class="workspace-login-link">Back to login</button>
      <div class="container">
        <aside class="left-pane">
          <div class="pane-section pane-section--mode">
            <div class="pane-section-label mode-selector-label" data-ui="mode-label"></div>
            <div class="mode-selector tile-selector">
              ${createTileSelectorOption({
                id: "random",
                name: "mode",
                value: "random",
                checked: route === SIMULATION_ROUTE,
                size: "md",
                icon: SHUFFLE_ICON,
                dataAttributeName: "mode",
                dataAttributeValue: "random",
              })}
              ${createTileSelectorOption({
                id: "zoo",
                name: "mode",
                value: "zoo",
                checked: route === ZOO_ROUTE,
                size: "md",
                icon: PAW_ICON,
                dataAttributeName: "mode",
                dataAttributeValue: "zoo",
              })}
              ${createTileSelectorOption({
                id: "drawing",
                name: "mode",
                value: "drawing",
                checked: route === DRAWING_ROUTE,
                size: "md",
                icon: PENCIL_ICON,
                dataAttributeName: "mode",
                dataAttributeValue: "drawing",
              })}
            </div>
          </div>
          <div class="pane-section pane-section--separated">
            <div class="iteration">
              <span class="iteration-label"></span>
              <span class="iteration-counter"></span>
            </div>
          </div>
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
          <div class="pane-section pane-section--separated">
            <div class="speed-selector">
              <div class="speed-header">
                <label for="speed-slider" class="speed-label"></label>
                <span class="speed-value"></span>
              </div>
              <input type="range" id="speed-slider" min="0" max="60" value="12" step="1">
            </div>
          </div>
          <div class="pane-section pane-section--separated playback-controls">
            <button type="button" class="pause"></button>
          </div>
        </aside>
        <div class="canvas-wrapper">
          <div class="canvas-stack">
            <canvas id="canvasID"></canvas>
            <canvas id="canvas-drawing"></canvas>
          </div>
        </div>
        <aside class="right-pane">
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
                  ${createTileSelectorOption({
                    id: "random-noise-uniform",
                    name: "random-noise-type",
                    value: "uniform",
                    checked: true,
                    size: "md",
                    icon: NOISE_UNIFORM_ICON,
                    dataAttributeName: "noise-type",
                    dataAttributeValue: "uniform",
                    title: "Uniform",
                    ariaLabel: "Uniform",
                  })}
                  ${createTileSelectorOption({
                    id: "random-noise-perlin-like",
                    name: "random-noise-type",
                    value: "perlin-like",
                    size: "md",
                    icon: NOISE_PERLIN_ICON,
                    dataAttributeName: "noise-type",
                    dataAttributeValue: "perlin-like",
                    title: "Perlin-like",
                    ariaLabel: "Perlin-like",
                  })}
                  ${createTileSelectorOption({
                    id: "random-noise-clusters",
                    name: "random-noise-type",
                    value: "clusters",
                    size: "md",
                    icon: NOISE_CLUSTERS_ICON,
                    dataAttributeName: "noise-type",
                    dataAttributeValue: "clusters",
                    title: "Clusters",
                    ariaLabel: "Clusters",
                  })}
                </div>
              </div>
              <div class="random-param random-param--seed">
                <label for="random-seed">
                  <span id="random-seed-label"></span>
                  <span id="random-seed-value"></span>
                </label>
                <input type="range" id="random-seed" min="0" max="9999999" value="0" step="1">
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
          <div class="custom-drawing-files" style="display: none">
            <button type="button" class="save"></button>
            <div class="user-select-container">
              <div class="selectButton">
                <label for="custom-file"></label>
                <select name="custom-file" id="custom-file"></select>
              </div>
            </div>
          </div>
          <div class="zoombox-container"></div>
          <div class="drawing-toolbox" style="display: none">
            <div class="item pencil">
              <img src="assets/pencil/icons8-pencil-24.png" alt="" data-tool="pencil">
            </div>
            <div class="item eraser">
              <img src="assets/eraser/icons8-erase-24.png" alt="" data-tool="eraser">
            </div>
          </div>
          <div class="custom-cursor" style="display: none">
            <img class="cursor pencil" src="assets/pencil/icons8-pencil-24.png" alt="" data-tool="pencil" style="display: none">
            <img class="cursor eraser" src="assets/eraser/icons8-erase-24.png" alt="" data-tool="eraser" style="display: none">
          </div>
          <div class="zoo-selector">
            <div id="selectButton">
              <label for="primitives"></label>
              <select id="primitives"></select>
            </div>
            <div class="critter-comments"></div>
          </div>
        </aside>
      </div>
    </section>
  `;
}
