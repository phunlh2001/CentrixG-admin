import type {
  BaseResponse,
  PaginatedResponse,
  Product,
  ProductQueryParams,
  CreateProductDto,
  UpdateProductDto,
  RawProductResponse,
  MultiCurrencyPrice,
} from '@/types';
import { axiosClient } from './axiosClient';

function unwrapResponse<T>(json: BaseResponse<T> | T): T {
  if (json && typeof json === 'object' && json !== null && 'data' in json && (json as BaseResponse<T>).data !== undefined) {
    return (json as BaseResponse<T>).data;
  }
  return json as T;
}

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
    name: rawData.name || fallback?.name || '',
    pricing,
    isDelete: rawData.isDelete,
    categories: rawData.categories || fallback?.categories || [],
    imageUrl: rawData.imageUrl || fallback?.imageUrl || '',
    createdAt: rawData.createdAt || fallback?.createdAt || new Date().toISOString(),
    isDenuvo: rawData.isDenuvo,
    publisher: rawData.publisher || fallback?.publisher || '',
  };
}

export class ProductApi {
  private readonly _endpoint: string;
  constructor() {
    this._endpoint = '/products';
  }

  async getAll(params?: ProductQueryParams): Promise<PaginatedResponse<Product>> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;

    const queryParams = new URLSearchParams({
      includeHidden: 'true',
      page: String(page),
      pageSize: String(pageSize),
    });

    if (params?.search) {
      queryParams.append('search', params.search);
    }

    const res = await axiosClient.get(this._endpoint, { params: queryParams });
    return unwrapResponse(res.data);
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
}

const productApi = new ProductApi();
export default productApi;