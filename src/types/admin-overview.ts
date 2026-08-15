export interface OverviewMetrics {
  period: string
  dateRangeText: string
  revenue: Revenue
  topSellers: TopSeller[]
  accountMetrics: AccountMetrics
  recentUsers: RecentUser[]
}

export interface Revenue {
  totalRevenueVnd: number
  usdEquivalent: number
  cnyEquivalent: number
}

export interface TopSeller {
  rank: number
  id: string
  appId: number
  name: string
  category: string
  priceVnd: number
  imageUrl: string
  paidUsersCount: number
  totalRevenueVnd: number
}

export interface AccountMetrics {
  activeAccountsCount: number
  bannedAccountsCount: number
}

export interface RecentUser {
  id: string
  username: string
  email: string
  role: string
  status: string
  createdAt: string
}
