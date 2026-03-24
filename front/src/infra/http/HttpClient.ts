import { getRequestURL } from "@helpers/api";
import axios from "axios";

import type { AxiosInstance, AxiosRequestConfig } from "axios";

class HttpClient {
  private readonly _client: AxiosInstance;

  constructor(client: AxiosInstance = axios.create({ baseURL: getRequestURL("") })) {
    this._client = client;
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this._client.get<T>(url, config);
    return data;
  }

  public async post<TResponse, TBody>(
    url: string,
    body: TBody,
    config?: AxiosRequestConfig<TBody>,
  ): Promise<TResponse> {
    const { data } = await this._client.post<TResponse>(url, body, config);
    return data;
  }
}

export const httpClient = new HttpClient();

export default HttpClient;
