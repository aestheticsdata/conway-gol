import axios, { AxiosResponse } from 'axios';
import Helpers from "../helpers/Helpers";
import { URLS } from "../helpers/constants";

class UserCustomService {
  public async getCustomdrawingList(): Promise<AxiosResponse> {
    try {
      return await axios.get(`${Helpers.getRequestURL(URLS.critterList)}?subdir=user-custom`);
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Save a custom drawing to the server.
   * @param data  Full grid state as number[][] (0=DEAD, 1=ALIVE) from Simulation.toGrid().
   */
  public async postCustomDrawing(data: number[][], filename: string) {
    const o = {
      comments: [""],
      automata: data,
    };
    try {
      return await axios.post(`${Helpers.getRequestURL(URLS.usercustom + filename)}`, o);
    } catch (err) {
      console.log(err);
    }
  }
}

export default UserCustomService;
