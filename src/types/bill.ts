export interface BillProductInfo {
  id: string;
  appId?: number;
  name: string;
  imageUrl: string;
}

export interface BillUserAccount {
  id: string;
  username: string;
  email: string;
}

export interface BillReferrerInfo {
  id: string;
  username: string;
  email: string;
  code?: string;
}

export interface BillPaymentAmount {
  vnd: number;
  usd: number;
  cny: number;
}

export interface Bill {
  id: string;
  products?: BillProductInfo[];
  productInfo?: BillProductInfo[] | BillProductInfo;
  userAccount: BillUserAccount;
  orderStatus: string;
  referrerInfo?: BillReferrerInfo | null;
  paymentAmount: BillPaymentAmount;
  createdAt: string;
}

export interface BillQueryParams {
  search?: string;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}
