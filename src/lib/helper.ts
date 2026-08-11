import type { AuthTokenData } from '@/types';
import { CONFIG_STORAGE } from './constants';

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
    return data;
  } catch (err) {
    console.error('Failed reading stored auth token:', err);
    localStorage.removeItem(CONFIG_STORAGE.AUTH_TOKEN);
    return null;
  }
}