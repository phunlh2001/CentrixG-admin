import AdminBaseApi from "./adminBaseApi";
import { axiosClient, unwrapResponse } from "./axiosClient";
import type { Bill, BillQueryParams, PaginatedResponse } from "@/types";

export class BillApi extends AdminBaseApi {
  private _inFlightGetBills: Map<string, Promise<PaginatedResponse<Bill>>> = new Map();

  constructor() {
    super('bill');
  }

  async getBills(params?: BillQueryParams): Promise<PaginatedResponse<Bill>> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    const search = params?.search ?? '';
    const paymentMethod = params?.paymentMethod ?? '';

    const cacheKey = `${search}_${paymentMethod}_${page}_${pageSize}`;

    if (this._inFlightGetBills.has(cacheKey)) {
      return this._inFlightGetBills.get(cacheKey)!;
    }

    const queryParams = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });

    if (search) {
      queryParams.append('search', search);
    }
    if (paymentMethod && paymentMethod !== 'ALL') {
      queryParams.append('paymentMethod', paymentMethod);
    }

    const fetchPromise = (async () => {
      try {
        const res = await axiosClient.get(this._endpoint, { params: queryParams });
        return unwrapResponse(res.data);
      } finally {
        this._inFlightGetBills.delete(cacheKey);
      }
    })();

    this._inFlightGetBills.set(cacheKey, fetchPromise);
    return fetchPromise;
  }
}

const billApi = new BillApi();
export default billApi;