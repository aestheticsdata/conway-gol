/**
 * Limits how many async tasks run at once. Used to avoid bursting the API when
 * many independent callers (e.g. Zoo card loaders) would otherwise fire in parallel.
 */
export class ConcurrencyLimiter {
  private _active = 0;
  private readonly _waiters: Array<() => void> = [];

  constructor(private readonly _maxConcurrent: number) {
    if (_maxConcurrent < 1) {
      throw new Error("maxConcurrent must be at least 1");
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this._acquire();
    try {
      return await fn();
    } finally {
      this._release();
    }
  }

  private _acquire(): Promise<void> {
    if (this._active < this._maxConcurrent) {
      this._active++;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this._waiters.push(() => {
        this._active++;
        resolve();
      });
    });
  }

  private _release(): void {
    this._active--;
    const next = this._waiters.shift();
    if (next) {
      next();
    }
  }
}
