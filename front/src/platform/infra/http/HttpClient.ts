import { getRequestURL } from "@lib/api/api";
import axios from "axios";

import type { AxiosInstance, AxiosRequestConfig } from "axios";

class HttpClient {
  private readonly _client: AxiosInstance;
  private _csrfToken: string | null = null;

  constructor(
    client: AxiosInstance = axios.create({
      baseURL: getRequestURL(""),
      withCredentials: true,
    }),
  ) {
    this._client = client;

    this._client.interceptors.request.use((config) => {
      if (config.method !== "get" && this._csrfToken) {
        config.headers["X-CSRF-Token"] = this._csrfToken;
      }
      return config;
    });
  }

  public setCsrfToken(token: string): void {
    this._csrfToken = token;
  }

  public clearCsrfToken(): void {
    this._csrfToken = null;
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

  public async patch<TResponse, TBody>(
    url: string,
    body: TBody,
    config?: AxiosRequestConfig<TBody>,
  ): Promise<TResponse> {
    const { data } = await this._client.patch<TResponse>(url, body, config);
    return data;
  }

  public async put<TResponse, TBody>(url: string, body: TBody, config?: AxiosRequestConfig<TBody>): Promise<TResponse> {
    const { data } = await this._client.put<TResponse>(url, body, config);
    return data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this._client.delete<T>(url, config);
    return data;
  }
}

export const httpClient = new HttpClient();

export default HttpClient;
