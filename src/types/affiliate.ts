export type AffiliateStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SocialChannel {
  platform: string;
  url: string;
}

export interface AffiliateListItem {
  id: string;
  userId: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  offerCode: string | null;
  totalEarn: number | null;
  status: AffiliateStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateDetail extends AffiliateListItem {
  socialChannels: SocialChannel[];
  promotionPlan: string;
  achievements: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  rejectionReason: string | null;
  reviewedAt: string | null;
}

export interface AffiliateQueryParams {
  status?: AffiliateStatus | null;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UpdateAffiliateStatusDto {
  status: AffiliateStatus;
  rejectionReason?: string | null;
}
