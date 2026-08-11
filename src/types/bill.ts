export interface Bill {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  userId: string;
  userName: string;
  userEmail: string;
  referrerInfo?: string;
  paymentMethod: 'Credit Card' | 'PayPal' | 'Crypto' | 'Momo' | 'Bank Transfer';
  amountVnd: number;
  amountUsd: number;
  amountCny: number;
  createdAt: string;
}
