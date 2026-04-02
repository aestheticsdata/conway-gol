import { httpClient } from "@infra/http/HttpClient";
import { URLS } from "@lib/constants/constants";
import { catalogPatternFetchLimiter } from "@services/catalogPatternFetchLimiter";
import axios from "axios";

import type HttpClient from "@infra/http/HttpClient";

export interface RemotePattern {
  automata: number[][];
  comments: string[];
}

const RETRYABLE_STATUS = new Set([502, 503, 429]);
const CATALOG_FETCH_MAX_ATTEMPTS = 4;
const RETRY_BASE_DELAY_MS = 120;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class PatternService {
  private readonly _http: HttpClient;

  constructor(http: HttpClient = httpClient) {
    this._http = http;
  }

  public async getPattern(entity: string, custom = false): Promise<RemotePattern> {
    const url = custom ? `${URLS.pattern}${entity}-custom` : `${URLS.pattern}${entity}`;

    const load = async (): Promise<RemotePattern | string> => {
      let lastError: unknown;
      for (let attempt = 1; attempt <= CATALOG_FETCH_MAX_ATTEMPTS; attempt++) {
        try {
          return await this._http.get<RemotePattern | string>(url);
        } catch (error) {
          lastError = error;
          const status = axios.isAxiosError(error) ? error.response?.status : undefined;
          const canRetry = status !== undefined && RETRYABLE_STATUS.has(status) && attempt < CATALOG_FETCH_MAX_ATTEMPTS;
          if (!canRetry) {
            throw error;
          }
          await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
        }
      }
      throw lastError;
    };

    const raw = custom ? await load() : await catalogPatternFetchLimiter.run(load);

    return typeof raw === "string" ? (JSON.parse(raw) as RemotePattern) : raw;
  }
}

export default PatternService;
