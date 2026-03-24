import { URLS } from "@helpers/constants";
import { httpClient } from "@infra/http/HttpClient";

import type HttpClient from "@infra/http/HttpClient";

export type RemotePattern = {
  automata: number[][];
  comments: string[];
};

class PatternService {
  private readonly _http: HttpClient;

  constructor(http: HttpClient = httpClient) {
    this._http = http;
  }

  public async getPattern(entity: string, custom = false): Promise<RemotePattern> {
    const url = custom ? `${URLS.pattern}${entity}-custom` : `${URLS.pattern}${entity}`;
    const pattern = await this._http.get<RemotePattern | string>(url);

    return typeof pattern === "string" ? (JSON.parse(pattern) as RemotePattern) : pattern;
  }
}

export default PatternService;
