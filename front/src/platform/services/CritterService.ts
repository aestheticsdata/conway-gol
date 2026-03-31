import { httpClient } from "@infra/http/HttpClient";
import { URLS } from "@lib/constants/constants";

import type HttpClient from "@infra/http/HttpClient";

class CritterService {
  private readonly _http: HttpClient;

  constructor(http: HttpClient = httpClient) {
    this._http = http;
  }

  public getCritterList(subdir?: string): Promise<string[]> {
    return this._http.get<string[]>(URLS.critterList, {
      params: subdir ? { subdir } : undefined,
    });
  }
}

export default CritterService;
