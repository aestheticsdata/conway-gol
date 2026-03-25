import { URLS } from "@helpers/constants";
import { httpClient } from "@infra/http/HttpClient";
import CritterService from "@services/CritterService";

import type HttpClient from "@infra/http/HttpClient";

type CustomDrawingPayload = {
  comments: string[];
  automata: number[][];
};

class UserCustomService {
  private readonly _http: HttpClient;
  private readonly _critterService: CritterService;

  constructor(http: HttpClient = httpClient, critterService: CritterService = new CritterService(http)) {
    this._http = http;
    this._critterService = critterService;
  }

  public getCustomDrawingList(): Promise<string[]> {
    return this._critterService.getCritterList("user-custom");
  }

  /**
   * Persist a full-grid custom pattern via Nest `POST usercustom/:filename`.
   * Same payload is used for drawing saves and for random-mode snapshots: the API stores
   * one `automata` matrix per name; the drawing screen lists all public custom patterns.
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
