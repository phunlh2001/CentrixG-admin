import AdminBaseApi from "./adminBaseApi";
import { axiosClient, unwrapResponse } from "./axiosClient";
import type {
  AffiliateListItem,
  AffiliateDetail,
  AffiliateQueryParams,
  UpdateAffiliateStatusDto,
  PaginatedResponse,
  BaseResponse,
} from "@/types";

export class AffiliateApi extends AdminBaseApi {
  private _inFlightGetApplications: Map<string, Promise<PaginatedResponse<AffiliateListItem>>> = new Map();

  constructor() {
    super('affiliate');
  }

  async getApplications(params?: AffiliateQueryParams): Promise<PaginatedResponse<AffiliateListItem>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const search = params?.search ?? '';
    const status = params?.status;

    const cacheKey = `${search}_${status ?? 'ALL'}_${page}_${limit}`;

    if (this._inFlightGetApplications.has(cacheKey)) {
      return this._inFlightGetApplications.get(cacheKey)!;
    }

    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (search) {
      queryParams.append('search', search);
    }
    if (status) {
      queryParams.append('status', status);
    }

    const fetchPromise = (async () => {
      try {
        const res = await axiosClient.get(this._endpoint, { params: queryParams });
        return unwrapResponse(res.data);
      } finally {
        this._inFlightGetApplications.delete(cacheKey);
      }
    })();

    this._inFlightGetApplications.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  async getApplicationDetail(id: string): Promise<AffiliateDetail> {
    const res = await axiosClient.get(`${this._endpoint}/${id}`);
    return unwrapResponse(res.data);
  }

  async updateStatus(id: string, dto: UpdateAffiliateStatusDto): Promise<BaseResponse<AffiliateDetail>> {
    const res = await axiosClient.patch<BaseResponse<AffiliateDetail>>(
      `${this._endpoint}/${id}/status`,
      dto
    );
    return res.data;
  }
}

const affiliateApi = new AffiliateApi();
export default affiliateApi;
