import type { AuthTokenData, AuthUser } from '@/types';
import { CONFIG_STORAGE } from './constants';

export function parseJwtToken(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);

    return {
      id: payload.id || payload.sub || payload.userId || '',
      username: payload.username || '',
      email: payload.email || '',
      role: payload.role || '',
      isBlock: Boolean(payload.isBlock ?? payload.isBlocked),
    };
  } catch (err) {
    console.error('Failed parsing JWT accessToken:', err);
    return null;
  }
}

// Helper to get non-expired auth tokens
export function getStoredAuthToken(): AuthTokenData | null {
  try {
    const dataStr = localStorage.getItem(CONFIG_STORAGE.AUTH_TOKEN);
    if (!dataStr) return null;
    const data: AuthTokenData = JSON.parse(dataStr);

    // Expiration check
    if (data.expiresAt && Date.now() >= data.expiresAt) {
      localStorage.removeItem(CONFIG_STORAGE.AUTH_TOKEN);
      return null;
    }

    // Ensure user profile is populated from accessToken if missing
    if (!data.user && data.accessToken) {
      const parsedUser = parseJwtToken(data.accessToken);
      if (parsedUser) {
        data.user = parsedUser;
      }
    }

    return data;
  } catch (err) {
    console.error('Failed reading stored auth token:', err);
    localStorage.removeItem(CONFIG_STORAGE.AUTH_TOKEN);
    return null;
  }
}