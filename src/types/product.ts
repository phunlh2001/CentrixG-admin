export interface MultiCurrencyPrice {
  vnd: string;
  usd: string;
  cny: string;
}

export interface Product {
  id: string;
  appId?: number;
  hasManifest?: boolean;
  name: string;
  pricing: MultiCurrencyPrice;
  isDelete: boolean;
  disabled?: boolean;
  categories?: string[];
  category?: string;
  imageUrl: string;
  createdAt: string;
  isDenuvo: boolean;
  publisher?: string;
  type?: ProductType;
}

export interface ProductType {
  id: string;
  name: string;
}

export type ProductCatalogMode = 'product' | 'warehouse' | 'trash';

export interface ProductQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  hasManifest?: boolean;
  newest?: boolean;
  isDelete?: boolean;
  mode?: ProductCatalogMode;
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
  appId?: number;
  hasManifest?: boolean;
  name?: string;
  pricing?: MultiCurrencyPrice;
  isDelete?: boolean;
  disabled: boolean;
  categories?: string[];
  imageUrl?: string;
  createdAt?: string;
  isDenuvo?: boolean;
  publisher?: string;
  type?: ProductType;
}
