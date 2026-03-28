import { describe, expect, it, vi } from "vitest";
import { buildPathWithSearchParam, getTrimmedSearchParam, replaceCurrentSearchParam } from "./searchParamsHelper";

describe("getTrimmedSearchParam", () => {
  it("returns the trimmed value when the search param exists", () => {
    const searchParams = new URLSearchParams("pattern=%20101%20");

    expect(getTrimmedSearchParam(searchParams, "pattern")).toBe("101");
  });

  it("returns null when the value is empty after trimming", () => {
    const searchParams = new URLSearchParams("pattern=%20%20");

    expect(getTrimmedSearchParam(searchParams, "pattern")).toBeNull();
  });
});

describe("buildPathWithSearchParam", () => {
  it("appends a query string when a value is provided", () => {
    expect(buildPathWithSearchParam("/zoo", "pattern", "101")).toBe("/zoo?pattern=101");
  });

  it("returns the original path when the value is null", () => {
    expect(buildPathWithSearchParam("/zoo", "pattern", null)).toBe("/zoo");
  });
});

describe("replaceCurrentSearchParam", () => {
  it("updates the current URL search params in place", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        href: "https://example.test/conway-gol/zoo?pattern=101",
      },
      history: {
        state: { current: true },
        replaceState,
      },
    });

    replaceCurrentSearchParam("pattern", "ak94");

    expect(replaceState).toHaveBeenCalledWith(
      { current: true },
      "",
      new URL("https://example.test/conway-gol/zoo?pattern=ak94"),
    );
  });

  it("removes the search param when the value is null", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        href: "https://example.test/conway-gol/zoo?pattern=101&autostart=1",
      },
      history: {
        state: null,
        replaceState,
      },
    });

    replaceCurrentSearchParam("pattern", null);

    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      new URL("https://example.test/conway-gol/zoo?autostart=1"),
    );
  });
});
