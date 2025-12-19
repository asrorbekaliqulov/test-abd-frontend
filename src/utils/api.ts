import axios from 'axios';
import { useState } from 'react';

export const API_BASE_URL = 'https://backend.testabd.uz';

// axios.defaults.withCredentials = true;

const csrfManager = {
  getToken: () => {
    const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrftoken="));
    return match ? decodeURIComponent(match.split("=")[1]) : null;
  },

  // LocalStorage ishlatmaymiz ❌
  setToken: () => {},

  fetchToken: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/system/csrf/`, {});
      // Backend @ensure_csrf_cookie bilan cookie yuboradi,
      // biz faqat cookie'ndan olib ishlatamiz
      return csrfManager.getToken();
    } catch (error) {
      console.warn("Failed to fetch CSRF token:", error);
      return null;
    }
  },
};

// Public API (auth oldidan ishlatiladigan)
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Helper function to get a cookie by name
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
  return null;
}

// Authenticated API (token bilan ishlaydi)
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
});

// Token manager
export const tokenManager = {
  getToken: () => localStorage.getItem('access_token'),
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),

  setTokens: (access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  },

  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  refreshToken: async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) throw new Error('Refresh token mavjud emas');

    try {
      const response = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
        refresh,
      });
      const { access } = response.data;
      localStorage.setItem('access_token', access);
      return access;
    } catch (error) {
      tokenManager.clearTokens();
      window.location.href = '/login';
      throw error;
    }
  }
};

api.interceptors.request.use(
    (config) => {
      const csrfToken = getCookie("csrftoken");
      if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
      }
      const token = tokenManager.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
);

const formAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
});

// Tokenni qo'shish uchun interceptor
formAPI.interceptors.request.use(
    (config) => {
      const token = tokenManager.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
);

// Faylni yuborish funksiyasi
export const updateProfileImage = (formData: FormData) => {
  return formAPI.patch("/accounts/me/update/", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Response interceptor: token muddati tugasa refresh qilib qayta yuborish
api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newAccess = await tokenManager.refreshToken();
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch (refreshError) {
          tokenManager.clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
);

export const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await api.post('/accounts/token/refresh/', {
    refresh: refreshToken,
  });

  if (response.data.access) {
    localStorage.setItem('access_token', response.data.access);
  }

  return response;
};

export const passwordResetAPI = {
  sendResetCode: async (contact: string, method: 'email' | 'sms') => {
    try {
      const response = await publicApi.post('/accounts/send-reset-code/', {
        contact,
        method,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }
};

export const checkUsername = async (username: string) => {
  try {
    const response = await publicApi.get(`/accounts/check-username/?username=${username}`);
    const data = await response.data;
    return data.available;
  } catch (error) {
    console.error('Username check error:', error);
    return false;
  }
};

export const checkEmail = async (email: string) => {
  try {
    const response = await publicApi.get(`/accounts/check-email/?email=${email}`);
    const data = await response.data;
    return data.available;
  } catch (error) {
    console.error('Email check error:', error);
    return false;
  }
};

export const checkReferral = async (referral: string) => {
  try {
    const response = await publicApi.get(`/accounts/check-referral/?referral-code=${referral}`);
    const data = await response.data;
    return data.available;
  } catch (error) {
    console.error('Referral check error:', error);
    return false;
  }
};

export const userProfile = async (username: string) => {
  try {
    const response = await api.get(`/accounts/profile/${username}/`);
    const { user, stats } = response.data;
    return { user, stats };
  } catch (error) {
    console.error('User profile error:', error);
    throw error;
  }
};

interface SearchParams {
  query?: string;
  type?: "test" | "question" | "user";
  category?: number;
  period?: "day" | "week" | "month" | "year" | "all";
  sort_by?: string;
}

export function useSearch() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const search = async (params: SearchParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("accounts/search/", {
        params,
      });
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Qidiruvda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return { search, loading, data, error };
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

export const leaderboardApi = {
  async getLeaderboardData(): Promise<LeaderboardUser[]> {
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

  toggleFollow: async (userId: number) => {
    try {
      const res = await api.post(`/accounts/followers/${userId}/toggle/`);
      return res.data;
    } catch (error) {
      console.error('Error toggling follow:', error);
      throw error;
    }
  },
};

// Define UserData interface (customize fields as needed)
export interface UserData {
  id: number;
  username: string;
  email: string;
  // Add other user fields as needed
}

// Auth API
export const authAPI = {
  async getCurrentUser(): Promise<UserData> {
    const response = await api.get<UserData>("/accounts/me/");
    return response.data;
  },

  login: (username: string, password: string) =>
      api.post('/accounts/login/', { username, password }),

  register: (data: any) =>
      api.post('/accounts/register/', data),

  logout: () =>
      api.post('/accounts/logout/'),

  getMe: () =>
      api.get('/accounts/me/'),

  updateProfile: (data: any) =>
      api.patch('/accounts/me/update/', data),

  changePassword: (data: any) =>
      api.post('/accounts/me/change-password/', data),

  getStats: () =>
      api.get('/accounts/me/stats/'),

  getCountry: () =>
      publicApi.get('/accounts/countries/'),

  getRegion: (country_id: number) =>
      publicApi.get(`/accounts/regions/${country_id}/`),

  getDistrict: (region_id: number) =>
      publicApi.get(`/accounts/districts/${region_id}/`),

  getSettlement: (district_id: number) =>
      publicApi.get(`/accounts/settlements/${district_id}/`),

  socialLogin: (provider: string, accessToken: string) =>
      publicApi.post(`/accounts/social-login/${provider}/`, {
        access_token: accessToken,
      }),

  fetchStories: () => api.get('/accounts/stories/'),

  resendVerificationEmail: (email: string) =>
      publicApi.post('/accounts/resend-verification-email/', { email }),

  verifyEmail: (token: string) =>
      publicApi.get(`/accounts/verify-email/${token}/`),

  sendPasswordResetEmail: (email: string) =>
      publicApi.post('/accounts/send-password-reset/', { email }),

  resetPassword: (token: string, password: string) =>
      publicApi.post('/accounts/reset-password/', { token, password }),

  fetchNotifications: () =>
      api.get(`/accounts/notifications/`),

  markNotificationAsRead: (notificationId: number) =>
      api.patch(`/accounts/notifications/${notificationId}/`, { is_read: true }),

  markAllNotificationsAsRead: () =>
      api.post(`/accounts/notifications/mark-all-read/`),
};

// Quiz API
export const quizAPI = {
  fetchCategories: () => api.get('/quiz/categories/'),
  fetchPublicTests: () => api.get('/quiz/tests/'),
  fetchTestById: (id: number) => api.get(`/quiz/tests/${id}/`),
  createTest: (data: any) => api.post('/quiz/tests/', data),
  fetchMyBookmarks: () => api.get('/quiz/tests/my_bookmarks/'),
  fetchMyTest: () => api.get('/quiz/tests/my_tests/'),
  fetchTestByUser: (user_id: number) => api.get(`/quiz/tests/by_user/${user_id}/`),
  fetchQuestionsbyfollower: (url?: string) =>
      url ? api.get(url) : api.get('/quiz/recommended/followed-questions/'),

  fetchQuestionsByUser: (user_id: number) =>
      api.get(`/quiz/questions/user_questions/?user_id=${user_id}`),
  fetchQuestions: (url?: string) =>
      url ? api.get(url) : api.get('/quiz/questions/'),

  fetchRecentQuestions: () =>
      api.get(`/quiz/questions/recent/`),

  fetchQuestionById: (id: number) => api.get(`/quiz/questions/${id}/`),

  fetchQuestionViewStats: (questionId: number) =>
      api.get(`/quiz/question-views/${questionId}/`),

  createQuestion: (data: any) => api.post('/quiz/questions/', data),

  submitAnswers: (answers: {
    question: number;
    selected_answer_ids: number[];
    duration?: number;
  }) => api.post('/quiz/submit-answer/', answers),

  submitTextAnswers: (answers: {
    question: number;
    written_answer: string;
    duration?: number;
  }) => api.post('/quiz/submit-answer/', answers),

  getQuestionAttempts: () => api.get('/quiz/question-attempts/'),

  likeTest: (data: any) => api.post('/quiz/likes/', data),
  unlikeTest: (likeId: number) => api.delete(`/quiz/likes/${likeId}/`),

  postComment: (data: any) => api.post('/quiz/comments/', data),
  fetchComments: () => api.get('/quiz/comments/'),

  recordView: (data: any) => api.post('/quiz/views/', data),

  bookmarkQuestion: (data: any) => api.post('/quiz/question-bookmarks/', data),
  getBookmarks: () => api.get('/quiz/question-bookmarks/'),
  getBookmarkByQuestion: (questionId: number) =>
      api.get(`/quiz/question-bookmarks/?question=${questionId}`),

  bookmarkTest: (data: any) => api.post('/quiz/test-bookmarks/', data),
  getBookmarksTest: () => api.get('/quiz/test-bookmarks/'),
  getBookmarkByTest: (testId: number) =>
      api.get(`/quiz/test-bookmarks/?test=${testId}`),

  unblockBookmark: (id: number) => api.delete(`/quiz/test-bookmarks/${id}/`),

  fetchLeaderboard: (scope: 'global' | 'country' | 'region' | 'district' | 'settlement') =>
      api.get(`/quiz/leaderboard/?scope=${scope}`),

  fetchUserStats: (userId: number) => api.get(`/quiz/user-stats/${userId}/`),

  fetchRecommendedTests: (url?: string) =>
      url ? api.get(url) : api.get('/quiz/random/'),
};

export const getLeaderboard = (page = 1) =>
    api.get(`/accounts/leaderboard/?page=${page}`);

export const toggleFollow = async (userId: number) => {
  try {
    const res = await api.post(`/accounts/followers/${userId}/toggle/`);
    return res.data;
  } catch (error) {
    console.error('Toggle follow error:', error);
    throw error;
  }
};

interface FollowUser {
  id: number;
  username: string;
  profile_image: string | null;
}

interface FollowDataResponse {
  followers: FollowUser[];
  following: FollowUser[];
}

export const authApi = axios.create({
  baseURL: API_BASE_URL,
});

// Token qo'shib qo'yish
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Accounts API
export const accountsAPI = {
  getUserFollowData: (userId: number): Promise<FollowDataResponse> =>
      api.get(`/accounts/followers/${userId}/`),

  toggleFollow: (userId: number) =>
      api.post(`/accounts/followers/${userId}/toggle/`),

  getLeaderboard: () =>
      api.get('/accounts/leaderboard/'),

  getAds: () =>
      api.get('/accounts/ads/'),

  createAd: (data: any) =>
      api.post('/accounts/ads/', data),

  getSubscriptions: () =>
      api.get('/accounts/subscriptions/'),

  searchUsers: (query: string) =>
      api.get('/accounts/search/', { params: { q: query } }),

  createSubscription: (data: any) =>
      api.post('/accounts/subscriptions/', data),

  getNotifications: () => api.get('/accounts/notifications/'),

  getRecomendedUsers: () => api.get('/accounts/recommended-users/'),
};

// System API (Admin only)
export const systemAPI = {
  getConfig: () =>
      api.get('/system/config/'),

  updateConfig: (id: number, data: any) =>
      api.patch(`/system/config/${id}/`, data),

  getFlags: () =>
      api.get('/system/flags/'),

  getLogs: () =>
      api.get('/system/logs/'),

  getRoles: () =>
      api.get('/system/roles/'),

  updateRole: (id: number, data: any) =>
      api.patch(`/system/roles/${id}/`, data)
};

export const quizViewsAPI = {
  /**
   * Quizning ko'rishlar sonini va statistikasini olish
   * @param {number} quizId - Quiz ID (question ID yoki test ID)
   * @returns {Promise<Object>} - Ko'rishlar statistikasi
   */
  getQuizViews: async (quizId: number) => {
    try {
      const response = await api.get(`/quiz/question-views/${quizId}/`);
      return {
        success: true,
        data: response.data,
        totalViews: response.data.total_views || response.data.view_count || 0,
      };
    } catch (error) {
      console.error('Quiz ko\'rishlarini olishda xatolik:', error);
      return {
        success: false,
        error: error.response?.data || error.message,
        totalViews: 0,
      };
    }
  },

  /**
   * Yangi ko'rish qo'shish (quiz ochilganda chaqiriladi)
   * @param {number} quizId - Quiz ID
   * @param {Object} options - Qo'shimcha parametrlar
   * @returns {Promise<Object>} - Natija
   */
  addQuizView: async (quizId: number, options: any = {}) => {
    try {
      const response = await api.post(`/quiz/question-views/${quizId}/`, {
        ...options,
        timestamp: new Date().toISOString(),
      });
      return {
        success: true,
        data: response.data,
        message: 'Ko\'rish muvaffaqiyatli qayd etildi',
      };
    } catch (error) {
      console.error('Ko\'rish qo\'shishda xatolik:', error);
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  },

  /**
   * Barcha quizlar uchun ko'rishlar statistikasini olish
   * @param {Object} filters - Filtr parametrlari
   * @returns {Promise<Object>} - Umumiy statistika
   */
  getAllQuizViewsStats: async (filters: any = {}) => {
    try {
      const response = await api.get('/quiz/question-views/stats/overview/', {
        params: filters,
      });
      return {
        success: true,
        data: response.data,
        stats: response.data.results || response.data.stats || [],
        totalQuizzes: response.data.total || response.data.count || 0,
      };
    } catch (error) {
      console.error('Statistikani olishda xatolik:', error);
      return {
        success: false,
        error: error.response?.data || error.message,
        stats: [],
        totalQuizzes: 0,
      };
    }
  },

  /**
   * Foydalanuvchi ko'rgan quizlar ro'yxatini olish
   * @param {number} userId - Foydalanuvchi ID
   * @param {Object} options - Qo'shimcha parametrlar
   * @returns {Promise<Object>} - Foydalanuvchi ko'rishlari
   */
  getUserQuizViews: async (userId: number, options: any = {}) => {
    try {
      const response = await api.get(`/quiz/question-views/user/${userId}/`, {
        params: options,
      });
      return {
        success: true,
        data: response.data,
        viewedQuizzes: response.data.results || response.data.views || [],
        totalViewed: response.data.total || response.data.count || 0,
      };
    } catch (error) {
      console.error('Foydalanuvchi ko\'rishlarini olishda xatolik:', error);
      return {
        success: false,
        error: error.response?.data || error.message,
        viewedQuizzes: [],
        totalViewed: 0,
      };
    }
  },

  /**
   * Ko'rishlar sonini real-time yangilash uchun polling funksiyasi
   * @param {number} quizId - Quiz ID
   * @param {Function} onUpdate - Yangilangan ma'lumotlar bilan chaqiriladigan callback
   * @param {number} interval - Yangilash intervali (ms) - default: 30000 (30s)
   * @returns {Function} - Polling'ni to'xtatish funksiyasi
   */
  startViewsPolling: (quizId: number, onUpdate: (data: any) => void, interval = 30000) => {
    let isPolling = true;

    const poll = async () => {
      if (!isPolling) return;

      try {
        const result = await quizViewsAPI.getQuizViews(quizId);
        if (result.success) {
          onUpdate(result.data);
        }
      } catch (error) {
        console.error('Polling da xatolik:', error);
      }

      if (isPolling) {
        setTimeout(poll, interval);
      }
    };

    // Darhol birinchi marta chaqirish
    poll();

    // Polling'ni to'xtatish funksiyasi
    return () => {
      isPolling = false;
    };
  },

  /**
   * Ko'rishlar tarixini olish (page by page)
   * @param {number} quizId - Quiz ID
   * @param {Object} options - Pagination parametrlari
   * @returns {Promise<Object>} - Ko'rishlar tarixi
   */
  getQuizViewHistory: async (quizId: number, options: any = {}) => {
    try {
      const response = await api.get(`/quiz/question-views/${quizId}/history/`, {
        params: {
          page: options.page || 1,
          page_size: options.pageSize || 20,
          order_by: options.orderBy || '-timestamp',
          ...options,
        },
      });
      return {
        success: true,
        data: response.data,
        views: response.data.results || response.data.views || [],
        pagination: {
          currentPage: response.data.current_page || 1,
          totalPages: response.data.total_pages || 1,
          totalItems: response.data.total_count || 0,
          hasNext: response.data.next !== null,
          hasPrev: response.data.previous !== null,
        },
      };
    } catch (error) {
      console.error('Ko\'rishlar tarixini olishda xatolik:', error);
      return {
        success: false,
        error: error.response?.data || error.message,
        views: [],
        pagination: null,
      };
    }
  },
};

export interface QuizViewStats {
  total_views: number;
  today_views: number;
  unique_viewers: number;
  average_view_time: number;
  last_viewed: string;
  // ... boshqa maydonlar
}

export interface QuizView {
  id: number;
  quiz_id: number;
  user_id?: number;
  user?: {
    id: number;
    username: string;
    profile_image?: string;
  };
  timestamp: string;
  source?: string;
  duration?: number;
}

export const chatAPI = {
  // Chat rooms
  getChatRooms: () => api.get('/chat/chatrooms/'),

  createOneOnOneChat: (userId: number) =>
      api.post('/chat/chatrooms/create-one-on-one/', { user_id: userId }),

  createGroupChat: (data: { name: string; participants: number[] }) =>
      api.post('/chat/chatrooms/create-group/', data),

  getChatRoom: (id: number) => api.get(`/chat/chatrooms/${id}/`),

  updateChatRoom: (id: number, data: any) =>
      api.patch(`/chat/chatrooms/${id}/`, data),

  deleteChatRoom: (id: number) => api.delete(`/chat/chatrooms/${id}/`),

  addParticipant: (roomId: number, userId: number) =>
      api.post(`/chat/chatrooms/${roomId}/add-participant/`, { user_id: userId }),

  removeParticipant: (roomId: number, userId: number) =>
      api.post(`/chat/chatrooms/${roomId}/remove-participant/`, { user_id: userId }),

  pinMessage: (roomId: number, messageId: number) =>
      api.post(`/chat/chatrooms/${roomId}/pin-message/`, { message_id: messageId }),

  // Messages
  getMessages: (params?: { page?: number; page_size?: number; chatroom?: number }) =>
      api.get('/chat/messages/', { params }),

  sendMessage: (data: {
    chatroom: number;
    content?: string;
    message_type?: 'text' | 'file' | 'quiz' | 'system';
    reply_to?: number;
    file?: File;
  }) => {
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
    return api.post('/chat/messages/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getMessage: (id: number) => api.get(`/chat/messages/${id}/`),

  updateMessage: (id: number, data: any) =>
      api.patch(`/chat/messages/${id}/`, data),

  deleteMessage: (id: number) => api.delete(`/chat/messages/${id}/`),

  deleteMessageForAll: (id: number) =>
      api.delete(`/chat/messages/${id}/delete-for-all/`),

  forwardMessage: (id: number, chatroomIds: number[]) =>
      api.post(`/chat/messages/${id}/forward/`, { chatroom_ids: chatroomIds }),

  reactToMessage: (id: number, emoji: string) =>
      api.post(`/chat/messages/${id}/react/`, { emoji }),

  // Quiz attempts in chat
  getQuizAttempts: () => api.get('/chat/quiz-attempts/'),

  createQuizAttempt: (data: {
    message: number;
    answers: { question_id: number; selected_options: number[] }[];
  }) => api.post('/chat/quiz-attempts/', data),

  // Blocked users
  getBlockedUsers: () => api.get('/chat/blocked-users/'),

  blockUser: (userId: number) =>
      api.post('/chat/blocked-users/', { blocked_user: userId }),

  unblockUser: (id: number) => api.delete(`/chat/blocked-users/${id}/`),

  // Drafts
  getDrafts: () => api.get('/chat/drafts/'),

  createDraft: (data: { chatroom: number; content: string }) =>
      api.post('/chat/drafts/', data),

  updateDraft: (id: number, data: { content: string }) =>
      api.patch(`/chat/drafts/${id}/`, data),

  deleteDraft: (id: number) => api.delete(`/chat/drafts/${id}/`),
};

// Live Quiz API
export const liveQuizAPI = {
  // Get user's live quizzes
  fetchMyLiveQuizzes: () => api.get("/quiz/live-quiz/my/"),

  createLiveQuiz: async (data: {
    test: number;
    mode: "timed" | "first_answer" | "admin_controlled" | "free";
    start_time?: string;
    end_time?: string;
    description?: string;
    is_public?: boolean;
    is_active?: boolean;
    time_per_question?: number;
  }) => {
    // Ensure CSRF token is available
    let csrfToken = csrfManager.getToken();
    if (!csrfToken) {
      csrfToken = await csrfManager.fetchToken();
    }

    // Determine is_active based on start_time
    let isActive = false;
    if (data.start_time) {
      const now = new Date();
      const start = new Date(data.start_time);
      isActive = start <= now;
    }

    // Transform data to match Django model expectations
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

    return api.post("/quiz/live-quiz/save/", payload, {
      headers: {
        ...(csrfToken && { "X-CSRFToken": csrfToken }),
        "Content-Type": "application/json",
      },
    });
  },

  // Get live quiz by ID
  getLiveQuiz: (id: number) => api.get(`/quiz/live-quiz/${id}/`),

  // Update live quiz
  updateLiveQuiz: (id: number, data: any) => api.patch(`/quiz/live-quiz/${id}/`, data),

  // Delete live quiz
  deleteLiveQuiz: (id: number) => api.delete(`/quiz/live-quiz/${id}/`),

  // Join live quiz
  joinLiveQuiz: (quizId: number) => api.post(`/quiz/live-quiz/${quizId}/join/`),

  // Get live quiz participants
  getLiveQuizParticipants: (quizId: number) => api.get(`/quiz/live-quiz/${quizId}/participants/`),

  // Submit answer in live quiz
  submitLiveQuizAnswer: (
      quizId: number,
      data: {
        question_id: number;
        selected_answer_ids: number[];
        duration?: number;
      },
  ) => api.post(`/quiz/live-quiz/${quizId}/submit-answer/`, data),

  // Get live quiz results
  getLiveQuizResults: (quizId: number) => api.get(`/quiz/live-quiz/${quizId}/results/`),
};

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.url = 'wss://backend.testabd.uz/ws/chat/';
    this.token = localStorage.getItem('access_token');
  }

  connect(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = this.token
          ? `${this.url}?token=${this.token}`
          : this.url;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
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
        console.log('WebSocket disconnected');
        this.reconnect(onMessage, onError);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      onError?.(error as Event);
    }
  }

  private reconnect(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
        this.connect(onMessage, onError);
      }, 1000 * this.reconnectAttempts);
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
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

export const checkApiHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health/`, { timeout: 5000 });
    return { healthy: true, data: response.data };
  } catch (error) {
    console.warn("API health check failed:", error);
    return { healthy: false, error };
  }
};

export const handleApiError = (error: any) => {
  console.error("API Error:", error);

  if (error.response?.status === 401) {
    // Unauthorized - redirect to login
    tokenManager.clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return "Tizimga kirish talab qilinadi. Iltimos, qaytadan kiring.";
  } else if (error.response?.status === 403) {
    return "Ushbu amalni bajarish uchun ruxsat yo'q. Tizimga kirganingizni tekshiring.";
  } else if (error.response?.status === 404) {
    return "So'ralgan ma'lumot topilmadi. Backend endpoint mavjudligini tekshiring.";
  } else if (error.response?.status >= 500) {
    return "Server xatosi yuz berdi. Iltimos, keyinroq qayta urinib ko'ring.";
  } else if (error.code === "NETWORK_ERROR" || !error.response) {
    return "Tarmoq xatosi. Internet aloqasini va API URL ni tekshiring.";
  } else if (error.code === "ECONNREFUSED") {
    return "Serverga ulanib bo'lmadi. Backend server ishlab turganini tekshiring.";
  }

  const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Noma'lum xatolik yuz berdi";

  return `Xatolik: ${errorMessage}`;
};

export const initializeCSRF = async () => {
  try {
    await csrfManager.fetchToken();
    return true;
  } catch (error) {
    console.error("Failed to initialize CSRF token:", error);
    return false;
  }
};

export { csrfManager };

export default api;