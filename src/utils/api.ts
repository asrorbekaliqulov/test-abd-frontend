import axios from 'axios';
import { useState } from 'react';

const API_BASE_URL = 'https://backend.testabd.uz';





// Public API (auth oldidan ishlatiladigan)
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Authenticated API (token bilan ishlaydi)
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
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

    const response = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
      refresh,
    });

    const { access } = response.data;
    localStorage.setItem('access_token', access);
    return access;
  }
};

// Request interceptor: tokenni headerga qo‘shish
api.interceptors.request.use(
  (config) => {
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
  // ❌ 'Content-Type' yozmang!
  headers: {
    Accept: 'application/json',
  },
});

// Tokenni qo‘shish uchun interceptor
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
  return formAPI.patch("/accounts/me/update/", formData);
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
    // Simulate API call - replace with real endpoint when available
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { success: true };
  }
};

export const checkUsername = async (username: string) => {
  const response = await publicApi.get(`/accounts/check-username/?username=${username}`);
  const data = await response.data;
  return data.available;
};

export const checkEmail = async (email: string) => {
  const response = await publicApi.get(`/accounts/check-email/?email=${email}`);
  const data = await response.data;
  return data.available;
}

export const checkReferral = async (referral: string) => {
  const response = await publicApi.get(`/accounts/check-referral/?referral-code=${referral}`);
  const data = await response.data
  return data.available
};

export const userProfile = async (username: string) => {
  const response = await api.get(`/accounts/profile/${username}`);
  const { user, stats } = response.data;
  return { user, stats };
};


interface SearchParams {
  query?: string
  type?: "test" | "question" | "user"
  category?: number
  period?: "day" | "week" | "month" | "year" | "all"
  sort_by?: string
}

export function useSearch() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const search = async (params: SearchParams = {}) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get("accounts/search/", {
        params,
      })
      setData(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Qidiruvda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  return { search, loading, data, error }
}



export interface UserLeaderboardData {
  username: string
  tests_solved: number
  correct: number
  wrong: number
  average_time: number
  level: string
  location: string
  lat: number
  lng: number
  level_type: string
  profile_image?: string
}

export interface LeaderboardFilters {
  level?: string
  date?: string
  level_type?: string
  location?: string
}

export const leaderboardApi = {
  async getLeaderboardData(filters: LeaderboardFilters = {}): Promise<UserLeaderboardData[]> {
    try {
      const queryParams = new URLSearchParams()
  
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value)
        }
      })
  
      const url = `${API_BASE_URL}/accounts/leaderboard/?${queryParams.toString()}`
      const response = await api.get(url)
  
      const data = response.data
      return data.results || data
    } catch (error) {
      console.error("Error fetching leaderboard data:", error)
      throw error
    }
  }
  

}

     


// Auth API
export const authAPI = {
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

  fetchQuestionsByUser: (user_id: number) =>
    api.get(`/quiz/questions/user_questions/?user_id=${user_id}`),
  fetchQuestions: (url?: string) =>
    url ? api.get(url) : api.get('/quiz/questions/'),

  fetchRecentQuestions: () =>
    api.get(`/quiz/questions/recent/`),

  fetchQuestionById: (id: number) => api.get(`/quiz/questions/${id}/`),
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


  BlockBookmark: (data: any) => api.post('/quiz/test-bookmarks/', data),
  unblockBookmark: (id: number) => api.delete(`/quiz/test-bookmarks/${id}/`),

  fetchLeaderboard: (scope: 'global' | 'country' | 'region' | 'district' | 'settlement') =>
    api.get(`/quiz/leaderboard/?scope=${scope}`),

  fetchUserStats: (userId: number) => api.get(`/quiz/user-stats/${userId}/`),

  // fetchRecommendedTests: (pageNum: number) => api.get(`/quiz/recommended/?page=${pageNum}`),
  fetchRecommendedTests: (url?: string) =>
    url ? api.get(url) : api.get('/quiz/recommended/'),
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

  createSubscription: (data: any) =>
    api.post('/accounts/subscriptions/', data)
};

// System API (Admin only)
export const systemAPI = {
  getConfig: () =>
    api.get('/systemconfig/'),

  updateConfig: (id: number, data: any) =>
    api.patch(`/systemconfig/${id}/`, data),

  getFlags: () =>
    api.get('/systemflags/'),

  getLogs: () =>
    api.get('/systemlogs/'),

  getRoles: () =>
    api.get('/systemroles/'),

  updateRole: (id: number, data: any) =>
    api.patch(`/systemroles/${id}/`, data)
};

export default api;
