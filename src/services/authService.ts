import { getStoredAuthToken } from '@/lib/helper';
import { axiosClient } from '../api/axiosClient';
import type { LoginCredentials, BaseResponse, LoginData, AuthTokenData, AuthUser } from '@/types';

const AUTH_STORAGE_KEY = 'centrix_admin_auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginData> {
    const response = await axiosClient.post<BaseResponse<LoginData> | LoginData>('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });
    
    // Support both wrapped BaseResponse<LoginData> and flat LoginData
    const resBody = response.data;
    const loginData: LoginData = ('data' in resBody && resBody.data && (resBody.data as any).accessToken)
      ? (resBody.data as LoginData)
      : (resBody as LoginData);

    // Enforce role requirement: Only ADMIN and MOD roles are authorized
    const role = loginData?.user?.role?.toUpperCase();
    if (!role || (role !== 'ADMIN' && role !== 'MOD')) {
      throw new Error('Access forbidden: Only ADMIN and MOD roles can access this platform.');
    }
    
    if (loginData && loginData.accessToken) {
      this.saveAuthSession(loginData);
    }
    
    return loginData;
  },

  saveAuthSession(data: LoginData): AuthTokenData {
    // Calculate expiration timestamp (buffer 10 seconds for safety)
    const expiresIn = data.expiresIn || 900;
    const expiresAt = Date.now() + Math.max(expiresIn - 10, 60) * 1000;
    const tokenData: AuthTokenData = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt,
      user: data.user,
    };
    
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokenData));
    return tokenData;
  },

  getCurrentAuth(): AuthTokenData | null {
    const authData = getStoredAuthToken();
    if (!authData || !authData.user) return null;
    const role = authData.user.role?.toUpperCase();
    if (role !== 'ADMIN' && role !== 'MOD') {
      this.logout();
      return null;
    }
    return authData;
  },

  getCurrentUser(): AuthUser | null {
    const authData = this.getCurrentAuth();
    return authData ? authData.user : null;
  },

  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },
};
