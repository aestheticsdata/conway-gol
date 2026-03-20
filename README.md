# Conway's Game of Life

A full-stack implementation of [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life) featuring a TypeScript/Canvas frontend and a Node.js/Fastify backend serving a catalog of 1,400+ pre-built patterns.

**Live demo:** http://1991computer.com/conway-gol/

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
  - [Frontend](#frontend)
  - [Backend](#backend)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Pattern File Format (.hxf)](#pattern-file-format-hxf)
- [Refactoring History](#refactoring-history)

---

## Features

- **Random mode** — grid randomly seeded at startup (~18% alive)
- **Zoo mode** — browse and load 1,400+ named patterns from the ConwayLife catalog
- **Drawing mode** — paint cells with a pencil/eraser, save and reload custom patterns
- **Zoom view** — 4× magnified 7×7 neighborhood around the cursor
- **FPS control** — adjustable simulation speed (1–60 FPS)
- **Toroidal grid** — cells wrap at edges, no boundary edge cases

---

## Tech Stack

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Frontend  | TypeScript, Canvas 2D API, Vite              |
| HTTP client | Axios                                      |
| UI        | SweetAlert2 (modals)                         |
| Backend   | Node.js, Fastify 5, TypeScript               |
| Build     | Vite (front), tsc + tsc-alias (server)       |
| Deploy    | Bash deploy script with symlink + rollback   |

---

## Project Structure

```
conway-gol/
├── front/                      # Frontend (TypeScript + Vite)
│   ├── src/
│   │   ├── index.ts            # Entry point — Main class, animation loop
│   │   ├── index.html          # HTML shell
│   │   ├── Cell/
│   │   │   └── constants.ts    # Cell state integers: DEAD=0, ALIVE=1, BORDER=2, OUTSIDE=3
│   │   ├── Grid/
│   │   │   ├── Simulation.ts   # Pure Conway engine — double Uint8Array buffer, no DOM
│   │   │   ├── Grid.ts         # Canvas renderer + drawing-mode mouse handling
│   │   │   ├── constants.ts    # CELL_SIZE, GRID_COLS/ROWS, CELL_COLORS, zoom constants
│   │   │   └── zoom/
│   │   │       └── ZoomBox.ts  # 4× magnified 7×7 neighbourhood view
│   │   ├── controls/
│   │   │   ├── ModeSelector.ts       # Radio buttons: random / zoo / drawing
│   │   │   ├── ZooSelector.ts        # Dropdown of available species
│   │   │   ├── DrawingToolBox.ts     # Pencil / eraser tool selector
│   │   │   └── UserCustomSelector.ts # Save / load user drawings
│   │   ├── data/
│   │   │   ├── Data.ts         # Factory — fetches + centers patterns, returns number[][]
│   │   │   └── species/        # Local fallback species definitions
│   │   ├── services/
│   │   │   └── UserCustomService.ts  # GET + POST /usercustom
│   │   ├── helpers/
│   │   │   ├── Helpers.ts      # URL routing helper, canvas grid drawing
│   │   │   └── constants.ts    # URLS
│   │   └── styles/             # CSS
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── deploy_front.sh         # Production deploy with rollback
│
└── server/                     # Backend (Node.js + Fastify)
    ├── src/
    │   ├── server.ts           # Fastify bootstrap, CORS, route registration
    │   └── routes/
    │       ├── api/
    │       │   ├── list.ts         # GET /list
    │       │   ├── critter.ts      # GET /critter/:name
    │       │   └── usercustom.ts   # GET + POST /usercustom
    │       ├── controllers/
    │       │   ├── listController.ts
    │       │   ├── critterController.ts
    │       │   └── usercustomController.ts
    │       └── species/            # .hxf pattern files (1,400+ patterns)
    │           └── user-custom/    # User-saved drawings
    ├── tsconfig.json
    └── package.json
```

---

## Architecture

### Frontend

#### Class overview

```
Main (index.ts)
 ├─ Grid              — canvas renderer + drawing-mode interactions
 │   ├─ Simulation    — pure Conway engine (no DOM, no canvas)
 │   └─ ZoomBox       — 4× magnified cursor view
 ├─ ModeSelector      — random / zoo / drawing radio buttons
 ├─ ZooSelector       — species dropdown
 ├─ DrawingToolBox    — pencil / eraser
 └─ UserCustomSelector— save / load user patterns
```

**`Main`** is the top-level orchestrator. It owns the `requestAnimationFrame` loop, enforces FPS timing, and routes UI events (mode changes, tool changes, species selection) to the appropriate subsystems.

**`Simulation`** is the pure Conway engine. It owns two flat `Uint8Array` buffers (`_current` and `_next`) representing the full 156×156 grid. On each `tick()`, it applies Conway's rules into `_next`, then swaps the two pointers in O(1) — no allocation, no copy. The grid is **toroidal**: edges wrap around, so neighbour counting never needs boundary special-cases beyond the index arithmetic.

Conway's rules as implemented:
- A live cell with 2 or 3 live neighbours **survives**.
- A live cell with fewer than 2 or more than 3 live neighbours **dies**.
- A dead cell with exactly 3 live neighbours becomes **alive**.

Cell states are plain integers: `DEAD=0`, `ALIVE=1`. Because `ALIVE=1` and `DEAD=0`, the neighbour count is computed by summing the 8 neighbour values directly (no comparisons needed). The flat array index formula is `row * GRID_COLS + col`.

**`Grid`** is a pure renderer. It owns a `Simulation`, reads state via `getCell()`, and paints `fillRect` per cell on the HTML `<canvas>`. It also handles mouse events in drawing mode, translating them into `setCell()` calls on the simulation. No Conway logic lives here.

**`Data`** is a factory that builds the initial grid state as a plain `number[][]` (156×156, values 0/1). For zoo/drawing modes it fetches the `.hxf` file from the server, computes the centering offset, and writes alive cells into the array. `Grid` then calls `simulation.seedFromGrid()` with the result.

**`ZoomBox`** renders a 4× magnified 7×7 neighbourhood around the cursor. It receives a plain `number[][]` area from `Grid` and paints it directly — no internal cell state. It injects its own HTML into the DOM and redraws on every `mousemove`.

#### Simulation loop

```
requestAnimationFrame
  └─ if (now - lastFrame >= 1000 / fps)
       Grid.processNextGeneration()
         ├─ Simulation.tick()
         │    ├─ for each cell: sum 8 neighbours (toroidal wrap)
         │    ├─ apply Conway rules → write result into _next buffer
         │    └─ swap _current ↔ _next  (O(1), zero allocation)
         └─ render all cells to canvas (fillRect per cell)
```

#### URL routing (dev vs production)

`Helpers.getRequestURL()` detects whether the app is running on localhost and selects the correct API base URL accordingly (`http://localhost:5030` vs the production server). This avoids any build-time environment variable configuration.

---

### Backend

#### Endpoints

| Method | Path                  | Description                                 |
|--------|-----------------------|---------------------------------------------|
| GET    | `/list`               | List all species names                      |
| GET    | `/list?subdir=user-custom` | List user-saved pattern names          |
| GET    | `/critter/:name`      | Fetch a species `.hxf` file as plain text   |
| GET    | `/usercustom`         | List user-saved patterns                    |
| POST   | `/usercustom/:filename` | Save a custom drawing                     |

Species files live under `server/src/routes/species/`. The `-custom` suffix on a critter name redirects the lookup to the `user-custom/` subdirectory.

#### Controllers

Each route has a matching controller that handles filesystem I/O (`fs/promises`) and JSON serialization. The split between route registration and controller logic keeps the route files thin.

---

## Running Locally

### Prerequisites

- Node.js ≥ 18
- npm

### Backend

```bash
cd server
npm install
npm run build   # tsc + tsc-alias
npm start       # listens on :5030
```

### Frontend

```bash
cd front
npm install
npm run dev     # Vite dev server with HMR
```

Open `http://localhost:5173` (or the port Vite prints).

---

## Deployment

The frontend is deployed with `front/deploy_front.sh`. It follows a **releases + symlink** strategy:

```
/var/www/1991computer/conway-gol/front/
  releases/
    20240315_143000/   ← previous
    20240320_092000/   ← current (symlinked)
  current -> releases/20240320_092000
```

- Builds locally (`npm run build`), rsync's `dist/` to a timestamped release directory on the server, then atomically updates the `current` symlink.
- On failure, the script automatically rolls back to the previous release.
- Manual rollback: `./deploy_front.sh rollback`
- Only the 3 most recent releases are kept.

---

## Pattern File Format (.hxf)

Patterns are stored as JSON with the `.hxf` extension:

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

- `automata` — 2D array where `1` = alive, `0` = dead. Sparse patterns only need the bounding box; the `Data` factory centers them on the 156×156 grid automatically.
- `position` — optional explicit placement offset (otherwise centered).
- `comments` — free-form metadata lines.

User-drawn patterns are saved in the same format via `POST /usercustom/:filename`.

---

## Refactoring History

### Phase 2 — Simulation / Renderer split (2026-03)

#### Original architecture (before this refactor)

`Grid` was the single class responsible for both running the simulation and rendering to the canvas. It held a 2D matrix of `Cell` objects (`Cell[][]`, 24 336 instances). Each `Cell` carried:
- `_state` — an integer (DEAD/ALIVE/BORDER/OUTSIDE)
- `color` — a CSS color string, recomputed via a `switch` every time `state` was set
- `id` — a UUID generated at construction, never actually read anywhere

The simulation loop (`processNextGeneration`) did:
```
lodash.cloneDeep(Cell[][])       ← deep-copy all 24 336 objects every frame
for each cell: count neighbours  ← read .state on 8 Cell objects
apply Conway rules               ← write .state on the cloned matrix (triggers color recompute)
draw every cell to canvas        ← read .color on each Cell
this._cellsMatrix = clonedMatrix ← swap
```

`ZoomBox` maintained its own `Cell[][]` and received a fresh `Cell[][]` slice from `Grid` on every `mousemove`. `Data` built the initial `Cell[][]` using `new Cell(CELL_STATE.DEAD)` for all 24 336 cells before placing the pattern.

#### Why it was changed

`Cell` mixed two unrelated responsibilities: **simulation state** (domain logic) and **rendering** (`color`, pixel size). This coupling meant:
- Generating the next generation required `cloneDeep` on 24 336 JS objects every frame, allocating heap memory at 60 fps and creating constant GC pressure.
- Setting `.state` silently triggered a color recompute — rendering work happening inside the simulation loop.
- The simulation could not be tested or run in isolation (it was inseparable from the canvas).
- `Cell.size` (pixel width) was a static class property, scattering a rendering constant across the domain model.

**Motivation:** `Cell` was a class that mixed two unrelated responsibilities: simulation state (`ALIVE`/`DEAD`) and rendering concerns (`color`, `id`). This meant that generating the next generation required `lodash.cloneDeep` on 24 336 `Cell` objects every frame (~60×/s), triggering thousands of object allocations and GC pressure. Additionally, because `Cell` owned the color, the simulation loop was implicitly coupled to the renderer and could not be tested or run in isolation.

**What changed:**

| | Before | After |
|---|---|---|
| Cell state storage | `Cell[][]` — 24 336 JS objects | Two `Uint8Array` flat buffers |
| Generation copy cost | `cloneDeep(Cell[][])` — full heap copy | Pointer swap `[_current, _next] = [_next, _current]` — O(1) |
| Colors | Stored on every `Cell` instance | `CELL_COLORS[]` lookup array in `Grid/constants.ts` |
| Cell UUID | Generated on every cell, never used | Removed |
| Simulation testability | Impossible (coupled to canvas) | `new Simulation().tick()` — pure, no DOM |

**New class: `Grid/Simulation.ts`**

Pure Conway simulation engine. Owns two `Uint8Array` buffers (`_current`, `_next`). Public API:
- `seedRandom()` — random seeding at `INITIAL_DENSITY` (~18%)
- `seedDead()` — blank grid
- `seedFromGrid(grid: number[][])` — load from a full-grid snapshot (used by `Data`)
- `tick()` — apply Conway rules, swap buffers
- `getCell(row, col)` / `setCell(row, col, value)` — state accessors
- `toGrid(): number[][]` — serialize current state for saving

**`Grid.ts` is now a pure renderer.** It owns a `Simulation`, reads state via `getCell()`, and paints pixels. It also handles mouse events in drawing mode, translating them into `setCell()` calls. No Conway logic lives here.

**`ZoomBox.ts`** now receives a plain `number[][]` (7×7 area of state values) instead of `Cell[][]`. It renders directly from the array without maintaining its own cell matrix.

**`Data.ts`** builds `grid: number[][]` (all zeros, then sets 1s for alive cells from the pattern). Previously built `Cell[][]`.

**`UserCustomSelector`** — `gridData: CellGrid` replaced by `getGridData: () => number[][]`, a callback injected by `Grid` at construction time. Called at save time to get a live snapshot from `Simulation.toGrid()`.

**`UserCustomService.postCustomDrawing`** — receives `number[][]` directly; the previous `.map(row => row.map(cell => cell.state))` transform is gone.

**Constants centralised in `Grid/constants.ts`:**
- `CELL_SIZE = 5` — single source of truth for cell pixel size (was `Cell.size`, a static class property)
- `GRID_COLS = 156`, `GRID_ROWS = 156`
- `INITIAL_DENSITY = 0.18`
- `ZOOM_LEVEL`, `ZOOM_RADIUS`, `ZOOM_SIZE`, `ZOOM_CANVAS_PX`, `ZOOM_CENTER`
- `CELL_COLORS[]` — color lookup by state index

**Files deleted:**
- `Cell/Cell.ts` — replaced by `Simulation.ts`
- `Grid/Helpers.ts` — was entirely commented out (dead code)
