import { describe, expect, it } from "vitest";

import { ConcurrencyLimiter } from "./concurrencyLimiter";

describe("ConcurrencyLimiter", () => {
  it("runs up to maxConcurrent tasks in parallel", async () => {
    const limiter = new ConcurrencyLimiter(2);
    let parallel = 0;
    let maxParallel = 0;

    const task = async (id: number): Promise<number> => {
      parallel++;
      maxParallel = Math.max(maxParallel, parallel);
      await new Promise((r) => setTimeout(r, 5));
      parallel--;
      return id;
    };

    const results = await Promise.all([
      limiter.run(() => task(1)),
      limiter.run(() => task(2)),
      limiter.run(() => task(3)),
    ]);

    expect(results.sort()).toEqual([1, 2, 3]);
    expect(maxParallel).toBe(2);
  });
});
