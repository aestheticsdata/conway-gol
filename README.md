# Conway's Game of Life

A full-stack implementation of [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life) with a TypeScript/Canvas frontend and a NestJS API serving a catalog of 1,400+ pre-built patterns plus database-backed custom patterns.

**Live demo:** http://1991computer.com/conway-gol/

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Frontend Design System](#frontend-design-system)
- [Frontend Code Map](#frontend-code-map)
- [Running Locally](#running-locally)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Endpoints](#api-endpoints)
- [Pattern File Format (.hxf)](#pattern-file-format-hxf)
- [Refactoring History](#refactoring-history)

## Features

- Client-side app shell with real routes: `/login`, `/simulation`, `/zoo`, `/drawing`
- Navigation API based router behind a framework-agnostic adapter and screen abstraction
- Login screen used as a fake auth entry point for the future connected-user flow
- Random mode with 14 named presets (geometric, fractal, noise, and Conway-motif families), five generation controls (density, rotation, zoom, noise type, seed), a `Generate` action for a new variation, and a `Reset` button that restores all controls to their initial values
- Zoo mode with 1,400+ catalog patterns
- Drawing mode with save/load for custom patterns plus a `Restore` action that re-seeds the grid from the snapshot captured on the first `Play` press for the current drawing
- Image import in drawing mode: upload any common image format, automatically converted to a cell pattern via grayscale + Floyd-Steinberg dithering, with a live threshold slider for post-import tuning that is disabled while playback is running
- Zoom view around the cursor
- Left-side playback telemetry with iteration count, `stable after` and `cycle period` counters, live/dead cell counts, a real-time alive-cell variation graph, and a real-time absolute alive-cell graph
- Tokens-based visual system for colors, radius, spacing, form fields, telemetry, and canvas rendering
- Custom-styled random-preset dropdown consistent with the app visual language
- Reusable tile-style buttons used for workspace mode selection and random noise type selection
- Eight noise types for the `noise` preset and as spatial masks for pattern presets: `uniform`, `perlin-like`, `clusters`, `gradient`, `edge-bias`, `center-burst`, `interference`, `marbling`
- Inline SVG icons stored in shared assets for mode buttons and random-noise selectors
- Adjustable FPS from 0 to 60 via slider
- Toroidal grid with wraparound edges

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | TypeScript, Canvas 2D API, Vite |
| HTTP client | Axios |
| UI | SweetAlert2 |
| Backend | NestJS 11, Prisma, MariaDB/MySQL |
| Tests | Vitest (frontend), Jest (API) |
| Build | Vite, Nest CLI, Prisma |
| Process manager | PM2 |
| Deploy | Bash deploy scripts with releases and rollback |

## Project Structure

```text
conway-gol/
├── api-nest/
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── config/
│   │   ├── core/
│   │   ├── health/
│   │   ├── main.ts
│   │   ├── patterns/
│   │   └── prisma/
│   ├── data/
│   │   ├── legacy-custom-patterns/
│   │   └── patterns/
│   ├── generated/prisma/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── scripts/
│   ├── test/
│   ├── ecosystem.config.js
│   └── package.json
├── front/
│   ├── src/
│   │   ├── app/
│   │   │   ├── navigation/
│   │   │   ├── router/
│   │   │   ├── simulation/
│   │   │   │   ├── PlaybackTelemetryTracker.test.ts
│   │   │   │   ├── PlaybackTelemetryTracker.ts
│   │   │   │   └── SimulationWorkspace.ts
│   │   │   ├── views/
│   │   │   │   ├── html/
│   │   │   │   │   ├── lexicon/
│   │   │   │   │   │   ├── escapeHtml.ts
│   │   │   │   │   │   ├── lexiconView.ts
│   │   │   │   │   │   ├── markups.ts
│   │   │   │   │   │   ├── renderBlocks.ts
│   │   │   │   │   │   ├── renderEntry.ts
│   │   │   │   │   │   ├── renderPreface.ts
│   │   │   │   │   │   └── templates/
│   │   │   │   │   │       └── lexiconMain.ts
│   │   │   │   │   ├── aboutView.ts
│   │   │   │   │   ├── appHeader.ts
│   │   │   │   │   ├── authFields.ts
│   │   │   │   │   ├── authLayout.ts
│   │   │   │   │   ├── documentationView.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── loginView.ts
│   │   │   │   │   ├── registerView.ts
│   │   │   │   │   ├── settingsView.ts
│   │   │   │   │   ├── tileSelector.ts
│   │   │   │   │   └── workspaceView.ts
│   │   │   │   ├── AboutView.ts
│   │   │   │   ├── AuthPageView.ts
│   │   │   │   ├── DocumentationView.ts
│   │   │   │   ├── LexiconView.ts
│   │   │   │   ├── LoginView.ts
│   │   │   │   ├── RegisterView.ts
│   │   │   │   ├── SettingsView.ts
│   │   │   │   ├── SimulationView.ts
│   │   │   │   └── authValidation.ts
│   │   │   └── routes.ts
│   │   ├── assets/
│   │   │   ├── icons/
│   │   │   ├── eraser/
│   │   │   └── pencil/
│   │   ├── api/
│   │   │   └── core/
│   │   ├── Cell/
│   │   ├── Grid/
│   │   │   ├── Grid.ts
│   │   │   ├── GridDrawingHandler.ts
│   │   │   ├── Simulation.ts
│   │   │   ├── constants.ts
│   │   │   ├── gridTransforms.ts
│   │   │   ├── randomPresets.ts
│   │   │   ├── texts.ts
│   │   │   ├── seeding/
│   │   │   │   ├── RandomPresetSeeder.ts
│   │   │   │   ├── randomPresetFractalSeeders.ts
│   │   │   │   ├── randomPresetNoise.ts
│   │   │   │   ├── randomPresetShapeSeeders.ts
│   │   │   │   ├── randomPresetTypes.ts
│   │   │   │   ├── randomPresetUtils.ts
│   │   │   │   └── shapes/
│   │   │   │       ├── conway.ts
│   │   │   │       ├── field.ts
│   │   │   │       ├── index.ts
│   │   │   │       └── stamp.ts
│   │   │   └── zoom/
│   │   │       └── ZoomBox.ts
│   │   ├── lib/
│   │   │   └── image/
│   │   │       └── ImageSeeder.ts
│   │   ├── data/
│   │   │   ├── Data.ts
│   │   │   ├── lexicon/
│   │   │   │   ├── lexicon.txt
│   │   │   │   ├── lexiconParser.test.ts
│   │   │   │   └── lexiconParser.ts
│   │   │   ├── patterns/
│   │   │   │   └── patternCardMeta.ts
│   │   │   └── species/
│   │   │       └── species.ts
│   │   ├── infra/
│   │   │   └── http/
│   │   │       └── HttpClient.ts
│   │   ├── helpers/
│   │   │   ├── Helpers.ts
│   │   │   ├── api.ts
│   │   │   ├── canvas.ts
│   │   │   ├── constants.ts
│   │   │   └── dom.ts
│   │   ├── services/
│   │   │   ├── CritterService.ts
│   │   │   ├── LocalCredentialService.ts
│   │   │   ├── PatternFavoriteService.ts
│   │   │   ├── PatternService.ts
│   │   │   ├── SessionService.ts
│   │   │   └── UserCustomService.ts
│   │   ├── styles/
│   │   │   ├── main/
│   │   │   ├── tokens/
│   │   │   ├── zoo/
│   │   │   ├── main.css
│   │   │   ├── reset.css
│   │   │   └── tokens.css
│   │   ├── ui/
│   │   │   ├── components/
│   │   │   │   ├── button/
│   │   │   │   └── slider/
│   │   │   ├── controls/
│   │   │   │   ├── drawing/
│   │   │   │   ├── shared/
│   │   │   │   ├── simulation/
│   │   │   │   └── telemetry/
│   │   │   └── lib/
│   │   │       ├── WorkspaceUserMenu.ts
│   │   │       ├── ZooPatternModal.ts
│   │   │       └── patternPreview.ts
│   │   ├── index.html
│   │   ├── index.ts
│   │   ├── texts.ts
│   │   └── vite-env.d.ts
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   └── package.json
├── deploy-api.sh
├── deploy-front.sh
└── README.md
```

## Architecture

### Frontend

The frontend is now split between routing, screen composition, simulation orchestration, rendering, and DOM-facing controls.

#### Entry point, routing, and screens

`front/src/index.ts` is the composition root. It:

- creates the app router
- wires a `NavigationApiAdapter` behind a framework-agnostic `NavigationAdapter` interface
- registers concrete screens for `/login`, `/simulation`, `/zoo`, and `/drawing`
- normalizes the Vite base path so the app can run under `/conway-gol/`

`AppRouter` in `front/src/app/router/AppRouter.ts` owns route resolution and screen lifecycle:

- mount the active screen into `#app`
- call `enter()` / `leave()` / `destroy()` consistently
- redirect `/` and unknown paths to the fallback route

`NavigationApiAdapter` in `front/src/app/navigation/NavigationApiAdapter.ts` wraps the browser Navigation API while keeping the rest of the app decoupled from browser-specific details.

The screen layer is intentionally small:

- `LoginScreen.ts` renders the fake-auth entry route
- `SimulationScreen.ts` renders the shared workspace shell for random, zoo, and drawing routes

#### Custom router details

The router is deliberately custom because the frontend is not built around React, Vue, or another framework router model. The app is DOM-driven and class-oriented, so the routing layer is designed around screen lifecycle rather than component trees.

The routing system is split into three layers:

1. `NavigationAdapter`
   This is the browser-facing contract. It abstracts path reads, navigation requests, history replacement, back navigation, and lifecycle cleanup.

2. `AppRouter`
   This is the app-facing router. It resolves route definitions, creates screens, mounts them into the outlet, and guarantees `enter()` / `leave()` / `destroy()` ordering.

3. `Screen`
   This is the UI contract used by route targets. A screen must know how to mount itself, receive route context, leave cleanly, and optionally destroy resources.

The main benefit of this split is that navigation mechanics and screen lifecycle are independent:

- browser path changes stay in `NavigationApiAdapter`
- route matching and fallback logic stay in `AppRouter`
- workspace/login UI logic stays in `LoginScreen`, `SimulationScreen`, and `SimulationWorkspace`

##### Why Navigation API

The app uses the browser Navigation API instead of `hash` routing or a framework router:

- it supports real document paths such as `/conway-gol/login` and `/conway-gol/simulation`
- it lets the app intercept in-app navigations before they become full document reloads
- it keeps browser back/forward behaviour aligned with SPA navigation

The frontend still does one important thing manually: the initial render. The Navigation API does not emit a `navigate` event for the first page load, so `AppRouter.start()` explicitly renders `currentPath()` once at boot, then subscribes to later navigation events.

##### Navigation API specifics

This project uses the Navigation API as an implementation detail behind `NavigationAdapter`, not as a global dependency leaked throughout the app.

Concretely, that means:

- screens do not call `window.navigation` directly
- router logic does not depend on browser event shapes outside the adapter
- only `NavigationApiAdapter` knows how to translate browser navigations into app route changes

This is important because the Navigation API has a different model from the old History API:

- navigations can be intercepted before a document reload
- the adapter can await `finished` for programmatic navigations
- the app can opt out of intercepting unsupported navigation cases

At the same time, the app does not depend on the Navigation API for the first render. On the initial page load:

- the browser loads the document at `/conway-gol/login`, `/conway-gol/simulation`, etc.
- no `navigate` event is fired for that first load
- `AppRouter.start()` reads the current browser URL directly and renders the matching screen

So the Navigation API is used for subsequent in-app transitions, while the initial route is handled explicitly at startup.

##### Deployment implications of real routes

Because the app uses real document paths instead of hashes, direct loads and refreshes must still resolve to the SPA entry document.

That is not server-side rendering. It simply means the static host or web server must serve `index.html` for frontend routes such as:

- `/conway-gol/login`
- `/conway-gol/simulation`
- `/conway-gol/zoo`
- `/conway-gol/drawing`

Once the document is loaded, the client-side router takes over.

In production, this is handled by the Nginx rule for the frontend location:

```nginx
location /conway-gol/ {
  alias /var/www/1991computer/conway-gol/front/;
  try_files $uri $uri/ /conway-gol/index.html;
}
```

That rule ensures:

- an in-app navigation intercepted by the Navigation API stays client-side
- a hard refresh on `/conway-gol/zoo` still returns the SPA document
- the app can use real paths without `#` fragments

##### Base path handling

The app is deployed under `/conway-gol/`, not at the domain root. Because of that, router paths are normalized in two directions:

- `stripBasePath()` converts browser URLs such as `/conway-gol/zoo` into app paths such as `/zoo`
- `toDocumentPath()` converts app paths such as `/drawing` back into deployable document paths such as `/conway-gol/drawing`

This keeps route definitions clean while still supporting deployment under a subdirectory.

##### Interception rules

`NavigationApiAdapter` only intercepts navigations that should stay inside the SPA. It ignores:

- hash-only changes
- downloads
- form submissions
- cross-origin navigations
- URLs outside the configured base path
- paths not registered as app routes

That prevents the SPA from accidentally hijacking browser navigations it should not own.

##### Route resolution and fallback

`AppRouter` stores route definitions in a normalized path map. During render:

- `/` is redirected to the configured fallback route
- unknown paths are also redirected to the fallback route
- known paths create a new screen instance for that route

This keeps route handling explicit and avoids silent partial rendering of invalid states.

##### Screen lifecycle

Each navigation goes through a strict sequence:

1. leave the current screen
2. destroy the current screen if it exposes `destroy()`
3. clear the outlet
4. mount the next screen
5. call `enter()` with `{ path, url, query }`

`AppRouter` also uses a render token to protect against async race conditions. If a newer navigation finishes before an older screen has completed `enter()`, the older screen is immediately left and destroyed instead of staying mounted in a stale state.

##### Route context

Screens receive a small route context object:

| Field | Type | Purpose |
|---|---|---|
| `path` | `AppPath` | Normalized app route such as `/simulation` |
| `url` | `URL` | Full browser URL |
| `query` | `URLSearchParams` | Parsed query string for route-driven behavior |

That is enough for the current needs without coupling screens to the adapter or the browser directly.

##### Current route table

The current route registry is intentionally small:

| Route | Screen |
|---|---|
| `/login` | `LoginScreen` |
| `/simulation` | `SimulationScreen` in random mode |
| `/zoo` | `SimulationScreen` in zoo mode |
| `/drawing` | `SimulationScreen` in drawing mode |

`SimulationScreen` delegates the actual mode-specific workspace behavior to `SimulationWorkspace`, which maps route state to Conway mode state.

#### Simulation and seeding

`Simulation` in `front/src/Grid/Simulation.ts` is the pure Conway engine. It:

- owns the current and next `Uint8Array` buffers
- applies Conway rules and toroidal neighbour wrapping
- exposes read/write methods for cells
- delegates random-mode initialization to a seeding strategy

`RandomPresetSeeder` in `front/src/Grid/seeding/RandomPresetSeeder.ts` is the entry point for random-mode initial states. It receives a flat cell buffer plus grid dimensions and dispatches to one of three focused modules:

- `randomPresetShapeSeeders.ts` — re-export barrel; actual implementations live in `seeding/shapes/`:
  - `shapes/stamp.ts` — stamp-based presets: `stars`, `circles`, `sinus`, `clusters`
  - `shapes/field.ts` — field-formula presets: `rings`, `stripes`, `checker`, `diagonal`, `cross`
  - `shapes/conway.ts` — **Primordial bits** preset (`conway`)
- `randomPresetFractalSeeders.ts` — fractal presets: `sierpinski` (Sierpiński triangle), `cantor` (Cantor dust), `hilbert` (Hilbert curve)
- `randomPresetNoise.ts` — the `noise` preset and the `applySpatialNoiseMask` post-processing step shared by all other presets

Shared types and interfaces live in `randomPresetTypes.ts`; the Mulberry32 PRNG and FNV-1a preset hasher live in `randomPresetUtils.ts`.

Each preset supports two behaviours:

- a stable deterministic default when entering random mode or switching preset
- a random variation when the user clicks `Generate`

Generation is controlled by a `RandomSeedParams` object:

| Field | Type | Description |
|---|---|---|
| `density` | `number` 0–1 | Fill fraction applied with a quadratic curve (`t²`), so the slider feels sparse at the low end and full at 100 % |
| `noiseType` | `"uniform" \| "perlin-like" \| "clusters" \| "gradient" \| "edge-bias" \| "center-burst" \| "interference" \| "marbling"` | Spatial distribution; for non-noise presets a smooth mask is applied post-generation |
| `seed` | `number \| null` | Non-null seeds the Mulberry32 PRNG for deterministic replay; `null` uses the preset's FNV-1a hash (stable default) or `Math.random()` (Generate) |
| `noiseLevels` | `Record<NoiseType, number>` (0–1) | Per-noise-type intensity values. The UI stores one slider value per noise type and reuses it when switching tiles. |

All presets are calibrated so that `density = 1` nearly fills the current grid (`GRID_ROWS × GRID_COLS`).

`front/src/Grid/randomPresets.ts` is the source of truth for preset ids, labels, and the default preset. The UI and engine both read from this file, so the preset list is not duplicated.

Grid geometry is configured in `front/src/Grid/constants.ts`:

- `GRID.SIZE` is the single square grid size source of truth (in cells)
- grid dimensions are normalized to a positive odd value (`GRID_SIZE`) so the board always has one exact center cell
- pixel dimensions are derived from `CELL_SIZE`, so resizing cells and resizing the grid stay consistent

#### Rendering and drawing interaction

`Grid` in `front/src/Grid/Grid.ts` owns one `Simulation` and does two things:

- render simulation state to the main canvas
- delegate drawing-mode mouse interactions to `GridDrawingHandler`

Mode-specific initialization is split into private methods:

- `_initializeRandom()` seeds the selected random preset and saves the base grid snapshot
- `_initializeZoo()` loads a catalog pattern through `Data`
- `_initializeDrawing()` wires the toolbox, zoom box, custom save selector, and `GridDrawingHandler`

`GridDrawingHandler` in `front/src/Grid/GridDrawingHandler.ts` owns all drawing-mode state and mouse handling (cursor visibility, zoom area, pencil/eraser paint, hover overlay). It communicates with `Grid` exclusively through callbacks (`getCell`, `setCell`, `renderCell`, `emitStateChange`, `getPreviewCellColor`) — no direct reference to `Grid` or `Simulation`.

`gridTransforms.ts` in `front/src/Grid/gridTransforms.ts` exposes `transformGrid(baseGrid, angleDeg, zoomLevel)`, a pure function that applies rotation and zoom to a cell grid in a single inverse-mapping pass. Positive `angleDeg` rotates clockwise; `zoomLevel` maps to an exponential scale factor with a neutral centre at 0 → ×1.00, ranging from −100 → ×0.05 to +100 → ×16. The original grid is never mutated.

`Grid` stores a `_baseGrid` snapshot each time a preset is seeded. Rotation and zoom sliders call `setRotation()` / `setZoom()`, which re-apply `transformGrid` against the stored snapshot and re-seed the simulation — no new random generation is triggered.

This keeps Conway logic out of the renderer, DOM event handling out of `Simulation`, and drawing interaction out of `Grid`.

`SimulationWorkspace` in `front/src/app/simulation/SimulationWorkspace.ts` is the workspace orchestrator. It sits above `Grid` and owns:

- the shell DOM for left pane, canvas area, and right pane
- mode-specific UI visibility
- telemetry counters and charts
- playback telemetry tracking for fixed points (`stable after`) and repeating loops (`cycle period`)
- drawing-mode restore snapshot lifecycle: the first `Play` captures the current grid, `Restore` re-seeds from that saved state, and loading/importing/mode changes clear the snapshot
- random preset controls and the custom dropdown, including rotation, zoom, and reset
- reusable tile-button groups for route mode selection and random noise type selection
- route-to-mode synchronization between `/simulation`, `/zoo`, and `/drawing`

#### UI helpers and data access

`front/src/ui/controls/` contains DOM-facing UI controls, split by domain:

- `shared/CustomSelect.ts`: reusable custom dropdown controller backed by a hidden native `<select>`, with configurable visible-option count
- `shared/TileButtonGroup.ts`: reusable tile-button primitive used by typed selectors
- `simulation/ModeSelector.ts`: tile-button mode switching
- `simulation/NoiseTypeSelector.ts`: tile-button random noise switching
- `simulation/RandomControlsPanel.ts`: random preset dropdown plus density, rotation, zoom, noise type, and seed controls, and the Generate / Reset buttons
- `simulation/ZooSelector.ts`: pattern selection in zoo mode
- `drawing/DrawingToolBox.ts`: pencil/eraser selection
- `drawing/ImageImporter.ts`: image-to-grid import control (file picker, threshold slider, tooltip)
- `drawing/UserCustomSelector.ts`: save/load of custom drawings
- `telemetry/telemetryTheme.ts`: reads CSS design tokens and provides the shared telemetry chart drawing theme

`front/src/ui/components/` contains small shared markup primitives used by the workspace shell:

- `button/createButton.ts`: shared button template helper
- `slider/createSlider.ts`: shared labeled range-slider template helper plus `syncSliderFill()` for active-track fill

`front/src/lib/image/ImageSeeder.ts` is the image processing library. It is deliberately kept outside the Grid and UI layers because it has no dependency on Conway rules, canvas state, or DOM access. It is imported only by `ImageImporter`. See [Image import pipeline](#image-import-pipeline) below.

The telemetry charts share reusable renderers under `front/src/ui/controls/telemetry/`:

- `SignedSeriesChart.ts`: compact signed chart used for metrics centered around zero, such as alive-cell variation
- `PositiveSeriesChart.ts`: compact positive-only chart used for monotonic-from-zero metrics, such as the absolute alive-cell count
- `AliveVariationChart.ts`: left-panel playback graph that renders the signed per-step change in living cells
- `AliveCountChart.ts`: left-panel playback graph that renders the absolute number of living cells over time

`Data` in `front/src/data/Data.ts` fetches catalog or custom patterns, centers them on the current grid dimensions, and exposes a plain `number[][]` seed for the simulation. After `load()` resolves, `Data.comments` holds the pattern's metadata lines for the caller to display.

`ZoomBox` in `front/src/Grid/zoom/ZoomBox.ts` renders the magnified 14x14 area around the cursor in drawing mode.

#### Shared custom select

The custom dropdown used in the workspace right pane is now a shared UI primitive instead of two separate implementations.

`CustomSelect` in `front/src/ui/controls/shared/CustomSelect.ts` owns:

- synchronization between the hidden native `<select>` and the custom trigger/menu UI
- menu open/close behavior
- outside-click and `Escape` dismissal hooks
- selected-state rendering
- a `visibleOptionCount` configuration that controls how many rows are visible before the menu scrolls

The visual skin for this primitive lives in `front/src/styles/main/custom-select.css`.

Current consumers:

- `RandomControlsPanel` uses it for the random preset selector
- `ZooSelector` uses it for the species selector

Because both controls now share the same controller and stylesheet, visual updates to the custom dropdown should be made in the shared component instead of per-screen CSS.

#### Shared slider primitive

The workspace sliders now share one markup helper and one visual skin instead of each pane styling native range inputs independently.

`createSliderField()` in `front/src/ui/components/slider/createSlider.ts` renders:

- a legend row above the control
- the slider label left-aligned
- the live value right-aligned
- the range input and any optional overlay/extra content (for example the disabled-seed tooltip target or the random-seed checkbox block)

`syncSliderFill(input)` updates the CSS custom property `--ui-slider-percent`, which drives the cyan filled portion of the track from the start of the slider up to the current value.

The visual skin for every shared slider lives in `front/src/styles/main/slider.css`.

Current consumers:

- `SimulationWorkspace` uses it for the FPS slider
- `RandomControlsPanel` uses it for density, rotation, zoom, noise level, and seed
- `ImageImporter` uses it for the threshold slider

Visual or interaction changes to workspace sliders should now be made in the shared slider primitive instead of per-screen CSS.

#### HTTP facade and frontend services

The frontend now keeps Axios behind a small shared HTTP facade instead of calling it directly from domain-oriented classes.

`HttpClient` in `front/src/infra/http/HttpClient.ts` is the transport layer. It:

- wraps the shared Axios instance
- applies the shared API base URL via `getRequestURL()`
- exposes typed `get()` and `post()` helpers
- returns response payloads directly instead of leaking `AxiosResponse`

Business-facing services compose `HttpClient` and expose domain data:

- `CritterService` lists catalog or custom critter names
- `PatternService` loads and normalizes remote patterns
- `UserCustomService` lists and saves user-created patterns

This keeps the dependency direction explicit:

- UI and workspace classes depend on services
- services depend on `HttpClient`
- only `HttpClient` depends on Axios

As a result, frontend code outside `front/src/infra/http/` should not import Axios directly.

`front/src/helpers/dom.ts` centralizes strict DOM lookup helpers such as `queryRequired()` and `getRequiredContext2D()`. This removes scattered nullable DOM assumptions from the rest of the frontend code.

`front/src/helpers/api.ts` exposes `getRequestURL()`, which constructs absolute API URLs from the shared `API_BASE_PATH` constant in `helpers/constants.ts`.

`front/src/helpers/canvas.ts` exposes `drawGrid()`, a standalone canvas utility used by both `Grid` and `ZoomBox`.

`front/src/assets/icons/` contains the shared inline SVG icons used by the workspace shell, including:

- route mode icons (`random`, `zoo`, `drawing`)
- random noise type icons (`uniform`, `perlin-like`, `clusters`, `gradient`, `edge-bias`, `center-burst`, `interference`, `marbling`)

### API

The Nest API is split into focused modules:

- `HealthModule` exposes `GET /health`
- `PatternsModule` handles catalog and custom-pattern endpoints
- `PrismaModule` manages database access

Catalog patterns are read from `api-nest/data/patterns/`.

Custom patterns are stored in SQL through Prisma.

### Front/API routing

The frontend always calls the same-origin API prefix `/conway-gol/api`.

In local development, Vite proxies that prefix to `http://localhost:6300`, so frontend code does not need separate dev vs prod URLs.

## Frontend Design System

The current UI refactor introduces a lightweight design system intended to make visual iteration fast without tying the app to a framework or component library.

### Source of truth

The token entry point is `front/src/styles/tokens.css`.

The real token definitions are split by family under `front/src/styles/tokens/`.

Those files centralize:

- shared surfaces and text colors
- accent colors
- one global radius token
- left/right pane layout widths
- canvas rendering colors
- telemetry chart colors
- field and dropdown styling tokens

`front/src/styles/main.css` consumes those tokens for layout and component styling.

For canvas-based telemetry, `front/src/ui/controls/telemetry/telemetryTheme.ts` reads the CSS tokens at runtime and converts them into a JS theme object. This keeps the DOM/CSS layer and the canvas rendering layer visually aligned.

### Visual principles

The design system currently follows these rules:

- dark base surfaces with cyan/blue accents
- a single radius token for geometric consistency
- muted secondary text and bright numeric accents
- glass-like panels used sparingly on structural panes and charts
- no default browser blue on custom interactive controls
- login and workspace screens can have different background treatments without changing the shared base theme
- Conway canvas remains readable first; decorative effects should never compete with the grid

### Token groups

Important token families:

| Group | Purpose |
|---|---|
| `tokens/colors.css` | Core shell colors, canvas colors, telemetry colors, and field colors |
| `tokens/effects.css` | Shared shadows and glow effects |
| `tokens/layout.css` | Shell layout widths and workspace sizing tokens |
| `tokens/radius.css` | Global radius tokens such as `--radius` |

### Current custom components

The current visual system includes a few custom controls that are intentionally styled outside the browser defaults:

- reusable tile-style buttons with inline SVG icons
- telemetry charts drawn directly on canvas with a shared theme
- shared flat custom dropdown used by the random preset and zoo species selectors
- shared labeled slider primitive with cyan active fill and right-aligned numeric readout
- custom random noise type selector using the same tile-button primitive as the route mode selector
- gradient CTA buttons with alternate hover/active states

The tile-button primitive is designed to stay reusable:

- same geometry, icon slot, and label slot across different selector groups
- size can be chosen at markup time (`md`, `sm`, etc.) through the screen template helper
- labels can stay short in the tile while accessibility labels and titles preserve the full meaning

When extending the UI, prefer adding or reusing tokens before introducing one-off colors, radii, or shadows directly in component CSS.

## Frontend Code Map

Main dependency direction in the frontend:

```text
index.ts
  ├── NavigationApiAdapter
  ├── AppRouter
  │   ├── LoginScreen
  │   └── SimulationScreen
  │       └── SimulationWorkspace
  │           ├── Grid
  │           │   ├── Simulation
  │           │   │   └── IRandomPresetSeeder -> RandomPresetSeeder
  │           │   ├── GridDrawingHandler (drawing mode only)
  │           │   ├── gridTransforms (rotation + zoom — pure function)
  │           │   ├── Data -> PatternService -> HttpClient
  │           │   └── ZoomBox (drawing mode only)
  │           ├── ModeSelector
  │           ├── CritterService -> HttpClient
  │           ├── AliveVariationChart -> SignedSeriesChart -> telemetryTheme
  │           ├── AliveCountChart -> PositiveSeriesChart -> telemetryTheme
  │           ├── DrawingToolBox
  │           ├── ZooSelector
  │           ├── UserCustomSelector -> UserCustomService -> HttpClient
  │           └── ImageImporter -> ImageSeeder (lib/image)
```

Design rules used by the current frontend:

- `Simulation` and random seeding stay free of DOM and canvas logic.
- `Grid` reads simulation state and handles canvas interaction, but does not implement Conway rules.
- `SimulationWorkspace` orchestrates the shell, mode-specific controls, and route-aware workspace state, but does not implement Conway rules itself.
- `AppRouter` owns screen lifecycle and browser path changes, not screen business logic.
- Required DOM access should go through `front/src/helpers/dom.ts`.
- Data loading (`Data`) does not touch the DOM. Pattern comments are returned to the caller via `Data.comments` and rendered by `SimulationWorkspace._renderComments()`.
- Cross-module imports use path aliases (`@app`, `@cell`, `@data`, `@grid`, `@helpers`, `@infra`, `@lib`, `@navigation`, `@router`, `@services`, `@simulation`, `@views`). Intra-module imports (same folder or immediate subfolder) use relative `./` paths.
- `front/src/lib/` is the home for domain-agnostic utilities that are not UI components, not Grid logic, and not infrastructure. Currently it contains `lib/image/` for image processing.

## Image import pipeline

The image import feature converts an arbitrary image file into a Conway grid entirely client-side. No server is involved.

### Flow

```text
File (user picks)
  │
  ├─ magic-byte validation      detectImageMime() — 16 bytes read from the file header
  │
  ├─ size check                 file.size > 10 MB → rejected
  │
  ├─ createImageBitmap()        browser decodes the image natively
  │
  ├─ OffscreenCanvas            image scaled to grid dimensions (contain/letterbox, aspect-ratio preserved)
  │                             white fill behind image → transparent areas become DEAD
  │
  ├─ getImageData()             raw RGBA pixel array (cols × rows × 4 bytes)
  │
  ├─ pixelsToNormalisedGrayscale()
  │     1. luminance per pixel: 0.299 × R + 0.587 × G + 0.114 × B  (ITU-R BT.601)
  │     2. histogram stretching: [min, max] → [0, 255]
  │        so any image, bright or dark, always uses the full contrast range
  │
  ├─ floydSteinberg()           binary dithering with adjustable threshold
  │     for each pixel:
  │       quantised = old < threshold ? 0 : 255    (dark → ALIVE, bright → DEAD)
  │       err = old - quantised
  │       diffuse err to 4 neighbours:
  │         right:        7/16
  │         bottom-left:  3/16
  │         bottom:       5/16
  │         bottom-right: 1/16
  │     error diffusion preserves perceived brightness and keeps shapes recognisable
  │
  └─ number[][]                 `GRID_ROWS × GRID_COLS` grid passed to Grid.seedFromGrid()
```

The grayscale buffer is kept in memory by `ImageImporter` after the first import. Moving the threshold slider re-runs `floydSteinberg()` on the stored buffer without reloading or rescaling the image.

### Format validation (magic bytes)

`file.type` in the browser is derived from the file extension and is trivially spoofable (renaming `document.pdf` to `image.png` fools it). `ImageSeeder` instead reads the first 16 bytes of the file and checks the actual binary signature:

| Format | Signature (hex) | Offset |
|--------|----------------|--------|
| JPEG   | `FF D8 FF` | 0 |
| PNG    | `89 50 4E 47 0D 0A 1A 0A` | 0 |
| GIF87a / GIF89a | `47 49 46 38 (37\|39) 61` | 0 |
| WebP   | `52 49 46 46 ?? ?? ?? ?? 57 45 42 50` | 0 (RIFF) + 8 (WEBP) |
| BMP    | `42 4D` | 0 |
| AVIF   | `66 74 79 70` at offset 4 (ftyp box), then `61 76 69 (66\|73)` at offset 8 (avif/avis brand) | 4 |

A file with an unrecognised signature is rejected with a SweetAlert2 error listing the accepted formats before `createImageBitmap` is ever called.

### Threshold slider

The slider (0–255) controls the `threshold` argument to `floydSteinberg`:

- **low values** (close to 0): only the very darkest pixels become ALIVE → sparse grid
- **128** (default): roughly half the pixels become ALIVE based on luminance
- **high values** (close to 255): most pixels become ALIVE → dense grid

The slider is disabled until the first image is loaded. After an image has been imported, starting playback disables it again until playback is stopped. Hovering over a disabled slider before the first import shows a tooltip via the shared `Tooltip` component.

### Relevant files

| File | Role |
|------|------|
| `front/src/lib/image/ImageSeeder.ts` | Image processing: magic-byte detection, grayscale conversion, histogram normalisation, Floyd-Steinberg dithering |
| `front/src/ui/controls/drawing/ImageImporter.ts` | UI component: file input, threshold slider, tooltip, SweetAlert2 error handling |
| `front/src/ui/components/slider/createSlider.ts` | Shared labeled slider markup helper plus active-fill sync utility |
| `front/src/Grid/Grid.ts` | Exposes `seedFromGrid(grid)` used by `ImageImporter` callback |
| `front/src/styles/main/slider.css` | Shared slider skin used by playback, random controls, and image threshold |
| `front/src/styles/main/side-panels.css` | Drawing-pane layout and threshold tooltip overlay positioning |
| `front/src/styles/main/buttons.css` | `.image-import-btn` included in the shared button hover/active transition group |

## Running Locally

### Prerequisites

- Node.js 20.19+ or 22.12+
- pnpm
- MariaDB/MySQL

### API

The API expects `api-nest/.env` to define at least:

- `PORT`
- `DATABASE_URL`
- `CATALOG_DIR`

Run locally:

```bash
cd api-nest
pnpm install
pnpm prisma migrate deploy
pnpm start:dev
```

Default local API port is `6300`.

### Frontend

```bash
cd front
pnpm install
pnpm check
pnpm dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

Useful frontend scripts:

- `pnpm check` runs the full local validation (`lint` + `typecheck`)
- `pnpm lint` runs Biome checks from `front/biome.json`
- `pnpm lint:fix` applies Biome fixes (`--write --unsafe`)
- `pnpm format` reformats the frontend and re-runs Biome writes
- `pnpm test` runs the frontend unit tests with Vitest
- `pnpm typecheck` runs TypeScript only
- `pnpm build` verifies the production bundle locally

Additional frontend tooling notes:

- Vite now uses `lightningcss` for CSS transforms and production CSS minification.
- Google Fonts loading is declared in `front/src/index.html` with `preconnect` hints instead of being imported from `main.css`.
- `.vscode/settings.json` points the editor to `front/biome.json` so local formatting and linting stay aligned with the repo config.

## Testing

### Frontend

The frontend unit tests use `Vitest`, configured in `front/vitest.config.ts`.

Run them locally:

```bash
cd front
pnpm test
```

Current frontend tests are intentionally small and focused on pure simulation-adjacent logic. The first suite lives in `front/src/app/simulation/PlaybackTelemetryTracker.test.ts` and covers:

- `stable after` for still lifes
- `stable after` after extinction settles
- oscillator detection via `cycle period`
- a regression case for the zoo pattern `dinnertable` (period 12)

Because these tests target a pure tracker module instead of the DOM workspace shell, they run in a plain Node environment and stay fast.

### API

The Nest API test runner remains `Jest`.

Useful commands:

```bash
cd api-nest
pnpm test
pnpm test:e2e
pnpm test:cov
```

## Deployment

### Frontend

Deploy the frontend from the repo root:

```bash
./deploy-front.sh
```

Production layout on the server:

```text
/var/www/1991computer/conway-gol/
  front/
  .front-releases/
  .front.bak/
  .front-current-release
  .front-previous-release
```

The script builds locally, uploads `front/dist` into a hidden release directory, atomically replaces `front/`, validates through nginx, and keeps rollback metadata.

Manual rollback:

```bash
./deploy-front.sh rollback
```

### API

Deploy the API from the repo root:

```bash
export DATABASE_URL='mysql://...'
./deploy-api.sh
```

Production layout on the server:

```text
/var/www/1991computer/conway-gol/
  api-nest/
  .api-nest-releases/
  .api-nest.bak/
```

The script uploads a staged Nest release, installs dependencies on the server, runs Prisma migrations, builds the app, atomically promotes the release into `api-nest/`, and restarts PM2.

Manual rollback:

```bash
./deploy-api.sh rollback
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Healthcheck with DB connectivity |
| GET | `/list` | List catalog pattern names |
| GET | `/list?subdir=user-custom` | List public custom pattern names |
| GET | `/pattern/:name` | Fetch a pattern as plain text |
| GET | `/critter/:name` | Legacy alias of `/pattern/:name` |
| GET | `/usercustom` | List public custom patterns |
| POST | `/usercustom/:filename` | Save or update a public custom pattern |

## Pattern File Format (.hxf)

Catalog patterns are stored as JSON with the `.hxf` extension:

```json
{
  "comments": ["Pattern name / author", "https://conwaylife.com/..."],
  "automata": [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [0, 1, 1, 0]
  ],
  "position": [20, 20]
}
```

- `automata`: matrix where `1` is alive and `0` is dead
- `position`: optional placement offset, otherwise the frontend centers the pattern
- `comments`: metadata lines

Custom patterns are submitted in the same JSON shape through `POST /usercustom/:filename`, but are persisted in the database rather than the filesystem.

## Refactoring History

### Phase 16 - Drawing-mode Restore snapshot (2026-03)

Drawing mode gained a `Restore` button next to `Clear canvas`.

Unlike a generic reset, `Restore` does not blank the grid or regenerate a pattern. Instead, `SimulationWorkspace` stores a full-grid `number[][]` snapshot the first time playback starts for the current drawing session.

- The button stays disabled until that first `Play` click has captured a snapshot.
- `Restore` stops playback, resets the iteration counter and telemetry charts, and re-seeds `Grid` from the stored snapshot.
- Loading a different custom drawing, importing an image, or leaving/re-entering drawing mode clears the stored snapshot so stale state is never restored.

**Files involved:** `front/src/app/simulation/SimulationWorkspace.ts`, `front/src/app/views/html/workspaceView.ts`, `front/src/ui/controls/drawing/texts.ts`

### Phase 14 - Interference and marbling noise types (2026-03)

Two additional `NoiseType` values extend random seeding and spatial post-masks:

| Type | Behaviour |
|---|---|
| `interference` | Two slightly mis-tuned sine waves along different axes; their product yields moiré-style beats and fringes that read clearly when the grid is dense. |
| `marbling` | Coordinates are domain-warped with low-frequency sinusoids, then a product of sines is evaluated — vein-like, marble or wood-grain structure at high density. |

**Implementation:** `fillInterferenceNoise` and `fillMarblingNoise` in `front/src/Grid/seeding/randomPresetNoise.ts`; `applySpatialNoiseMask` uses the same low-mask preference as `center-burst` (threshold `0.5`). **UI:** `noiseInterferenceIcon.ts` and `noiseMarblingIcon.ts` (inline SVG, same tile-selector stroke styling as existing noise icons), labels in `front/src/texts.ts`, options in `workspaceView.ts` and `RandomControlsPanel.ts`.

### Phase 15 - Drawing-mode zoom viewport expanded to 14×14 (2026-03)

The zoom canvas shown while drawing was enlarged from a 7×7 to a 14×14 cell neighbourhood around the cursor.

**Viewport and sizing**

- `ZOOM_SIZE` is now a flat constant (`14`) instead of being derived from a radius. `ZOOM_CANVAS_PX` is computed dynamically as `CELL_SIZE × ZOOM_LEVEL × ZOOM_SIZE` (896 px at default settings), so resizing the viewport only requires changing `ZOOM_SIZE`.
- `ZoomBox` sets the container, wrapper, and canvas dimensions at construction time from `ZOOM_CANVAS_PX` rather than relying on CSS fixed values.

**Cursor focus point**

`ZOOM_RADIUS` (always equal to `(size − 1) / 2`, integer) was replaced by `ZOOM_FOCUS`:

```ts
export const ZOOM_FOCUS = {
  x: Math.floor((ZOOM_SIZE - 1) / 2),
  y: Math.floor((ZOOM_SIZE - 1) / 2),
} as const;
```

With an even-sized viewport the focus cell sits in the upper-left slot of the central 2×2 block — one deterministic cell is still highlighted, and the viewport shows three more cells ahead of the cursor than behind it.

**Boundary cell tinting**

A new theme token `zoomBoundaryCellColor` (`rgba(117, 161, 205, 0.24)`) and a matching CSS variable `--canvas-zoom-boundary-color` distinguish out-of-grid cells from regular dead cells in the zoom canvas. `getZoomCanvasCellColors()` returns this tint for both `BORDER` and `OUTSIDE` states, while the main canvas keeps using `getCanvasCellColors()` unchanged. Boundary cells skip the 1 px inset so they fill the full cell square, visually reinforcing the grid edge.

**Clipped grid lines**

`_drawGrid()` (full canvas) was replaced by `_drawVisibleGrid()`, which first calls `_getVisibleBounds()` to compute the bounding box of non-boundary cells, then draws grid lines and a border rectangle only over that region. When the cursor is near the edge, grid lines are not drawn over the tinted boundary area.

### Phase 11 - Random mode transforms, Grid split, and Reset (2026-03)

#### Rotation and zoom sliders

Two new sliders were added to the random mode right pane below the density slider.

**Rotation** (−180° → +180°, centred at 0):

- Rotates the seeded cell pattern around the grid centre.
- Positive values rotate clockwise (screen coordinates).

**Zoom** (−100 → +100, centred at 0):

- Maps to an exponential scale factor with a neutral centre: 0 → ×1.00, −100 → ×0.05, +100 → ×16.
- Values greater than 0 zoom in (pattern fills more of the grid); values less than 0 zoom out.
- The displayed label shows the computed factor in real time (e.g. "×2.00").

Both transforms are applied to the stored base-grid snapshot via a single inverse-mapping pass in `transformGrid`. No re-seeding is triggered; the base pattern remains stable while rotation and zoom are adjusted freely.

**Reset button** was added to the right of Generate. It restores all controls — preset, density, rotation, zoom, noise type, seed — to their initial values and re-seeds the grid from scratch (`randomPresetVariation = false`, iteration counter and charts cleared).

#### Grid module split

`Grid.ts` was split into three focused files:

| File | Responsibility |
|------|----------------|
| `Grid.ts` | Orchestration: constructor, public API (`processNextGeneration`, `reseedRandomPreset`, `setRotation`, `setZoom`, `resetTransforms`, `seedFromGrid`), rendering (`_render`, `_renderCell`, `_drawGrid`), and `_applyTransforms` |
| `GridDrawingHandler.ts` | All drawing-mode mouse handling: cursor visibility, zoom area, pencil/eraser paint, hover overlay. Communicates with `Grid` through five callbacks only — no direct reference to `Grid` or `Simulation` |
| `gridTransforms.ts` | `transformGrid(baseGrid, angleDeg, zoomLevel)` — a pure, DOM-free function combining rotation and zoom in one inverse-mapping pass |

#### Algorithm — `transformGrid`

For each target cell `(row, col)`:

```
dx = (col − cx) / scale        // inverse zoom
dy = (row − cy) / scale
srcCol = cx + dx·cos(θ) + dy·sin(θ)   // inverse rotation
srcRow = cy − dx·sin(θ) + dy·cos(θ)
```

Nearest-neighbour rounding maps each source coordinate back to a grid cell. At 0° + ×1.00 the base grid is returned unchanged (identity fast-path). At angles that are not multiples of 90°, discrete sampling introduces expected aliasing on a 156×156 cell grid.

**New files:**

| File | Role |
|------|------|
| `front/src/Grid/GridDrawingHandler.ts` | Drawing-mode mouse handler, decoupled from Grid via callbacks |
| `front/src/Grid/gridTransforms.ts` | Pure `transformGrid` function (rotation + zoom) |

### Phase 12 - Workspace layout: viewport-relative vertical positioning (2026-03)

The workspace layout was reworked so that the canvas and both side panes are always positioned relative to the viewport height, independently of each other's content height.

**Problem:** after adding rotation and zoom sliders to the right pane in Phase 11, the right pane became significantly taller. Because the flex container used `align-items: center`, a taller pane pushed its top edge upward and overlapped the "Back to login" button in the top-right corner.

**Root cause:** all three flex children (left pane, canvas wrapper, right pane) shared the same vertical centering anchor. Any change in one item's height shifted the others' visual positions.

**Fix — three independent anchors, all `align-self: flex-start` with `padding-top` driven by `100vh`:**

| Element | Rule | Effect |
|---|---|---|
| `.canvas-wrapper` | `align-self: flex-start; padding-top: max(0px, calc((100vh - 826px) / 2))` | Canvas is vertically centred in the viewport at all times, regardless of pane heights |
| `.left-pane` | `align-self: flex-start; margin-top: max(60px, calc(60px + (100vh - 826px) / 2))` | Left pane top is 60 px below the canvas top on any viewport |
| `.right-pane` | `align-self: flex-start; padding-top: max(60px, calc(60px + (100vh - 826px) / 2))` | Right pane top is 60 px below the canvas top on any viewport |

The `826px` constant is `canvas height (780 px) + container vertical padding (46 px)`. The `max(60px, …)` floor prevents the panes from riding above the canvas top on very short viewports.

This makes vertical layout a pure function of `100vh` rather than a side-effect of whichever flex child is tallest.

**File changed:** `front/src/styles/main/workspace.css`

### Phase 10 - Client-side image import (2026-03)

A fully offline image-to-grid import feature was added to drawing mode. No server round-trip is involved; the entire pipeline runs in the browser.

**Processing pipeline:**

1. Magic-byte validation — the first 16 bytes of the uploaded file are read and matched against known signatures (JPEG, PNG, GIF, WebP, BMP, AVIF). Files with a spoofed extension are rejected before any decoding is attempted.
2. `createImageBitmap` decodes the file into a hardware-accelerated bitmap.
3. An `OffscreenCanvas` (grid-sized) is filled white and the bitmap is drawn into it with contain/letterbox scaling (`scale = Math.min(cols/w, rows/h)`), centred with pixel-accurate offsets.
4. `getImageData` extracts the RGBA pixel buffer.
5. ITU-R BT.601 luminance converts each pixel to a float grayscale value; fully-transparent pixels are forced to white (DEAD).
6. Histogram stretching maps the actual `[min, max]` luminance range to `[0, 255]`, ensuring full contrast regardless of the original image exposure.
7. Floyd-Steinberg dithering converts the grayscale buffer to a binary 0/1 grid. Quantisation error is diffused to four neighbours so the perceived brightness distribution is preserved and shapes remain recognisable at 5 px/cell resolution.

**New code:**

| File | Role |
|---|---|
| `front/src/lib/image/ImageSeeder.ts` | Pure processing library — format detection, grayscale, dithering |
| `front/src/ui/controls/drawing/ImageImporter.ts` | UI component — file picker, formats label, threshold slider |

**Threshold slider:** always visible but disabled until an image is imported. Re-running only `floydSteinberg()` on slider input (the grayscale buffer is kept in component state) avoids reloading the image. Once playback starts in drawing mode, the slider is disabled again until playback stops so the imported threshold cannot be edited mid-simulation. A tooltip appears on pointer-hover over the disabled slider before the first import.

**`@lib` alias** was added to both `vite.config.ts` and `tsconfig.json` so `ImageSeeder` can be imported outside the Grid layer without a relative path.

### Phase 13 - Primordial bits preset and shapes/ module split (2026-03)

#### New preset: Primordial bits (`conway`)

A fourteenth random preset was added, designed around classic Conway life patterns. Unlike the other presets, the density slider controls **cell count per shape** (not shape count), producing a visual range from a single 3-cell blinker at 1–5% to a dense multi-ring organism of 80+ cells at 100%.

Two generation modes are chosen randomly on each `Generate`:

| Mode | Behaviour |
|---|---|
| **grow** | One tight cluster. Motifs are stamped within a radius `packRadius = √density × 15`, biased toward the centre with `rng² × packRadius`. The overlapping stamps fuse into a single organism that becomes more complex as density increases. |
| **scatter** | 1–3 ring-spaced constellations. Motif count is split across constellations; the number of constellations grows gently with density (more separate small shapes). |

**Density mapping.** The slider uses a quadratic curve (`density = (slider/100)²`), so `√density` is used inside the seeder to recover a linear proxy of the raw slider position. This spreads the visual change evenly: slider 30% → 5 motifs, slider 100% → 15 motifs.

**Motif library.** 18 hand-coded patterns in four complexity tiers, unlocked progressively:

| Complexity | Unlocked at slider | Examples |
|---|---|---|
| 1 | 0–25% | blinker, L-corner, zigzag (3 cells) |
| 2 | 25–50% | block, tub, boat, beehive, loaf (4–7 cells) |
| 3 | 50–75% | glider, R-pentomino, toad, beacon (5–8 cells) |
| 4 | 75–100% | LWSS, acorn, B-heptomino, pi-heptomino (7–9 cells) |

**Symmetry.** ~50% chance of none; otherwise h-mirror or v-mirror (never forced 4-fold). About 12% of motif placements break the mirror for an organic feel.

**Noise type + level.** The spatial noise mask applies normally for every noise type, including `uniform`. The per-type **Noise level** slider controls mask strength (threshold/mix) and acts as a zone filter for tight motifs: a motif often survives or disappears as a unit rather than being eroded pixel-by-pixel.

#### shapes/ subfolder

`randomPresetShapeSeeders.ts` (359 lines) was split into a `seeding/shapes/` subfolder so each preset family can be read and extended independently:

| File | Contents |
|---|---|
| `shapes/stamp.ts` | Stamp-based presets: `stars`, `circles`, `sinus`, `clusters` |
| `shapes/field.ts` | Field-formula presets: `rings`, `stripes`, `checker`, `diagonal`, `cross` |
| `shapes/conway.ts` | Primordial bits preset: motif library, `stampConwayMotif`, `getConstellationPositions`, `seedConway` |
| `shapes/index.ts` | Assembles and exports `SHAPE_RANDOM_PRESET_SEEDERS` |

`randomPresetShapeSeeders.ts` is now a one-line re-export barrel. `RandomPresetSeeder.ts` is unchanged.

### Phase 9 - Fractal presets, new noise types, and seeder module split (2026-03)

Three fractal random presets were added:

| Preset | Algorithm |
|---|---|
| `sierpinski` | Sierpiński triangle drawn recursively via subdivision |
| `cantor` | Cantor dust — repeated removal of middle thirds in both axes |
| `hilbert` | Hilbert space-filling curve drawn iteratively |

Three new noise types were added to `NoiseType`, raising the total from three to six:

| Type | Behaviour |
|---|---|
| `gradient` | Linear directional gradient at a random angle; cells in the "bright" half of the sweep are kept alive |
| `edge-bias` | Density concentrates toward the grid edges; the centre is sparser |
| `center-burst` | Density radiates outward from the centre; the centre is densest |

These types work both as the direct generation algorithm for the `noise` preset and as spatial post-processing masks for all other presets, consistent with the existing `perlin-like` and `clusters` behaviour.

The monolithic `RandomPresetSeeder.ts` (~660 lines) was split into five focused modules so each preset family and its supporting utilities can be read and extended independently. `RandomPresetSeeder.ts` is now a thin orchestrator; all implementation lives in `randomPresetShapeSeeders.ts`, `randomPresetFractalSeeders.ts`, `randomPresetNoise.ts`, `randomPresetTypes.ts`, and `randomPresetUtils.ts`. The public API exported from `RandomPresetSeeder.ts` is unchanged.

### Phase 8 - Shared HTTP facade and service composition (2026-03)

HTTP access in the frontend was moved behind a shared transport layer so domain code no longer calls Axios directly:

- `HttpClient` was introduced under `front/src/infra/http/` as the single Axios-backed transport entry point
- services now compose `HttpClient` instead of importing Axios
- `CritterService` and `PatternService` were added alongside `UserCustomService` so list loading and pattern loading follow the same service pattern
- service methods now return domain payloads directly instead of `AxiosResponse`
- `Data` and `SimulationWorkspace` were updated to use services rather than performing direct HTTP requests

This clarified the dependency chain between transport, service layer, and UI/workspace orchestration while keeping Axios isolated in one place.

### Phase 7 - Frontend tooling and import cleanup (2026-03)

The frontend toolchain and source layout were normalized so day-to-day changes follow one consistent path:

- `Biome` was added as the frontend formatter/linter, with shared scripts in `front/package.json` and repository-level editor wiring via `.vscode/settings.json`.
- `Vite` and `tsconfig` aliases were extended to cover app-level modules (`@navigation`, `@router`, `@simulation`, `@views`) so cross-module imports no longer depend on deep relative paths.
- The Google Fonts stylesheet was moved from CSS imports into `index.html`, making external asset loading explicit and allowing `preconnect` hints.
- `drawGrid` now uses a named-parameter helper signature, which keeps canvas call sites clearer where zoom and color are optional.
- A broad frontend formatting pass aligned TypeScript and CSS files with the new Biome conventions without changing the main simulation architecture.

### Phase 6 - Left playback telemetry and FPS slider (2026-03)

The left control column was reorganized into separated visual sections so that playback status reads as a single stack:

- mode buttons
- iteration counter
- `stable after` and `cycle period` counters
- a telemetry block with alive cells, dead cells, and a live variation graph
- an FPS slider with inline numeric readout
- the start / pause button

The playback status block now distinguishes two different long-term outcomes:

- `Stable after` is used only for fixed points, where one generation is exactly identical to the previous one and the grid will therefore remain unchanged forever.
- `Cycle period` is used for repeating loops, where a previously seen full-grid state reappears after one or more different generations, covering oscillators such as blinkers as well as longer periods.

The new `AliveVariationChart` control does not plot the total number of living cells. Instead, it plots the signed delta between two successive states:

- points above the center line mean the alive-cell count increased
- points below the center line mean the alive-cell count decreased
- the dotted horizontal midline is the zero-variation reference
- the final marker turns green when the variation is positive and red when it is negative
- the legend now shows the latest signed delta beside the chart title, using the same positive / negative / neutral color coding as the latest point

The telemetry stack now also includes an `AliveCountChart` directly below the variation graph. Unlike the delta graph, it plots the absolute number of living cells over time:

- the curve rises when the population grows and falls when it shrinks
- the bottom axis is zero and the top of the chart tracks the current visible maximum
- the last marker stays neutral because the chart encodes magnitude rather than signed change
- the legend now shows the latest absolute alive-cell count beside the chart title

The chart keeps the axes inside the canvas, including single-sided arrowheads at the top of the Y axis and the end of the X axis. The left panel width and numeric columns were also fixed so changing counters no longer causes horizontal layout jitter.

FPS control was changed from a free-text input to a range slider (`0` to `60`). `0` effectively freezes generation updates while keeping the playback UI active; values above `0` set the target generations per second used by the animation loop.

### Phase 3 - Random preset seeding split (2026-03)

The random-mode feature was separated into explicit layers:

- `randomPresets.ts` defines preset metadata in one place
- `RandomPresetSeeder` owns preset-specific generation rules
- `Simulation` delegates seeding instead of implementing preset logic inline
- `Main` renders the preset selector from shared metadata
- `Grid` now uses typed per-mode options instead of a long positional constructor

This made the random mode easier to extend without pushing more UI concerns into the simulation engine.

### Phase 5 - Random mode generation controls (2026-03)

Random mode now exposes four interactive generation controls:

- **Density slider** (0–100 %) — controls how much of the canvas is filled. A quadratic curve (`t²`) is applied so that small values stay sparse and 100 % gives a nearly full grid.
- **Noise type buttons** (`Uniform` / `Perlin-like` / `Clusters` / `Gradient` / `Edge bias` / `Center burst` / `Interference` / `Marbling`) — for the `noise` preset these drive the generation algorithm directly; for all other presets a smooth large-scale spatial mask is applied after generation to concentrate the pattern in coherent regions.
- **Noise level slider** (0–100 %) — intensity control applied to the currently selected noise type. The value is stored per noise type, and the label updates to include the active type.
- **Seed slider + "Random seed" checkbox** — a fixed seed feeds the Mulberry32 PRNG for exact replay. When the checkbox is checked, `seed = null` and either the preset's deterministic FNV-1a hash or `Math.random()` is used instead. The slider is always enabled; the checkbox governs whether its value matters.

`RandomSeedParams` (`density`, `noiseType`, `seed`, `noiseLevels`) threads through the full call chain: `Main` → `Grid.reseedRandomPreset` → `Simulation.seedByPreset` → `RandomPresetSeeder.seedInto`.

All ten preset algorithms were reworked so that `density = 1` nearly fills the canvas:

| Preset | Change |
|---|---|
| `stars` | Rejection-sampling removed; `baseCount = rows × cols / 4` (~6 000 shapes), direct stamping with overlap |
| `circles` | Redesigned as discrete random filled or hollow circles; `baseCount = rows × cols / 250` |
| `sinus` | Base wave count raised from 5 to 40; fixed layout bug that placed waves beyond index 5 off-canvas |
| `rings` | Phase-based fill (`phase < density → alive`) replaces the fixed 50 % alternating band |
| `stripes` | Fill fraction = `density` (`thick/period = density`), was fixed at ~33 % |
| `checker` | Wang hash per block for a smooth 0 % → 50 % → 100 % transition without randomness |
| `clusters` | Up to 196 clusters at 100 % (was 16); radius scales with grid size |
| `diagonal` | Fill fraction = `density`, was fixed at ~29 % |
| `cross` | Arm thickness = `(minSide / 2) × density`, was a fixed 3 px |
| `noise` | Unchanged; density = alive-cell probability, noiseType = generation algorithm |

When an explicit seed is provided, `effectiveRandom = true` is forced so all preset methods use their random-position paths — ensuring that changing the seed produces a visually different layout while remaining fully reproducible.

### Phase 4 - Service layer cleanup and path aliases (2026-03)

Several concerns that had been mixed together were separated and the import graph was made explicit:

- `Helpers.ts` was split into two focused modules: `helpers/api.ts` (`getRequestURL`) and `helpers/canvas.ts` (`drawGrid`). The `API_BASE_PATH` constant was moved to `helpers/constants.ts` alongside `URLS`.
- `Data.factory()` was renamed to `Data.load()`. DOM manipulation (rendering pattern comments) was removed from `Data` entirely. `Data.comments` is now read by the caller after the promise resolves, and `Main._renderComments()` handles display using safe DOM APIs (`createElement`, `createTextNode`, `replaceChildren`) instead of `innerHTML`.
- `Grid` gained an optional `onLoad` callback in its options. It is called with `data.comments` after a zoo or drawing pattern finishes loading, letting `Main` display comments without `Grid` or `Data` knowing about the DOM.
- `ZoomBox` was updated to import `drawGrid` from `@helpers/canvas` (it was still using the old `Helpers` class).
- Path aliases were added to `tsconfig.json` and `vite.config.ts`: `@app`, `@cell`, `@data`, `@grid`, `@helpers`, `@navigation`, `@router`, `@services`, `@simulation`, `@views`. All cross-module imports across the frontend now use these aliases.

### Phase 2 - Simulation / Renderer split (2026-03)

The main frontend refactor separated simulation logic from rendering:

- `Simulation` became a pure engine with flat typed arrays
- `Grid` became a renderer plus interaction layer
- per-frame deep cloning of `Cell[][]` was removed
- the hot path stopped allocating on every generation

This significantly reduced memory churn and made the Conway loop easier to reason about and test.
