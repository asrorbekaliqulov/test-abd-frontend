import axios from 'axios';
import { useState } from 'react';

const API_BASE_URL = 'https://backend.testabd.uz';

// axios.defaults.withCredentials = true;

const csrfManager = {
  getToken: () => {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrftoken="))
    return match ? decodeURIComponent(match.split("=")[1]) : null
  },

  // LocalStorage ishlatmaymiz ❌
  setToken: () => {},

  fetchToken: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/system/csrf/`, {
      })
      // Backend @ensure_csrf_cookie bilan cookie yuboradi,
      // biz faqat cookie’dan olib ishlatamiz
      return csrfManager.getToken()
    } catch (error) {
      console.warn("Failed to fetch CSRF token:", error)
      return null
    }
  },
}


// Public API (auth oldidan ishlatiladigan)
const publicApi = axios.create({
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

// Har bir request oldidan CSRF tokenni qo'shib yuboradi



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
    test: number // test_id -> test (ForeignKey field name)
    mode: "timed" | "first_answer" | "admin_controlled" | "free" // matches VIKTORINA_MODE choices
    start_time?: string // ISO datetime string
    end_time?: string // ISO datetime string
    description?: string
    is_public?: boolean
    is_active?: boolean // will be activated when quiz starts
    time_per_question?: number // for timed mode
  }) => {
    // Ensure CSRF token is available
    let csrfToken = csrfManager.getToken()
    if (!csrfToken) {
      csrfToken = await csrfManager.fetchToken()
    }

    // Determine is_active based on start_time
    let isActive = false
    if (data.start_time) {
      const now = new Date()
      const start = new Date(data.start_time)
      // Agar start_time hozirga teng yoki o'tgan bo'lsa, is_active true
      isActive = start <= now
    }

    // Transform data to match Django model expectations
    const payload = {
      test: data.test, // ForeignKey to Test model
      mode: data.mode, // matches VIKTORINA_MODE choices
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      description: data.description || "",
      is_public: data.is_public !== undefined ? data.is_public : true,
      is_active: isActive,
      // Add time_per_question for timed mode
      ...(data.mode === "timed" &&
        data.time_per_question && {
          time_per_question: data.time_per_question,
        }),
    }

    return api.post("/quiz/live-quiz/save/", payload, {
      headers: {
        ...(csrfToken && { "X-CSRFToken": csrfToken }),
        "Content-Type": "application/json",
      },
    })
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
      question_id: number
      selected_answer_ids: number[]
      duration?: number
    },
  ) => api.post(`/quiz/live-quiz/${quizId}/submit-answer/`, data),

  // Get live quiz results
  getLiveQuizResults: (quizId: number) => api.get(`/quiz/live-quiz/${quizId}/results/`),
}



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
    const response = await axios.get(`${API_BASE_URL}/health/`, { timeout: 5000 })
    return { healthy: true, data: response.data }
  } catch (error) {
    console.warn("API health check failed:", error)
    return { healthy: false, error }
  }
}

export const handleApiError = (error: any) => {
  console.error("API Error:", error)

  if (error.response?.status === 401) {
    // Unauthorized - redirect to login
    tokenManager.clearTokens()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    return "Tizimga kirish talab qilinadi. Iltimos, qaytadan kiring."
  } else if (error.response?.status === 403) {
    return "Ushbu amalni bajarish uchun ruxsat yo'q. Tizimga kirganingizni tekshiring."
  } else if (error.response?.status === 404) {
    return "So'ralgan ma'lumot topilmadi. Backend endpoint mavjudligini tekshiring."
  } else if (error.response?.status >= 500) {
    return "Server xatosi yuz berdi. Iltimos, keyinroq qayta urinib ko'ring."
  } else if (error.code === "NETWORK_ERROR" || !error.response) {
    return "Tarmoq xatosi. Internet aloqasini va API URL ni tekshiring."
  } else if (error.code === "ECONNREFUSED") {
    return "Serverga ulanib bo'lmadi. Backend server ishlab turganini tekshiring."
  }

  const errorMessage =
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Noma'lum xatolik yuz berdi"

  return `Xatolik: ${errorMessage}`
}

export const initializeCSRF = async () => {
  try {
    await csrfManager.fetchToken()
    return true
  } catch (error) {
    console.error("Failed to initialize CSRF token:", error)
    return false
  }
}

export { csrfManager }

export default api;