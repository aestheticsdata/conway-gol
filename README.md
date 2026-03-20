# Conway's Game of Life

A full-stack implementation of [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life) with a TypeScript/Canvas frontend and a NestJS API serving a catalog of 1,400+ pre-built patterns plus database-backed custom patterns.

**Live demo:** http://1991computer.com/conway-gol/

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [API Endpoints](#api-endpoints)
- [Pattern File Format (.hxf)](#pattern-file-format-hxf)
- [Refactoring History](#refactoring-history)

## Features

- Random mode with automatic startup seeding
- Zoo mode with 1,400+ catalog patterns
- Drawing mode with save/load for custom patterns
- Zoom view around the cursor
- Adjustable FPS from 1 to 60
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
│   │   ├── Grid/
│   │   ├── controls/
│   │   ├── data/
│   │   ├── helpers/
│   │   ├── services/
│   │   └── styles/
│   ├── vite.config.ts
│   └── package.json
├── deploy-api.sh
├── deploy-front.sh
└── notes.txt
```

## Architecture

### Frontend

`Main` owns the animation loop and wires together the simulation, rendering, and UI controls.

`Simulation` is the pure Conway engine. It uses two flat `Uint8Array` buffers and swaps them on each tick, so a generation step runs without per-frame allocation.

`Grid` renders the simulation to the canvas and handles drawing-mode mouse interaction.

`Data` fetches patterns from the API, centers them on the 156x156 grid, and returns a plain `number[][]` seed.

`ZoomBox` renders a 4x magnified 7x7 area around the cursor.

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
pnpm dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

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

### Phase 2 - Simulation / Renderer split (2026-03)

The main frontend refactor separated simulation logic from rendering:

- `Simulation` became a pure engine with flat typed arrays
- `Grid` became a renderer plus interaction layer
- per-frame deep cloning of `Cell[][]` was removed
- the hot path stopped allocating on every generation

This significantly reduced memory churn and made the Conway loop easier to reason about and test.
