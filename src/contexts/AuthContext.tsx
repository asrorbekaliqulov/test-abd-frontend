import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, tokenManager } from '../utils/api';
import { quizAPI, accountsAPI } from '../../utils/api.ts';

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_image?: string;
  is_premium?: boolean;
  is_badged?: boolean;
  role?: string;
  level?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDeveloper: boolean;
  isModerator: boolean;
  socialLogin: (provider: string, access_token: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Dastlabki auth tekshiruvi
  useEffect(() => {
    const checkInitialAuth = async () => {
      try {
        const hasValidToken = await tokenManager.validateAndRefreshToken();

        if (hasValidToken) {
          await refreshUser();
        } else {
          // Token yo'q yoki yaroqsiz
          setUser(null);
        }
      } catch (error) {
        console.error('Initial auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
        setInitialCheckDone(true);
      }
    };

    checkInitialAuth();
  }, []);

  const checkAuth = async (): Promise<boolean> => {
    try {
      const hasValidToken = await tokenManager.validateAndRefreshToken();

      if (hasValidToken) {
        await refreshUser();
        return true;
      }

      setUser(null);
      return false;
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      return false;
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authAPI.getMe();
      setUser(userData.data);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // User ma'lumotlarini olishda xatolik, token yaroqsiz bo'lishi mumkin
      try {
        // Token'ni qayta refresh qilishga urinib ko'rish
        await tokenManager.refreshToken();
        const userData = await authAPI.getMe();
        setUser(userData.data);
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        logoutSilently();
      }
    }
  };

  const login = async (username: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await authAPI.login(username, password);
      const { access, refresh } = response.data;

      tokenManager.setTokens(access, refresh);
      const userResponse = await authAPI.getMe();
      setUser(userResponse.data);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any): Promise<void> => {
    setLoading(true);
    try {
      const response = await authAPI.register(data);
      const token = response.data.token;

      if (token) {
        const { access, refresh } = token;
        tokenManager.setTokens(access, refresh);

        const userResponse = await authAPI.getMe();
        setUser(userResponse.data);
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = async (provider: string, access_token: string) => {
    setLoading(true);
    try {
      const response = await authAPI.socialLogin(provider, access_token);
      const { access, refresh, user } = response.data;

      tokenManager.setTokens(access, refresh);
      setUser(user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setLoading(true);
    try {
      // Backend'ga logout so'rovi yuborish
      authAPI.logout().catch(() => {
        // Backend xatosi bo'lsa ham, frontend'dan tokenlarni o'chirish
      });
    } finally {
      logoutSilently();
      setLoading(false);
    }
  };

  const logoutSilently = () => {
    setUser(null);
    tokenManager.clearTokens();
  };

  const updateProfile = async (data: any): Promise<void> => {
    try {
      const response = await authAPI.updateProfile(data);
      setUser(prev => prev ? { ...prev, ...response.data } : null);
    } catch (error) {
      throw error;
    }
  };

  const isAdmin = user?.role === 'admin';
  const isDeveloper = user?.role === 'developer';
  const isModerator = user?.role === 'moderator';

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    socialLogin,
    logout,
    updateProfile,
    isAuthenticated: !!user && !loading,
    isAdmin,
    isDeveloper,
    isModerator,
    refreshUser,
    checkAuth,
  };

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
};