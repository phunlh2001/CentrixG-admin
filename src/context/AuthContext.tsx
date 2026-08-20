import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser, LoginCredentials } from '@/types';
import { authService } from '@/services/authService';
import { useToast } from '@/components/ui/Toast';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const checkAuth = useCallback(() => {
    const currentAuth = authService.getCurrentAuth();
    if (currentAuth && currentAuth.user) {
      const role = currentAuth.user.role?.toUpperCase();
      if (role === 'ADMIN' || role === 'MOD') {
        setUser(currentAuth.user);
        setLoading(false);
        return;
      }
    }
    authService.logout();
    setUser(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen for unauthorized 401 events dispatched by axiosClient
    const handleUnauthorized = () => {
      setUser(null);
      showToast('Session expired. Please log in again.', 'error');
    };

    window.addEventListener('centrix_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('centrix_unauthorized', handleUnauthorized);
    };
  }, [checkAuth, showToast]);

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    const role = response.user?.role?.toUpperCase();
    if (!role || (role !== 'ADMIN' && role !== 'MOD')) {
      authService.logout();
      setUser(null);
      throw new Error('Access forbidden: Only ADMIN and MOD roles can access this platform.');
    }

    setUser(response.user);
    
    // Toast requirement: "Welcome back! {{username}}"
    const usernameDisplay = response.user.username || response.user.email.split('@')[0];
    showToast(`Welcome back! ${usernameDisplay}`, 'success');
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
