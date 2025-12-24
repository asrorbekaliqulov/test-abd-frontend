// src/utils/api.ts - To'liq tuzatilgan API fayli
import axios, { AxiosError, AxiosResponse } from 'axios';

// ==================== KONSTANTALAR ====================
export const API_BASE_URL = 'https://backend.testabd.uz';

// ==================== INTERFACE'LAR ====================
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: any;
  status?: number;
  message?: string;
  results?: any[];
}

export interface Quiz {
  id: number;
  question_text: string;
  question_type: string;
  media: string | null;
  answers: Answer[];
  correct_count: number;
  wrong_count: number;
  test_title: string;
  test_description: string;
  difficulty_percentage: number;
  is_bookmarked?: boolean;
  user: QuizUser;
  created_at: string;
  round_image: string | null;
  category?: Category;
  view_count?: number;
  unique_viewers?: number;
  total_views?: number;
  has_worked?: boolean;
  stats?: QuizStats;
  reactions_summary?: ReactionSummary;
  user_reaction?: string | null;
}

export interface Answer {
  id: number;
  letter: string;
  answer_text: string;
  is_correct: boolean;
}

export interface QuizUser {
  id: number;
  username: string;
  profile_image: string | null;
  is_following?: boolean;
}

export interface Category {
  id: number;
  title: string;
  slug: string;
  emoji?: string;
}

export interface QuizStats {
  total_attempts: number;
  correct_attempts: number;
  wrong_attempts: number;
  accuracy: number;
  average_time: number;
}

export interface QuizView {
  question_id: number;
  total_views: number;
  unique_viewers: number;
  last_viewed?: string;
}

export interface QuizReaction {
  id: number;
  quiz: number;
  user: number;
  reaction_type: string;
  created_at: string;
}

export interface ReactionSummary {
  coin: number;
  like: number;
  love: number;
  clap: number;
  insightful: number;
  total: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface FilterOptions {
  category?: number | string;
  ordering?: string;
  is_random?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
  difficulty_min?: number;
  difficulty_max?: number;
  worked?: boolean;
  unworked?: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_image?: string;
  is_staff?: boolean;
  is_active?: boolean;
  date_joined?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface TokenRefreshResponse {
  access: string;
  refresh?: string;
}

export interface UserData {
  id: number;
  username: string;
  email: string;
}

export interface QuizViewUser {
  username: string;
  id?: number;
  email?: string;
  profile_image?: string;
}

export interface QuizViewRecord {
  id: number;
  question: number;
  user: QuizViewUser;
  timestamp?: string;
  source?: string;
  duration?: number;
  user_agent?: string;
  ip_address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserLeaderboardData {
  username: string;
  tests_solved: number;
  correct: number;
  wrong: number;
  average_time: number;
  level: string;
  location: string;
  lat: number;
  lng: number;
  level_type: string;
  profile_image?: string;
}

export interface LeaderboardFilters {
  level?: string;
  date?: string;
  level_type?: string;
  location?: string;
}

export interface LeaderboardUser {
  username: string;
  profile_image?: string;
  tests_solved: number;
  coins: number;
  today_rank: number;
  yesterday_rank: number;
  is_following: boolean;
}

export interface FollowUser {
  id: number;
  username: string;
  profile_image: string | null;
}

export interface FollowDataResponse {
  followers: FollowUser[];
  following: FollowUser[];
}

export interface SearchParams {
  query?: string;
  type?: "test" | "question" | "user";
  category?: number;
  period?: "day" | "week" | "month" | "year" | "all";
  sort_by?: string;
}

// ==================== TOKEN MANAGER ====================
export const tokenManager = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  },

  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  },

  setTokens: (access: string, refresh: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  refreshToken: async (): Promise<string> => {
    try {
      const refresh = tokenManager.getRefreshToken();

      if (!refresh) {
        console.error('❌ No refresh token found');
        tokenManager.clearTokens();
        throw new Error('REFRESH_TOKEN_NOT_FOUND');
      }

      console.log('🔄 Attempting token refresh...');
      const response = await axios.post(
          `${API_BASE_URL}/accounts/token/refresh/`,
          { refresh },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            timeout: 10000
          }
      );

      if (response.data.access) {
        tokenManager.setTokens(response.data.access, response.data.refresh || refresh);
        console.log('✅ Token refreshed successfully');
        return response.data.access;
      } else {
        tokenManager.clearTokens();
        throw new Error('NO_ACCESS_TOKEN_IN_RESPONSE');
      }
    } catch (error: any) {
      console.error('❌ Token refresh failed:', {
        status: error.response?.status,
        message: error.message,
        code: error.code
      });

      tokenManager.clearTokens();

      if (typeof window !== 'undefined' &&
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }

      throw new Error('AUTHENTICATION_REQUIRED');
    }
  },

  isTokenValid: (): boolean => {
    const accessToken = tokenManager.getAccessToken();
    if (!accessToken) return false;

    try {
      const tokenParts = accessToken.split('.');
      if (tokenParts.length !== 3) return false;

      const payload = JSON.parse(atob(tokenParts[1]));
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();
      const bufferTime = 60000;

      return currentTime < (expiryTime - bufferTime);
    } catch (error) {
      console.error('❌ Token validation error:', error);
      return false;
    }
  },

  validateAndRefreshToken: async (): Promise<boolean> => {
    console.log('🔐 Starting STRICT token validation...');

    const hasAccessToken = !!tokenManager.getAccessToken();
    const hasRefreshToken = !!tokenManager.getRefreshToken();

    console.log('🔐 Token status:', { hasAccessToken, hasRefreshToken });

    if (!hasAccessToken && !hasRefreshToken) {
      console.error('❌ No tokens found - authentication required');
      tokenManager.clearTokens();
      return false;
    }

    if (tokenManager.isTokenValid()) {
      console.log('✅ Current token is valid');
      return true;
    }

    console.log('🔄 Token expired, attempting refresh...');

    if (!hasRefreshToken) {
      console.error('❌ No refresh token available');
      tokenManager.clearTokens();

      if (typeof window !== 'undefined' &&
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }

      return false;
    }

    try {
      await tokenManager.refreshToken();
      console.log('✅ Token refreshed successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Token refresh failed:', error.message);

      tokenManager.clearTokens();

      if (typeof window !== 'undefined' &&
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }

      return false;
    }
  },

  getAuthHeader: (): string | null => {
    const token = tokenManager.getAccessToken();
    return token ? `Bearer ${token}` : null;
  },

  decodeToken: (): any => {
    const token = tokenManager.getAccessToken();
    if (!token) return null;

    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return null;

      const payload = JSON.parse(atob(tokenParts[1]));
      return {
        userId: payload.user_id,
        username: payload.username,
        email: payload.email,
        exp: payload.exp,
        iat: payload.iat,
        ...payload
      };
    } catch (error) {
      console.error('❌ Token decode error:', error);
      return null;
    }
  },

  requireAuth: async (): Promise<boolean> => {
    const isAuthenticated = await tokenManager.validateAndRefreshToken();

    if (!isAuthenticated) {
      throw new Error('AUTHENTICATION_REQUIRED');
    }

    return true;
  }
};

// ==================== ERROR HANDLER ====================
export const handleApiError = (error: any): APIResponse => {
  console.error("API Error Details:", {
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    message: error.message,
    config: {
      url: error.config?.url,
      method: error.config?.method
    }
  });

  if (error.message === 'AUTHENTICATION_REQUIRED' ||
      error.response?.status === 401 ||
      error.message === 'REFRESH_TOKEN_NOT_FOUND') {

    tokenManager.clearTokens();

    if (typeof window !== "undefined" &&
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')) {
      window.location.href = "/login";
    }

    return {
      success: false,
      error: "Tizimga kirish talab qilinadi. Iltimos, avval tizimga kiring.",
      requiresAuth: true
    };
  }

  if (error.code === 'ERR_NETWORK' || error.code === 'ERR_NAME_NOT_RESOLVED') {
    return {
      success: false,
      error: "Serverga ulanib bo'lmadi. Internet aloqasini tekshiring.",
      isNetworkError: true
    };
  }

  if (error.code === 'ECONNABORTED') {
    return {
      success: false,
      error: "So'rov vaqti tugadi. Qayta urinib ko'ring.",
      isTimeoutError: true
    };
  }

  if (error.response?.status === 403) {
    return {
      success: false,
      error: "Bu amalni bajarish uchun ruxsat yo'q.",
      isForbidden: true
    };
  }

  if (error.response?.status === 404) {
    return {
      success: false,
      error: "So'ralgan resurs topilmadi.",
      isNotFound: true
    };
  }

  if (error.response?.status === 500) {
    return {
      success: false,
      error: "Serverda ichki xatolik yuz berdi.",
      isServerError: true
    };
  }

  const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Noma'lum xatolik yuz berdi";

  return {
    success: false,
    error: errorMessage
  };
};

// ==================== CSRF MANAGER ====================
const csrfManager = {
  getToken: (): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrftoken="));
    return match ? decodeURIComponent(match.split("=")[1]) : null;
  },

  setToken: (): void => {
    // Implement if needed
  },

  fetchToken: async (): Promise<string | null> => {
    try {
      await axios.get(`${API_BASE_URL}/system/csrf/`, {});
      return csrfManager.getToken();
    } catch (error) {
      console.warn("Failed to fetch CSRF token:", error);
      return null;
    }
  },
};

// ==================== API INSTANCES ====================
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000
});

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000
});

const formAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
  timeout: 30000
});

// ==================== HELPER FUNCTIONS ====================
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
  return null;
}

// ==================== REQUEST INTERCEPTORS ====================
api.interceptors.request.use(
    async (config) => {
      const publicEndpoints = [
        '/accounts/login/',
        '/accounts/register/',
        '/accounts/token/refresh/',
        '/accounts/send-reset-code/',
        '/accounts/reset-password/',
        '/accounts/verify-email/'
      ];

      const isPublicEndpoint = publicEndpoints.some(endpoint =>
          config.url?.includes(endpoint)
      );

      if (!isPublicEndpoint) {
        try {
          await tokenManager.requireAuth();
        } catch (error) {
          console.error('❌ Authentication required for:', config.url);
          throw new Error('AUTHENTICATION_REQUIRED');
        }
      }

      const csrfToken = getCookie("csrftoken");
      if (csrfToken && config.headers) {
        config.headers["X-CSRFToken"] = csrfToken;
      }

      const token = tokenManager.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
);

formAPI.interceptors.request.use(
    async (config) => {
      try {
        await tokenManager.requireAuth();
      } catch (error) {
        console.error('❌ Authentication required for form request:', config.url);
        throw new Error('AUTHENTICATION_REQUIRED');
      }

      const token = tokenManager.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
);

// ==================== RESPONSE INTERCEPTOR ====================
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      if (error.response?.status === 401 && !originalRequest?._retry) {
        originalRequest._retry = true;

        console.log('🔄 Interceptor: 401 detected, attempting token refresh...');

        try {
          const newAccessToken = await tokenManager.refreshToken();
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          console.log('✅ Interceptor: Token refreshed, retrying request...');
          return api(originalRequest);
        } catch (refreshError) {
          console.error('❌ Interceptor: Token refresh failed:', refreshError);

          tokenManager.clearTokens();
          if (typeof window !== 'undefined' &&
              !window.location.pathname.includes('/login') &&
              !window.location.pathname.includes('/register')) {
            window.location.href = '/login';
          }

          return Promise.reject(new Error('AUTHENTICATION_REQUIRED'));
        }
      }

      return Promise.reject(error);
    }
);

// ==================== QUIZ API FUNCTIONS ====================
const requireAuthForQuiz = async (): Promise<void> => {
  await tokenManager.requireAuth();
};

// Fetch quizzes with filters
export const fetchQuizzes = async (params: any = {}): Promise<APIResponse<any>> => {
  try {
    await requireAuthForQuiz();

    console.log("🔍 Starting fetchQuizzes with params:", params);

    const queryParams: Record<string, any> = {};

    if (params.category !== undefined && params.category !== null && params.category !== "All" && params.category !== "all") {
      queryParams.category = params.category;
      console.log("✅ Adding category filter:", params.category);
    }

    if (params.search && params.search.trim() !== '') {
      queryParams.search = params.search.trim();
      console.log("✅ Adding search filter:", params.search);
    }

    if (params.ordering) {
      queryParams.ordering = params.ordering;
      console.log("✅ Adding ordering filter:", params.ordering);
    }

    queryParams.page_size = params.page_size || 10;
    console.log("✅ Setting page_size:", queryParams.page_size);

    if (params.page) {
      queryParams.page = params.page;
      console.log("✅ Setting page:", params.page);
    }

    if (params.difficulty_min !== undefined && params.difficulty_min !== null && params.difficulty_min !== '') {
      const minVal = Number(params.difficulty_min);
      if (!isNaN(minVal) && minVal >= 0 && minVal <= 100) {
        queryParams.difficulty_min = minVal;
        console.log("✅ Adding difficulty_min filter:", minVal);
      }
    }

    if (params.difficulty_max !== undefined && params.difficulty_max !== null && params.difficulty_max !== '') {
      const maxVal = Number(params.difficulty_max);
      if (!isNaN(maxVal) && maxVal >= 0 && maxVal <= 100) {
        queryParams.difficulty_max = maxVal;
        console.log("✅ Adding difficulty_max filter:", maxVal);
      }
    }

    if (params.worked !== undefined && params.worked !== null && params.worked !== '') {
      if (params.worked === true || params.worked === 'true') {
        queryParams.worked = true;
        console.log("✅ Adding worked filter: true");
      }
    }

    if (params.unworked !== undefined && params.unworked !== null && params.unworked !== '') {
      if (params.unworked === true || params.unworked === 'true') {
        queryParams.unworked = true;
        console.log("✅ Adding unworked filter: true");
      }
    }

    if (params.is_random !== undefined && params.is_random !== null && params.is_random !== '') {
      if (params.is_random === true || params.is_random === 'true') {
        queryParams.is_random = true;
        console.log("✅ Adding is_random filter: true");
      }
    }

    console.log("📤 Final backend query params:", queryParams);

    const response = await api.get('/quiz/qs/', {
      params: queryParams,
      paramsSerializer: {
        indexes: null
      }
    });

    console.log("📥 Backend response status:", response.status);
    console.log("📥 Backend response data count:", response.data?.results?.length || response.data?.length || 0);

    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error("❌ Fetch quizzes API error:", error);
    return handleApiError(error);
  }
};

// Fetch quizzes with filters (alias)
export const fetchQuizzesWithFilters = async (filters: any = {}): Promise<APIResponse<any>> => {
  try {
    await requireAuthForQuiz();

    console.log("🔍 Starting fetchQuizzesWithFilters with filters:", filters);

    const cleanFilters: Record<string, any> = {};

    if (filters.category !== undefined && filters.category !== null && filters.category !== "All" && filters.category !== "all") {
      cleanFilters.category = filters.category;
      console.log("✅ Setting category to backend filter:", filters.category);
    }

    if (filters.search && filters.search.trim() !== '') {
      cleanFilters.search = filters.search.trim();
      console.log("✅ Setting search to backend filter:", filters.search);
    }

    if (filters.ordering) {
      cleanFilters.ordering = filters.ordering;
      console.log("✅ Setting ordering to backend filter:", filters.ordering);
    }

    cleanFilters.page_size = filters.page_size || 10;
    console.log("✅ Setting page_size to backend filter:", cleanFilters.page_size);

    if (filters.page) {
      cleanFilters.page = filters.page;
      console.log("✅ Setting page to backend filter:", filters.page);
    }

    if (filters.difficulty_min !== undefined && filters.difficulty_min !== null && filters.difficulty_min !== '') {
      const minVal = Number(filters.difficulty_min);
      if (!isNaN(minVal) && minVal >= 0 && minVal <= 100) {
        cleanFilters.difficulty_min = minVal;
        console.log("✅ Setting difficulty_min to backend filter:", minVal);
      }
    }

    if (filters.difficulty_max !== undefined && filters.difficulty_max !== null && filters.difficulty_max !== '') {
      const maxVal = Number(filters.difficulty_max);
      if (!isNaN(maxVal) && maxVal >= 0 && maxVal <= 100) {
        cleanFilters.difficulty_max = maxVal;
        console.log("✅ Setting difficulty_max to backend filter:", maxVal);
      }
    }

    if (filters.worked !== undefined && filters.worked !== null && filters.worked !== '') {
      if (filters.worked === true || filters.worked === 'true') {
        cleanFilters.worked = true;
        console.log("✅ Setting worked to backend filter: true");
      }
    }

    if (filters.unworked !== undefined && filters.unworked !== null && filters.unworked !== '') {
      if (filters.unworked === true || filters.unworked === 'true') {
        cleanFilters.unworked = true;
        console.log("✅ Setting unworked to backend filter: true");
      }
    }

    if (filters.is_random !== undefined && filters.is_random !== null && filters.is_random !== '') {
      if (filters.is_random === true || filters.is_random === 'true') {
        cleanFilters.is_random = true;
        console.log("✅ Setting is_random to backend filter: true");
      }
    }

    console.log("🔍 Final cleaned filters for backend:", cleanFilters);

    return await fetchQuizzes(cleanFilters);
  } catch (error: any) {
    console.error("❌ Fetch quizzes with filters API error:", error);
    return handleApiError(error);
  }
};

// Fetch random quizzes - TUZATILGAN VERSIYA
export const fetchRandomQuizzes = async (count: number = 10, page: number = 1): Promise<APIResponse<any>> => {
  try {
    await requireAuthForQuiz();

    console.log(`🎲 Fetching random quizzes: count=${count}, page=${page}`);

    const response = await api.get('/quiz/qs/', {
      params: {
        is_random: true,
        page: page,
        page_size: count,
        ordering: '?'
      }
    });

    console.log(`🎲 Random quizzes response status: ${response.status}`);

    let results = [];
    let totalCount = 0;
    let nextUrl = null;
    let prevUrl = null;

    if (response.data) {
      if (Array.isArray(response.data)) {
        results = response.data;
        totalCount = response.data.length;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        results = response.data.results;
        totalCount = response.data.count || response.data.results.length;
        nextUrl = response.data.next;
        prevUrl = response.data.previous;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        results = response.data.data;
        totalCount = response.data.data.length;
      } else {
        results = [];
        totalCount = 0;
      }
    }

    console.log(`🎲 Found ${results.length} quizzes after processing`);

    return {
      success: true,
      data: {
        results: results,
        count: totalCount,
        next: nextUrl,
        previous: prevUrl
      }
    };
  } catch (error: any) {
    console.error("❌ Fetch random quizzes API error:", error);
    return handleApiError(error);
  }
};

// Fetch quizzes by URL
export const fetchQuizzesByUrl = async (url: string): Promise<APIResponse<any>> => {
  try {
    await requireAuthForQuiz();
    const apiUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    console.log(`🔗 Fetching quizzes by URL: ${apiUrl}`);
    const response = await api.get(apiUrl);
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error("❌ Fetch quizzes by URL error:", error);
    return handleApiError(error);
  }
};

// Fetch quiz by ID
export const fetchQuizById = async (id: number): Promise<APIResponse<any>> => {
  try {
    await requireAuthForQuiz();
    console.log(`📋 Fetching quiz by ID: ${id}`);
    const response = await api.get(`/quiz/qs/${id}/`);
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error: any) {
    console.error(`❌ Fetch quiz by ID ${id} error:`, error);
    return handleApiError(error);
  }
};

// Fetch quizzes by category
export const fetchQuizzesByCategory = async (categoryId: number, page: number = 1, page_size: number = 30): Promise<APIResponse<any>> => {
  try {
    await requireAuthForQuiz();
    console.log(`🏷️ Fetching quizzes by category: ${categoryId}, page: ${page}`);
    const response = await api.get('/quiz/qs/', {
      params: {
        category: categoryId,
        page: page,
        page_size: page_size,
        ordering: '-created_at'
      }
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error(`❌ Fetch quizzes by category ${categoryId} error:`, error);
    return handleApiError(error);
  }
};

// Fetch recommended tests
export const fetchRecommendedTests = async (count: number = 10): Promise<APIResponse<any>> => {
  try {
    await requireAuthForQuiz();
    console.log(`⭐ Fetching recommended tests: count=${count}`);
    const response = await api.get('/quiz/recommended/', {
      params: { count }
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("❌ Fetch recommended tests error:", error);
    return handleApiError(error);
  }
};

// ==================== COMPREHENSIVE QUIZ API ====================
export const quizAPI = {
  fetchQuizzes,
  fetchRandomQuizzes,
  fetchQuizzesByUrl,
  fetchQuizzesWithFilters,
  fetchQuizById,
  fetchQuizzesByCategory,
  fetchRecommendedTests,

  // Categories
  fetchCategories: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log("🏷️ Fetching categories...");
      const response = await api.get('/quiz/categories/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch categories error:", error);
      return handleApiError(error);
    }
  },

  getCategoryById: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get(`/quiz/categories/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get category by ID ${id} error:`, error);
      return handleApiError(error);
    }
  },

  // Questions
  fetchQuestions: async (url?: string): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      if (url) {
        return fetchQuizzesByUrl(url);
      }
      const response = await api.get('/quiz/qs/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch questions error:", error);
      return handleApiError(error);
    }
  },

  fetchRecentQuestions: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get('/quiz/qs/', {
        params: { ordering: '-created_at', page_size: 20 }
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch recent questions error:", error);
      return handleApiError(error);
    }
  },

  fetchQuestionById: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get(`/quiz/qs/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Fetch question by ID ${id} error:`, error);
      return handleApiError(error);
    }
  },

  createQuestion: async (data: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.post('/quiz/questions/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create question error:", error);
      return handleApiError(error);
    }
  },

  updateQuestion: async (id: number, data: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.patch(`/quiz/questions/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Update question ${id} error:`, error);
      return handleApiError(error);
    }
  },

  deleteQuestion: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.delete(`/quiz/questions/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Delete question ${id} error:`, error);
      return handleApiError(error);
    }
  },

  // Submit answers
  submitAnswers: async (answers: {
    question: number;
    selected_answer_ids: number[];
    duration?: number;
  }): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`📤 Submitting answers for question ${answers.question}`);
      const response = await api.post('/quiz/submit-answer/', answers);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Submit answers error:", error);
      return handleApiError(error);
    }
  },

  submitTextAnswers: async (answers: {
    question: number;
    written_answer: string;
    duration?: number;
  }): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.post('/quiz/submit-answer/', answers);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Submit text answers error:", error);
      return handleApiError(error);
    }
  },

  // Attempts
  getQuestionAttempts: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get('/quiz/attempts/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get question attempts error:", error);
      return handleApiError(error);
    }
  },

  getAttemptById: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get(`/quiz/attempts/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get attempt by ID ${id} error:`, error);
      return handleApiError(error);
    }
  },

  // Question views
  getQuestionViewStats: async (questionId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`👁️ Getting view stats for question ${questionId}`);
      const response = await api.get(`/quiz/question-views/${questionId}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get question view stats ${questionId} error:`, error);
      return handleApiError(error);
    }
  },

  addQuestionView: async (quizId: number, data?: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`➕ Adding view for question ${quizId}`);
      const response = await api.post(`/quiz/question-views/${quizId}/`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Add question view ${quizId} error:`, error);
      return handleApiError(error);
    }
  },

  // Question bookmarks
  bookmarkQuestion: async (data: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`🔖 Bookmarking question:`, data);
      const response = await api.post('/quiz/question-bookmarks/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Bookmark question error:", error);
      return handleApiError(error);
    }
  },

  getBookmarks: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get('/quiz/question-bookmarks/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get bookmarks error:", error);
      return handleApiError(error);
    }
  },

  getBookmarkByQuestion: async (questionId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get(`/quiz/question-bookmarks/?question=${questionId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get bookmark by question ${questionId} error:`, error);
      return handleApiError(error);
    }
  },

  deleteBookmarkQuestion: async (bookmarkId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.delete(`/quiz/question-bookmarks/${bookmarkId}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Delete bookmark question ${bookmarkId} error:`, error);
      return handleApiError(error);
    }
  },

  // Test bookmarks
  bookmarkTest: async (data: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.post('/quiz/test-bookmarks/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Bookmark test error:", error);
      return handleApiError(error);
    }
  },

  getBookmarksTest: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get('/quiz/test-bookmarks/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get bookmarks test error:", error);
      return handleApiError(error);
    }
  },

  getBookmarkByTest: async (testId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get(`/quiz/test-bookmarks/?test=${testId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get bookmark by test ${testId} error:`, error);
      return handleApiError(error);
    }
  },

  deleteBookmarkTest: async (bookmarkId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.delete(`/quiz/test-bookmarks/${bookmarkId}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Delete bookmark test ${bookmarkId} error:`, error);
      return handleApiError(error);
    }
  },

  // Tests
  fetchPublicTests: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get('/quiz/tests/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch public tests error:", error);
      return handleApiError(error);
    }
  },

  fetchTestById: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get(`/quiz/tests/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Fetch test by ID ${id} error:`, error);
      return handleApiError(error);
    }
  },

  createTest: async (data: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.post('/quiz/tests/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create test error:", error);
      return handleApiError(error);
    }
  },

  fetchMyTest: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get('/quiz/tests/my_tests/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch my test error:", error);
      return handleApiError(error);
    }
  },

  fetchTestByUser: async (user_id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get(`/quiz/tests/by_user/${user_id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Fetch test by user ${user_id} error:`, error);
      return handleApiError(error);
    }
  },

  // Quiz reactions
  getQuizReactions: async (quizId?: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const url = quizId
          ? `/quiz/quiz-reactions/${quizId}/`
          : `/quiz/quiz-reactions/`;
      console.log(`❤️ Getting reactions for quiz ${quizId || 'all'}`);
      const response = await api.get(url);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get quiz reactions error for quiz ${quizId}:`, error);
      return handleApiError(error);
    }
  },

  addOrUpdateReaction: async (quizId: number, reactionType: string): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`❤️ Adding/updating reaction for quiz ${quizId}: ${reactionType}`);

      const checkResponse = await api.get(`/quiz/quiz-reactions/?quiz=${quizId}`);

      if (checkResponse.data.results && checkResponse.data.results.length > 0) {
        const existingReaction = checkResponse.data.results[0];

        if (existingReaction.reaction_type === reactionType) {
          await api.delete(`/quiz/quiz-reactions/${existingReaction.id}/`);
          return {
            success: true,
            data: {
              removed: true,
              reaction_type: null,
              message: "Reaction removed"
            }
          };
        } else {
          const response = await api.patch(
              `/quiz/quiz-reactions/${existingReaction.id}/`,
              { reaction_type: reactionType }
          );
          return { success: true, data: response.data };
        }
      } else {
        const response = await api.post(`/quiz/quiz-reactions/`, {
          quiz: quizId,
          reaction_type: reactionType
        });
        return { success: true, data: response.data };
      }
    } catch (error: any) {
      console.error(`❌ Add/update reaction error for quiz ${quizId}:`, error);
      return handleApiError(error);
    }
  },

  deleteReaction: async (reactionId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`🗑️ Deleting reaction ${reactionId}`);
      const response = await api.delete(`/quiz/quiz-reactions/${reactionId}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Delete reaction ${reactionId} error:`, error);
      return handleApiError(error);
    }
  },

  // Follower questions
  fetchQuestionsbyfollower: async (url?: string): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      if (url) {
        const response = await api.get(url);
        return { success: true, data: response.data };
      }
      const response = await api.get('/quiz/recommended/followed-questions/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch questions by follower error:", error);
      return handleApiError(error);
    }
  },

  // Leaderboard
  fetchLeaderboard: async (scope: 'global' | 'country' | 'region' | 'district' | 'settlement'): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get(`/quiz/leaderboard/?scope=${scope}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Fetch leaderboard ${scope} error:`, error);
      return handleApiError(error);
    }
  },

  // User stats
  fetchUserStats: async (userId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get(`/quiz/user-stats/${userId}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Fetch user stats ${userId} error:`, error);
      return handleApiError(error);
    }
  },

  // My bookmarks
  fetchMyBookmarks: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get('/quiz/tests/my_bookmarks/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch my bookmarks error:", error);
      return handleApiError(error);
    }
  },

  unblockBookmark: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.delete(`/quiz/test-bookmarks/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Unblock bookmark ${id} error:`, error);
      return handleApiError(error);
    }
  },

  // Live quiz
  fetchMyLiveQuizzes: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get("/quiz/live-quiz/my/");
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch my live quizzes error:", error);
      return handleApiError(error);
    }
  },

  createLiveQuiz: async (data: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.post("/quiz/live-quiz/save/", data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create live quiz error:", error);
      return handleApiError(error);
    }
  },

  getLiveQuiz: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get(`/quiz/live-quiz/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get live quiz ${id} error:`, error);
      return handleApiError(error);
    }
  },

  // Achievements
  getAchievements: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get('/quiz/achievements/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get achievements error:", error);
      return handleApiError(error);
    }
  },

  getAchievementById: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get(`/quiz/achievements/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get achievement by ID ${id} error:`, error);
      return handleApiError(error);
    }
  },

  // Question stats - TO'LIQ TUZATILGAN VERSIYA
  getQuestionStats: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`📊 Fetching stats for quiz ${id}`);

      // 1. Avval quiz ma'lumotlarini to'g'ridan-to'g'ri API orqali olish
      const quizResponse = await api.get(`/quiz/qs/${id}/`);

      if (!quizResponse.data) {
        return {
          success: false,
          error: 'Quiz topilmadi'
        };
      }

      const quiz = quizResponse.data;
      console.log(`📊 Quiz base data for ${id}:`, {
        id: quiz.id,
        correct_count: quiz.correct_count,
        wrong_count: quiz.wrong_count,
        view_count: quiz.view_count
      });

      // 2. Stats endpointini sinab ko'rish
      let statsFromEndpoint = null;
      try {
        const statsResponse = await api.get(`/quiz/qs/${id}/stats/`);
        console.log(`📊 Stats from endpoint for quiz ${id}:`, statsResponse.data);
        statsFromEndpoint = statsResponse.data;
      } catch (statsError) {
        console.log(`📊 Stats endpoint not available for quiz ${id}, using quiz data`);
      }

      // 3. Stats ma'lumotlarini biriktrish
      const correctCount = quiz.correct_count || 0;
      const wrongCount = quiz.wrong_count || 0;
      const totalAttempts = correctCount + wrongCount;
      const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

      const stats = {
        // Asosiy quiz ma'lumotlari
        correct_count: correctCount,
        wrong_count: wrongCount,
        view_count: quiz.view_count || quiz.total_views || 0,
        unique_viewers: quiz.unique_viewers || 0,

        // Stats endpointidan olingan ma'lumotlar yoki hisoblanganlar
        correct_attempts: statsFromEndpoint?.correct_attempts || correctCount,
        wrong_attempts: statsFromEndpoint?.wrong_attempts || wrongCount,
        total_attempts: statsFromEndpoint?.total_attempts || totalAttempts,
        total_views: statsFromEndpoint?.total_views || quiz.view_count || quiz.total_views || 0,

        // Accuracy
        accuracy: statsFromEndpoint?.accuracy || accuracy,

        average_time: statsFromEndpoint?.average_time || 0
      };

      console.log(`📊 Final compiled stats for quiz ${id}:`, stats);

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      console.error(`❌ Error fetching stats for quiz ${id}:`, error);
      return handleApiError(error);
    }
  },

  // Questions by user
  fetchQuestionsByUser: async (user_id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get(`/quiz/qs/user_questions/?user_id=${user_id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Fetch questions by user ${user_id} error:`, error);
      return handleApiError(error);
    }
  },

  // View tracking
  recordView: async (data: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`👁️ Recording view:`, data);
      const response = await api.post('/quiz/views/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Record view error:", error);
      return handleApiError(error);
    }
  },

  getViews: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await api.get('/quiz/views/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get views error:", error);
      return handleApiError(error);
    }
  },
};

// ==================== QUIZ VIEWS API ====================
export const quizViewsAPI = {
  // GET all views
  getQuizViews: async (questionId?: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();

      const params: any = {};
      if (questionId !== undefined && questionId !== null) {
        params.question = questionId;
      }

      console.log(`📊 GET /quiz/question-views/ for questionId: ${questionId || 'all'}`);

      const response = await api.get('/quiz/question-views/', {
        params,
        paramsSerializer: {
          indexes: null
        }
      });

      console.log('✅ GET /quiz/question-views/ response:', {
        status: response.status,
        count: response.data?.results?.length || response.data?.length || 0,
        hasData: !!response.data
      });

      let results = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          results = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          results = response.data.results;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          results = response.data.data;
        }
      }

      return {
        success: true,
        data: response.data,
        results: results
      };
    } catch (error: any) {
      console.error('❌ Get quiz views error:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  },

  // POST /quiz/question-views/ - yangi view yaratish
  createQuizView: async (questionId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();

      console.log(`➕ POST to /quiz/question-views/ for question ${questionId}`);

      const requestData = {
        question: questionId
      };

      console.log('📤 POST data:', requestData);

      const response = await api.post('/quiz/question-views/', requestData);

      console.log('✅ Backend POST response:', {
        status: response.status,
        data: response.data,
        success: true
      });

      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      console.error('❌ Create quiz view error:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });

      if (error.response?.status === 400) {
        console.log('🔄 Trying alternative data format...');
        try {
          const alternativeData = { question_id: questionId };
          const retryResponse = await api.post('/quiz/question-views/', alternativeData);

          return {
            success: true,
            data: retryResponse.data,
            status: retryResponse.status,
            retried: true
          };
        } catch (retryError: any) {
          console.error('❌ Retry failed:', retryError);
        }
      }

      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  },

  // Get views statistics for a question
  getQuestionViewStats: async (questionId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();

      console.log(`📈 Getting view stats for question ${questionId}`);

      const viewsResponse = await quizViewsAPI.getQuizViews(questionId);

      if (!viewsResponse.success) {
        console.error(`❌ Failed to get views for question ${questionId}:`, viewsResponse.error);
        return {
          success: false,
          error: viewsResponse.error || 'Failed to get views'
        };
      }

      const views = Array.isArray(viewsResponse.results) ? viewsResponse.results : [];
      console.log(`📊 Found ${views.length} views for question ${questionId}`);

      const totalViews = views.length;
      const uniqueUsers = new Set<string>();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let todayViews = 0;
      let thisWeekViews = 0;
      let thisMonthViews = 0;
      let totalDuration = 0;
      let lastViewed: Date | null = null;

      views.forEach((view, index) => {
        if (view.user && view.user.username) {
          uniqueUsers.add(view.user.username);
        }

        if (view.created_at) {
          try {
            const viewDate = new Date(view.created_at);

            if (viewDate >= today) {
              todayViews++;
            }

            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (viewDate >= weekAgo) {
              thisWeekViews++;
            }

            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            if (viewDate >= monthAgo) {
              thisMonthViews++;
            }

            if (!lastViewed || viewDate > lastViewed) {
              lastViewed = viewDate;
            }
          } catch (dateError) {
            console.error(`❌ Error parsing date for view ${index}:`, view.created_at);
          }
        }

        if (view.duration) {
          totalDuration += view.duration;
        }
      });

      const averageViewTime = totalViews > 0 ? totalDuration / totalViews : 0;

      const stats = {
        total_views: totalViews,
        unique_viewers: uniqueUsers.size,
        today_views: todayViews,
        this_week_views: thisWeekViews,
        this_month_views: thisMonthViews,
        average_view_time: averageViewTime,
        last_viewed: lastViewed ? lastViewed.toISOString() : null,
        views_data: views
      };

      console.log(`📊 View stats for question ${questionId}:`, stats);

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      console.error(`❌ Get question view stats error for question ${questionId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get single view
  getQuizView: async (viewId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();

      console.log(`📋 Getting single view ${viewId}`);
      const response = await api.get(`/quiz/question-views/${viewId}/`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      console.error(`❌ Get quiz view ${viewId} error:`, error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  },

  // PUT update view
  updateQuizView: async (viewId: number, data: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();

      console.log(`✏️ Updating view ${viewId}:`, data);
      const response = await api.put(`/quiz/question-views/${viewId}/`, data);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      console.error(`❌ Update quiz view ${viewId} error:`, error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  },

  // PATCH partial update
  patchQuizView: async (viewId: number, data: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();

      console.log(`🔧 Patching view ${viewId}:`, data);
      const response = await api.patch(`/quiz/question-views/${viewId}/`, data);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      console.error(`❌ Patch quiz view ${viewId} error:`, error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  },

  // DELETE view
  deleteQuizView: async (viewId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();

      console.log(`🗑️ Deleting view ${viewId}`);
      const response = await api.delete(`/quiz/question-views/${viewId}/`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      console.error(`❌ Delete quiz view ${viewId} error:`, error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
};

// ==================== AUTH API ====================
export const authAPI = {
  async getCurrentUser(): Promise<UserData> {
    await tokenManager.requireAuth();
    const response = await api.get<UserData>("/accounts/me/");
    return response.data;
  },

  login: async (username: string, password: string): Promise<APIResponse<LoginResponse>> => {
    try {
      const response = await publicApi.post('/accounts/login/', { username, password });

      if (response.data.access && response.data.refresh) {
        tokenManager.setTokens(response.data.access, response.data.refresh);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      }

      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      console.error("❌ Login error:", error);
      return handleApiError(error);
    }
  },

  register: async (data: any): Promise<APIResponse<any>> => {
    try {
      const response = await publicApi.post('/accounts/register/', data);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      console.error("❌ Register error:", error);
      return handleApiError(error);
    }
  },

  logout: async (): Promise<APIResponse<void>> => {
    try {
      await api.post('/accounts/logout/');
      tokenManager.clearTokens();
      return { success: true, status: 200 };
    } catch (error: any) {
      tokenManager.clearTokens();
      return handleApiError(error);
    }
  },

  getMe: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/accounts/me/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get me error:", error);
      return handleApiError(error);
    }
  },

  updateProfile: async (data: any): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.patch('/accounts/me/update/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Update profile error:", error);
      return handleApiError(error);
    }
  },

  changePassword: async (data: any): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.post('/accounts/me/change-password/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Change password error:", error);
      return handleApiError(error);
    }
  },

  getStats: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/accounts/me/stats/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get stats error:", error);
      return handleApiError(error);
    }
  },

  getCountry: async (): Promise<APIResponse<any>> => {
    try {
      const response = await publicApi.get('/accounts/countries/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get country error:", error);
      return handleApiError(error);
    }
  },

  getRegion: async (country_id: number): Promise<APIResponse<any>> => {
    try {
      const response = await publicApi.get(`/accounts/regions/${country_id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get region ${country_id} error:`, error);
      return handleApiError(error);
    }
  },

  getDistrict: async (region_id: number): Promise<APIResponse<any>> => {
    try {
      const response = await publicApi.get(`/accounts/districts/${region_id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get district ${region_id} error:`, error);
      return handleApiError(error);
    }
  },

  getSettlement: async (district_id: number): Promise<APIResponse<any>> => {
    try {
      const response = await publicApi.get(`/accounts/settlements/${district_id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get settlement ${district_id} error:`, error);
      return handleApiError(error);
    }
  },

  socialLogin: async (provider: string, accessToken: string): Promise<APIResponse<any>> => {
    try {
      const response = await publicApi.post(`/accounts/social-login/${provider}/`, {
        access_token: accessToken,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Social login ${provider} error:`, error);
      return handleApiError(error);
    }
  },

  fetchStories: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/accounts/stories/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch stories error:", error);
      return handleApiError(error);
    }
  },

  resendVerificationEmail: async (email: string): Promise<APIResponse<any>> => {
    try {
      const response = await publicApi.post('/accounts/resend-verification-email/', { email });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Resend verification email error:", error);
      return handleApiError(error);
    }
  },

  verifyEmail: async (token: string): Promise<APIResponse<any>> => {
    try {
      const response = await publicApi.get(`/accounts/verify-email/${token}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Verify email error:", error);
      return handleApiError(error);
    }
  },

  sendPasswordResetEmail: async (email: string): Promise<APIResponse<any>> => {
    try {
      const response = await publicApi.post('/accounts/send-password-reset/', { email });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Send password reset email error:", error);
      return handleApiError(error);
    }
  },

  resetPassword: async (token: string, password: string): Promise<APIResponse<any>> => {
    try {
      const response = await publicApi.post('/accounts/reset-password/', { token, password });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Reset password error:", error);
      return handleApiError(error);
    }
  },

  fetchNotifications: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get(`/accounts/notifications/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch notifications error:", error);
      return handleApiError(error);
    }
  },

  markNotificationAsRead: async (notificationId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.patch(`/accounts/notifications/${notificationId}/`, { is_read: true });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Mark notification as read ${notificationId} error:`, error);
      return handleApiError(error);
    }
  },

  markAllNotificationsAsRead: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.post(`/accounts/notifications/mark-all-read/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Mark all notifications as read error:", error);
      return handleApiError(error);
    }
  },
};

// ==================== ACCOUNTS API ====================
export const accountsAPI = {
  getUserFollowData: async (userId: number): Promise<APIResponse<FollowDataResponse>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get(`/accounts/followers/${userId}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get user follow data ${userId} error:`, error);
      return handleApiError(error);
    }
  },

  toggleFollow: async (userId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.post(`/accounts/followers/${userId}/toggle/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Toggle follow error:", error);
      return handleApiError(error);
    }
  },

  getLeaderboard: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/accounts/leaderboard/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get leaderboard error:", error);
      return handleApiError(error);
    }
  },

  getAds: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/accounts/ads/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get ads error:", error);
      return handleApiError(error);
    }
  },

  createAd: async (data: any): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.post('/accounts/ads/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create ad error:", error);
      return handleApiError(error);
    }
  },

  getSubscriptions: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/accounts/subscriptions/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get subscriptions error:", error);
      return handleApiError(error);
    }
  },

  searchUsers: async (query: string): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/accounts/search/', { params: { q: query } });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Search users error:", error);
      return handleApiError(error);
    }
  },

  createSubscription: async (data: any): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.post('/accounts/subscriptions/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create subscription error:", error);
      return handleApiError(error);
    }
  },

  getNotifications: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/accounts/notifications/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get notifications error:", error);
      return handleApiError(error);
    }
  },

  getRecomendedUsers: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/accounts/recommended-users/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get recommended users error:", error);
      return handleApiError(error);
    }
  },
};

// ==================== UTILITY FUNCTIONS ====================
export const refreshToken = async (): Promise<APIResponse<TokenRefreshResponse>> => {
  try {
    const refreshTokenValue = tokenManager.getRefreshToken();
    if (!refreshTokenValue) {
      tokenManager.clearTokens();
      throw new Error('REFRESH_TOKEN_NOT_FOUND');
    }

    const response = await api.post('/accounts/token/refresh/', {
      refresh: refreshTokenValue,
    });

    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      return {
        success: true,
        data: response.data
      };
    } else {
      tokenManager.clearTokens();
      throw new Error('NO_ACCESS_TOKEN_IN_RESPONSE');
    }
  } catch (error: any) {
    console.error('❌ Refresh token error:', error);

    tokenManager.clearTokens();
    if (typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')) {
      window.location.href = '/login';
    }

    return handleApiError(error);
  }
};

export const updateProfileImage = async (formData: FormData): Promise<APIResponse<any>> => {
  try {
    await tokenManager.requireAuth();
    const response = await formAPI.patch("/accounts/me/update/", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("❌ Update profile image error:", error);
    return handleApiError(error);
  }
};

// ==================== PASSWORD RESET ====================
export const passwordResetAPI = {
  sendResetCode: async (contact: string, method: 'email' | 'sms'): Promise<APIResponse<any>> => {
    try {
      const response = await publicApi.post('/accounts/send-reset-code/', {
        contact,
        method,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return handleApiError(error);
    }
  }
};

// ==================== VALIDATION FUNCTIONS ====================
export const checkUsername = async (username: string): Promise<boolean> => {
  try {
    const response = await publicApi.get(`/accounts/check-username/?username=${username}`);
    return response.data?.available || false;
  } catch (error) {
    console.error('Username check error:', error);
    return false;
  }
};

export const checkEmail = async (email: string): Promise<boolean> => {
  try {
    const response = await publicApi.get(`/accounts/check-email/?email=${email}`);
    return response.data?.available || false;
  } catch (error) {
    console.error('Email check error:', error);
    return false;
  }
};

export const checkReferral = async (referral: string): Promise<boolean> => {
  try {
    const response = await publicApi.get(`/accounts/check-referral/?referral-code=${referral}`);
    return response.data?.available || false;
  } catch (error) {
    console.error('Referral check error:', error);
    return false;
  }
};

// ==================== USER PROFILE ====================
export const userProfile = async (username: string): Promise<{ user: any; stats: any }> => {
  try {
    await tokenManager.requireAuth();
    const response = await api.get(`/accounts/profile/${username}/`);
    const { user, stats } = response.data;
    return { user, stats };
  } catch (error: any) {
    console.error(`❌ User profile error for ${username}:`, error);
    throw error;
  }
};

// ==================== SEARCH ====================
export function useSearch() {
  // Bu funksiya React hook bo'lgani uchun uni React component ichida ishlatish kerak
  // Utility faylga mos emas, shuning uchun uni olib tashlaymiz yoki alohida hook faylida saqlash kerak
  throw new Error('useSearch hook faqat React component ichida ishlatilishi mumkin');
}

// ==================== LEADERBOARD ====================
export const leaderboardApi = {
  async getLeaderboardData(): Promise<LeaderboardUser[]> {
    await tokenManager.requireAuth();
    try {
      const response = await api.get('/accounts/leaderboard/');
      return response.data.results.map((u: any) => ({
        username: u.username,
        profile_image: u.profile_image,
        tests_solved: u.tests_solved || 0,
        coins: u.coins || 0,
        today_rank: u.today_rank || 0,
        yesterday_rank: u.yesterday_rank || 0,
        is_following: u.is_following || false,
      }));
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      throw error;
    }
  },

  toggleFollow: async (userId: number): Promise<any> => {
    await tokenManager.requireAuth();
    try {
      const res = await api.post(`/accounts/followers/${userId}/toggle/`);
      return res.data;
    } catch (error) {
      console.error('Error toggling follow:', error);
      throw error;
    }
  },
};

export const getLeaderboard = async (page = 1): Promise<APIResponse<any>> => {
  try {
    await tokenManager.requireAuth();
    const response = await api.get(`/accounts/leaderboard/?page=${page}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("❌ Get leaderboard error:", error);
    return handleApiError(error);
  }
};

export const toggleFollow = async (userId: number): Promise<APIResponse<any>> => {
  try {
    await tokenManager.requireAuth();
    const response = await api.post(`/accounts/followers/${userId}/toggle/`);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("❌ Toggle follow error:", error);
    return handleApiError(error);
  }
};

// ==================== SYSTEM API ====================
export const systemAPI = {
  getConfig: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/system/config/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get config error:", error);
      return handleApiError(error);
    }
  },

  updateConfig: async (id: number, data: any): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.patch(`/system/config/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Update config ${id} error:`, error);
      return handleApiError(error);
    }
  },

  getFlags: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/system/flags/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get flags error:", error);
      return handleApiError(error);
    }
  },

  getLogs: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/system/logs/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get logs error:", error);
      return handleApiError(error);
    }
  },

  getRoles: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/system/roles/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get roles error:", error);
      return handleApiError(error);
    }
  },

  updateRole: async (id: number, data: any): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.patch(`/system/roles/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Update role ${id} error:`, error);
      return handleApiError(error);
    }
  }
};

// ==================== CHAT API ====================
export const chatAPI = {
  getChatRooms: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/chat/chatrooms/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get chat rooms error:", error);
      return handleApiError(error);
    }
  },

  createOneOnOneChat: async (userId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.post('/chat/chatrooms/create-one-on-one/', { user_id: userId });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create one-on-one chat error:", error);
      return handleApiError(error);
    }
  },

  createGroupChat: async (data: { name: string; participants: number[] }): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.post('/chat/chatrooms/create-group/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create group chat error:", error);
      return handleApiError(error);
    }
  },

  getChatRoom: async (id: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get(`/chat/chatrooms/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get chat room ${id} error:`, error);
      return handleApiError(error);
    }
  },

  updateChatRoom: async (id: number, data: any): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.patch(`/chat/chatrooms/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Update chat room ${id} error:`, error);
      return handleApiError(error);
    }
  },

  deleteChatRoom: async (id: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.delete(`/chat/chatrooms/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Delete chat room ${id} error:`, error);
      return handleApiError(error);
    }
  },

  addParticipant: async (roomId: number, userId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.post(`/chat/chatrooms/${roomId}/add-participant/`, { user_id: userId });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Add participant ${userId} to room ${roomId} error:`, error);
      return handleApiError(error);
    }
  },

  removeParticipant: async (roomId: number, userId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.post(`/chat/chatrooms/${roomId}/remove-participant/`, { user_id: userId });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Remove participant ${userId} from room ${roomId} error:`, error);
      return handleApiError(error);
    }
  },

  pinMessage: async (roomId: number, messageId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.post(`/chat/chatrooms/${roomId}/pin-message/`, { message_id: messageId });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Pin message ${messageId} in room ${roomId} error:`, error);
      return handleApiError(error);
    }
  },

  getMessages: async (params?: { page?: number; page_size?: number; chatroom?: number }): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/chat/messages/', { params });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get messages error:", error);
      return handleApiError(error);
    }
  },

  sendMessage: async (data: {
    chatroom: number;
    content?: string;
    message_type?: 'text' | 'file' | 'quiz' | 'system';
    reply_to?: number;
    file?: File;
  }): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'file' && value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });
      const response = await api.post('/chat/messages/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Send message error:", error);
      return handleApiError(error);
    }
  },

  getMessage: async (id: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get(`/chat/messages/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get message ${id} error:`, error);
      return handleApiError(error);
    }
  },

  updateMessage: async (id: number, data: any): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.patch(`/chat/messages/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Update message ${id} error:`, error);
      return handleApiError(error);
    }
  },

  deleteMessage: async (id: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.delete(`/chat/messages/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Delete message ${id} error:`, error);
      return handleApiError(error);
    }
  },

  deleteMessageForAll: async (id: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.delete(`/chat/messages/${id}/delete-for-all/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Delete message for all ${id} error:`, error);
      return handleApiError(error);
    }
  },

  forwardMessage: async (id: number, chatroomIds: number[]): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.post(`/chat/messages/${id}/forward/`, { chatroom_ids: chatroomIds });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Forward message ${id} error:`, error);
      return handleApiError(error);
    }
  },

  reactToMessage: async (id: number, emoji: string): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.post(`/chat/messages/${id}/react/`, { emoji });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ React to message ${id} error:`, error);
      return handleApiError(error);
    }
  },

  getQuizAttempts: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/chat/quiz-attempts/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get quiz attempts error:", error);
      return handleApiError(error);
    }
  },

  createQuizAttempt: async (data: {
    message: number;
    answers: { question_id: number; selected_options: number[] }[];
  }): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.post('/chat/quiz-attempts/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create quiz attempt error:", error);
      return handleApiError(error);
    }
  },

  getBlockedUsers: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/chat/blocked-users/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get blocked users error:", error);
      return handleApiError(error);
    }
  },

  blockUser: async (userId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.post('/chat/blocked-users/', { blocked_user: userId });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Block user ${userId} error:`, error);
      return handleApiError(error);
    }
  },

  unblockUser: async (id: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.delete(`/chat/blocked-users/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Unblock user ${id} error:`, error);
      return handleApiError(error);
    }
  },

  getDrafts: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get('/chat/drafts/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get drafts error:", error);
      return handleApiError(error);
    }
  },

  createDraft: async (data: { chatroom: number; content: string }): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.post('/chat/drafts/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create draft error:", error);
      return handleApiError(error);
    }
  },

  updateDraft: async (id: number, data: { content: string }): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.patch(`/chat/drafts/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Update draft ${id} error:`, error);
      return handleApiError(error);
    }
  },

  deleteDraft: async (id: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.delete(`/chat/drafts/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Delete draft ${id} error:`, error);
      return handleApiError(error);
    }
  },
};

// ==================== LIVE QUIZ API ====================
export const liveQuizAPI = {
  fetchMyLiveQuizzes: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get("/quiz/live-quiz/my/");
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch my live quizzes error:", error);
      return handleApiError(error);
    }
  },

  createLiveQuiz: async (data: {
    test: number;
    mode: "timed" | "first_answer" | "admin_controlled" | "free";
    start_time?: string;
    end_time?: string;
    description?: string;
    is_public?: boolean;
    is_active?: boolean;
    time_per_question?: number;
  }): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();

      let csrfToken = csrfManager.getToken();
      if (!csrfToken) {
        csrfToken = await csrfManager.fetchToken();
      }

      let isActive = false;
      if (data.start_time) {
        const now = new Date();
        const start = new Date(data.start_time);
        isActive = start <= now;
      }

      const payload = {
        test: data.test,
        mode: data.mode,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        description: data.description || "",
        is_public: data.is_public !== undefined ? data.is_public : true,
        is_active: isActive,
        ...(data.mode === "timed" && data.time_per_question && {
          time_per_question: data.time_per_question,
        }),
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (csrfToken) {
        headers["X-CSRFToken"] = csrfToken;
      }

      const response = await api.post("/quiz/live-quiz/save/", payload, { headers });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create live quiz error:", error);
      return handleApiError(error);
    }
  },

  getLiveQuiz: async (id: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get(`/quiz/live-quiz/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get live quiz ${id} error:`, error);
      return handleApiError(error);
    }
  },

  updateLiveQuiz: async (id: number, data: any): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.patch(`/quiz/live-quiz/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Update live quiz ${id} error:`, error);
      return handleApiError(error);
    }
  },

  deleteLiveQuiz: async (id: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.delete(`/quiz/live-quiz/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Delete live quiz ${id} error:`, error);
      return handleApiError(error);
    }
  },

  joinLiveQuiz: async (quizId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.post(`/quiz/live-quiz/${quizId}/join/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Join live quiz ${quizId} error:`, error);
      return handleApiError(error);
    }
  },

  getLiveQuizParticipants: async (quizId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get(`/quiz/live-quiz/${quizId}/participants/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get live quiz participants ${quizId} error:`, error);
      return handleApiError(error);
    }
  },

  submitLiveQuizAnswer: async (
      quizId: number,
      data: {
        question_id: number;
        selected_answer_ids: number[];
        duration?: number;
      },
  ): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.post(`/quiz/live-quiz/${quizId}/submit-answer/`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Submit live quiz answer ${quizId} error:`, error);
      return handleApiError(error);
    }
  },

  getLiveQuizResults: async (quizId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await api.get(`/quiz/live-quiz/${quizId}/results/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get live quiz results ${quizId} error:`, error);
      return handleApiError(error);
    }
  },
};

// ==================== HEALTH CHECK ====================
export const checkApiHealth = async (): Promise<{ healthy: boolean; data?: any; error?: string; code?: string }> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health/`, { timeout: 5000 });
    return { healthy: true, data: response.data };
  } catch (error: any) {
    return {
      healthy: false,
      error: error.message,
      code: error.code
    };
  }
};

export const initializeCSRF = async (): Promise<boolean> => {
  try {
    await csrfManager.fetchToken();
    return true;
  } catch (error) {
    console.error("Failed to initialize CSRF token:", error);
    return false;
  }
};

// ==================== STRICT AUTH CHECK ====================
export const checkAuthWithStrictValidation = async (): Promise<{
  isAuthenticated: boolean;
  userData: any;
  error?: string;
}> => {
  try {
    const isAuthenticated = await tokenManager.validateAndRefreshToken();

    if (!isAuthenticated) {
      throw new Error('AUTHENTICATION_REQUIRED');
    }

    const userData = tokenManager.decodeToken();

    return {
      isAuthenticated: true,
      userData
    };
  } catch (error: any) {
    console.error('❌ Strict auth check failed:', error);

    tokenManager.clearTokens();
    if (typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')) {
      window.location.href = '/login';
    }

    return {
      isAuthenticated: false,
      userData: null,
      error: error.message
    };
  }
};

// ==================== BACKEND HEALTH CHECK ====================
export const checkBackendHealth = async (): Promise<{
  healthy: boolean;
  error?: string;
}> => {
  try {
    await axios.get(API_BASE_URL, { timeout: 5000 });
    return { healthy: true };
  } catch (error: any) {
    return {
      healthy: false,
      error: `Backend serverga ulanish imkoni yo'q: ${error.code || error.message}`
    };
  }
};

// ==================== WEB SOCKET ====================
export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.url = 'wss://backend.testabd.uz/ws/chat/';
    this.token = tokenManager.getAccessToken();

    if (!this.token) {
      console.error('❌ No authentication token for WebSocket');
      tokenManager.clearTokens();
      if (typeof window !== 'undefined' &&
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
  }

  connect(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    if (!this.token) {
      console.error('❌ Cannot connect WebSocket: No authentication token');
      tokenManager.clearTokens();
      if (typeof window !== 'undefined' &&
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
      return;
    }

    try {
      const wsUrl = `${this.url}?token=${this.token}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.reconnect(onMessage, onError);
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        onError?.(error);
      };

    } catch (error) {
      console.error('❌ Error creating WebSocket connection:', error);
      onError?.(error as Event);
    }
  }

  private reconnect(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`🔄 Reconnecting WebSocket... attempt ${this.reconnectAttempts}`);
        this.connect(onMessage, onError);
      }, 1000 * this.reconnectAttempts);
    } else {
      console.error('❌ WebSocket reconnection failed after maximum attempts');
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('❌ WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(chatroomId: number, content: string, messageType = 'text') {
    this.send({
      type: 'chat_message',
      chatroom_id: chatroomId,
      message: content,
      message_type: messageType
    });
  }

  joinRoom(chatroomId: number) {
    this.send({
      type: 'join_room',
      chatroom_id: chatroomId
    });
  }

  leaveRoom(chatroomId: number) {
    this.send({
      type: 'leave_room',
      chatroom_id: chatroomId
    });
  }

  sendTyping(chatroomId: number, isTyping: boolean) {
    this.send({
      type: 'typing',
      chatroom_id: chatroomId,
      is_typing: isTyping
    });
  }

  startQuiz(chatroomId: number, testId: number) {
    this.send({
      type: 'start_quiz',
      chatroom_id: chatroomId,
      test_id: testId
    });
  }

  submitQuizAnswer(chatroomId: number, questionId: number, answer: any) {
    this.send({
      type: 'quiz_answer',
      chatroom_id: chatroomId,
      question_id: questionId,
      answer: answer
    });
  }
}

// ==================== DEFAULT EXPORT ====================
export default api;