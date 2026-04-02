import { httpClient } from "@infra/http/HttpClient";
import { URLS } from "@lib/constants/constants";
import axios from "axios";

import type { RemotePattern } from "@services/PatternService";

const DEBOUNCE_MS = 28;
const CHUNK_SIZE = 48;
const RETRYABLE_STATUS = new Set([502, 503, 429]);
const MAX_ATTEMPTS = 4;
const RETRY_BASE_DELAY_MS = 120;

type Waiter = {
  resolve: (value: RemotePattern) => void;
  reject: (reason: unknown) => void;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Coalesces many Zoo card loads into few POST /pattern/batch calls so nginx rate limits
 * are not triggered by dozens of parallel GET /pattern/:name requests.
 */
export class CatalogPatternBatchCoordinator {
  private readonly _waiters = new Map<string, Waiter[]>();
  private _debounceId: ReturnType<typeof setTimeout> | null = null;
  private _processing = false;

  requestCatalogPattern(name: string): Promise<RemotePattern> {
    return new Promise((resolve, reject) => {
      const list = this._waiters.get(name) ?? [];
      list.push({ resolve, reject });
      this._waiters.set(name, list);
      this._armDebounce();
    });
  }

  private _armDebounce(): void {
    if (this._debounceId !== null) {
      return;
    }
    this._debounceId = setTimeout(() => {
      this._debounceId = null;
      void this._processQueue();
    }, DEBOUNCE_MS);
  }

  private async _processQueue(): Promise<void> {
    if (this._processing) {
      return;
    }
    this._processing = true;
    try {
      while (this._waiters.size > 0) {
        const chunk = this._takeChunk(CHUNK_SIZE);
        await this._executeChunk(chunk);
      }
    } finally {
      this._processing = false;
      if (this._waiters.size > 0) {
        void this._processQueue();
      }
    }
  }

  private _takeChunk(max: number): Map<string, Waiter[]> {
    const chunk = new Map<string, Waiter[]>();
    let count = 0;
    for (const [name, list] of this._waiters) {
      if (count >= max) {
        break;
      }
      this._waiters.delete(name);
      chunk.set(name, list);
      count++;
    }
    return chunk;
  }

  private async _executeChunk(chunk: Map<string, Waiter[]>): Promise<void> {
    const names = [...chunk.keys()];
    try {
      const payload = await this._postBatchWithRetry(names);
      for (const name of names) {
        const key = name.trim().toLowerCase();
        const row = payload[key];
        const waiters = chunk.get(name) ?? [];
        if (this._isRemotePattern(row)) {
          for (const w of waiters) {
            w.resolve(row);
          }
        } else {
          const err = new Error(`Catalog pattern "${name}" not in batch response`);
          for (const w of waiters) {
            w.reject(err);
          }
        }
      }
    } catch (error) {
      for (const name of names) {
        const waiters = chunk.get(name) ?? [];
        for (const w of waiters) {
          w.reject(error);
        }
      }
    }
  }

  private _isRemotePattern(value: unknown): value is RemotePattern {
    if (!value || typeof value !== "object") {
      return false;
    }
    const o = value as Record<string, unknown>;
    return Array.isArray(o.comments) && Array.isArray(o.automata);
  }

  private async _postBatchWithRetry(names: string[]): Promise<Record<string, unknown>> {
    const body = { names: names.map((n) => n.trim().toLowerCase()) };
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await httpClient.post<Record<string, unknown>, { names: string[] }>(URLS.patternBatch, body);
      } catch (error) {
        lastError = error;
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        const canRetry = status !== undefined && RETRYABLE_STATUS.has(status) && attempt < MAX_ATTEMPTS;
        if (!canRetry) {
          throw error;
        }
        await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }
    }
    throw lastError;
  }
}

export const catalogPatternBatchCoordinator = new CatalogPatternBatchCoordinator();
