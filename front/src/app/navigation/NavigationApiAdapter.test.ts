import { afterEach, describe, expect, it, vi } from "vitest";
import { NavigationApiAdapter } from "./NavigationApiAdapter";

import type { AppPath } from "@navigation/NavigationAdapter";

type NavigationType = "push" | "replace" | "reload" | "traverse";

/** The adapter reads `window.navigation` at construction and `window.location` on every event. */
function stubWindow(href: string): EventTarget {
  const url = new URL(href);
  const navigation = new EventTarget();

  vi.stubGlobal("window", {
    navigation,
    location: {
      href: url.href,
      origin: url.origin,
      pathname: url.pathname,
      search: url.search,
    },
  });

  return navigation;
}

/**
 * Raises the event with the fields a real `NavigateEvent` carries here, as measured in Chrome: a
 * `history.replaceState` that only rewrites the query reports `navigationType: "replace"`,
 * `canIntercept: true` and `hashChange: false`, on the same pathname as the document. The handler
 * given to `intercept` is called and settled, as the browser calls it.
 */
function fireNavigate(navigation: EventTarget, destinationUrl: string, navigationType: NavigationType) {
  const handled: Promise<unknown>[] = [];

  const event = Object.assign(new Event("navigate"), {
    canIntercept: true,
    hashChange: false,
    destination: { url: destinationUrl },
    navigationType,
    intercept: ({ handler }: { handler?: () => void | Promise<void> }) => {
      const result = handler?.();
      if (result) {
        handled.push(result);
      }
    },
  });

  navigation.dispatchEvent(event);
  return Promise.all(handled);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NavigationApiAdapter", () => {
  it("ignores a replace that only rewrites the query of the current path", async () => {
    const navigation = stubWindow("https://cgl.test/zoo?pattern=alpha");
    const adapter = new NavigationApiAdapter("");
    const render = vi.fn();
    adapter.start(render);

    await fireNavigate(navigation, "https://cgl.test/zoo?pattern=beta", "replace");

    expect(render).not.toHaveBeenCalled();
  });

  it("ignores a query-only replace under a base path", async () => {
    const navigation = stubWindow("https://cgl.test/app/zoo?pattern=alpha");
    const adapter = new NavigationApiAdapter("/app");
    const render = vi.fn();
    adapter.start(render);

    await fireNavigate(navigation, "https://cgl.test/app/zoo?pattern=beta", "replace");

    expect(render).not.toHaveBeenCalled();
  });

  it("renders when a replace moves to another route", async () => {
    const navigation = stubWindow("https://cgl.test/");
    const adapter = new NavigationApiAdapter("");
    const render = vi.fn();
    adapter.start(render);

    await fireNavigate(navigation, "https://cgl.test/simulation", "replace");

    expect(render).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0][0]).toBe<AppPath>("/simulation");
  });

  it("renders when back or forward moves between two queries of one path", async () => {
    const navigation = stubWindow("https://cgl.test/zoo?pattern=beta");
    const adapter = new NavigationApiAdapter("");
    const render = vi.fn();
    adapter.start(render);

    await fireNavigate(navigation, "https://cgl.test/zoo?pattern=alpha", "traverse");

    expect(render).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0][1].search).toBe("?pattern=alpha");
  });

  it("renders a push to another route", async () => {
    const navigation = stubWindow("https://cgl.test/zoo");
    const adapter = new NavigationApiAdapter("");
    const render = vi.fn();
    adapter.start(render);

    await fireNavigate(navigation, "https://cgl.test/drawing", "push");

    expect(render).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0][0]).toBe<AppPath>("/drawing");
  });
});
