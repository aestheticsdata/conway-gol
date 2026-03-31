import { httpClient } from "@infra/http/HttpClient";
import { URLS } from "@lib/constants/constants";

import type HttpClient from "@infra/http/HttpClient";

interface CustomDrawingPayload {
  comments: string[];
  automata: number[][];
}

class UserCustomService {
  private readonly _http: HttpClient;

  constructor(http: HttpClient = httpClient) {
    this._http = http;
  }

  public getCustomDrawingList(): Promise<string[]> {
    return this._http.get<string[]>(URLS.usercustom);
  }

  /**
   * Persist a full-grid custom pattern via Nest `POST usercustom/:filename`.
   * Same payload is used for drawing saves and for random-mode snapshots: the API stores
   * one `automata` matrix per name; the drawing screen lists only the authenticated user's presets.
   *
   * @param data  Full grid state as number[][] (0=DEAD, 1=ALIVE) from Simulation.toGrid().
   */
  public async postCustomDrawing(data: number[][], filename: string): Promise<void> {
    const payload: CustomDrawingPayload = {
      comments: [""],
      automata: data,
    };

    const safeName = encodeURIComponent(filename.trim());
    await this._http.post<void, CustomDrawingPayload>(`${URLS.usercustom}${safeName}`, payload);
  }
}

export default UserCustomService;
