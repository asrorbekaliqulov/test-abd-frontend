import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, tokenManager } from '../utils/api';

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

interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  country?: number;
  region?: number;
  district?: number;
  settlement?: number;
}

interface LoginData {
  username: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;         // ✅ void qaytadi
  register: (data: any) => Promise<void>;                               // ✅ void qaytadi
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDeveloper: boolean;
  isModerator: boolean;
  socialLogin: (provider: string, access_token: string) => Promise<void>;  // ➕ agar ishlatyotgan bo‘lsangiz
  refreshUser: () => Promise<void>;                                      // ✅ void qaytadi
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
  const [loading, setLoading] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      refreshUser();
    }
  }, []);

  const refreshUser = async () => {
    try {
      const userData = await authAPI.getMe();
      setUser(userData.data);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // Token might be expired, try to refresh
      try {
        await tokenManager.refreshToken();
        const userData = await authAPI.getMe();
        setUser(userData.data);
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        logout();
      }
    }
  };

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await authAPI.login(username, password);
      const { access, refresh } = response.data;

      tokenManager.setTokens(access, refresh);
      const userResponse = await authAPI.getMe();
      setUser(userResponse.data);
    } catch (error) {
      throw error;
    }
  };
  

  const register = async (data: any): Promise<void> => {
    try {
      const response = await authAPI.register(data);
      const token = response.data.token; // ✅ to‘g‘rilandi

      if (token) {
        const { access, refresh } = token;
        tokenManager.setTokens(access, refresh);

        const userResponse = await authAPI.getMe();
        setUser(userResponse.data);
      }
    } catch (error) {
      throw error;
    }
  };
  

  const socialLogin = async (provider: string, access_token: string) => {
    const response = await authAPI.socialLogin(provider, access_token);
    const { access, refresh, user } = response.data;

    tokenManager.setTokens(access, refresh);
    setUser(user);
  };
  

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    socialLogin,
    logout,
    isAuthenticated: !!user,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};