export interface MultiCurrencyPrice {
  vnd: string;
  usd: string;
  cny: string;
}

export interface Product {
  id: string;
  name: string;
  pricing?: MultiCurrencyPrice;
  isDelete?: boolean;
  categories?: string[];
  category?: string;
  imageUrl: string;
  createdAt: string;
  isDenuvo?: boolean;
  publisher?: string;
}

export interface ProductQueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateProductDto {
  name: string;
  pricing: number | MultiCurrencyPrice;
  disabled?: boolean;
  isDelete?: boolean;
  imageUrl?: string;
  isDenuvo?: boolean;
  publisher?: string;
  categories?: string[];
}

export interface UpdateProductDto {
  name?: string;
  pricing?: number | MultiCurrencyPrice;
  disabled?: boolean;
  isDelete?: boolean;
  imageUrl?: string;
  isDenuvo?: boolean;
  publisher?: string;
  categories?: string[];
}

export interface RawProductResponse {
  id?: string;
  name?: string;
  pricing?: MultiCurrencyPrice;
  isDelete?: boolean;
  disabled: boolean;
  categories?: string[];
  imageUrl?: string;
  createdAt?: string;
  isDenuvo?: boolean;
  publisher?: string;
}
