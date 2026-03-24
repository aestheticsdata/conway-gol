import { getRequestURL } from "@helpers/api";
import { URLS } from "@helpers/constants";
import axios from "axios";

import type { AxiosResponse } from "axios";

class UserCustomService {
  public getCustomdrawingList(): Promise<AxiosResponse<string[]>> {
    return axios.get<string[]>(`${getRequestURL(URLS.critterList)}?subdir=user-custom`);
  }

  /**
   * Save a custom drawing to the server.
   * @param data  Full grid state as number[][] (0=DEAD, 1=ALIVE) from Simulation.toGrid().
   */
  public postCustomDrawing(data: number[][], filename: string): Promise<AxiosResponse> {
    const o = {
      comments: [""],
      automata: data,
    };
    return axios.post(`${getRequestURL(URLS.usercustom + filename)}`, o);
  }
}

export default UserCustomService;
