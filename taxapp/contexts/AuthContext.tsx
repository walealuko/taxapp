import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { type AxiosError } from 'axios';
import { API_URL } from '../constants/tax';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'taxapp_access_token';
const REFRESH_TOKEN_KEY = 'taxapp_refresh_token';
const USER_KEY = 'taxapp_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const [storedUser, accessToken] = await Promise.all([
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(ACCESS_TOKEN_KEY),
        ]);
        if (storedUser && accessToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  // Axios interceptor to auto-refresh token on 401
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const newToken = await refreshAccessToken();
          if (newToken) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      const r = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = r.data;

      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      return accessToken;
    } catch (e) {
      // Refresh failed - force logout
      await logout();
      return null;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await axios.post(`${API_URL}/auth/login`, { email, password });
    const { accessToken, refreshToken, user: userData } = r.data;

    await Promise.all([
      AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
      AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(userData)),
    ]);
    setUser(userData);
  }, []);

  const register = useCallback(async (data: { firstName: string; lastName: string; email: string; password: string }) => {
    await axios.post(`${API_URL}/auth/register`, data);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (refreshToken && accessToken) {
        await axios.post(
          `${API_URL}/auth/logout`,
          { refreshToken },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      }
    } catch (e) {
      // Ignore logout API errors
    } finally {
      await Promise.all([
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshAccessToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}