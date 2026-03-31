import { DOCUMENTATION_ROUTE, SIMULATION_ROUTE } from "@app/routes";
import { DOCUMENTATION_ICON } from "@assets/icons/documentationIcon";
import { normalizeBasePath, toDocumentPath } from "@router/paths";
import { APP_TEXTS } from "@texts";
import { createConnectedHeader } from "@views/html/appHeader";

import type { SessionViewer } from "@services/AuthSessionService";

interface DocumentationCard {
  description: string;
  title: string;
}

interface DocumentationGroup {
  items: string[];
  title: string;
}

type RuleGridCell = "alive" | "empty" | "outcome-alive" | "outcome-dead" | "subject-alive" | "subject-dead";

interface CoreRuleCard {
  after: readonly RuleGridCell[];
  before: readonly RuleGridCell[];
  description: string;
  title: string;
}

const basePath = normalizeBasePath(import.meta.env.BASE_URL);

const CORE_RULE_CARDS: readonly CoreRuleCard[] = [
  {
    title: "Birth",
    description: "A dead cell with exactly three live neighbors becomes alive, which is how new structure appears.",
    before: ["alive", "empty", "empty", "alive", "subject-dead", "empty", "empty", "empty", "alive"],
    after: ["empty", "empty", "empty", "empty", "outcome-alive", "empty", "empty", "empty", "empty"],
  },
  {
    title: "Overcrowding",
    description: "A live cell with more than three live neighbors dies when the local cluster becomes too dense.",
    before: ["alive", "empty", "alive", "alive", "subject-alive", "empty", "empty", "alive", "alive"],
    after: ["alive", "empty", "empty", "alive", "outcome-dead", "empty", "alive", "alive", "alive"],
  },
  {
    title: "Survival",
    description: "A live cell with two or three live neighbors survives and carries the current structure forward.",
    before: ["alive", "empty", "empty", "empty", "subject-alive", "empty", "empty", "alive", "empty"],
    after: ["empty", "empty", "empty", "alive", "outcome-alive", "empty", "empty", "empty", "empty"],
  },
  {
    title: "Death",
    description: "A live cell with fewer than two live neighbors dies. Sparse fragments cannot sustain themselves.",
    before: ["alive", "empty", "empty", "empty", "subject-alive", "empty", "empty", "empty", "empty"],
    after: ["empty", "empty", "empty", "empty", "outcome-dead", "empty", "empty", "empty", "empty"],
  },
] as const;

const MODE_CARDS: readonly DocumentationCard[] = [
  {
    title: "Random",
    description:
      "Start from a preset, tune density, rotation, zoom, seed and spatial noise, then let the rule evolve it.",
  },
  {
    title: "Zoo",
    description:
      "Load 1,400+ curated patterns and species from the catalog, with the original comments preserved beside the board.",
  },
  {
    title: "Drawing",
    description:
      "Paint cells directly, switch brush shapes, import an image, and save your own patterns back into the studio.",
  },
] as const;

const PRESET_GROUPS: readonly DocumentationGroup[] = [
  {
    title: "Fractal / recursive",
    items: ["Sierpinski triangles", "Cantor dust", "Hilbert curve"],
  },
  {
    title: "Geometric / field-like",
    items: [
      "Stars",
      "Random circles",
      "Sine waves",
      "Rings",
      "Stripes",
      "Checkerboard",
      "Clusters",
      "Diagonals",
      "Cross",
    ],
  },
  {
    title: "Baselines",
    items: ["Classic noise", "Primordial bits"],
  },
] as const;

const NOISE_TYPES: readonly DocumentationCard[] = [
  {
    title: "Uniform",
    description: "Independent randomness. The clean baseline when you want an unbiased seed field.",
  },
  {
    title: "Perlin-like",
    description: "Low-frequency drift that turns isolated points into softer clouds and larger blobs.",
  },
  {
    title: "Clusters",
    description: "Biases the mask toward islands and colonies instead of evenly scattered live cells.",
  },
  {
    title: "Gradient",
    description: "Pushes density along a directional slope so one side of the board is more active than the other.",
  },
  {
    title: "Edge bias",
    description: "Prefers the perimeter, which is useful for outward fronts and frame-heavy starts.",
  },
  {
    title: "Center burst",
    description: "Concentrates activity near the core and lets the outskirts stay comparatively quiet.",
  },
  {
    title: "Interference",
    description: "Overlapping wave bands create moire-like stripes, beats and collision corridors.",
  },
  {
    title: "Marbling",
    description: "Warped streaks and turbulent veins for organic-looking, flow-field-like distributions.",
  },
] as const;

const DRAWING_FEATURES: readonly string[] = [
  "Tools: pencil, eraser and hand/pan.",
  "Brush shapes: square, circle, diamond, cross, hollow variants, lines and X-shape.",
  "Live zoom box plus cursor coordinates for precise edits on the cell grid.",
  "Image import pipeline: fit to grid, normalize grayscale, then re-threshold with Floyd-Steinberg dithering.",
  "Restore reloads the snapshot captured on the first Play press for the current drawing.",
  "Saved drawings become reusable custom patterns inside the app.",
] as const;

const TELEMETRY_FEATURES: readonly string[] = [
  "Iteration counter for raw step count.",
  "Stable-after detector when a board stops changing.",
  "Cycle detector that reports the period once a previously seen state comes back.",
  "Alive / dead cell counters.",
  "Two compact charts: alive variation and absolute alive count.",
  "Playback speed slider from 0 to 60 FPS.",
] as const;

function renderCardGrid(cards: readonly DocumentationCard[], className: string): string {
  return cards
    .map(
      (card) => `
        <article class="${className}">
          <h3>${card.title}</h3>
          <p>${card.description}</p>
        </article>
      `,
    )
    .join("");
}

function renderChipList(items: readonly string[]): string {
  return items.map((item) => `<li class="documentation-chip">${item}</li>`).join("");
}

function renderBulletList(items: readonly string[]): string {
  return items.map((item) => `<li>${item}</li>`).join("");
}

function renderRuleGridCells(cells: readonly RuleGridCell[]): string {
  return cells
    .map((cell) => `<span class="documentation-rule-grid__cell documentation-rule-grid__cell--${cell}"></span>`)
    .join("");
}

function renderRuleBoard(label: string, cells: readonly RuleGridCell[]): string {
  return `
    <div class="documentation-rule-visual__stage">
      <span class="documentation-rule-visual__label">${label}</span>
      <div class="documentation-rule-grid" aria-hidden="true">
        ${renderRuleGridCells(cells)}
      </div>
    </div>
  `;
}

function renderCoreRuleCards(cards: readonly CoreRuleCard[]): string {
  return cards
    .map(
      (card) => `
        <article class="documentation-rule-card">
          <div class="documentation-rule-card__copy">
            <h3>${card.title}</h3>
            <p>${card.description}</p>
          </div>
          <div class="documentation-rule-card__divider" aria-hidden="true"></div>
          <div class="documentation-rule-visual" aria-hidden="true">
            ${renderRuleBoard("Before", card.before)}
            <div class="documentation-rule-arrow"></div>
            ${renderRuleBoard("After", card.after)}
          </div>
        </article>
      `,
    )
    .join("");
}

function renderPresetGroups(groups: readonly DocumentationGroup[]): string {
  return groups
    .map(
      (group) => `
        <article class="documentation-group">
          <h3>${group.title}</h3>
          <ul class="documentation-chip-list">
            ${renderChipList(group.items)}
          </ul>
        </article>
      `,
    )
    .join("");
}

export function createDocumentationView(viewer: SessionViewer): string {
  return `
    <section class="workspace-screen workspace-screen--documentation">
      <div class="workspace-shell workspace-shell--documentation">
        ${createConnectedHeader({
          avatarId: viewer.avatarId,
          currentPath: DOCUMENTATION_ROUTE,
          sessionMode: viewer.mode,
          navContent: `<a class="workspace-header__context-link" href="${toDocumentPath(SIMULATION_ROUTE, basePath)}">${APP_TEXTS.documentation.backToSimulation}</a>`,
          username: viewer.username,
        })}
        <main class="documentation-page route-pane-fade-in">
          <header class="documentation-page-header">
            <span class="documentation-page-header__eyebrow">
              <span class="documentation-page-header__icon" aria-hidden="true">${DOCUMENTATION_ICON}</span>
              <span>${APP_TEXTS.documentation.title}</span>
            </span>
            <h1>Conway&apos;s Game of Life, plus a seeded pattern lab.</h1>
            <p>
              Short map of the studio: the Life rule itself, the three entry modes, the random seeding pipeline,
              and the telemetry layered on top of the simulation.
            </p>
          </header>

          <section class="documentation-section">
            <div class="documentation-facts-grid">
              <article class="documentation-fact">
                <span class="documentation-fact__label">Grid</span>
                <strong class="documentation-fact__value">167 × 167</strong>
                <p>Odd-sized on purpose, so the board has one exact center cell.</p>
              </article>
              <article class="documentation-fact">
                <span class="documentation-fact__label">Rule</span>
                <strong class="documentation-fact__value">B3 / S23</strong>
                <p>Birth on 3 neighbors. Survival on 2 or 3. Everything else decays.</p>
              </article>
              <article class="documentation-fact">
                <span class="documentation-fact__label">Zoo catalog</span>
                <strong class="documentation-fact__value">1,400+</strong>
                <p>Named patterns are available as ready-to-run specimens instead of manual seeds.</p>
              </article>
              <article class="documentation-fact">
                <span class="documentation-fact__label">Noise families</span>
                <strong class="documentation-fact__value">8</strong>
                <p>Structured masks let you push the seed field toward blobs, waves, edges or the center.</p>
              </article>
            </div>
          </section>

          <section class="documentation-section">
            <article class="documentation-panel documentation-panel--rules">
              <span class="documentation-panel__eyebrow">Core rules</span>
              <div class="documentation-rules-header">
                <div class="documentation-rules-header__titlebar">
                  <span class="documentation-rules-header__icon" aria-hidden="true">${DOCUMENTATION_ICON}</span>
                  <div class="documentation-rules-header__copy">
                    <h2>The core rules of life</h2>
                    <p>
                      Every generation inspects the 8-cell Moore neighborhood around one center cell. That compact
                      B3 / S23 rule is enough to produce still lifes, oscillators, gliders and longer debris fields.
                      In CGL Studio, the board wraps at the edges, so the same local logic applies everywhere.
                    </p>
                  </div>
                </div>
              </div>
              <div class="documentation-rules-grid">
                ${renderCoreRuleCards(CORE_RULE_CARDS)}
              </div>
            </article>
          </section>

          <section class="documentation-section">
            <article class="documentation-panel documentation-panel--accent">
              <span class="documentation-panel__eyebrow">Studio map</span>
              <h2>Three ways to enter the automaton.</h2>
              <div class="documentation-mode-grid">
                ${renderCardGrid(MODE_CARDS, "documentation-mode-card")}
              </div>
            </article>
          </section>

          <section class="documentation-section documentation-section--split">
            <article class="documentation-panel">
              <span class="documentation-panel__eyebrow">Random mode</span>
              <h2>Preset, transform, noise, seed, run.</h2>
              <p>
                Random mode is a composition pipeline, not just a random fill. Density changes frequency or scale
                depending on the chosen preset, and transforms are applied before the simulation starts stepping.
              </p>
              <pre class="documentation-ascii"><code>preset
  -> density
  -> rotation / zoom
  -> noise type + noise level
  -> seed
  -> generate
  -> evolve</code></pre>
              <ul class="documentation-bullets">
                <li>With <strong>Random seed</strong> enabled, the app rolls a fresh seed for new variations.</li>
                <li>Disable it to replay a layout exactly from the seed slider.</li>
                <li><strong>Generate</strong> keeps the current controls but injects new entropy.</li>
                <li><strong>Randomize parameters</strong> scrambles preset, transforms, noise family and seed mode in one shot.</li>
                <li><strong>Reset</strong> returns the random panel to its default preset and control state.</li>
              </ul>
            </article>

            <article class="documentation-panel">
              <span class="documentation-panel__eyebrow">Preset families</span>
              <h2>What the generator can start from.</h2>
              <div class="documentation-group-grid">
                ${renderPresetGroups(PRESET_GROUPS)}
              </div>
            </article>
          </section>

          <section class="documentation-section">
            <article class="documentation-panel documentation-panel--noise">
              <span class="documentation-panel__eyebrow">Noise types</span>
              <h2>Eight spatial masks, eight different opening conditions.</h2>
              <p>
                Noise level is tracked per noise family, so you can tune each mask without losing the previous one.
              </p>
              <div class="documentation-noise-grid">
                ${renderCardGrid(NOISE_TYPES, "documentation-noise-card")}
              </div>
            </article>
          </section>

          <section class="documentation-section documentation-section--split">
            <article class="documentation-panel">
              <span class="documentation-panel__eyebrow">Drawing stack</span>
              <h2>Direct editing when you do not want presets.</h2>
              <ul class="documentation-bullets">
                ${renderBulletList(DRAWING_FEATURES)}
              </ul>
            </article>

            <article class="documentation-panel">
              <span class="documentation-panel__eyebrow">Playback + telemetry</span>
              <h2>Enough instrumentation to see what the board is doing.</h2>
              <ul class="documentation-bullets">
                ${renderBulletList(TELEMETRY_FEATURES)}
              </ul>
              <pre class="documentation-ascii documentation-ascii--compact"><code>iter   -> current generation
stable -> first repeated still state
cycle  -> first detected loop
alive  -> population size
delta  -> alive variation per step</code></pre>
            </article>
          </section>
        </main>
      </div>
    </section>
  `;
}
