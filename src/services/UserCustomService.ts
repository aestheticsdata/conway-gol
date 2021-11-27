import axios, {AxiosResponse} from 'axios';
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

  public async postCustomDrawing(data, filename: string) {
    const transformedData = data.map(row => row.map(cell => cell.state));
    const o = {
      comments: [""],
      automata: transformedData,
    };
    try {
      return await axios.post(`${Helpers.getRequestURL(URLS.usercustom + filename)}`, o);
    } catch (err) {
      console.log(err);
    }
  }
}

export default UserCustomService;
