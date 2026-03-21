# Conway's Game of Life

A full-stack implementation of [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life) with a TypeScript/Canvas frontend and a NestJS API serving a catalog of 1,400+ pre-built patterns plus database-backed custom patterns.

**Live demo:** http://1991computer.com/conway-gol/

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Frontend Code Map](#frontend-code-map)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [API Endpoints](#api-endpoints)
- [Pattern File Format (.hxf)](#pattern-file-format-hxf)
- [Refactoring History](#refactoring-history)

## Features

- Random mode with named presets, three generation controls (density, noise type, seed), and a `Generate` action for a new variation
- Zoo mode with 1,400+ catalog patterns
- Drawing mode with save/load for custom patterns
- Zoom view around the cursor
- Left-side playback telemetry with iteration count, live/dead cell counts, and a real-time alive-cell variation graph
- Adjustable FPS from 0 to 60 via slider
- Toroidal grid with wraparound edges

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | TypeScript, Canvas 2D API, Vite |
| HTTP client | Axios |
| UI | SweetAlert2 |
| Backend | NestJS 11, Prisma, MariaDB/MySQL |
| Build | Vite, Nest CLI, Prisma |
| Process manager | PM2 |
| Deploy | Bash deploy scripts with releases and rollback |

## Project Structure

```text
conway-gol/
├── api-nest/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/
│   │   ├── health/
│   │   ├── patterns/
│   │   └── prisma/
│   ├── data/patterns/
│   ├── prisma/schema.prisma
│   ├── ecosystem.config.js
│   └── package.json
├── front/
│   ├── src/
│   │   ├── index.ts
│   │   ├── index.html
│   │   ├── Cell/
│   │   │   └── constants.ts
│   │   ├── Grid/
│   │   │   ├── Grid.ts
│   │   │   ├── Simulation.ts
│   │   │   ├── constants.ts
│   │   │   ├── randomPresets.ts
│   │   │   ├── seeding/
│   │   │   │   └── RandomPresetSeeder.ts
│   │   │   └── zoom/
│   │   │       └── ZoomBox.ts
│   │   ├── controls/
│   │   │   ├── AliveVariationChart.ts
│   │   │   ├── AliveVariationChart.constants.ts
│   │   │   ├── DrawingToolBox.ts
│   │   │   ├── ModeSelector.ts
│   │   │   ├── UserCustomSelector.ts
│   │   │   └── ZooSelector.ts
│   │   ├── data/
│   │   │   ├── Data.ts
│   │   │   └── species/
│   │   ├── helpers/
│   │   │   ├── api.ts
│   │   │   ├── canvas.ts
│   │   │   ├── constants.ts
│   │   │   └── dom.ts
│   │   ├── services/
│   │   │   └── UserCustomService.ts
│   │   └── styles/
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
├── deploy-api.sh
├── deploy-front.sh
└── README.md
```

## Architecture

### Frontend

The frontend is split between orchestration, simulation, rendering, and DOM-facing controls.

#### Entry point and app wiring

`Main` in `front/src/index.ts` is the composition root. It:

- resolves required DOM nodes and canvas contexts up front
- owns the animation loop and FPS control
- switches between `random`, `zoo`, and `drawing` modes
- shows or hides mode-specific UI blocks
- instantiates `Grid` with typed mode-specific options instead of a long positional constructor
- populates the random preset selector from shared preset metadata

#### Simulation and seeding

`Simulation` in `front/src/Grid/Simulation.ts` is the pure Conway engine. It:

- owns the current and next `Uint8Array` buffers
- applies Conway rules and toroidal neighbour wrapping
- exposes read/write methods for cells
- delegates random-mode initialization to a seeding strategy

`RandomPresetSeeder` in `front/src/Grid/seeding/RandomPresetSeeder.ts` owns random-mode initial states. It receives a flat cell buffer plus grid dimensions and fills the buffer for named families such as `stars`, `rings`, `checker`, or `noise`.

Each preset supports two behaviours:

- a stable deterministic default when entering random mode or switching preset
- a random variation when the user clicks `Generate`

Generation is controlled by a `RandomSeedParams` object:

| Field | Type | Description |
|---|---|---|
| `density` | `number` 0–1 | Fill fraction applied with a quadratic curve (`t²`), so the slider feels sparse at the low end and full at 100 % |
| `noiseType` | `"uniform" \| "perlin-like" \| "clusters"` | Spatial distribution; for non-noise presets a smooth mask is applied post-generation |
| `seed` | `number \| null` | Non-null seeds the Mulberry32 PRNG for deterministic replay; `null` uses the preset's FNV-1a hash (stable default) or `Math.random()` (Generate) |

All presets are calibrated so that `density = 1` nearly fills the 156 × 156 grid.

`front/src/Grid/randomPresets.ts` is the source of truth for preset ids, labels, and the default preset. The UI and engine both read from this file, so the preset list is not duplicated.

#### Rendering and drawing interaction

`Grid` in `front/src/Grid/Grid.ts` owns one `Simulation` and does two things:

- render simulation state to the main canvas
- translate drawing-mode mouse events into simulation edits

Mode-specific initialization is split into private methods:

- `_initializeRandom()` seeds the selected random preset
- `_initializeZoo()` loads a catalog pattern through `Data`
- `_initializeDrawing()` wires the toolbox, zoom box, and custom save selector

This keeps Conway logic out of the renderer and keeps DOM event handling out of `Simulation`.

#### UI helpers and data access

`front/src/controls/` contains DOM-facing UI components:

- `AliveVariationChart.ts`: left-panel playback graph that renders the signed per-step change in living cells
- `ModeSelector.ts`: radio-button mode switching
- `DrawingToolBox.ts`: pencil/eraser selection
- `ZooSelector.ts`: pattern selection in zoo mode
- `UserCustomSelector.ts`: save/load of custom drawings

`Data` in `front/src/data/Data.ts` fetches catalog or custom patterns, centers them on the 156x156 grid, and exposes a plain `number[][]` seed for the simulation. After `load()` resolves, `Data.comments` holds the pattern's metadata lines for the caller to display.

`ZoomBox` in `front/src/Grid/zoom/ZoomBox.ts` renders the magnified 7x7 area around the cursor in drawing mode.

`UserCustomService` in `front/src/services/UserCustomService.ts` handles HTTP calls for listing and saving custom patterns.

`front/src/helpers/dom.ts` centralizes strict DOM lookup helpers such as `queryRequired()` and `getRequiredContext2D()`. This removes scattered nullable DOM assumptions from the rest of the frontend code.

`front/src/helpers/api.ts` exposes `getRequestURL()`, which constructs absolute API URLs from the shared `API_BASE_PATH` constant in `helpers/constants.ts`.

`front/src/helpers/canvas.ts` exposes `drawGrid()`, a standalone canvas utility used by both `Grid` and `ZoomBox`.

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

## Frontend Code Map

Main dependency direction in the frontend:

```text
Main (index.ts)
  ├── Grid
  │   ├── Simulation
  │   │   └── IRandomPresetSeeder -> RandomPresetSeeder
  │   ├── Data
  │   └── ZoomBox (drawing mode only)
  ├── ModeSelector
  ├── DrawingToolBox
  ├── ZooSelector
  └── UserCustomSelector -> UserCustomService
```

Design rules used by the current frontend:

- `Simulation` and random seeding stay free of DOM and canvas logic.
- `Grid` reads simulation state and handles canvas interaction, but does not implement Conway rules.
- `Main` orchestrates mode transitions and shared UI state, but does not manipulate cell state directly.
- Required DOM access should go through `front/src/helpers/dom.ts`.
- Data loading (`Data`) does not touch the DOM. Pattern comments are returned to the caller via `Data.comments` and rendered by `Main._renderComments()`.
- Cross-module imports use path aliases (`@cell`, `@controls`, `@data`, `@grid`, `@helpers`, `@services`). Intra-module imports (same folder or immediate subfolder) use relative `./` paths.

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
pnpm typecheck
pnpm dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

Use `pnpm build` to verify the production bundle locally.

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

### Phase 6 - Left playback telemetry and FPS slider (2026-03)

The left control column was reorganized into separated visual sections so that playback status reads as a single stack:

- mode radio buttons
- iteration counter
- a telemetry block with alive cells, dead cells, and a live variation graph
- an FPS slider with inline numeric readout
- the start / pause button

The new `AliveVariationChart` control does not plot the total number of living cells. Instead, it plots the signed delta between two successive states:

- points above the center line mean the alive-cell count increased
- points below the center line mean the alive-cell count decreased
- the dotted horizontal midline is the zero-variation reference
- the final marker turns green when the variation is positive and red when it is negative

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

Three interactive controls were added to random mode, separated by visual dividers:

- **Density slider** (0–100 %) — controls how much of the canvas is filled. A quadratic curve (`t²`) is applied so that small values stay sparse and 100 % gives a nearly full grid.
- **Noise type radio buttons** (`Uniform` / `Perlin-like` / `Clusters`) — for the `noise` preset these drive the generation algorithm directly; for all other presets a smooth large-scale spatial mask (scale = 30 cells) is applied after generation to concentrate the pattern in coherent regions.
- **Seed slider + "Random seed" checkbox** — a fixed seed feeds the Mulberry32 PRNG for exact replay. When the checkbox is checked, `seed = null` and either the preset's deterministic FNV-1a hash or `Math.random()` is used instead. The slider is always enabled; the checkbox governs whether its value matters.

`RandomSeedParams` (`density`, `noiseType`, `seed`) threads through the full call chain: `Main` → `Grid.reseedRandomPreset` → `Simulation.seedByPreset` → `RandomPresetSeeder.seedInto`.

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
- Path aliases were added to `tsconfig.json` and `vite.config.ts`: `@cell`, `@controls`, `@data`, `@grid`, `@helpers`, `@services`. All cross-module imports across the frontend now use these aliases.

### Phase 2 - Simulation / Renderer split (2026-03)

The main frontend refactor separated simulation logic from rendering:

- `Simulation` became a pure engine with flat typed arrays
- `Grid` became a renderer plus interaction layer
- per-frame deep cloning of `Cell[][]` was removed
- the hot path stopped allocating on every generation

This significantly reduced memory churn and made the Conway loop easier to reason about and test.
