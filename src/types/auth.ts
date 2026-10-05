import type { BaseResponse } from './api';

export type Role = 'admin' | 'staff' | 'customer' | 'moderator' | 'seller';

export type UserStatus = 'active' | 'banned';

export type RoleUpdateType = 'promote' | 'demote';

export interface UserAccount {
  id: string;
  email: string;
  username: string;
  role: string;
  isBlock: boolean;
  resonable?: string | null;
  offerCode?: string | null;
  totalEarn?: number | null;
  createdAt: string;
  name?: string;
}

export interface GetAllUsersQueryDto {
  month?: number;
  year?: number;
}

export interface BanUserDto {
  userId: string;
  reason?: string | null;
  isBlock: boolean;
}

export interface UpdateUserRoleDto {
  userId: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  isBlock: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export type LoginResponse = BaseResponse<AuthTokensDto>;

export interface AuthTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}
