import type {
  PaginatedResponse,
  Product,
  ProductQueryParams,
  CreateProductDto,
  UpdateProductDto,
  RawProductResponse,
  MultiCurrencyPrice,
} from '@/types';
import { axiosClient, unwrapResponse } from './axiosClient';

function mapRawToProduct(rawData: RawProductResponse, fallback?: Partial<Product>): Product {
  let pricing: MultiCurrencyPrice;
  if (typeof rawData.pricing === 'number') {
    pricing = {
      vnd: String(rawData.pricing),
      usd: String(Math.round((rawData.pricing / 25000) * 100) / 100),
      cny: String(Math.round((rawData.pricing / 3500) * 100) / 100),
    };
  } else if (rawData.pricing && typeof rawData.pricing === 'object') {
    pricing = rawData.pricing;
  } else if (fallback?.pricing) {
    pricing = fallback.pricing;
  } else {
    pricing = { vnd: '0', usd: '0', cny: '0' };
  }

  return {
    id: rawData.id || fallback?.id || '',
    appId: rawData.appId ?? fallback?.appId,
    hasManifest: rawData.hasManifest ?? fallback?.hasManifest ?? false,
    name: rawData.name || fallback?.name || '',
    pricing,
    isDelete: rawData.isDelete ?? fallback?.isDelete ?? false,
    disabled: rawData.disabled ?? fallback?.disabled ?? false,
    categories: rawData.categories || fallback?.categories || [],
    imageUrl: rawData.imageUrl || fallback?.imageUrl || '',
    createdAt: rawData.createdAt || fallback?.createdAt || new Date().toISOString(),
    isDenuvo: rawData.isDenuvo ?? fallback?.isDenuvo ?? false,
    publisher: rawData.publisher || fallback?.publisher || '',
    type: rawData.type
  };
}

export class ProductApi {
  private readonly _endpoint: string;
  private _inFlightGetAll: Map<string, Promise<PaginatedResponse<Product>>> = new Map();

  constructor() {
    this._endpoint = '/products';
  }

  async getAll(params?: ProductQueryParams): Promise<PaginatedResponse<Product>> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    const search = params?.search ?? '';
    const hasManifestStr = params?.hasManifest !== undefined ? String(params.hasManifest) : '';

    const cacheKey = `${search}_${hasManifestStr}_${page}_${pageSize}`;

    if (this._inFlightGetAll.has(cacheKey)) {
      return this._inFlightGetAll.get(cacheKey)!;
    }

    const queryParams = new URLSearchParams({
      includeHidden: 'true',
      page: String(page),
      pageSize: String(pageSize),
    });

    if (params?.hasManifest !== undefined) {
      queryParams.append('hasManifest', String(params.hasManifest));
    }

    if (params?.newest !== undefined) {
      queryParams.append('newest', String(params.newest));
    }

    if (search) {
      queryParams.append('search', search);
    }

    const fetchPromise = (async () => {
      try {
        const res = await axiosClient.get(this._endpoint, { params: queryParams });
        return unwrapResponse(res.data);
      } finally {
        this._inFlightGetAll.delete(cacheKey);
      }
    })();

    this._inFlightGetAll.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  async create(payload: CreateProductDto): Promise<Product> {
    const res = await axiosClient.post(
      this._endpoint,
      payload
    );
    const rawData = unwrapResponse(res.data);
    return mapRawToProduct(rawData, {
      name: payload.name,
      imageUrl: payload.imageUrl,
      isDelete: payload.isDelete,
      isDenuvo: payload.isDenuvo,
      publisher: payload.publisher,
      categories: payload.categories,
    });
  }

  async update(id: string, payload: UpdateProductDto): Promise<Product> {
    const res = await axiosClient.patch(
      `${this._endpoint}/${id}`,
      payload
    );
    const rawData = unwrapResponse(res.data);
    return mapRawToProduct(rawData, {
      id,
      name: payload.name,
      imageUrl: payload.imageUrl,
      isDelete: payload.isDelete,
      isDenuvo: payload.isDenuvo,
      publisher: payload.publisher,
      categories: payload.categories,
    });
  }

  async updateType(id: string, category: string) {
    const res = await axiosClient.patch(
      `${this._endpoint}/${id}/type`, 
      { category: category }
    );
    return unwrapResponse(res.data);
  }
}

const productApi = new ProductApi();
export default productApi;