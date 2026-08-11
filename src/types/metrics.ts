import type { Product } from './product';
import type { UserAccount } from './auth';

export interface OverviewMetrics {
  totalRevenueVnd: number;
  totalRevenueUsd: number;
  totalRevenueCny: number;
  topSellerProducts: {
    product: Product;
    totalPaidUsers: number;
    totalRevenueVnd: number;
  }[];
  userAccountsSummary: {
    total: number;
    activeCount: number;
    bannedCount: number;
    newlyCreated: UserAccount[];
  };
  timeframe: 'weekly' | 'monthly';
}
