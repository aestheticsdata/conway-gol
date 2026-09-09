import { defineConfig, devices } from "@playwright/test";

/**
 * The portfolio demo run — a filming job, not a test one. There is no E2E suite beside it in this
 * repo (the unit tests are Vitest's, `vitest.config.ts`); this config never runs a spec.
 *
 * One worker, no retries (half a retried take is worse than no take), a long timeout because the
 * run deliberately spends most of its time waiting, and video at the exact viewport size, so no
 * scaling ever touches the picture.
 *
 * No `storageState`, no setup project and no env file: the take films the sign-in itself — as a
 * guest, which is client-side and leaves nothing to put back — so the demo project starts every
 * run from a cold browser and the same state. The knobs are plain environment variables.
 */

/** 1080p by default: native, 16:9, and nothing upscales on the way to a landing page. */
const viewport = {
  width: Number(process.env.DEMO_WIDTH ?? 1920),
  height: Number(process.env.DEMO_HEIGHT ?? 1080),
};

/**
 * Renders at twice the resolution and lets the encoder downsample into the same
 * frame. Supersampling: visibly crisper text, for CPU. It is the default
 * because `pnpm video:generate` should produce the best picture it can without
 * being asked — `DEMO_SCALE=1` is the way out if a slow machine drops frames.
 * The stills are the one thing kept at 2x (3840x2160); the mp4 stays 1080p.
 */
const deviceScaleFactor = Number(process.env.DEMO_SCALE ?? 2);

const chrome = {
  ...devices["Desktop Chrome"],
  viewport,
  deviceScaleFactor,
  // The app is English-only and puts no date on screen, so the locale only has to be stable:
  // pinned to what the film expects rather than to whatever the machine running it is set to.
  locale: "en-US",
  launchOptions: {
    headless: process.env.DEMO_HEADED !== "1",
    args: ["--force-color-profile=srgb", "--hide-scrollbars"],
  },
};

export default defineConfig({
  testDir: "./e2e/demo",
  // Checks the app is actually up before a browser is launched, so a shut-down
  // server is reported as a shut-down server rather than as a failed click.
  globalSetup: "./e2e/demo/preflight.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 8 * 60_000,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    trace: "off",
    // Off unless asked for: the CDP recorder in `e2e/demo/recorder.ts` captures
    // the same screencast without the 25fps ceiling, and running both at once
    // would have two clients acking the same frames.
    video: process.env.DEMO_RECORDER === "playwright" ? { mode: "on" as const, size: viewport } : ("off" as const),
  },
  projects: [{ name: "demo", testMatch: /.*\.demo\.ts/, use: chrome }],
});
