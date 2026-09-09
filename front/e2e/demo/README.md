# Demo film

One Playwright run that drives the app the way a hand would, records it as a single continuous
video, and writes the chapter list beside it. No editing: the take *is* the video, and the chapter
file is what goes in the description.

```bash
pnpm video:generate
```

Output lands in `e2e/demo/out/` (gitignored):

- `cgl-demo.mp4` — the take, h264, **1920×1080** — the viewport, never 4K — with the chapters
  written into the file itself
- `chapters.txt` — `0:00 Title` per line, for a human to read
- `chapters.vtt` — WebVTT, for `<track kind="chapters">` on the portfolio's own `<video>`
- `chapters.ffmeta` — ffmpeg metadata; already applied to the mp4, kept so a re-encode can reapply it
- `chapters.json` — the same marks with millisecond precision
- `shots/01-random.png` … `04-drawing.png` — four stills at 3840×2160, for a page that wants
  pictures too

This is a port of PFA's harness (PFA-180), which is a port of Trekker's, which is a port of Zeus's,
which is a port of Spira's. `pacing.ts`, `recorder.ts`, `chapters.ts` and `cursor.ts` are
byte-identical to PFA's; `fixture.ts` is PFA's — `Demo.glide` included — with the output renamed and
`hideDevChrome()` left as a documented no-op; `preflight.ts` and `playwright.demo.config.ts` are the
same files with the CGL-specific parts changed. The full write-up of how it works and why — the CDP
screencast, the drawn pointer, the encode, and every trap found building it — is
`front/e2e/demo/HOW-TO-FILM-A-DEMO.md` in the Spira repo, and Zeus's `e2e/demo/README.md` carries
the traps that console found. Only `cgl.demo.ts` knows what CGL is.

## What it needs before it will record

`preflight.ts` refuses to launch a browser until the first two are true, and names whichever one is
not. The rest it cannot check.

1. **The front on `localhost:5173`** — `pnpm dev`. Vite paints nothing over the page — no dev
   badge, no devtools — so the dev server is what the takes are filmed on, and `hideDevChrome()`
   has nothing to do here. Let a hot reload finish before starting a take: the app has no HMR
   handlers, so a change under `src/` while a take runs is a full reload in the middle of the film.
2. **The Nest API on `localhost:6300`** — `cd api-nest && pnpm start:dev`, with `CATALOG_DIR` in
   `api-nest/.env` pointing at the full catalogue (`api-nest/data/patterns`, 1432 names). Preflight
   probes `/auth/me` — its 401 is the answer it wants; the API declares no global prefix — and then
   `/list`, which must hold more than a thousand names: without the API the Zoo picker falls back
   to fourteen built-in species, `prepulsarshuttle26` does not exist, and the take would film the
   wrong thing.
3. **A browser to film with** — `pnpm exec playwright install chromium`, once.
4. **ffmpeg on `PATH`** with libx264, the mp4 muxer and the `concat` demuxer — `brew install ffmpeg`
   (8.0.1 is what the takes so far were encoded with), or `DEMO_FFMPEG` pointing at one.

No credential. The take signs in as a guest, which is client-side (`authSessionService.setGuest()`
in `LoginView.ts`): no `.env.test.local`, no setup project, nothing to put back between takes. The
house dev account is a later ticket, in PFA-179's shape; when it comes, only the first chapter
changes.

`settle()` in `fixture.ts` adds one more check on the real page: every stylesheet the document asked
for has loaded and `document.fonts.ready` has resolved before a frame is kept. It was written for
Spira's icon font, and it matters here for real: `index.html` loads JetBrains Mono and Space Grotesk
from fonts.googleapis.com, so a take filmed offline would be a take in system fonts, and nothing
else would notice.

## Nothing is written, and nothing is real

A guest cannot save, favorite or reach settings, and the storyboard touches none of the export,
import, save or favorite controls anyway: nothing the take does reaches the API in writing, and the
drawing of chapter 4 lives in memory and is gone on the next navigation. What is on screen is a
guest, the public catalogue, and a drawing the take makes itself. Every take starts from the same
state; there is no reset.

## The take

Four chapters, **82.3s — a minute and twenty-two**, at the default `DEMO_SPEED=1`.

| | |
|---|---|
| 0:00 Sign in | the login form, *Continue as guest* — nothing typed |
| 0:03 Random | the page arrives already randomized; the two dice, quickly — *randomize parameters*, then *Add geometry* on what it drew, each masked crossfade played to the end; then a state worth playing, built by hand: *Reset*, the preset menu wheeled to *Hilbert curve*, the *Marbling* tile, the density dragged to 70 %, the grid reseeding on every step; *start* the moment it is there — a guard wants 3 000 alive cells first; the FPS slider dragged to 30 while it runs, the telemetry column read — iteration, alive and dead cells, the two graphs under them — and *pause* |
| 0:31 Zoo | the *Zoo* tile; *Patterns list* on the whole catalogue, the count in its title, a short scroll through the cards; `prepulsar` typed into the search, a tiny scroll, the `prepulsarshuttle26` card clicked; the pattern and its comments; *start*, fifty generations, *pause* |
| 1:01 Drawing | the *Drawing* tile; pencil and *Square* left as they are, the brush dragged to 8; four squares tapped around the centre cell, the shape menu to *Circle*, one tap to the side; *start*, a few seconds of the drawing living its life, the pointer parked off-frame |

## The stills

`demo.shot("name", prepare?)` marks four screens. It takes no picture at the time — it writes down
the URL, and the pictures are taken at the very end, once the recorder has stopped and the mp4 is
closed, by sending the same guest page back to each URL. They come out at 3840×2160, lossless PNG,
animations frozen, caret hidden, the harness's overlays painted out.

- `random` — `/simulation`, which randomizes on entry: the point of the screen, and why the still
  is a revisit. Its `prepare` presses *randomize parameters* again while the grid holds fewer than
  2 500 alive cells, because the randomizer is honest about the whole range of its knobs — a zoom
  at ×0.15 leaves a hundred cells in the middle of an empty grid — and this still is the card's
  thumbnail.
- `zoo` — `/zoo?pattern=prepulsarshuttle26`: the pattern reloads from the URL, comments included.
- `zoo-patterns` — the same URL, with a `prepare` that opens *Patterns list* and fills the search,
  since neither survives a revisit.
- `drawing` — `/drawing`, with a `prepare` that sets the brush through the real controls (the
  slider by its arrow keys, the shape by its menu) and presses the same four squares and the circle
  with plain Playwright: the drawing lives in memory only, and a revisit is an empty grid. The
  pointer is moved off the canvas before the shutter, or the brush preview would be in the picture.

All three prepares are repeatable and write nothing.

## CGL-specific traps

**Marks, not words.** Every element the storyboard touches carries a `data-testid` — ~35 of them,
added by GOL-3 — with a `data-*` companion where a beat chooses on a fact: `data-route` on the mode
tiles, `data-noise` on the noise tiles, `data-value` on the options of a custom select,
`data-pattern` on a Zoo card. The DOM is built by hand (template strings under
`src/app/views/html/`, `document.createElement` in the modal and the custom select), so the marks
sit where the elements are made, and the helpers take an optional `testId` so nothing is
duplicated: `createButton`, `createSliderField` (the input gets `<id>-slider`, its value span
`<id>-value`), `createTileSelectorButton` (`testId`, plus `testData` for the companions) and
`CustomSelect` (`<id>-trigger` on the trigger, `<id>-option` on every option it creates, beside its
`data-value`). `@texts` is read only to check what a control says once it has been used.

**Two things have no element to aim at.** The cells of the drawing canvas are one `<canvas>`, and
the thumb of a range slider is a pseudo-element. `Demo.glide(x, y)` walks the real pointer to a
point, and the storyboard wraps it in `page.mouse.down()` / `page.mouse.up()`: a real drag for a
native `<input type="range">` — the value follows the pointer — and a real stroke for
`GridDrawingHandler`, which listens to mousedown/mousemove/mouseup on `#canvas-drawing`. A slider
beat then lands the exact value with ArrowLeft/ArrowRight (the press focused the input) and asserts
it; the thumb's position is worked out from the input's box, its range and the thumb's computed
width. A cell is converted to a client point through the canvas's bounding box and `CELL_SIZE`: the
handler maps `offsetX` to a column as `floor(x / 5) - 1`, so column `c` is the band
`[(c + 1) * 5, (c + 2) * 5)` and the hand goes to its middle. The canvas is not CSS-scaled
(`.canvas-stack` is `max-content`), and the box width is checked against `CANVAS_PX_WIDTH` so a
scaled canvas fails the take rather than painting the wrong cells.

**Every transition plays to the end.** *Add geometry* and *randomize parameters* run a masked
crossfade on the grid (`CELL_PATTERN_CROSSFADE_DEFAULTS`: 280 + 10 + 280 ms, ×0.35 for geometrize)
and get a dwell longer than it runs. The Zoo modal animates in (280 ms) and out (220 ms). A mode
tile is a route change: the workspace is built again for the new screen, its right pane replays a
200 ms entrance, and the FPS slider is back at 12 — the storyboard waits on the URL and on a mark
of the new screen, never on the animation.

**Selecting a pattern does not.** The Zoo writes `?pattern=` with `history.replaceState`, and the
Navigation API reports that as a `navigate` event like any other — which used to reach the router
and render the route again, tearing the workspace down and building it afresh for what is a query
string. The adapter drops it now (GOL-5): a replace that lands on the path the document is already
on is a state update, not a route change, so the live workspace loads the pattern itself. The right
pane keeps its entrance, the counters keep their values, the catalogue list is not fetched a second
time, and the card click is answered by the grid rather than by a teardown. The storyboard asserts
on the URL and on the comment block changing hands, which is the beat itself and not a wait.

**The modal is heavy.** *Patterns list* creates a card for every one of the 1432 names, each with a
preview canvas, an IntersectionObserver for its lazy load and another for its staggered reveal
(rows fade in as they enter the body's viewport — `zoo-modal-body`, the scroll container and the
element the wheel must be over). While it is open every input event is a round trip the page
answers in a tenth of a second or more, so the harness's usual pacing — fifty pointer or wheel
steps a second — would spend ten seconds of screen time on a scroll of a few hundred pixels. The
storyboard asks for its two scrolls in the modal with short `duration`s (few steps, still eased)
and keeps the pointer travel inside it short. The search re-ranks the list on every keystroke and
grows it as card metadata arrives — the copy normalises `Pre-pulsar` to the same needle as
`prepulsar` — so the card is waited for, not counted on.

**The randomizer is random, and geometry dies.** The Random chapter opens on whatever the entry
randomization drew, and *randomize parameters* draws again; two takes never show the same grid,
which is the point of the screen. Neither draw is what gets played. A draw can be a hundred cells —
the entry randomizer also draws a rotation and a zoom, and a zoom at ×0.15 shrinks any preset to a
blob whatever the density says — and *Add geometry* makes solid shapes, which die under the rules in
a generation or two: the first cut pressed *start* on exactly that and filmed the grid empty out.
So the dice are thrown first, quickly, and the state that gets played is built by hand from
*Reset*, which puts rotation, zoom, noise and density back to their defaults: *Hilbert curve*, the
*Marbling* tile (always a real click — *Reset* left the tiles on *Uniform*), the density dragged to
70 % — some eight thousand alive cells that stay busy for hundreds of generations — and a guard of
3 000 alive cells before *start*, so a beat that left a blob fails the take instead of filming it.

## Knobs

All environment variables, no env file: `DEMO_SPEED` (4 for a dry run), `DEMO_HEADED=1`,
`DEMO_WIDTH` / `DEMO_HEIGHT`, `DEMO_SCALE=1` (the stills at 1920×1080; the mp4 is 1080p either
way), `DEMO_TITLES=on`, `DEMO_CURSOR=off`, `DEMO_FPS`, `DEMO_CRF`, `DEMO_FFMPEG`,
`DEMO_RECORDER=playwright`, `E2E_BASE_URL` (default `http://localhost:5173`), `DEMO_API_URL`
(default `http://localhost:6300`, what preflight probes).

## What this run actually measured

On an Apple-silicon Mac, at 1920×1080 with the default 2× supersampling, the front on `pnpm dev`.

| | |
|---|---|
| The take | 82.3s, 4 chapters, **1786 frames at 21.7fps** — the app repaints on every generation and on every hover, and sits still between them, so the screencast lands where Zeus's and Trekker's do |
| The file | **12.2 MB**, h264, 1920×1080, 60fps, chapters inside it |
| Stills | 4 × 3840×2160 PNG, 500 KB–1.7 MB each, 3.5 MB the set |
| The run | 2.1 minutes wall clock: the take, the four revisits, the encode |
| Repeatability | the first cut of this storyboard, which pressed *start* eight seconds later and on the wrong grid, came out at 99.8s and 98.6s on consecutive takes with its chapter marks within a second of each other; this cut's dry run at `DEMO_SPEED=4` took 51.0s and its take 82.3s |

## What this ticket changed outside the harness

- `package.json`: `@playwright/test`, `video:generate`.
- `tsconfig.json`: `@e2e/*` → `e2e/*`, with `e2e/**/*.ts` and the config in `include` so
  `pnpm typecheck` covers the harness, and `DOM.Iterable` in `lib` for the fixture's NodeList
  spreads.
- `biome.json`: the harness's output directories excluded — Biome does not read `.gitignore` here,
  and would lint the chapter JSON.
- The root `.gitignore`: `front/e2e/demo/out/`, `front/test-results/`, `front/playwright-report/`.
- ~35 `data-testid`s, one per mark the storyboard touches — the guest button, the mode and noise
  tiles, the playback toggle and the FPS slider, the telemetry counters, the drawing canvas, the
  random pane's buttons, preset and sliders, the Zoo pane and its modal (search, body, count,
  close, cards), the drawing tools, brush shape and size — through the `testId` options above.
