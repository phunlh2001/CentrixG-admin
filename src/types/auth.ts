import type { BaseResponse } from './api';

export type Role = 'admin' | 'staff' | 'customer' | 'moderator';

export type UserStatus = 'active' | 'banned';

export interface UserAccount {
  id: string;
  email: string;
  username: string;
  role: string;
  isBlock: boolean;
  resonable?: string | null;
  createdAt: string;
  name?: string;
}

export interface BanUserDto {
  userId: string;
  reason?: string | null;
  isBlock: boolean;
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

export interface LoginData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export type LoginResponse = BaseResponse<LoginData>;

export interface AuthTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}
