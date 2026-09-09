import { expect, test } from "@e2e/demo/fixture";
import { CANVAS_PX_WIDTH, CELL_SIZE, GRID_CENTER_COL, GRID_CENTER_ROW } from "@grid/constants";
import { CONTROL_TEXTS, GRID_TEXTS } from "@texts";

import type { Locator, Page } from "@playwright/test";

/**
 * CGL Studio, end to end — one continuous take, four chapters, three screens.
 *
 * This file is the storyboard and nothing else: no pointer paths, no video, no timing arithmetic.
 * Those live in `cursor.ts`, `fixture.ts` and `pacing.ts`, so what is left here reads as a shot
 * list and can be reordered by moving blocks around.
 *
 * Four things it never breaks.
 *
 * IT SIGNS IN AS A GUEST, ON CAMERA. The film opens on the login form and clicks *Continue as
 * guest*. Guest mode is client-side (`authSessionService.setGuest()` in `LoginView.ts`): there is
 * no credential, no saved session and nothing to put back between takes — every take starts from
 * the same state. The house dev account is a later ticket, and only this chapter changes then.
 *
 * IT ADDRESSES MARKS, NOT WORDS. Every element it touches carries a `data-testid` (GOL-3, the same
 * contract as the other seven harnesses), with a `data-*` companion where a beat chooses on a fact
 * (`data-route`, `data-noise`, `data-value`, `data-pattern`). The copy module (`@texts`) is read
 * only to check what a control says once it has been used.
 *
 * IT WRITES NOTHING. A guest cannot save, favorite or reach settings, and the storyboard touches
 * none of the export, import, save or favorite controls anyway. The drawing of chapter 4 lives in
 * memory and is gone on the next navigation, which is why its still repaints it.
 *
 * THE REAL MOUSE DOES THE WORK where there is no element to aim at: the thumbs of the range
 * sliders and the cells of the drawing canvas. `demo.glide` walks the pointer to a point, and the
 * storyboard wraps it in `page.mouse.down()` / `page.mouse.up()` — a real drag for a native
 * `<input type="range">`, a real stroke for `GridDrawingHandler`.
 *
 * And one thing it learned: IT PLAYS WHAT IS WORTH PLAYING. The first cut pressed *start* on
 * whatever *randomize parameters* had just drawn, which can be a hundred cells — and solid
 * geometry dies under the rules in a generation or two. Now the dice are thrown first, quickly,
 * and the state that gets played is built by hand from *Reset*: the entry randomizer also draws a
 * rotation and a zoom, and a zoom at ×0.15 shrinks any preset to a blob whatever the density says.
 */

/** The preset chapter 2 plays — the tenth of fourteen, past the fold of an eight-row menu. */
const PRESET = "hilbert";
/** The noise tile chapter 2 clicks, after *Reset* has put the tiles back on *Uniform*. */
const NOISE = "marbling";
/** Where the density slider is dragged to before *start*: a dense curve that stays busy for hundreds of generations. */
const DENSITY = 70;
/** What the grid must hold before *start* is pressed on it. A beat that left less fails the take. */
const PLAY_MIN_ALIVE = 3000;
/** Where the FPS slider is dragged to while the telemetry column is read. */
const FPS = 30;
/** What chapter 3 types, and the card it clicks: a catalogue pattern, so the API must be up (see `preflight.ts`). */
const SEARCH = "prepulsar";
const PATTERN = "prepulsarshuttle26";
/** How far chapter 3 lets the pattern run before pausing on it. */
const ITERATIONS = 50;
/** Chapter 4's brush, and the cells it taps: four squares around the centre cell, then a circle to the side. */
const BRUSH = 8;
const SQUARES: [number, number][] = [
  [GRID_CENTER_COL - 30, GRID_CENTER_ROW - 30],
  [GRID_CENTER_COL + 30, GRID_CENTER_ROW - 30],
  [GRID_CENTER_COL - 30, GRID_CENTER_ROW + 30],
  [GRID_CENTER_COL + 30, GRID_CENTER_ROW + 30],
];
const CIRCLE: [number, number] = [GRID_CENTER_COL + 52, GRID_CENTER_ROW];

/** The number inside a label such as ` (1432 patterns)` or `256`. */
const digitsOf = (text: string | null) => Number((text ?? "").replace(/\D/g, ""));

/** The random still is the card's thumbnail: below this many alive cells the grid reads as empty. */
const THUMBNAIL_MIN_ALIVE = 2500;

/**
 * The random still's `prepare`. A revisit of `/simulation` randomizes on entry — the point of the
 * screen, and why the still is otherwise a plain revisit — but the randomizer is honest about the
 * whole range of its knobs: a zoom at ×0.15 or a thin preset leaves a hundred cells in the middle
 * of an empty grid, which is a poor thumbnail. So *randomize parameters* is pressed again, the way
 * a hand would, until the grid is worth a picture. Repeatable, and it writes nothing.
 */
async function fillTheGrid(target: Page): Promise<void> {
  const alive = target.getByTestId("alive-cells");
  const randomize = target.getByTestId("random-randomize");
  let count = 0;
  for (let attempt = 0; attempt < 8; attempt++) {
    count = digitsOf(await alive.textContent());
    if (count >= THUMBNAIL_MIN_ALIVE) return;
    await randomize.click();
    // The masked crossfade: 280 ms out, a 10 ms gap, 280 ms in. The grid is read once it is over.
    await target.waitForTimeout(900);
  }
  expect(count, "eight randomizations in a row left the grid nearly empty").toBeGreaterThanOrEqual(THUMBNAIL_MIN_ALIVE);
}

/**
 * A cell of the drawing canvas as a client point. The canvas is not CSS-scaled (`.canvas-stack` is
 * `max-content`, and the box is checked against the pixel width to be sure), and
 * `GridDrawingHandler` maps `offsetX` to a column as `floor(x / CELL_SIZE) - 1` — the first cell's
 * worth of pixels is the grid's outer border — so column `c` owns the band
 * `[(c + 1) * CELL_SIZE, (c + 2) * CELL_SIZE)` and the hand is sent to its middle. Never a pixel
 * written down by hand.
 */
async function cellPoint(canvas: Locator, col: number, row: number): Promise<{ x: number; y: number }> {
  const box = await canvas.boundingBox();
  if (!box) throw new Error("demo: the drawing canvas has no box to point at — is drawing mode on?");
  expect(Math.round(box.width), "the drawing canvas is CSS-scaled: a cell is no longer CELL_SIZE px").toBe(
    CANVAS_PX_WIDTH,
  );
  return {
    x: box.x + (col + 1) * CELL_SIZE + CELL_SIZE / 2,
    y: box.y + (row + 1) * CELL_SIZE + CELL_SIZE / 2,
  };
}

/**
 * Where a range input's thumb sits now, and where it would sit at `target`: the thumb is a
 * pseudo-element with no box of its own, so its centre is worked out from the input's box, the
 * thumb's computed width and the input's range, the way the browser lays it out.
 */
const thumbPoints = (input: Locator, target: number) =>
  input.evaluate((node, wanted) => {
    const el = node as HTMLInputElement;
    const box = el.getBoundingClientRect();
    const thumb = Number.parseFloat(getComputedStyle(el, "::-webkit-slider-thumb").width) || 12;
    const min = Number(el.min);
    const max = Number(el.max);
    const at = (value: number) => box.left + thumb / 2 + ((value - min) / (max - min)) * (box.width - thumb);
    const y = box.top + box.height / 2;
    return { from: { x: at(Number(el.value)), y }, to: { x: at(wanted), y } };
  }, target);

/** Step a focused range input to an exact value with the arrow keys, then insist on it. */
async function landOn(page: Page, input: Locator, target: number): Promise<void> {
  for (let step = 0; step < 60; step++) {
    const value = Number(await input.inputValue());
    if (value === target) break;
    await page.keyboard.press(value < target ? "ArrowRight" : "ArrowLeft");
  }
  await expect(input).toHaveValue(String(target));
}

/**
 * The drawing, made again with plain Playwright: the still's `prepare`. A revisit of `/drawing` is
 * an empty grid — the drawing lives in memory only — so the same brush is set through the real
 * controls (the slider by its keys, the shape by its menu) and the same cells are pressed. Nothing
 * here is written anywhere, and it runs the same on every pass.
 */
async function paintDrawing(target: Page): Promise<void> {
  const canvas = target.getByTestId("drawing-canvas");
  await expect(canvas).toBeVisible();

  const size = target.getByTestId("brush-size-slider");
  await size.focus();
  await landOn(target, size, BRUSH);

  const press = async (col: number, row: number) => {
    const point = await cellPoint(canvas, col, row);
    await target.mouse.move(point.x, point.y);
    await target.mouse.down();
    await target.mouse.up();
  };
  for (const [col, row] of SQUARES) await press(col, row);

  await target.getByTestId("brush-shape-trigger").click();
  await target.locator('[data-testid="brush-shape-option"][data-value="circle"]').click();
  await press(...CIRCLE);

  // Off the canvas: the brush preview and the pencil cursor follow the pointer while it is over
  // the grid, and a still wants the drawing alone.
  const box = await canvas.boundingBox();
  if (box) await target.mouse.move(box.x - 80, box.y + box.height / 2);
}

test("cgl studio, end to end", async ({ demo }) => {
  const page = demo.page;

  const modeTile = (route: string) => page.locator(`[data-testid="mode-tile"][data-route="${route}"]`);
  const toggle = page.getByTestId("playback-toggle");
  const iteration = page.getByTestId("iteration-counter");
  const alive = page.getByTestId("alive-cells");
  const aliveCount = async () => digitsOf(await alive.textContent());
  const iterationCount = async () => digitsOf(await iteration.textContent());

  /** The play button carries the icon of what a press would do next: `pause` while playing. */
  const playing = () => expect(toggle).toHaveAttribute("data-icon", "pause");
  const paused = () => expect(toggle).toHaveAttribute("data-icon", "play");

  /**
   * A native range input, dragged the way a hand would: the pointer walked to the thumb, pressed,
   * walked to where the target value sits, released — the value follows the pointer the whole way
   * — and then the keyboard lands the last pixel: the press focused the input, and the arrow keys
   * step it by one.
   */
  const drag = async (input: Locator, target: number) => {
    await expect(input).toBeVisible();
    const { from, to } = await thumbPoints(input, target);
    await demo.glide(from.x, from.y);
    await demo.dwell(150);
    await page.mouse.down();
    await demo.glide(to.x, to.y);
    await page.mouse.up();
    await landOn(page, input, target);
    await demo.dwell(400);
  };

  /** One press of the brush on a cell: `GridDrawingHandler` paints on `mousedown`. */
  const tap = async (canvas: Locator, col: number, row: number) => {
    const point = await cellPoint(canvas, col, row);
    await demo.glide(point.x, point.y);
    await demo.dwell(150);
    await page.mouse.down();
    await demo.dwell(90);
    await page.mouse.up();
    await demo.dwell(350);
  };

  // ── 1 ── Sign in ─────────────────────────────────────────────────────────
  await demo.open("/login");
  await demo.chapter("Sign in");

  const guest = page.getByTestId("login-guest");
  await expect(guest).toBeVisible();
  await demo.dwell(1200);
  await demo.click(guest);
  await expect(page).toHaveURL(/\/simulation$/, { timeout: 20_000 });

  // ── 2 ── Random ──────────────────────────────────────────────────────────
  await demo.chapter("Random");

  // The page arrives already randomized — a preset, a density, a rotation, a zoom, a noise, a
  // seed, all drawn on entry, which is the point of the screen and why its still is a revisit.
  await expect(alive).toBeVisible();
  await expect.poll(aliveCount).toBeGreaterThan(0);
  await demo.dwell(900);
  demo.shot("random", fillTheGrid);

  // The two dice, quickly: *randomize parameters*, then *Add geometry* on what it drew. Each runs
  // a masked crossfade over the grid (`CELL_PATTERN_CROSSFADE_DEFAULTS`: 280 + 10 + 280 ms, ×0.35
  // for geometrize) and the dwell outlasts it. Neither is what gets played: a draw can be a hundred
  // cells, and solid geometry dies under the rules in a generation or two.
  await demo.click(page.getByTestId("random-randomize"));
  await demo.dwell(800);
  await demo.click(page.getByTestId("random-geometrize"));
  await demo.dwell(600);

  // Then a state worth playing, built by hand. *Reset* puts rotation, zoom, noise and density
  // back to their defaults; the preset menu is wheeled — eight rows show of fourteen, and the wheel
  // goes to whatever is under the pointer — to *Hilbert curve*; the *Marbling* tile is clicked
  // (*Reset* left the tiles on *Uniform*, so this click always does something); the density is
  // dragged up, the grid reseeding on every step of the drag.
  await demo.click(page.getByTestId("random-reset"));
  await demo.dwell(500);
  const presetTrigger = page.getByTestId("random-preset-trigger");
  await demo.click(presetTrigger);
  const presetOptions = page.getByTestId("random-preset-option");
  await expect(presetOptions.first()).toBeVisible();
  await demo.dwell(250);
  await demo.scroll(presetOptions.nth(2), 150, 500);
  await demo.click(page.locator(`[data-testid="random-preset-option"][data-value="${PRESET}"]`), { aim: "text" });
  await expect(presetTrigger).toContainText(GRID_TEXTS.randomPresets[PRESET]);
  await demo.dwell(600);
  await demo.click(page.locator(`[data-testid="noise-tile"][data-noise="${NOISE}"]`));
  await demo.dwell(500);
  await drag(page.getByTestId("random-density-slider"), DENSITY);
  await expect(page.getByTestId("random-density-value")).toContainText(String(DENSITY));

  // *start*, the moment there is something complex on the grid — and the guard says whether
  // there is, so a beat that left a blob fails the take instead of filming it die.
  await expect.poll(aliveCount).toBeGreaterThan(PLAY_MIN_ALIVE);
  await demo.click(toggle);
  await playing();

  // While it runs: the FPS slider dragged up, and a few seconds on the telemetry column — the
  // iteration count, alive and dead cells, the two graphs under them. Then *pause*.
  await drag(page.getByTestId("fps-slider"), FPS);
  await expect(page.getByTestId("fps-value")).toHaveText(String(FPS));
  await demo.moveTo(iteration, { dwell: 900 });
  await demo.moveTo(alive, { dwell: 700 });
  await demo.moveTo(page.getByTestId("dead-cells"), { dwell: 2200 });
  await expect.poll(iterationCount).toBeGreaterThan(0);
  await demo.click(toggle);
  await paused();
  await demo.dwell(500);

  // ── 3 ── Zoo ─────────────────────────────────────────────────────────────
  // A mode tile is a route change: the workspace is built again for the new screen.
  await demo.click(modeTile("/zoo"));
  await expect(page).toHaveURL(/\/zoo/, { timeout: 20_000 });
  await demo.chapter("Zoo");

  const openPatterns = page.getByTestId("zoo-open-patterns");
  await expect(openPatterns).toBeVisible();
  // The default pattern loads from the catalogue: its comment block filling is the sign the API answered.
  const comments = page.getByTestId("zoo-comments");
  await expect(comments).not.toBeEmpty({ timeout: 15_000 });
  await demo.dwell(1200);

  // *Patterns list*: the modal on the whole catalogue, its count in the title, a short scroll
  // through the cards — they reveal row by row as they come into the body's viewport.
  //
  // The scrolls in here are asked for in few steps, on purpose. The modal holds fourteen hundred
  // cards, and every wheel step — every pointer step, too — is a round trip that the busy page
  // answers in a tenth of a second or more, so a scroll paced at the harness's usual fifty steps
  // a second would spend ten seconds of screen time travelling a few hundred pixels. A short
  // `duration` means few steps; the wheel is eased over them all the same.
  await demo.click(openPatterns);
  const modal = page.getByTestId("zoo-modal");
  await expect(modal).toBeVisible();
  const count = page.getByTestId("zoo-modal-count");
  await expect.poll(async () => digitsOf(await count.textContent())).toBeGreaterThan(1000);
  await demo.dwell(900);
  const body = page.getByTestId("zoo-modal-body");
  await demo.scroll(body, 520, 520);
  await demo.dwell(500);

  // The search: the list re-ranks on every keystroke and grows as card metadata arrives (the copy
  // normalises `Pre-pulsar` to the same needle), a tiny scroll, then the card wanted is clicked.
  await demo.click(page.getByTestId("zoo-modal-search"));
  await demo.type(SEARCH);
  const card = page.locator(`[data-testid="zoo-card"][data-pattern="${PATTERN}"]`);
  await expect(card).toBeVisible({ timeout: 15_000 });
  await demo.dwell(700);
  await demo.scroll(body, 120, 300);
  const commentsBefore = await comments.textContent();
  await demo.click(card);
  // The modal animates out and the pattern loads: asserted on the URL and on the comment block
  // changing hands, never waited out.
  await expect(page).toHaveURL(new RegExp(`pattern=${PATTERN}`));
  await expect(modal).toBeHidden();
  await expect(page.getByTestId("zoo-selected-pattern")).toContainText(PATTERN);
  await expect.poll(() => comments.textContent(), { timeout: 15_000 }).not.toBe(commentsBefore);
  await expect(comments).not.toBeEmpty();
  await demo.dwell(1600);
  demo.shot("zoo");
  demo.shot("zoo-patterns", async (target) => {
    await target.getByTestId("zoo-open-patterns").click();
    await expect(target.getByTestId("zoo-modal")).toBeVisible();
    await target.getByTestId("zoo-modal-search").fill(SEARCH);
    await expect(target.locator(`[data-testid="zoo-card"][data-pattern="${PATTERN}"]`)).toBeVisible({
      timeout: 15_000,
    });
  });

  // *start*, and the pattern run to fifty generations before it is paused on.
  await demo.click(toggle);
  await playing();
  await expect.poll(iterationCount, { timeout: 30_000 }).toBeGreaterThanOrEqual(ITERATIONS);
  await demo.click(toggle);
  await paused();
  await demo.dwell(600);

  // ── 4 ── Drawing ─────────────────────────────────────────────────────────
  await demo.click(modeTile("/drawing"));
  await expect(page).toHaveURL(/\/drawing/, { timeout: 20_000 });
  await demo.chapter("Drawing");

  const canvas = page.getByTestId("drawing-canvas");
  await expect(canvas).toBeVisible();
  await demo.dwell(800);
  demo.shot("drawing", paintDrawing);

  // Pencil and *Square* are the defaults and are left alone; the brush grows to eight cells.
  await drag(page.getByTestId("brush-size-slider"), BRUSH);
  await expect(page.getByTestId("brush-size-value")).toHaveText(String(BRUSH));

  // Four squares, symmetric about the centre cell — a tap paints a whole brush, and the alive
  // count says whether every one of them landed.
  for (const [col, row] of SQUARES) await tap(canvas, col, row);
  await expect(alive).toHaveText(String(SQUARES.length * BRUSH * BRUSH));

  // The shape dropdown to *Circle*, and one tap a little to the side.
  const shapeTrigger = page.getByTestId("brush-shape-trigger");
  await demo.click(shapeTrigger);
  await demo.dwell(400);
  await demo.click(page.locator('[data-testid="brush-shape-option"][data-value="circle"]'), { aim: "text" });
  await expect(shapeTrigger).toContainText(CONTROL_TEXTS.drawing.shapes.circle);
  await tap(canvas, ...CIRCLE);
  await expect.poll(aliveCount).toBeGreaterThan(SQUARES.length * BRUSH * BRUSH);

  // *start*, and a few seconds of the drawing living its life.
  await demo.click(toggle);
  await playing();
  await demo.dwell(5000);

  // ── 5 ── At rest ─────────────────────────────────────────────────────────
  // Off-frame on the same beat, so the pointer's teleport hides under the last hover fading out.
  await demo.park(-40, -40);
  await demo.dwell(2200);
  // One last pointer move, which nobody sees. The screencast emits a frame only when something
  // is drawn and the recorder holds its final frame for a single sixtieth of a second, so on a
  // still closing shot the hold above is what would be lost.
  await demo.park(-41, -41);
});
