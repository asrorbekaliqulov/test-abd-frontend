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
  fromCache?: boolean;
  isThrottled?: boolean;
  hasMore?: boolean;
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

// ==================== INFINITE SCROLL KONSTANTALARI ====================
const INFINITE_SCROLL_PAGE_SIZE = 10;
const INFINITE_SCROLL_THRESHOLD = 2;
const INFINITE_SCROLL_DEBOUNCE = 500;
const INFINITE_SCROLL_MIN_INTERVAL = 1000;

// ==================== INFINITE SCROLL MANAGER ====================
class InfiniteScrollManager {
  private state: {
    isLoading: boolean;
    hasMore: boolean;
    currentPage: number;
    loadedItems: any[];
    filters: any;
  };
  private lastLoadTime: number = 0;
  private loadTimeout: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;
  private abortController: AbortController | null = null;
  private lastFilters: string = '';

  constructor() {
    this.state = {
      isLoading: false,
      hasMore: true,
      currentPage: 1,
      loadedItems: [],
      filters: {}
    };
  }

  init(filters: any = {}): any {
    const filtersStr = JSON.stringify(filters);

    if (this.isInitialized && filtersStr === this.lastFilters) {
      console.log('🔄 Infinite scroll already initialized with same filters');
      return this.getState();
    }

    this.reset();
    this.state.filters = { ...filters };
    this.lastFilters = filtersStr;
    this.isInitialized = true;

    console.log('🔄 Infinite scroll initialized with filters:', filters);
    return this.getState();
  }

  getState(): any {
    return { ...this.state };
  }

  reset(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.state = {
      isLoading: false,
      hasMore: true,
      currentPage: 1,
      loadedItems: [],
      filters: {}
    };
    this.lastLoadTime = 0;
    this.isInitialized = false;
    this.lastFilters = '';

    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
      this.loadTimeout = null;
    }

    console.log('🔄 Infinite scroll reset');
  }

  updateFilters(newFilters: any): boolean {
    const oldFilters = JSON.stringify(this.state.filters);
    const newFiltersStr = JSON.stringify(newFilters);

    if (oldFilters !== newFiltersStr) {
      console.log('🔄 Filters changed, resetting infinite scroll');
      this.state.filters = { ...newFilters };
      this.lastFilters = newFiltersStr;
      this.reset();
      return true;
    }

    console.log('🔄 Filters unchanged, skipping reset');
    return false;
  }

  shouldLoadMore(currentIndex: number): boolean {
    if (!this.isInitialized) {
      console.log('🚫 Infinite scroll not initialized');
      return false;
    }

    if (this.state.isLoading) {
      console.log('🚫 Already loading, skipping');
      return false;
    }

    if (!this.state.hasMore) {
      console.log('🚫 No more items to load');
      return false;
    }

    const totalLoaded = this.state.loadedItems.length;

    if (totalLoaded === 0) {
      console.log('🔍 No items loaded yet, should load');
      return true;
    }

    const remainingItems = totalLoaded - currentIndex;
    const shouldLoad = remainingItems <= INFINITE_SCROLL_THRESHOLD;

    console.log(`🔍 Infinite scroll check: currentIndex=${currentIndex}, totalLoaded=${totalLoaded}, remaining=${remainingItems}, threshold=${INFINITE_SCROLL_THRESHOLD}, shouldLoad=${shouldLoad}`);

    return shouldLoad;
  }

  async loadMore(): Promise<APIResponse> {
    const now = Date.now();
    const timeSinceLastLoad = now - this.lastLoadTime;

    if (timeSinceLastLoad < INFINITE_SCROLL_MIN_INTERVAL) {
      console.log(`⏱️ Too soon to load more: ${timeSinceLastLoad}ms since last load`);
      return {
        success: false,
        error: 'Please wait before loading more',
        isThrottled: true
      };
    }

    if (this.state.isLoading) {
      console.log('🚫 Already loading more items...');
      return {
        success: false,
        error: 'Already loading more items...',
        data: this.state.loadedItems
      };
    }

    if (!this.state.hasMore) {
      console.log('🎉 No more items to load');
      return {
        success: true,
        data: { results: this.state.loadedItems, count: this.state.loadedItems.length },
        results: this.state.loadedItems,
        message: 'No more items to load',
        hasMore: false
      };
    }

    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
      this.loadTimeout = null;
    }

    return new Promise((resolve) => {
      this.loadTimeout = setTimeout(async () => {
        await this.performLoadMore(resolve);
      }, INFINITE_SCROLL_DEBOUNCE);
    });
  }

  private async performLoadMore(resolve: Function): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    this.state.isLoading = true;
    this.lastLoadTime = Date.now();

    try {
      console.log(`📄 Infinite scroll loading page ${this.state.currentPage}...`);

      const result = await fetchQuizzesInfinite(
          this.state.currentPage,
          INFINITE_SCROLL_PAGE_SIZE,
          this.state.filters,
          this.abortController.signal
      );

      console.log(`📥 Infinite scroll result for page ${this.state.currentPage}:`, {
        success: result.success,
        dataCount: result.data?.results?.length || result.data?.length || 0,
        hasMore: result.hasMore
      });

      if (result.success && result.data) {
        let newItems = [];

        if (result.data?.results && Array.isArray(result.data.results)) {
          newItems = result.data.results;
        } else if (Array.isArray(result.data)) {
          newItems = result.data;
        }

        console.log(`✅ Infinite scroll loaded ${newItems.length} items for page ${this.state.currentPage}`);

        const existingIds = new Set(this.state.loadedItems.map(item => item.id));
        const uniqueNewItems = newItems.filter(item => item && item.id && !existingIds.has(item.id));

        if (newItems.length !== uniqueNewItems.length) {
          console.log(`⚠️ Filtered ${newItems.length - uniqueNewItems.length} duplicate items`);
        }

        this.state.loadedItems = [...this.state.loadedItems, ...uniqueNewItems];

        const loadedEnough = newItems.length >= INFINITE_SCROLL_PAGE_SIZE;
        const hasNextPage = !!result.data?.next;

        this.state.hasMore = loadedEnough || hasNextPage;

        console.log(`📊 Page analysis: loadedEnough=${loadedEnough}, hasNextPage=${hasNextPage}, hasMore=${this.state.hasMore}`);

        if (this.state.hasMore) {
          this.state.currentPage++;
          console.log(`⬆️ Incremented page to ${this.state.currentPage}`);
        } else {
          console.log(`🏁 Reached end of content at page ${this.state.currentPage}`);
        }

        resolve({
          success: true,
          data: result.data,
          results: this.state.loadedItems,
          page: this.state.currentPage - 1,
          hasMore: this.state.hasMore,
          totalLoaded: this.state.loadedItems.length
        });
      } else {
        console.error('❌ Infinite scroll load failed:', result.error);
        this.state.hasMore = false;

        resolve({
          success: false,
          error: result.error || 'Failed to load items',
          data: this.state.loadedItems,
          hasMore: false
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🛑 Infinite scroll load aborted');
        resolve({
          success: false,
          error: 'Request aborted',
          data: this.state.loadedItems
        });
      } else {
        console.error('❌ Infinite scroll load error:', error);
        this.state.hasMore = false;
        resolve(handleApiError(error));
      }
    } finally {
      this.state.isLoading = false;
      this.abortController = null;

      if (this.loadTimeout) {
        clearTimeout(this.loadTimeout);
        this.loadTimeout = null;
      }
    }
  }

  addItem(item: any): void {
    if (item && item.id && !this.state.loadedItems.find(q => q.id === item.id)) {
      this.state.loadedItems = [item, ...this.state.loadedItems];
      console.log(`➕ Added item ${item.id} to infinite scroll`);
    }
  }

  updateItem(itemId: number, updates: any): void {
    const index = this.state.loadedItems.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.state.loadedItems[index] = { ...this.state.loadedItems[index], ...updates };
      console.log(`✏️ Updated item ${itemId} in infinite scroll`);
    }
  }

  removeItem(itemId: number): void {
    const initialLength = this.state.loadedItems.length;
    this.state.loadedItems = this.state.loadedItems.filter(item => item.id !== itemId);

    if (this.state.loadedItems.length !== initialLength) {
      console.log(`🗑️ Removed item ${itemId} from infinite scroll`);
    }
  }

  syncWithExternalData(externalData: any[]): void {
    if (!Array.isArray(externalData) || externalData.length === 0) return;

    const existingIds = new Set(this.state.loadedItems.map(item => item.id));
    const newItems = externalData.filter(item => item && item.id && !existingIds.has(item.id));

    if (newItems.length > 0) {
      this.state.loadedItems = [...this.state.loadedItems, ...newItems];
      console.log(`🔄 Synced ${newItems.length} new items from external source`);
    }
  }
}

export const infiniteScrollManager = new InfiniteScrollManager();

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
    try {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      console.log('✅ Tokens set successfully');
    } catch (error) {
      console.error('❌ Error setting tokens:', error);
    }
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      console.log('✅ Tokens cleared');
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
    }
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

      const response = await axios.post<TokenRefreshResponse>(
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
        console.log('🔒 Redirecting to login due to token refresh failure');
        window.location.href = '/login';
      }

      throw new Error('AUTHENTICATION_REQUIRED');
    }
  },

  isTokenValid: (): boolean => {
    const accessToken = tokenManager.getAccessToken();
    if (!accessToken) {
      console.log('🔍 No access token found');
      return false;
    }

    try {
      const tokenParts = accessToken.split('.');
      if (tokenParts.length !== 3) {
        console.log('🔍 Invalid token format');
        return false;
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();
      const bufferTime = 60000;

      const isValid = currentTime < (expiryTime - bufferTime);

      if (!isValid) {
        console.log('🔍 Token expired or about to expire');
      }

      return isValid;
    } catch (error) {
      console.error('❌ Token validation error:', error);
      return false;
    }
  },

  validateAndRefreshToken: async (): Promise<boolean> => {
    console.log('🔐 Starting token validation...');

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

    console.log('🔄 Token expired or invalid, attempting refresh...');

    if (!hasRefreshToken) {
      console.error('❌ No refresh token available');
      tokenManager.clearTokens();

      if (typeof window !== 'undefined' &&
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register')) {
        console.log('🔒 Redirecting to login due to missing refresh token');
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
        console.log('🔒 Redirecting to login due to token refresh failure');
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
    console.log('🔒 Checking authentication...');

    try {
      const isAuthenticated = await tokenManager.validateAndRefreshToken();

      if (!isAuthenticated) {
        console.error('❌ Authentication failed');
        throw new Error('AUTHENTICATION_REQUIRED');
      }

      console.log('✅ Authentication successful');
      return true;
    } catch (error) {
      console.error('❌ Authentication error:', error);
      throw error;
    }
  }
};

// ==================== HELPER FUNCTIONS ====================
const getDefaultHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
};

const getAuthHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const token = tokenManager.getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const csrfToken = csrfManager.getToken();
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }

  return headers;
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

  if (error.message.includes('CORS') || error.code === 'ERR_NETWORK') {
    return {
      success: false,
      error: "CORS xatoligi: Server sozlamalarini tekshiring.",
      isCorsError: true
    };
  }

  if (error.message === 'AUTHENTICATION_REQUIRED' ||
      error.response?.status === 401 ||
      error.message === 'REFRESH_TOKEN_NOT_FOUND') {

    tokenManager.clearTokens();

    if (typeof window !== "undefined" &&
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')) {
      console.log('🔒 Redirecting to login due to authentication error');
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
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
export const csrfManager = {
  getToken: (): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrftoken="));
    return match ? decodeURIComponent(match.split("=")[1]) : null;
  },

  setToken: (token: string): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `csrftoken=${token}; path=/; SameSite=Lax; Secure`;
  },

  fetchToken: async (): Promise<string | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/system/csrf/`, {
        headers: getDefaultHeaders(),
        timeout: 10000
      });

      const csrfToken = csrfManager.getToken();
      console.log('✅ CSRF token fetched:', csrfToken ? 'Token received' : 'No token');
      return csrfToken;
    } catch (error) {
      console.warn("⚠️ Failed to fetch CSRF token:", error);
      return null;
    }
  },

  ensureToken: async (): Promise<string | null> => {
    const existingToken = csrfManager.getToken();
    if (existingToken) {
      return existingToken;
    }
    return await csrfManager.fetchToken();
  }
};

// ==================== UTILITY FUNCTIONS ====================
let fetchTimeout: NodeJS.Timeout | null = null;
let lastFetchTime = 0;
const FETCH_THROTTLE_DELAY = 300;
const MIN_FETCH_INTERVAL = 1000;

const debouncedFetch = <T extends (...args: any[]) => Promise<any>>(
    func: T,
    delay: number
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          timeoutId = null;
        }
      }, delay);
    });
  };
};

const throttleFetch = <T extends (...args: any[]) => Promise<any>>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
  let inThrottle: boolean = false;
  let lastResult: any = null;
  let lastError: any = null;

  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (!inThrottle) {
      inThrottle = true;

      try {
        const result = await func(...args);
        lastResult = result;
        lastError = null;

        setTimeout(() => {
          inThrottle = false;
        }, limit);

        return result;
      } catch (error) {
        lastError = error;
        inThrottle = false;
        throw error;
      }
    } else {
      console.log('⏱️ Fetch throttled - waiting for next interval');

      if (lastResult && !lastError) {
        console.log('📦 Returning cached result from throttled fetch');
        return Promise.resolve(lastResult);
      }

      return Promise.reject(new Error('Fetch throttled'));
    }
  };
};

const quizCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

const cleanupCache = () => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [key, value] of quizCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION * 2) {
      quizCache.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} expired cache entries`);
  }
};

setInterval(cleanupCache, 10 * 60 * 1000);

// ==================== API INSTANCES ====================
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: getDefaultHeaders(),
  timeout: 15000,
});

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: getDefaultHeaders(),
  timeout: 15000,
});

const formAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// ==================== HELPER FUNCTIONS ====================
export function getCookie(name: string): string | null {
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

      const csrfToken = csrfManager.getToken();
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

      const csrfToken = csrfManager.getToken();
      if (csrfToken && config.headers) {
        config.headers["X-CSRFToken"] = csrfToken;
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

// ==================== OPTIMIZED QUIZ FETCH FUNCTIONS ====================
const _fetchQuizzes = async (params: any = {}, signal?: AbortSignal): Promise<APIResponse<any>> => {
  try {
    const now = Date.now();

    if (now - lastFetchTime < MIN_FETCH_INTERVAL) {
      console.log('⏱️ Throttling fetch - too frequent requests');
      return {
        success: false,
        error: 'Too many requests. Please wait.',
        isThrottled: true
      };
    }

    await requireAuthForQuiz();

    console.log("🔍 Starting fetchQuizzes with params:", params);

    const queryParams: Record<string, any> = {};

    if (params.category !== undefined && params.category !== null && params.category !== "All" && params.category !== "all") {
      queryParams.category = params.category;
    }

    if (params.search && params.search.trim() !== '') {
      queryParams.search = params.search.trim();
    }

    if (params.ordering) {
      queryParams.ordering = params.ordering;
    }

    queryParams.page_size = params.page_size || 10;

    if (params.page) {
      queryParams.page = params.page;
    }

    if (params.difficulty_min !== undefined && params.difficulty_min !== null && params.difficulty_min !== '') {
      const minVal = Number(params.difficulty_min);
      if (!isNaN(minVal) && minVal >= 0 && minVal <= 100) {
        queryParams.difficulty_min = minVal;
      }
    }

    if (params.difficulty_max !== undefined && params.difficulty_max !== null && params.difficulty_max !== '') {
      const maxVal = Number(params.difficulty_max);
      if (!isNaN(maxVal) && maxVal >= 0 && maxVal <= 100) {
        queryParams.difficulty_max = maxVal;
      }
    }

    if (params.worked !== undefined && params.worked !== null && params.worked !== '') {
      if (params.worked === true || params.worked === 'true') {
        queryParams.worked = true;
      }
    }

    if (params.unworked !== undefined && params.unworked !== null && params.unworked !== '') {
      if (params.unworked === true || params.unworked === 'true') {
        queryParams.unworked = true;
      }
    }

    if (params.is_random !== undefined && params.is_random !== null && params.is_random !== '') {
      if (params.is_random === true || params.is_random === 'true') {
        queryParams.is_random = true;
      }
    }

    console.log("📤 Final backend query params:", queryParams);

    lastFetchTime = Date.now();

    const response = await axios.get(`${API_BASE_URL}/quiz/qs/`, {
      params: queryParams,
      paramsSerializer: {
        indexes: null
      },
      headers: getAuthHeaders(),
      timeout: 15000,
      signal
    });

    console.log("📥 Backend response status:", response.status);

    // Correct_count va wrong_count ma'lumotlarini to'g'ri olish va saqlash
    const data = response.data;

    if (data && data.results && Array.isArray(data.results)) {
      // Har bir quiz uchun correct_count va wrong_count ni to'g'ri formatda saqlash
      data.results = data.results.map((quiz: any) => ({
        ...quiz,
        correct_count: quiz.correct_count || quiz.correct_attempts || 0,
        wrong_count: quiz.wrong_count || quiz.wrong_attempts || 0,
        // Stats maydonini to'g'ri formatda yaratish
        stats: quiz.stats || {
          total_attempts: (quiz.correct_count || 0) + (quiz.wrong_count || 0),
          correct_attempts: quiz.correct_count || 0,
          wrong_attempts: quiz.wrong_count || 0,
          accuracy: quiz.difficulty_percentage || 0,
          average_time: 0
        }
      }));
    }

    return {
      success: true,
      data: data
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('🛑 Fetch quizzes aborted');
      return {
        success: false,
        error: 'Request aborted'
      };
    }
    console.error("❌ Fetch quizzes API error:", error);
    return handleApiError(error);
  }
};

export const fetchQuizzes = debouncedFetch(_fetchQuizzes, FETCH_THROTTLE_DELAY);
export const fetchQuizzesThrottled = throttleFetch(_fetchQuizzes, MIN_FETCH_INTERVAL);

export const fetchQuizzesWithCache = async (
    params: any,
    useCache: boolean = true,
    signal?: AbortSignal
): Promise<APIResponse<any>> => {
  const cacheKey = JSON.stringify(params);

  if (useCache) {
    const cached = quizCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📦 Returning cached quizzes from fetchQuizzesWithCache');
      return {
        success: true,
        data: cached.data,
        fromCache: true
      };
    }
  }

  try {
    const result = await fetchQuizzes(params, signal);

    if (result.success && result.data) {
      quizCache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now()
      });

      if (quizCache.size > 100) {
        const firstKey = quizCache.keys().next().value;
        if (firstKey) {
          quizCache.delete(firstKey);
        }
      }
    }

    return result;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const fetchQuizzesInfinite = async (
    page: number,
    pageSize: number = INFINITE_SCROLL_PAGE_SIZE,
    filters: any = {},
    signal?: AbortSignal
): Promise<APIResponse<any>> => {
  try {
    const params = {
      page,
      page_size: pageSize,
      ...filters
    };

    console.log(`📄 Infinite scroll: page=${page}, pageSize=${pageSize}`);

    const cacheKey = JSON.stringify(params);
    const cached = quizCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📦 Returning cached infinite scroll page ${page}`);
      return {
        success: true,
        data: cached.data,
        fromCache: true,
        page,
        hasMore: (cached.data?.results?.length || 0) >= pageSize || !!cached.data?.next
      };
    }

    const result = await _fetchQuizzes(params, signal);

    if (result.success && result.data) {
      quizCache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now()
      });

      const hasMore = (result.data?.results?.length || 0) >= pageSize || !!result.data?.next;

      console.log(`📊 Infinite scroll result: loaded=${result.data?.results?.length || 0}, hasMore=${hasMore}`);

      return {
        ...result,
        page,
        hasMore
      };
    }

    return {
      ...result,
      page,
      hasMore: false
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('🛑 Fetch quizzes infinite aborted');
      return {
        success: false,
        error: 'Request aborted',
        hasMore: false
      };
    }
    console.error("❌ Fetch quizzes infinite error:", error);
    return {
      ...handleApiError(error),
      hasMore: false
    };
  }
};

export const clearQuizCache = (): void => {
  const cacheSize = quizCache.size;
  quizCache.clear();
  console.log(`🧹 Cleared ${cacheSize} items from quiz cache`);
};

// ==================== QUIZ API FUNCTIONS ====================
const requireAuthForQuiz = async (): Promise<void> => {
  try {
    await tokenManager.requireAuth();
  } catch (error) {
    console.error('❌ Authentication required for quiz operations');
    throw error;
  }
};

export const fetchQuizzesWithFilters = async (filters: any = {}): Promise<APIResponse<any>> => {
  try {
    await requireAuthForQuiz();

    console.log("🔍 Starting fetchQuizzesWithFilters with filters:", filters);

    const cleanFilters: Record<string, any> = {};

    if (filters.category !== undefined && filters.category !== null && filters.category !== "All" && filters.category !== "all") {
      cleanFilters.category = filters.category;
    }

    if (filters.search && filters.search.trim() !== '') {
      cleanFilters.search = filters.search.trim();
    }

    if (filters.ordering) {
      cleanFilters.ordering = filters.ordering;
    }

    cleanFilters.page_size = filters.page_size || 20;

    if (filters.page) {
      cleanFilters.page = filters.page;
    }

    if (filters.difficulty_min !== undefined && filters.difficulty_min !== null && filters.difficulty_min !== '') {
      const minVal = Number(filters.difficulty_min);
      if (!isNaN(minVal) && minVal >= 0 && minVal <= 100) {
        cleanFilters.difficulty_min = minVal;
      }
    }

    if (filters.difficulty_max !== undefined && filters.difficulty_max !== null && filters.difficulty_max !== '') {
      const maxVal = Number(filters.difficulty_max);
      if (!isNaN(maxVal) && maxVal >= 0 && maxVal <= 100) {
        cleanFilters.difficulty_max = maxVal;
      }
    }

    if (filters.worked !== undefined && filters.worked !== null && filters.worked !== '') {
      if (filters.worked === true || filters.worked === 'true') {
        cleanFilters.worked = true;
      }
    }

    if (filters.unworked !== undefined && filters.unworked !== null && filters.unworked !== '') {
      if (filters.unworked === true || filters.unworked === 'true') {
        cleanFilters.unworked = true;
      }
    }

    if (filters.is_random !== undefined && filters.is_random !== null && filters.is_random !== '') {
      if (filters.is_random === true || filters.is_random === 'true') {
        cleanFilters.is_random = true;
      }
    }

    console.log("🔍 Final cleaned filters for backend:", cleanFilters);

    return await fetchQuizzesWithCache(cleanFilters);
  } catch (error: any) {
    console.error("❌ Fetch quizzes with filters API error:", error);
    return handleApiError(error);
  }
};

export const fetchRandomQuizzes = async (count: number = 10, page: number = 1): Promise<APIResponse<any>> => {
  try {
    await requireAuthForQuiz();

    console.log(`🎲 Fetching random quizzes: count=${count}, page=${page}`);

    const response = await axios.get(`${API_BASE_URL}/quiz/qs/`, {
      params: {
        is_random: true,
        page: page,
        page_size: count,
        ordering: '?'
      },
      headers: getAuthHeaders(),
      timeout: 15000,
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

export const fetchQuizzesByUrl = async (url: string): Promise<APIResponse<any>> => {
  try {
    await requireAuthForQuiz();
    const apiUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    console.log(`🔗 Fetching quizzes by URL: ${apiUrl}`);
    const response = await axios.get(apiUrl, {
      headers: getAuthHeaders(),
      timeout: 15000,
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error("❌ Fetch quizzes by URL error:", error);
    return handleApiError(error);
  }
};

export const fetchQuizById = async (id: number): Promise<APIResponse<any>> => {
  try {
    await requireAuthForQuiz();
    console.log(`📋 Fetching quiz by ID: ${id}`);
    const response = await axios.get(`${API_BASE_URL}/quiz/qs/${id}/`, {
      headers: getAuthHeaders(),
      timeout: 15000,
    });

    // Correct_count va wrong_count ni to'g'ri formatda qaytarish
    const quizData = response.data;
    if (quizData) {
      quizData.correct_count = quizData.correct_count || quizData.correct_attempts || 0;
      quizData.wrong_count = quizData.wrong_count || quizData.wrong_attempts || 0;
    }

    return {
      success: true,
      data: quizData,
      status: response.status
    };
  } catch (error: any) {
    console.error(`❌ Fetch quiz by ID ${id} error:`, error);
    return handleApiError(error);
  }
};

export const fetchQuizzesByCategory = async (categoryId: number, page: number = 1, page_size: number = 30): Promise<APIResponse<any>> => {
  try {
    await requireAuthForQuiz();
    console.log(`🏷️ Fetching quizzes by category: ${categoryId}, page: ${page}`);
    const response = await axios.get(`${API_BASE_URL}/quiz/qs/`, {
      params: {
        category: categoryId,
        page: page,
        page_size: page_size,
        ordering: '-created_at'
      },
      headers: getAuthHeaders(),
      timeout: 15000,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error(`❌ Fetch quizzes by category ${categoryId} error:`, error);
    return handleApiError(error);
  }
};

export const fetchRecommendedTests = async (count: number = 10): Promise<APIResponse<any>> => {
  try {
    await requireAuthForQuiz();
    console.log(`⭐ Fetching recommended tests: count=${count}`);
    const response = await axios.get(`${API_BASE_URL}/quiz/recommended/`, {
      params: { count },
      headers: getAuthHeaders(),
      timeout: 15000,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("❌ Fetch recommended tests error:", error);
    return handleApiError(error);
  }
};

export const searchAPI = {
  searchAll: async (query: string): Promise<APIResponse<any>> => {
    try {
      const [usersResult, quizzesResult] = await Promise.all([
        accountsAPI.searchUsers(query),
        fetchQuizzesWithFilters({ search: query })
      ]);

      return {
        success: usersResult.success && quizzesResult.success,
        data: {
          users: usersResult.data?.results || usersResult.data || [],
          quizzes: quizzesResult.data?.results || quizzesResult.data || [],
          usersCount: usersResult.data?.count || 0,
          quizzesCount: quizzesResult.data?.count || 0
        }
      };
    } catch (error: any) {
      console.error("❌ Search all error:", error);
      return handleApiError(error);
    }
  }
};

// ==================== TO'LIQ TUG'IRLANGAN QUIZ API ====================
export const quizAPI = {
  fetchQuizzes,
  fetchQuizzesThrottled,
  fetchQuizzesInfinite,
  fetchQuizzesWithCache,
  fetchRandomQuizzes,
  fetchQuizzesByUrl,
  fetchQuizzesWithFilters,
  fetchQuizById,
  fetchQuizzesByCategory,
  fetchRecommendedTests,

  infiniteScroll: {
    init: (filters: any = {}) => infiniteScrollManager.init(filters),
    getState: () => infiniteScrollManager.getState(),
    loadMore: () => infiniteScrollManager.loadMore(),
    shouldLoadMore: (currentIndex: number) => infiniteScrollManager.shouldLoadMore(currentIndex),
    updateFilters: (filters: any) => infiniteScrollManager.updateFilters(filters),
    reset: () => infiniteScrollManager.reset(),
    addItem: (item: any) => infiniteScrollManager.addItem(item),
    updateItem: (itemId: number, updates: any) => infiniteScrollManager.updateItem(itemId, updates),
    removeItem: (itemId: number) => infiniteScrollManager.removeItem(itemId),
    syncWithExternalData: (externalData: any[]) => infiniteScrollManager.syncWithExternalData(externalData)
  },

  clearQuizCache,

  fetchCategories: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log("🏷️ Fetching categories...");
      const response = await axios.get(`${API_BASE_URL}/quiz/categories/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch categories error:", error);
      return handleApiError(error);
    }
  },

  getCategoryById: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/categories/${id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get category by ID ${id} error:`, error);
      return handleApiError(error);
    }
  },

  fetchQuestions: async (url?: string): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      if (url) {
        return fetchQuizzesByUrl(url);
      }
      const response = await axios.get(`${API_BASE_URL}/quiz/qs/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch questions error:", error);
      return handleApiError(error);
    }
  },

  fetchRecentQuestions: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/qs/`, {
        params: { ordering: '-created_at', page_size: 20 },
        headers: getAuthHeaders(),
        timeout: 15000,
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
      const response = await axios.get(`${API_BASE_URL}/quiz/qs/${id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Fetch question by ID ${id} error:`, error);
      return handleApiError(error);
    }
  },

  createQuestion: async (data: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.post(`${API_BASE_URL}/quiz/questions/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create question error:", error);
      return handleApiError(error);
    }
  },

  updateQuestion: async (id: number, data: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.patch(`${API_BASE_URL}/quiz/questions/${id}/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Update question ${id} error:`, error);
      return handleApiError(error);
    }
  },

  deleteQuestion: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.delete(`${API_BASE_URL}/quiz/questions/${id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Delete question ${id} error:`, error);
      return handleApiError(error);
    }
  },

  submitAnswers: async (answers: {
    question: number;
    selected_answer_ids: number[];
    duration?: number;
  }): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`📤 Submitting answers for question ${answers.question}`);
      const response = await axios.post(`${API_BASE_URL}/quiz/submit-answer/`, answers, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
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
      const response = await axios.post(`${API_BASE_URL}/quiz/submit-answer/`, answers, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Submit text answers error:", error);
      return handleApiError(error);
    }
  },

  getQuestionAttempts: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/attempts/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get question attempts error:", error);
      return handleApiError(error);
    }
  },

  getAttemptById: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/attempts/${id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get attempt by ID ${id} error:`, error);
      return handleApiError(error);
    }
  },

  getQuestionViewStats: async (questionId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`👁️ Getting view stats for question ${questionId}`);
      const response = await axios.get(`${API_BASE_URL}/quiz/question-views/${questionId}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
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

      await csrfManager.ensureToken();

      const response = await axios.post(`${API_BASE_URL}/quiz/question-views/${quizId}/`, data || {}, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Add question view ${quizId} error:`, error);
      return handleApiError(error);
    }
  },

  // ==================== TO'LIQ TUG'IRLANGAN BOOKMARK FUNCTIONS ====================
  bookmarkQuestion: async (questionId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`🔖 Bookmarking question: ${questionId}`);

      // Avval bookmark borligini tekshiramiz
      const checkResponse = await axios.get(`${API_BASE_URL}/quiz/question-bookmarks/?question=${questionId}`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });

      if (checkResponse.data.results && checkResponse.data.results.length > 0) {
        // Bookmark bor, uni o'chiramiz (unbookmark)
        const bookmarkId = checkResponse.data.results[0].id;
        const deleteResponse = await axios.delete(`${API_BASE_URL}/quiz/question-bookmarks/${bookmarkId}/`, {
          headers: getAuthHeaders(),
          timeout: 15000,
        });

        // Infinite scroll manager dan itemni yangilash
        infiniteScrollManager.updateItem(questionId, { is_bookmarked: false });

        return {
          success: true,
          data: deleteResponse.data,
          message: "Bookmark removed successfully",
          is_bookmarked: false
        };
      } else {
        // Bookmark yo'q, yangi yaratamiz
        const response = await axios.post(`${API_BASE_URL}/quiz/question-bookmarks/`, {
          question: questionId
        }, {
          headers: getAuthHeaders(),
          timeout: 15000,
        });

        // Infinite scroll manager dan itemni yangilash
        infiniteScrollManager.updateItem(questionId, { is_bookmarked: true });

        return {
          success: true,
          data: response.data,
          message: "Question bookmarked successfully",
          is_bookmarked: true
        };
      }
    } catch (error: any) {
      console.error("❌ Bookmark question error:", error);
      return handleApiError(error);
    }
  },

  getBookmarks: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log("📚 Getting all bookmarks...");
      const response = await axios.get(`${API_BASE_URL}/quiz/question-bookmarks/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data,
        results: response.data.results || []
      };
    } catch (error: any) {
      console.error("❌ Get bookmarks error:", error);
      return handleApiError(error);
    }
  },

  getBookmarkByQuestion: async (questionId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`🔍 Checking bookmark for question ${questionId}`);
      const response = await axios.get(`${API_BASE_URL}/quiz/question-bookmarks/?question=${questionId}`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });

      const isBookmarked = response.data.results && response.data.results.length > 0;

      return {
        success: true,
        data: response.data,
        is_bookmarked: isBookmarked,
        bookmark_id: isBookmarked ? response.data.results[0].id : null
      };
    } catch (error: any) {
      console.error(`❌ Get bookmark by question ${questionId} error:`, error);
      return handleApiError(error);
    }
  },

  deleteBookmarkQuestion: async (bookmarkId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`🗑️ Deleting bookmark ${bookmarkId}`);
      const response = await axios.delete(`${API_BASE_URL}/quiz/question-bookmarks/${bookmarkId}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data,
        message: "Bookmark deleted successfully"
      };
    } catch (error: any) {
      console.error(`❌ Delete bookmark question ${bookmarkId} error:`, error);
      return handleApiError(error);
    }
  },

  bookmarkTest: async (testId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`🔖 Bookmarking test: ${testId}`);

      // Avval bookmark borligini tekshiramiz
      const checkResponse = await axios.get(`${API_BASE_URL}/quiz/test-bookmarks/?test=${testId}`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });

      if (checkResponse.data.results && checkResponse.data.results.length > 0) {
        // Bookmark bor, uni o'chiramiz (unbookmark)
        const bookmarkId = checkResponse.data.results[0].id;
        const deleteResponse = await axios.delete(`${API_BASE_URL}/quiz/test-bookmarks/${bookmarkId}/`, {
          headers: getAuthHeaders(),
          timeout: 15000,
        });

        return {
          success: true,
          data: deleteResponse.data,
          message: "Test bookmark removed successfully",
          is_bookmarked: false
        };
      } else {
        // Bookmark yo'q, yangi yaratamiz
        const response = await axios.post(`${API_BASE_URL}/quiz/test-bookmarks/`, {
          test: testId
        }, {
          headers: getAuthHeaders(),
          timeout: 15000,
        });

        return {
          success: true,
          data: response.data,
          message: "Test bookmarked successfully",
          is_bookmarked: true
        };
      }
    } catch (error: any) {
      console.error("❌ Bookmark test error:", error);
      return handleApiError(error);
    }
  },

  getBookmarksTest: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log("📚 Getting all test bookmarks...");
      const response = await axios.get(`${API_BASE_URL}/quiz/test-bookmarks/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data,
        results: response.data.results || []
      };
    } catch (error: any) {
      console.error("❌ Get bookmarks test error:", error);
      return handleApiError(error);
    }
  },

  getBookmarkByTest: async (testId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`🔍 Checking bookmark for test ${testId}`);
      const response = await axios.get(`${API_BASE_URL}/quiz/test-bookmarks/?test=${testId}`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });

      const isBookmarked = response.data.results && response.data.results.length > 0;

      return {
        success: true,
        data: response.data,
        is_bookmarked: isBookmarked,
        bookmark_id: isBookmarked ? response.data.results[0].id : null
      };
    } catch (error: any) {
      console.error(`❌ Get bookmark by test ${testId} error:`, error);
      return handleApiError(error);
    }
  },

  deleteBookmarkTest: async (bookmarkId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`🗑️ Deleting test bookmark ${bookmarkId}`);
      const response = await axios.delete(`${API_BASE_URL}/quiz/test-bookmarks/${bookmarkId}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data,
        message: "Test bookmark deleted successfully"
      };
    } catch (error: any) {
      console.error(`❌ Delete bookmark test ${bookmarkId} error:`, error);
      return handleApiError(error);
    }
  },

  fetchPublicTests: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/tests/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch public tests error:", error);
      return handleApiError(error);
    }
  },

  fetchTestById: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/tests/${id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Fetch test by ID ${id} error:`, error);
      return handleApiError(error);
    }
  },

  createTest: async (data: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.post(`${API_BASE_URL}/quiz/tests/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create test error:", error);
      return handleApiError(error);
    }
  },

  fetchMyTest: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/tests/my_tests/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch my test error:", error);
      return handleApiError(error);
    }
  },

  fetchTestByUser: async (user_id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/tests/by_user/${user_id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Fetch test by user ${user_id} error:`, error);
      return handleApiError(error);
    }
  },

  getQuizReactions: async (quizId?: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const url = quizId
          ? `${API_BASE_URL}/quiz/quiz-reactions/${quizId}/`
          : `${API_BASE_URL}/quiz/quiz-reactions/`;
      console.log(`❤️ Getting reactions for quiz ${quizId || 'all'}`);
      const response = await axios.get(url, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
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

      await csrfManager.ensureToken();

      const checkResponse = await axios.get(`${API_BASE_URL}/quiz/quiz-reactions/?quiz=${quizId}`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });

      if (checkResponse.data.results && checkResponse.data.results.length > 0) {
        const existingReaction = checkResponse.data.results[0];

        if (existingReaction.reaction_type === reactionType) {
          await axios.delete(`${API_BASE_URL}/quiz/quiz-reactions/${existingReaction.id}/`, {
            headers: getAuthHeaders(),
            timeout: 15000,
          });
          return {
            success: true,
            data: {
              removed: true,
              reaction_type: null,
              message: "Reaction removed"
            }
          };
        } else {
          const response = await axios.patch(
              `${API_BASE_URL}/quiz/quiz-reactions/${existingReaction.id}/`,
              { reaction_type: reactionType },
              {
                headers: getAuthHeaders(),
                timeout: 15000,
              }
          );
          return { success: true, data: response.data };
        }
      } else {
        const response = await axios.post(`${API_BASE_URL}/quiz/quiz-reactions/`, {
          quiz: quizId,
          reaction_type: reactionType
        }, {
          headers: getAuthHeaders(),
          timeout: 15000,
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
      const response = await axios.delete(`${API_BASE_URL}/quiz/quiz-reactions/${reactionId}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Delete reaction ${reactionId} error:`, error);
      return handleApiError(error);
    }
  },

  fetchQuestionsbyfollower: async (url?: string): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      if (url) {
        const response = await axios.get(url, {
          headers: getAuthHeaders(),
          timeout: 15000,
        });
        return { success: true, data: response.data };
      }
      const response = await axios.get(`${API_BASE_URL}/quiz/recommended/followed-questions/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch questions by follower error:", error);
      return handleApiError(error);
    }
  },

  fetchLeaderboard: async (scope: 'global' | 'country' | 'region' | 'district' | 'settlement'): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/leaderboard/?scope=${scope}`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Fetch leaderboard ${scope} error:`, error);
      return handleApiError(error);
    }
  },

  fetchUserStats: async (userId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/user-stats/${userId}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Fetch user stats ${userId} error:`, error);
      return handleApiError(error);
    }
  },

  fetchMyBookmarks: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/tests/my_bookmarks/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch my bookmarks error:", error);
      return handleApiError(error);
    }
  },

  unblockBookmark: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.delete(`${API_BASE_URL}/quiz/test-bookmarks/${id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Unblock bookmark ${id} error:`, error);
      return handleApiError(error);
    }
  },

  fetchMyLiveQuizzes: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/live-quiz/my/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch my live quizzes error:", error);
      return handleApiError(error);
    }
  },

  createLiveQuiz: async (data: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.post(`${API_BASE_URL}/quiz/live-quiz/save/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create live quiz error:", error);
      return handleApiError(error);
    }
  },

  getLiveQuiz: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/live-quiz/${id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get live quiz ${id} error:`, error);
      return handleApiError(error);
    }
  },

  getAchievements: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/achievements/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get achievements error:", error);
      return handleApiError(error);
    }
  },

  getAchievementById: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/achievements/${id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get achievement by ID ${id} error:`, error);
      return handleApiError(error);
    }
  },

  // ==================== TO'LIQ TUG'IRLANGAN CORRECT_COUNT VA WRONG_COUNT ====================
  getQuestionStats: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`📊 Fetching stats for quiz ${id}`);

      const quizResponse = await axios.get(`${API_BASE_URL}/quiz/qs/${id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });

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
        view_count: quiz.view_count,
        correct_attempts: quiz.correct_attempts,
        wrong_attempts: quiz.wrong_attempts
      });

      // To'g'ri formatda correct_count va wrong_count ni olish
      const correctCount = quiz.correct_count || quiz.correct_attempts || 0;
      const wrongCount = quiz.wrong_count || quiz.wrong_attempts || 0;
      const totalAttempts = correctCount + wrongCount;
      const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

      let statsFromEndpoint = null;
      try {
        const statsResponse = await axios.get(`${API_BASE_URL}/quiz/questions/${id}/stats/`, {
          headers: getAuthHeaders(),
          timeout: 15000,
        });
        console.log(`📊 Stats from /quiz/questions/${id}/stats/:`, statsResponse.data);
        statsFromEndpoint = statsResponse.data;
      } catch (statsError: any) {
        console.log(`📊 Stats endpoint /quiz/questions/${id}/stats/ not available:`, statsError.message);

        try {
          const alternativeResponse = await axios.get(`${API_BASE_URL}/quiz/qs/${id}/stats/`, {
            headers: getAuthHeaders(),
            timeout: 15000,
          });
          console.log(`📊 Stats from alternative endpoint for quiz ${id}:`, alternativeResponse.data);
          statsFromEndpoint = alternativeResponse.data;
        } catch (altError) {
          console.log(`📊 Both stats endpoints failed for quiz ${id}, using quiz data`);
        }
      }

      const stats = {
        correct_count: correctCount,
        wrong_count: wrongCount,
        view_count: quiz.view_count || quiz.total_views || 0,
        unique_viewers: quiz.unique_viewers || 0,
        correct_attempts: statsFromEndpoint?.correct_attempts || correctCount,
        wrong_attempts: statsFromEndpoint?.wrong_attempts || wrongCount,
        total_attempts: statsFromEndpoint?.total_attempts || totalAttempts,
        total_views: statsFromEndpoint?.total_views || statsFromEndpoint?.view_count || quiz.view_count || quiz.total_views || 0,
        accuracy: statsFromEndpoint?.accuracy || accuracy,
        average_time: statsFromEndpoint?.average_time || 0,
        difficulty_percentage: quiz.difficulty_percentage || 0,
        has_worked: quiz.has_worked || false,
        is_bookmarked: quiz.is_bookmarked || false,
        user_reaction: quiz.user_reaction || null,
        reactions_summary: quiz.reactions_summary || null
      };

      console.log(`📊 Final compiled stats for quiz ${id}:`, stats);

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      console.error(`❌ Error fetching stats for quiz ${id}:`, error);

      const fallbackStats = {
        correct_count: 0,
        wrong_count: 0,
        view_count: 0,
        unique_viewers: 0,
        correct_attempts: 0,
        wrong_attempts: 0,
        total_attempts: 0,
        total_views: 0,
        accuracy: 0,
        average_time: 0,
        difficulty_percentage: 0,
        has_worked: false,
        is_bookmarked: false,
        user_reaction: null,
        reactions_summary: null
      };

      return {
        success: false,
        error: error.message,
        data: fallbackStats
      };
    }
  },

  updateQuestionStats: async (quizId: number, stats: {
    correct_count?: number;
    wrong_count?: number;
    view_count?: number;
  }): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`📈 Updating stats for quiz ${quizId}:`, stats);

      // Backend API ga so'rov yuborish
      const response = await axios.patch(`${API_BASE_URL}/quiz/qs/${quizId}/stats/`, stats, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });

      // Infinite scroll manager dagi itemni yangilash
      infiniteScrollManager.updateItem(quizId, {
        correct_count: stats.correct_count,
        wrong_count: stats.wrong_count,
        view_count: stats.view_count
      });

      return {
        success: true,
        data: response.data,
        message: "Stats updated successfully"
      };
    } catch (error: any) {
      console.error(`❌ Update question stats error for quiz ${quizId}:`, error);
      return handleApiError(error);
    }
  },

  incrementCorrectCount: async (quizId: number): Promise<APIResponse<any>> => {
    try {
      // Avval hozirgi ma'lumotlarni olish
      const currentStats = await quizAPI.getQuestionStats(quizId);

      if (!currentStats.success) {
        return currentStats;
      }

      const currentCorrect = currentStats.data?.correct_count || 0;

      // Correct_count ni 1 ga oshirish
      return await quizAPI.updateQuestionStats(quizId, {
        correct_count: currentCorrect + 1
      });
    } catch (error: any) {
      console.error(`❌ Increment correct count error for quiz ${quizId}:`, error);
      return handleApiError(error);
    }
  },

  incrementWrongCount: async (quizId: number): Promise<APIResponse<any>> => {
    try {
      // Avval hozirgi ma'lumotlarni olish
      const currentStats = await quizAPI.getQuestionStats(quizId);

      if (!currentStats.success) {
        return currentStats;
      }

      const currentWrong = currentStats.data?.wrong_count || 0;

      // Wrong_count ni 1 ga oshirish
      return await quizAPI.updateQuestionStats(quizId, {
        wrong_count: currentWrong + 1
      });
    } catch (error: any) {
      console.error(`❌ Increment wrong count error for quiz ${quizId}:`, error);
      return handleApiError(error);
    }
  },

  fetchQuestionsByUser: async (user_id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/qs/user_questions/?user_id=${user_id}`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Fetch questions by user ${user_id} error:`, error);
      return handleApiError(error);
    }
  },

  recordView: async (data: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      console.log(`👁️ Recording view:`, data);

      await csrfManager.ensureToken();

      const response = await axios.post(`${API_BASE_URL}/quiz/views/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Record view error:", error);
      return handleApiError(error);
    }
  },

  getViews: async (): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/views/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get views error:", error);
      return handleApiError(error);
    }
  },
};

// ==================== QUIZ VIEWS API ====================
export const quizViewsAPI = {
  createQuizView: async (questionId: number, data?: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();

      console.log(`➕ POST to /quiz/question-views/ for question ${questionId}`);

      await csrfManager.ensureToken();

      const requestData = {
        question: questionId,
        user: {
          username: data?.username || ''
        },
        ...data
      };

      console.log('📤 POST data to /quiz/question-views/:', requestData);

      const response = await axios.post(`${API_BASE_URL}/quiz/question-views/`, requestData, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });

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

      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  },

  getQuizViews: async (questionId?: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();

      const params: any = {};
      if (questionId !== undefined && questionId !== null) {
        params.question = questionId;
      }

      console.log(`📊 GET /quiz/question-views/ for questionId: ${questionId || 'all'}`);

      const response = await axios.get(`${API_BASE_URL}/quiz/question-views/`, {
        params,
        headers: getAuthHeaders(),
        timeout: 15000,
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

  getQuizViewById: async (viewId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();

      console.log(`📋 Getting view by ID: ${viewId}`);
      const response = await axios.get(`${API_BASE_URL}/quiz/question-views/${viewId}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
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

  updateQuizView: async (viewId: number, data: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();

      console.log(`✏️ Updating view ${viewId}:`, data);
      const response = await axios.put(`${API_BASE_URL}/quiz/question-views/${viewId}/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
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

  patchQuizView: async (viewId: number, data: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();

      console.log(`🔧 Patching view ${viewId}:`, data);
      const response = await axios.patch(`${API_BASE_URL}/quiz/question-views/${viewId}/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
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

  deleteQuizView: async (viewId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();

      console.log(`🗑️ Deleting view ${viewId}`);
      const response = await axios.delete(`${API_BASE_URL}/quiz/question-views/${viewId}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
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
  },

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

  recordView: async (questionId: number, duration?: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();

      console.log(`👁️ Recording view for question ${questionId}`, duration ? `with duration ${duration}s` : '');

      const requestData: any = {
        question: questionId
      };

      if (duration !== undefined) {
        requestData.duration = duration;
      }

      return await quizViewsAPI.createQuizView(questionId, requestData);
    } catch (error: any) {
      console.error(`❌ Record view error for question ${questionId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// ==================== TO'LIQ TUG'IRLANGAN AUTH API ====================
export const authAPI = {
  async getCurrentUser(): Promise<UserData> {
    await tokenManager.requireAuth();
    const response = await axios.get<UserData>(`${API_BASE_URL}/accounts/me/`, {
      headers: getAuthHeaders(),
      timeout: 15000,
    });
    return response.data;
  },

  login: async (username: string, password: string): Promise<APIResponse<LoginResponse>> => {
    try {
      console.log('🔐 Attempting login for user:', username);

      const response = await axios.post(`${API_BASE_URL}/accounts/login/`,
          { username, password },
          {
            headers: getDefaultHeaders(),
            timeout: 15000,
          }
      );

      console.log('✅ Login response status:', response.status);

      if (response.data.access && response.data.refresh) {
        tokenManager.setTokens(response.data.access, response.data.refresh);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        console.log('✅ Tokens set successfully');
      }

      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      console.error("❌ Login error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return handleApiError(error);
    }
  },

  register: async (data: any): Promise<APIResponse<any>> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/accounts/register/`, data, {
        headers: getDefaultHeaders(),
        timeout: 15000,
      });
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
      await axios.post(`${API_BASE_URL}/accounts/logout/`, {}, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
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
      console.log('👤 Getting current user info...');

      const response = await axios.get(`${API_BASE_URL}/accounts/me/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });

      console.log('✅ Get me response:', response.status);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      console.error("❌ Get me error:", error);
      return handleApiError(error);
    }
  },

  updateProfile: async (data: any): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.patch(`${API_BASE_URL}/accounts/me/update/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Update profile error:", error);
      return handleApiError(error);
    }
  },

  changePassword: async (data: any): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.post(`${API_BASE_URL}/accounts/me/change-password/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Change password error:", error);
      return handleApiError(error);
    }
  },

  getStats: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.get(`${API_BASE_URL}/accounts/me/stats/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get stats error:", error);
      return handleApiError(error);
    }
  },

  getCountry: async (): Promise<APIResponse<any>> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/accounts/countries/`, {
        headers: getDefaultHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get country error:", error);
      return handleApiError(error);
    }
  },

  getRegion: async (country_id: number): Promise<APIResponse<any>> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/accounts/regions/${country_id}/`, {
        headers: getDefaultHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get region ${country_id} error:`, error);
      return handleApiError(error);
    }
  },

  getDistrict: async (region_id: number): Promise<APIResponse<any>> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/accounts/districts/${region_id}/`, {
        headers: getDefaultHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get district ${region_id} error:`, error);
      return handleApiError(error);
    }
  },

  getSettlement: async (district_id: number): Promise<APIResponse<any>> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/accounts/settlements/${district_id}/`, {
        headers: getDefaultHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get settlement ${district_id} error:`, error);
      return handleApiError(error);
    }
  },

  socialLogin: async (provider: string, accessToken: string): Promise<APIResponse<any>> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/accounts/social-login/${provider}/`, {
        access_token: accessToken,
      }, {
        headers: getDefaultHeaders(),
        timeout: 15000,
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
      const response = await axios.get(`${API_BASE_URL}/accounts/stories/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch stories error:", error);
      return handleApiError(error);
    }
  },

  resendVerificationEmail: async (email: string): Promise<APIResponse<any>> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/accounts/resend-verification-email/`,
          { email },
          {
            headers: getDefaultHeaders(),
            timeout: 15000,
          }
      );
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Resend verification email error:", error);
      return handleApiError(error);
    }
  },

  verifyEmail: async (token: string): Promise<APIResponse<any>> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/accounts/verify-email/${token}/`, {
        headers: getDefaultHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Verify email error:", error);
      return handleApiError(error);
    }
  },

  sendPasswordResetEmail: async (email: string): Promise<APIResponse<any>> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/accounts/send-password-reset/`,
          { email },
          {
            headers: getDefaultHeaders(),
            timeout: 15000,
          }
      );
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Send password reset email error:", error);
      return handleApiError(error);
    }
  },

  resetPassword: async (token: string, password: string): Promise<APIResponse<any>> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/accounts/reset-password/`,
          { token, password },
          {
            headers: getDefaultHeaders(),
            timeout: 15000,
          }
      );
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Reset password error:", error);
      return handleApiError(error);
    }
  },

  fetchNotifications: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      console.log('🔔 Fetching notifications...');
      const response = await axios.get(`${API_BASE_URL}/accounts/notifications/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      console.log('✅ Notifications response:', response.status);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Fetch notifications error:", error);
      return handleApiError(error);
    }
  },

  markNotificationAsRead: async (notificationId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.patch(`${API_BASE_URL}/accounts/notifications/${notificationId}/`,
          { is_read: true },
          {
            headers: getAuthHeaders(),
            timeout: 15000,
          }
      );
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Mark notification as read ${notificationId} error:`, error);
      return handleApiError(error);
    }
  },

  markAllNotificationsAsRead: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.post(`${API_BASE_URL}/accounts/notifications/mark-all-read/`, {}, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Mark all notifications as read error:", error);
      return handleApiError(error);
    }
  },
};

// ==================== TO'LIQ TUG'IRLANGAN ACCOUNTS API ====================
export const accountsAPI = {
  getUserFollowData: async (userId: number): Promise<APIResponse<FollowDataResponse>> => {
    try {
      await tokenManager.requireAuth();
      console.log(`👥 Getting follow data for user ${userId}`);
      const response = await axios.get(`${API_BASE_URL}/accounts/followers/${userId}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get user follow data ${userId} error:`, error);
      return handleApiError(error);
    }
  },


  toggleFollow: async (userId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      console.log(`🔄 Toggling follow for user ${userId}`);

      const response = await axios.post(`${API_BASE_URL}/accounts/followers/${userId}/toggle/`, {}, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });

      let followStatus = false;
      let message = "Unknown status";

      if (response.data && typeof response.data.is_following !== 'undefined') {
        followStatus = response.data.is_following;
        message = followStatus ? "Followed successfully" : "Unfollowed successfully";
      } else {
        // Agar backend standart javob qaytarmasa, follow statusini aniqlash
        const currentUserResponse = await axios.get(`${API_BASE_URL}/accounts/me/`, {
          headers: getAuthHeaders(),
          timeout: 15000,
        });

        if (currentUserResponse.data) {
          const followersResponse = await axios.get(`${API_BASE_URL}/accounts/followers/${userId}/`, {
            headers: getAuthHeaders(),
            timeout: 15000,
          });

          if (followersResponse.data && followersResponse.data.followers) {
            const currentUserId = tokenManager.decodeToken()?.userId;
            const isFollowing = followersResponse.data.followers.some(
                (follower: any) => follower.id === currentUserId
            );
            followStatus = isFollowing;
            message = followStatus ? "Followed successfully" : "Unfollowed successfully";
          }
        }
      }

      console.log(`✅ Follow toggled for user ${userId}: ${followStatus}`);

      return {
        success: true,
        data: response.data,
        is_following: followStatus,
        message: message
      };
    } catch (error: any) {
      console.error("❌ Toggle follow error:", error);
      return handleApiError(error);
    }
  },

  followUser: async (userId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      console.log(`➕ Following user ${userId}`);

      // Avval follow holatini tekshiramiz
      const checkResponse = await accountsAPI.getUserFollowData(userId);

      if (checkResponse.success && checkResponse.data) {
        const currentUserId = tokenManager.decodeToken()?.userId;
        const isCurrentlyFollowing = checkResponse.data.followers.some(
            (follower: any) => follower.id === currentUserId
        );

        if (isCurrentlyFollowing) {
          // Allaqachon follow qilingan, unfollow qilamiz
          return await accountsAPI.unfollowUser(userId);
        } else {
          // Follow qilamiz
          const response = await axios.post(`${API_BASE_URL}/accounts/followers/${userId}/`, {}, {
            headers: getAuthHeaders(),
            timeout: 15000,
          });

          return {
            success: true,
            data: response.data,
            is_following: true,
            message: "User followed successfully"
          };
        }
      }

      return {
        success: false,
        error: "Could not determine follow status"
      };
    } catch (error: any) {
      console.error(`❌ Follow user ${userId} error:`, error);
      return handleApiError(error);
    }
  },

  unfollowUser: async (userId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      console.log(`➖ Unfollowing user ${userId}`);

      const response = await axios.delete(`${API_BASE_URL}/accounts/followers/${userId}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });

      return {
        success: true,
        data: response.data,
        is_following: false,
        message: "User unfollowed successfully"
      };
    } catch (error: any) {
      console.error(`❌ Unfollow user ${userId} error:`, error);
      return handleApiError(error);
    }
  },

  checkFollowStatus: async (userId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      console.log(`🔍 Checking follow status for user ${userId}`);

      const response = await accountsAPI.getUserFollowData(userId);

      if (response.success && response.data) {
        const currentUserId = tokenManager.decodeToken()?.userId;
        const isFollowing = response.data.followers.some(
            (follower: any) => follower.id === currentUserId
        );

        return {
          success: true,
          is_following: isFollowing,
          data: response.data
        };
      }

      return {
        success: false,
        error: "Could not determine follow status"
      };
    } catch (error: any) {
      console.error(`❌ Check follow status error for user ${userId}:`, error);
      return handleApiError(error);
    }
  },

  getLeaderboard: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.get(`${API_BASE_URL}/accounts/leaderboard/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get leaderboard error:", error);
      return handleApiError(error);
    }
  },

  getAds: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.get(`${API_BASE_URL}/accounts/ads/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get ads error:", error);
      return handleApiError(error);
    }
  },

  createAd: async (data: any): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.post(`${API_BASE_URL}/accounts/ads/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create ad error:", error);
      return handleApiError(error);
    }
  },

  getSubscriptions: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.get(`${API_BASE_URL}/accounts/subscriptions/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get subscriptions error:", error);
      return handleApiError(error);
    }
  },

  searchUsers: async (query: string): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      console.log(`🔍 Searching users with query: ${query}`);
      const response = await axios.get(`${API_BASE_URL}/accounts/search/`, {
        params: { q: query },
        headers: getAuthHeaders(),
        timeout: 30000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Search users error:", error);
      return handleApiError(error);
    }
  },

  createSubscription: async (data: any): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.post(`${API_BASE_URL}/accounts/subscriptions/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create subscription error:", error);
      return handleApiError(error);
    }
  },

  getNotifications: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.get(`${API_BASE_URL}/accounts/notifications/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get notifications error:", error);
      return handleApiError(error);
    }
  },

  getRecomendedUsers: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.get(`${API_BASE_URL}/accounts/recommended-users/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get recommended users error:", error);
      return handleApiError(error);
    }
  },
};

// ==================== PASSWORD RESET ====================
export const passwordResetAPI = {
  sendResetCode: async (contact: string, method: 'email' | 'sms'): Promise<APIResponse<any>> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/accounts/send-reset-code/`, {
        contact,
        method,
      }, {
        headers: getDefaultHeaders(),
        timeout: 15000,
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
    const response = await axios.get(`${API_BASE_URL}/accounts/check-username/?username=${username}`, {
      headers: getDefaultHeaders(),
      timeout: 15000,
    });
    return response.data?.available || false;
  } catch (error) {
    console.error('Username check error:', error);
    return false;
  }
};

export const checkEmail = async (email: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/accounts/check-email/?email=${email}`, {
      headers: getDefaultHeaders(),
      timeout: 15000,
    });
    return response.data?.available || false;
  } catch (error) {
    console.error('Email check error:', error);
    return false;
  }
};

export const checkReferral = async (referral: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/accounts/check-referral/?referral-code=${referral}`, {
      headers: getDefaultHeaders(),
      timeout: 15000,
    });
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
    const response = await axios.get(`${API_BASE_URL}/accounts/profile/${username}/`, {
      headers: getAuthHeaders(),
      timeout: 15000,
    });
    const { user, stats } = response.data;
    return { user, stats };
  } catch (error: any) {
    console.error(`❌ User profile error for ${username}:`, error);
    throw error;
  }
};

// ==================== SEARCH ====================
export function useSearch() {
  throw new Error('useSearch hook faqat React component ichida ishlatilishi mumkin');
}

// ==================== TO'LIQ TUG'IRLANGAN LEADERBOARD ====================
export const leaderboardApi = {
  async getLeaderboardData(): Promise<LeaderboardUser[]> {
    await tokenManager.requireAuth();
    try {
      const response = await axios.get(`${API_BASE_URL}/accounts/leaderboard/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });

      // Users larni to'g'ri formatda qaytarish
      return response.data.results.map((u: any) => ({
        username: u.username,
        profile_image: u.profile_image,
        tests_solved: u.tests_solved || 0,
        coins: u.coins || 0,
        today_rank: u.today_rank || 0,
        yesterday_rank: u.yesterday_rank || 0,
        is_following: u.is_following || false,
        // Stats ma'lumotlarini qo'shish
        correct_count: u.correct_count || u.correct_attempts || 0,
        wrong_count: u.wrong_count || u.wrong_attempts || 0,
        total_attempts: (u.correct_count || 0) + (u.wrong_count || 0)
      }));
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      throw error;
    }
  },

  toggleFollow: async (userId: number): Promise<any> => {
    await tokenManager.requireAuth();
    try {
      const res = await axios.post(`${API_BASE_URL}/accounts/followers/${userId}/toggle/`, {}, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
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
    const response = await axios.get(`${API_BASE_URL}/accounts/leaderboard/?page=${page}`, {
      headers: getAuthHeaders(),
      timeout: 15000,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("❌ Get leaderboard error:", error);
    return handleApiError(error);
  }
};

// ==================== TO'LIQ TUG'IRLANGAN TOGGLE FOLLOW FUNCTION ====================
export const toggleFollow = async (userId: number): Promise<APIResponse<any>> => {
  try {
    await tokenManager.requireAuth();
    console.log(`🔄 Toggling follow for user ${userId}`);

    const response = await axios.post(`${API_BASE_URL}/accounts/followers/${userId}/toggle/`, {}, {
      headers: getAuthHeaders(),
      timeout: 15000,
    });

    let followStatus = false;
    let message = "Unknown status";

    if (response.data && typeof response.data.is_following !== 'undefined') {
      followStatus = response.data.is_following;
      message = followStatus ? "Followed successfully" : "Unfollowed successfully";
    } else {
      // Agar backend standart javob qaytarmasa, follow statusini aniqlash
      const currentUserResponse = await axios.get(`${API_BASE_URL}/accounts/me/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });

      if (currentUserResponse.data) {
        const followersResponse = await axios.get(`${API_BASE_URL}/accounts/followers/${userId}/`, {
          headers: getAuthHeaders(),
          timeout: 15000,
        });

        if (followersResponse.data && followersResponse.data.followers) {
          const currentUserId = tokenManager.decodeToken()?.userId;
          const isFollowing = followersResponse.data.followers.some(
              (follower: any) => follower.id === currentUserId
          );
          followStatus = isFollowing;
          message = followStatus ? "Followed successfully" : "Unfollowed successfully";
        }
      }
    }

    console.log(`✅ Follow toggled for user ${userId}: ${followStatus}`);

    return {
      success: true,
      data: response.data,
      is_following: followStatus,
      message: message
    };
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
      const response = await axios.get(`${API_BASE_URL}/system/config/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get config error:", error);
      return handleApiError(error);
    }
  },

  updateConfig: async (id: number, data: any): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.patch(`${API_BASE_URL}/system/config/${id}/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Update config ${id} error:`, error);
      return handleApiError(error);
    }
  },

  getFlags: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.get(`${API_BASE_URL}/system/flags/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get flags error:", error);
      return handleApiError(error);
    }
  },

  getLogs: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.get(`${API_BASE_URL}/system/logs/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get logs error:", error);
      return handleApiError(error);
    }
  },

  getRoles: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.get(`${API_BASE_URL}/system/roles/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get roles error:", error);
      return handleApiError(error);
    }
  },

  updateRole: async (id: number, data: any): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.patch(`${API_BASE_URL}/system/roles/${id}/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
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
      const response = await axios.get(`${API_BASE_URL}/chat/chatrooms/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get chat rooms error:", error);
      return handleApiError(error);
    }
  },

  createOneOnOneChat: async (userId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.post(`${API_BASE_URL}/chat/chatrooms/create-one-on-one/`, { user_id: userId }, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create one-on-one chat error:", error);
      return handleApiError(error);
    }
  },

  createGroupChat: async (data: { name: string; participants: number[] }): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.post(`${API_BASE_URL}/chat/chatrooms/create-group/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create group chat error:", error);
      return handleApiError(error);
    }
  },

  getChatRoom: async (id: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.get(`${API_BASE_URL}/chat/chatrooms/${id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get chat room ${id} error:`, error);
      return handleApiError(error);
    }
  },

  updateChatRoom: async (id: number, data: any): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.patch(`${API_BASE_URL}/chat/chatrooms/${id}/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Update chat room ${id} error:`, error);
      return handleApiError(error);
    }
  },

  deleteChatRoom: async (id: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.delete(`${API_BASE_URL}/chat/chatrooms/${id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Delete chat room ${id} error:`, error);
      return handleApiError(error);
    }
  },

  addParticipant: async (roomId: number, userId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.post(`${API_BASE_URL}/chat/chatrooms/${roomId}/add-participant/`, { user_id: userId }, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Add participant ${userId} to room ${roomId} error:`, error);
      return handleApiError(error);
    }
  },

  removeParticipant: async (roomId: number, userId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.post(`${API_BASE_URL}/chat/chatrooms/${roomId}/remove-participant/`, { user_id: userId }, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Remove participant ${userId} from room ${roomId} error:`, error);
      return handleApiError(error);
    }
  },

  pinMessage: async (roomId: number, messageId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.post(`${API_BASE_URL}/chat/chatrooms/${roomId}/pin-message/`, { message_id: messageId }, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Pin message ${messageId} in room ${roomId} error:`, error);
      return handleApiError(error);
    }
  },

  getMessages: async (params?: { page?: number; page_size?: number; chatroom?: number }): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.get(`${API_BASE_URL}/chat/messages/`, {
        params,
        headers: getAuthHeaders(),
        timeout: 15000,
      });
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
      const response = await axios.post(`${API_BASE_URL}/chat/messages/`, formData, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${tokenManager.getAccessToken()}`,
          'X-CSRFToken': csrfManager.getToken() || '',
        },
        timeout: 15000,
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
      const response = await axios.get(`${API_BASE_URL}/chat/messages/${id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get message ${id} error:`, error);
      return handleApiError(error);
    }
  },

  updateMessage: async (id: number, data: any): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.patch(`${API_BASE_URL}/chat/messages/${id}/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Update message ${id} error:`, error);
      return handleApiError(error);
    }
  },

  deleteMessage: async (id: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.delete(`${API_BASE_URL}/chat/messages/${id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Delete message ${id} error:`, error);
      return handleApiError(error);
    }
  },

  deleteMessageForAll: async (id: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.delete(`${API_BASE_URL}/chat/messages/${id}/delete-for-all/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Delete message for all ${id} error:`, error);
      return handleApiError(error);
    }
  },

  forwardMessage: async (id: number, chatroomIds: number[]): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.post(`${API_BASE_URL}/chat/messages/${id}/forward/`, { chatroom_ids: chatroomIds }, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Forward message ${id} error:`, error);
      return handleApiError(error);
    }
  },

  reactToMessage: async (id: number, emoji: string): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.post(`${API_BASE_URL}/chat/messages/${id}/react/`, { emoji }, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ React to message ${id} error:`, error);
      return handleApiError(error);
    }
  },

  getQuizAttempts: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.get(`${API_BASE_URL}/chat/quiz-attempts/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
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
      const response = await axios.post(`${API_BASE_URL}/chat/quiz-attempts/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create quiz attempt error:", error);
      return handleApiError(error);
    }
  },

  getBlockedUsers: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.get(`${API_BASE_URL}/chat/blocked-users/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get blocked users error:", error);
      return handleApiError(error);
    }
  },

  blockUser: async (userId: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.post(`${API_BASE_URL}/chat/blocked-users/`, { blocked_user: userId }, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Block user ${userId} error:`, error);
      return handleApiError(error);
    }
  },

  unblockUser: async (id: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.delete(`${API_BASE_URL}/chat/blocked-users/${id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Unblock user ${id} error:`, error);
      return handleApiError(error);
    }
  },

  getDrafts: async (): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.get(`${API_BASE_URL}/chat/drafts/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Get drafts error:", error);
      return handleApiError(error);
    }
  },

  createDraft: async (data: { chatroom: number; content: string }): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.post(`${API_BASE_URL}/chat/drafts/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create draft error:", error);
      return handleApiError(error);
    }
  },

  updateDraft: async (id: number, data: { content: string }): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.patch(`${API_BASE_URL}/chat/drafts/${id}/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Update draft ${id} error:`, error);
      return handleApiError(error);
    }
  },

  deleteDraft: async (id: number): Promise<APIResponse<any>> => {
    try {
      await tokenManager.requireAuth();
      const response = await axios.delete(`${API_BASE_URL}/chat/drafts/${id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
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
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/live-quiz/my/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
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
      await requireAuthForQuiz();

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

      const headers = getAuthHeaders();
      if (csrfToken) {
        headers["X-CSRFToken"] = csrfToken;
      }

      const response = await axios.post(`${API_BASE_URL}/quiz/live-quiz/save/`, payload, {
        headers,
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Create live quiz error:", error);
      return handleApiError(error);
    }
  },

  getLiveQuiz: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/live-quiz/${id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Get live quiz ${id} error:`, error);
      return handleApiError(error);
    }
  },

  updateLiveQuiz: async (id: number, data: any): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.patch(`${API_BASE_URL}/quiz/live-quiz/${id}/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Update live quiz ${id} error:`, error);
      return handleApiError(error);
    }
  },

  deleteLiveQuiz: async (id: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.delete(`${API_BASE_URL}/quiz/live-quiz/${id}/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Delete live quiz ${id} error:`, error);
      return handleApiError(error);
    }
  },

  joinLiveQuiz: async (quizId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.post(`${API_BASE_URL}/quiz/live-quiz/${quizId}/join/`, {}, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Join live quiz ${quizId} error:`, error);
      return handleApiError(error);
    }
  },

  getLiveQuizParticipants: async (quizId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/live-quiz/${quizId}/participants/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
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
      await requireAuthForQuiz();
      const response = await axios.post(`${API_BASE_URL}/quiz/live-quiz/${quizId}/submit-answer/`, data, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`❌ Submit live quiz answer ${quizId} error:`, error);
      return handleApiError(error);
    }
  },

  getLiveQuizResults: async (quizId: number): Promise<APIResponse<any>> => {
    try {
      await requireAuthForQuiz();
      const response = await axios.get(`${API_BASE_URL}/quiz/live-quiz/${quizId}/results/`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      });
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
    const response = await axios.get(`${API_BASE_URL}/health/`, {
      timeout: 5000,
      headers: getDefaultHeaders(),
    });
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
    await axios.get(API_BASE_URL, {
      timeout: 5000,
      headers: getDefaultHeaders(),
    });
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
export default axios;