import { getStoredAuthToken, parseJwtToken } from '@/lib/helper';
import { axiosClient } from '../api/axiosClient';
import type { LoginCredentials, BaseResponse, AuthTokenData, AuthTokensDto, AuthUser } from '@/types';

const AUTH_STORAGE_KEY = 'centrix_admin_auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthTokenData> {
    const response = await axiosClient.post<BaseResponse<AuthTokensDto> | AuthTokensDto>('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });

    // Support both wrapped BaseResponse<AuthTokensDto> and flat AuthTokensDto
    const resBody = response.data;
    const tokens: AuthTokensDto = ('data' in resBody && resBody.data && (resBody.data as any).accessToken)
      ? (resBody.data as AuthTokensDto)
      : (resBody as AuthTokensDto);

    if (!tokens || !tokens.accessToken) {
      throw new Error('Authentication response did not contain an access token.');
    }

    // Parse user profile from JWT accessToken payload
    const user = parseJwtToken(tokens.accessToken);
    if (!user) {
      throw new Error('Failed to decode user credentials from token.');
    }

    // Enforce role requirement: Only ADMIN and MOD roles are authorized
    const role = user.role?.toUpperCase();
    if (!role || (role !== 'ADMIN' && role !== 'MOD')) {
      throw new Error('Access forbidden: Only ADMIN and MOD roles can access this platform.');
    }

    const savedAuth = this.saveAuthSession(tokens, user);
    return savedAuth;
  },

  saveAuthSession(tokens: AuthTokensDto, user: AuthUser): AuthTokenData {
    // Calculate expiration timestamp (buffer 10 seconds for safety)
    const expiresIn = tokens.expiresIn || 900;
    const expiresAt = Date.now() + Math.max(expiresIn - 10, 60) * 1000;
    const tokenData: AuthTokenData = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt,
      user,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokenData));
    return tokenData;
  },

  getCurrentAuth(): AuthTokenData | null {
    const authData = getStoredAuthToken();
    if (!authData || !authData.accessToken) return null;

    const user = authData.user || parseJwtToken(authData.accessToken);
    if (!user) {
      this.logout();
      return null;
    }

    const role = user.role?.toUpperCase();
    if (role !== 'ADMIN' && role !== 'MOD') {
      this.logout();
      return null;
    }

    return {
      ...authData,
      user,
    };
  },

  getCurrentUser(): AuthUser | null {
    const authData = this.getCurrentAuth();
    return authData ? authData.user : null;
  },

  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },
};
