/**
 * Refusing to shoot before there is anything to shoot.
 *
 * Without this the first thing that happens is the storyboard reporting
 * `net::ERR_CONNECTION_REFUSED` with a stack pointing into a file about
 * clicking a button — which says nothing about the actual problem. The demo
 * has three preconditions and none of them are the script's to fix, so it
 * names them instead.
 */

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

/**
 * The API is a second origin here, not a path under the front.
 *
 * The front calls `/api` and Vite proxies it to Nest (`vite.config.ts`, GOL-1), so probing
 * `${BASE_URL}/api/...` would only prove Vite is up: with Nest down the proxy answers an error
 * and the app quietly falls back to its fourteen built-in species. Nest declares no global
 * prefix — `/auth/me` and `/list` sit at its root.
 */
const API_URL = process.env.DEMO_API_URL ?? "http://localhost:6300";

/**
 * The Zoo chapter searches the catalogue for a card the built-in fallback does not have. The
 * fallback holds fourteen names; the catalogue on disk holds fourteen hundred.
 */
const MIN_CATALOGUE = 1000;

async function reachable(url: string): Promise<boolean> {
  try {
    // Any answer at all is enough — a 401 or a redirect still proves something
    // is listening, which is the whole question here.
    await fetch(url, { signal: AbortSignal.timeout(3000), redirect: "manual" });
    return true;
  } catch {
    return false;
  }
}

/** How many names `GET /list` answers with, or null when it does not answer with a list. */
async function catalogueSize(url: string): Promise<number | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const names: unknown = await response.json();
    return Array.isArray(names) ? names.length : null;
  } catch {
    return null;
  }
}

export default async function preflight(): Promise<void> {
  const problems: string[] = [];

  if (!(await reachable(`${BASE_URL}/login`))) {
    problems.push(
      `Nothing is listening on ${BASE_URL}.\n` +
        "    The demo films the app; it does not start it. In two shells:\n" +
        "      cd api-nest && pnpm start:dev\n" +
        "      cd front && pnpm dev\n" +
        "    Vite paints nothing over the page, so the dev server is what the takes are filmed on.",
    );
  } else if (!(await reachable(`${API_URL}/auth/me`))) {
    problems.push(
      `${BASE_URL} answers, but the Nest API does not answer on ${API_URL}.\n` +
        "    Start it with `cd api-nest && pnpm start:dev` (it listens on 6300). Without it the Zoo\n" +
        "    picker falls back to fourteen built-in species and the take films the wrong thing.",
    );
  } else {
    const size = await catalogueSize(`${API_URL}/list`);
    if (size === null || size < MIN_CATALOGUE) {
      const answer = size === null ? "did not answer with a list of names" : `holds ${size} names`;
      problems.push(
        `${API_URL}/list ${answer}; the take expects the full catalogue (${MIN_CATALOGUE}+).\n` +
          "    Check CATALOG_DIR in api-nest/.env — it should point at api-nest/data/patterns.",
      );
    }
  }

  if (problems.length > 0) {
    throw new Error(`\n\n  The demo cannot record yet:\n\n  - ${problems.join("\n\n  - ")}\n`);
  }
}
