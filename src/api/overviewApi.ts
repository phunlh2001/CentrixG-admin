import type { OverviewMetrics } from "@/types";
import { axiosClient, unwrapResponse } from "./axiosClient";
import AdminBaseApi from "./adminBaseApi";

export class OverviewApi extends AdminBaseApi {
  constructor() {
    super('overview');
  }

  async getOverviewMetrics(period: string): Promise<OverviewMetrics> {
    const res = await axiosClient.get(`${this._endpoint}?period=${period}`);
    return unwrapResponse(res.data);
  }
}

const overviewApi = new OverviewApi();
export default overviewApi;