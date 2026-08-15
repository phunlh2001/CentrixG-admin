import type { Category } from "@/types";
import { axiosClient, unwrapResponse } from "./axiosClient";
import AdminBaseApi from "./adminBaseApi";

export class CategoryApi extends AdminBaseApi {
  constructor() {
    super('category');
  }

  async getCategories(): Promise<Category[]> {
    const res = await axiosClient.get(this._endpoint);
    return unwrapResponse(res.data);
  }
}

const categoryApi = new CategoryApi();
export default categoryApi;