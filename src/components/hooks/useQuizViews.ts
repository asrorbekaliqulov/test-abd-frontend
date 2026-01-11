// src/hooks/useQuizViews.ts - TO'LIQ TUZATILGAN VERSIYA
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { quizViewsAPI, tokenManager } from '../../utils/api';

interface ViewUser {
    username: string;
    [key: string]: any;
}

interface QuizView {
    id: number;
    question: number;
    user: ViewUser;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    updated_at?: string;
    timestamp?: string;
    duration?: number;
}

interface UseQuizViewsReturn {
    // State
    views: Map<number, number>;
    totalViews: Map<number, number>;
    uniqueUsers: Map<number, Set<string>>;
    viewDetails: Map<number, QuizView[]>;
    loading: boolean;
    error: string | null;
    isInitialized: boolean;

    // Getter functions
    getUniqueViewCount: (questionId: number) => number;
    getTotalViewCount: (questionId: number) => number;
    getUniqueUsers: (questionId: number) => Set<string>;
    hasUserViewed: (questionId: number, username: string | null) => boolean;
    getViewDetails: (questionId: number) => QuizView[];
    getStatistics: (questionId: number) => {
        uniqueViews: number;
        totalViews: number;
        uniqueUsers: string[];
        viewsList: QuizView[];
        lastViewed: Date | null;
        firstViewed: Date | null;
        currentUserViewed: boolean;
        currentUsername: string | null;
    };
    getCurrentUsername: () => string | null;
    getCurrentUserId: () => number | null;
    getMultipleQuestionStats: (questionIds: number[]) => Record<number, any>;

    // Action functions
    initialize: () => Promise<any>;
    fetchViewsList: (questionId?: number) => Promise<any>;
    createView: (questionId: number) => Promise<any>;
    recordView: (questionId: number) => Promise<any>;
    refreshQuestionViews: (questionId: number) => Promise<any>;
    clearQuestionCache: (questionId: number) => void;
    resetViews: () => void;

    // Update functions
    updateUniqueViews: (questionId: number, count: number) => void;
    updateTotalViews: (questionId: number, count: number) => void;
    updateUniqueUsers: (questionId: number, usersSet: Set<string>) => void;
    updateViewDetails: (questionId: number, viewList: QuizView[]) => void;
}

export const useQuizViews = (): UseQuizViewsReturn => {
    // State
    const [views, setViews] = useState<Map<number, number>>(new Map());
    const [uniqueUsers, setUniqueUsers] = useState<Map<number, Set<string>>>(new Map());
    const [viewDetails, setViewDetails] = useState<Map<number, QuizView[]>>(new Map());
    const [totalViews, setTotalViews] = useState<Map<number, number>>(new Map());
    const [isInitialized, setIsInitialized] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Refs
    const processing = useRef<Set<number>>(new Set());
    const initializedQuestions = useRef<Set<number>>(new Set());
    const viewCountCache = useRef<Map<number, {timestamp: number, count: number}>>(new Map());
    const CACHE_DURATION = 60000; // 60 soniya cache

    // ==================== GETTER FUNCTIONS ====================
    const getUniqueViewCount = useCallback((questionId: number): number => {
        const cached = viewCountCache.current.get(questionId);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.count;
        }
        return views.get(questionId) || 0;
    }, [views]);

    const getTotalViewCount = useCallback((questionId: number): number => {
        return totalViews.get(questionId) || 0;
    }, [totalViews]);

    const getUniqueUsers = useCallback((questionId: number): Set<string> => {
        return uniqueUsers.get(questionId) || new Set();
    }, [uniqueUsers]);

    const hasUserViewed = useCallback((questionId: number, username: string | null): boolean => {
        if (!username) return false;
        const users = uniqueUsers.get(questionId);
        return users ? users.has(username) : false;
    }, [uniqueUsers]);

    const getViewDetails = useCallback((questionId: number): QuizView[] => {
        return viewDetails.get(questionId) || [];
    }, [viewDetails]);

    // YANGI: ISHLASHI KAFOLATLANGAN getCurrentUsername FUNKSIYASI
    const getCurrentUsername = useCallback((): string | null => {
        try {
            // 1. Avval localStorage'dan username ni olish
            let userStr: string | null = null;
            try {
                userStr = localStorage.getItem('user');
            } catch (storageError: any) {
                console.warn('⚠️ localStorage access error:', storageError.message);
                // localStorage ga kirishda muammo bo'lsa, keyingi bosqichga o'tish
            }

            // 2. Agar userStr mavjud bo'lsa, uni parse qilish
            if (userStr && userStr !== 'undefined' && userStr !== 'null' && userStr.trim() !== '') {
                try {
                    const userData = JSON.parse(userStr);

                    // Username ni turli formatlarda qidirish
                    const username =
                        userData?.username ||
                        userData?.user_name ||
                        userData?.userName ||
                        userData?.email?.split('@')[0] ||
                        (userData?.id ? `user_${userData.id}` : null) ||
                        (userData?.userId ? `user_${userData.userId}` : null);

                    if (username) {
                        console.log('✅ Got username from localStorage:', username);
                        return username;
                    }
                } catch (parseError: any) {
                    console.warn('⚠️ Failed to parse localStorage user data:', parseError.message);
                }
            }

            // 3. Token dan username ni olish
            let token: string | null = null;
            try {
                token = tokenManager.getAccessToken();
            } catch (tokenError: any) {
                console.warn('⚠️ Token access error:', tokenError.message);
            }

            if (token) {
                try {
                    const tokenParts = token.split('.');
                    if (tokenParts.length === 3) {
                        const payload = JSON.parse(atob(tokenParts[1]));

                        // Token payload'dan username ni qidirish
                        const usernameFromToken =
                            payload?.username ||
                            payload?.user_name ||
                            payload?.preferred_username ||
                            payload?.sub ||
                            (payload?.user_id ? `user_${payload.user_id}` : null) ||
                            (payload?.userId ? `user_${payload.userId}` : null) ||
                            (payload?.id ? `user_${payload.id}` : null);

                        if (usernameFromToken) {
                            console.log('✅ Got username from token:', usernameFromToken);
                            return usernameFromToken;
                        }
                    }
                } catch (tokenError: any) {
                    console.warn('⚠️ Failed to parse token payload:', tokenError.message);
                }
            }

            // 4. SessionStorage dan tekshirish
            try {
                const sessionUser = sessionStorage.getItem('user');
                if (sessionUser && sessionUser !== 'undefined' && sessionUser !== 'null') {
                    try {
                        const userData = JSON.parse(sessionUser);
                        const username =
                            userData?.username ||
                            userData?.user_name ||
                            (userData?.id ? `user_${userData.id}` : null);

                        if (username) {
                            console.log('✅ Got username from sessionStorage:', username);
                            return username;
                        }
                    } catch (e) {
                        console.warn('⚠️ Failed to parse sessionStorage user data');
                    }
                }
            } catch (sessionError: any) {
                console.warn('⚠️ sessionStorage access error:', sessionError.message);
            }

            // 5. User ID ni alohida olish
            const getCurrentUserId = (): number | null => {
                try {
                    // localStorage dan
                    if (userStr && userStr !== 'undefined') {
                        try {
                            const userData = JSON.parse(userStr);
                            if (userData?.id) return userData.id;
                            if (userData?.userId) return userData.userId;
                        } catch (e) {
                            // ignore
                        }
                    }

                    // token dan
                    if (token) {
                        try {
                            const tokenParts = token.split('.');
                            if (tokenParts.length === 3) {
                                const payload = JSON.parse(atob(tokenParts[1]));
                                return payload?.user_id || payload?.userId || payload?.id || null;
                            }
                        } catch (e) {
                            // ignore
                        }
                    }
                } catch (error: any) {
                    console.warn('⚠️ Error getting user ID:', error.message);
                }
                return null;
            };

            const userId = getCurrentUserId();
            if (userId) {
                const generatedUsername = `user_${userId}`;
                console.log('🔄 Generated username from user_id:', generatedUsername);
                return generatedUsername;
            }

            // 6. Cookie lar dan foydalanish
            try {
                const cookies = document.cookie.split(';');
                for (const cookie of cookies) {
                    const [name, value] = cookie.trim().split('=');
                    if (name === 'username' && value) {
                        console.log('✅ Got username from cookie:', decodeURIComponent(value));
                        return decodeURIComponent(value);
                    }
                    if (name === 'user_id' && value) {
                        const generatedUsername = `user_${value}`;
                        console.log('🔄 Generated username from cookie user_id:', generatedUsername);
                        return generatedUsername;
                    }
                }
            } catch (cookieError: any) {
                console.warn('⚠️ Cookie access error:', cookieError.message);
            }

            // 7. Oxirgi chora - anonymous yoki null
            console.log('👤 No user identified, using anonymous');
            return 'anonymous';

        } catch (error: any) {
            console.error('❌ Critical error in getCurrentUsername:', error.message);
            // Xatolik yuz bersa ham, anonymous qaytarish
            return 'anonymous';
        }
    }, []);

    const getCurrentUserId = useCallback((): number | null => {
        try {
            // 1. localStorage dan
            try {
                const userStr = localStorage.getItem('user');
                if (userStr && userStr !== 'undefined' && userStr !== 'null') {
                    const userData = JSON.parse(userStr);
                    if (userData?.id) return Number(userData.id);
                    if (userData?.userId) return Number(userData.userId);
                }
            } catch (e) {
                console.warn('Failed to get user ID from localStorage');
            }

            // 2. token dan
            try {
                const token = tokenManager.getAccessToken();
                if (token) {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const userId = payload?.user_id || payload?.userId || payload?.id;
                    if (userId) return Number(userId);
                }
            } catch (e) {
                console.warn('Failed to get user ID from token');
            }

            // 3. sessionStorage dan
            try {
                const sessionUser = sessionStorage.getItem('user');
                if (sessionUser) {
                    const userData = JSON.parse(sessionUser);
                    if (userData?.id) return Number(userData.id);
                }
            } catch (e) {
                console.warn('Failed to get user ID from sessionStorage');
            }

            return null;
        } catch (error: any) {
            console.error('❌ Error getting user ID:', error.message);
            return null;
        }
    }, []);

    // ==================== CALCULATION FUNCTIONS ====================
    const calculateUniqueUsers = useCallback((viewsData: QuizView[]): { count: number; users: Set<string> } => {
        const userSet = new Set<string>();

        viewsData.forEach(view => {
            if (view.user && view.user.username) {
                userSet.add(view.user.username);
            }
        });

        return {
            count: userSet.size,
            users: userSet
        };
    }, []);

    // ==================== UPDATE FUNCTIONS ====================
    const updateUniqueViews = useCallback((questionId: number, count: number) => {
        setViews(prev => {
            const newMap = new Map(prev);
            newMap.set(questionId, count);
            return newMap;
        });
        viewCountCache.current.set(questionId, {
            timestamp: Date.now(),
            count: count
        });
    }, []);

    const updateTotalViews = useCallback((questionId: number, count: number) => {
        setTotalViews(prev => {
            const newMap = new Map(prev);
            newMap.set(questionId, count);
            return newMap;
        });
    }, []);

    const updateUniqueUsers = useCallback((questionId: number, usersSet: Set<string>) => {
        setUniqueUsers(prev => {
            const newMap = new Map(prev);
            newMap.set(questionId, usersSet);
            return newMap;
        });
    }, []);

    const updateViewDetails = useCallback((questionId: number, viewList: QuizView[]) => {
        setViewDetails(prev => {
            const newMap = new Map(prev);
            newMap.set(questionId, viewList);
            return newMap;
        });
    }, []);

    // ==================== API FUNCTIONS ====================
    const fetchViewsList = useCallback(async (questionId?: number) => {
        try {
            console.log(`📊 Fetching views list ${questionId ? `for question ${questionId}` : 'for all questions'}`);

            const result = await quizViewsAPI.getQuizViews(questionId);

            if (result.success) {
                const viewsData = Array.isArray(result.results) ? result.results : [];
                console.log(`📊 Received ${viewsData.length} views from /quiz/question-views/`);

                const questionViewMap = new Map<number, QuizView[]>();

                viewsData.forEach((view: any) => {
                    const qId = view.question;
                    if (!questionViewMap.has(qId)) {
                        questionViewMap.set(qId, []);
                    }
                    questionViewMap.get(qId)!.push({
                        id: view.id,
                        question: view.question,
                        user: view.user || { username: 'anonymous' },
                        ip_address: view.ip_address,
                        user_agent: view.user_agent,
                        created_at: view.created_at || new Date().toISOString(),
                        updated_at: view.updated_at,
                        timestamp: view.timestamp || view.created_at,
                        duration: view.duration
                    });
                });

                questionViewMap.forEach((viewList, qId) => {
                    const uniqueStats = calculateUniqueUsers(viewList);

                    updateViewDetails(qId, viewList);
                    updateUniqueViews(qId, uniqueStats.count);
                    updateUniqueUsers(qId, uniqueStats.users);
                    updateTotalViews(qId, viewList.length);

                    console.log(`📊 Question ${qId}: ${viewList.length} total views, ${uniqueStats.count} unique users`);

                    initializedQuestions.current.add(qId);
                });

                console.log(`✅ Updated views for ${questionViewMap.size} questions`);

                return {
                    success: true,
                    data: questionViewMap,
                    count: viewsData.length
                };
            }

            console.error('❌ No views data received:', result.error);
            return {
                success: false,
                error: 'No views data received'
            };
        } catch (error) {
            console.error('❌ Error fetching views list:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }, [calculateUniqueUsers, updateViewDetails, updateUniqueViews, updateUniqueUsers, updateTotalViews]);

    const createView = useCallback(async (questionId: number) => {
        if (processing.current.has(questionId)) {
            console.log(`⏳ Already processing view for question ${questionId}`);
            return {
                success: false,
                error: 'Already processing'
            };
        }

        processing.current.add(questionId);

        try {
            console.log(`🔄 Creating view for question ${questionId} at /quiz/question-views/`);

            const result = await quizViewsAPI.createQuizView(questionId);

            if (result.success && result.data) {
                console.log(`✅ View created successfully for question ${questionId}:`, result.data);

                const newView: QuizView = {
                    id: result.data.id,
                    question: questionId,
                    user: result.data.user || { username: 'anonymous' },
                    ip_address: result.data.ip_address,
                    user_agent: result.data.user_agent,
                    created_at: result.data.created_at || new Date().toISOString(),
                    updated_at: result.data.updated_at,
                    timestamp: result.data.timestamp || result.data.created_at,
                    duration: result.data.duration
                };

                const currentDetails = getViewDetails(questionId);
                const updatedDetails = [...currentDetails, newView];

                updateViewDetails(questionId, updatedDetails);
                updateTotalViews(questionId, updatedDetails.length);

                const currentUsername = getCurrentUsername();
                if (currentUsername) {
                    const currentUsers = getUniqueUsers(questionId);
                    const newUsersSet = new Set(currentUsers);

                    if (!newUsersSet.has(currentUsername)) {
                        newUsersSet.add(currentUsername);
                        updateUniqueUsers(questionId, newUsersSet);
                        updateUniqueViews(questionId, newUsersSet.size);

                        console.log(`👤 Added user ${currentUsername} to unique viewers for question ${questionId}`);

                        return {
                            success: true,
                            view: newView,
                            uniqueCount: newUsersSet.size,
                            totalCount: updatedDetails.length,
                            userAdded: true
                        };
                    } else {
                        console.log(`👤 User ${currentUsername} already viewed question ${questionId}`);
                        return {
                            success: true,
                            view: newView,
                            uniqueCount: newUsersSet.size,
                            totalCount: updatedDetails.length,
                            userAdded: false,
                            alreadyViewed: true
                        };
                    }
                } else {
                    console.log(`👤 Anonymous view for question ${questionId}`);
                    return {
                        success: true,
                        view: newView,
                        uniqueCount: getUniqueViewCount(questionId),
                        totalCount: updatedDetails.length,
                        userAdded: false,
                        anonymous: true
                    };
                }
            }

            console.error(`❌ Failed to create view for question ${questionId}:`, result.error);
            return {
                success: false,
                error: result.error || 'Failed to create view'
            };
        } catch (error: any) {
            console.error(`❌ Error creating view for question ${questionId}:`, error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            processing.current.delete(questionId);
        }
    }, [
        getCurrentUsername,
        getViewDetails,
        updateViewDetails,
        updateTotalViews,
        getUniqueUsers,
        updateUniqueUsers,
        updateUniqueViews,
        getUniqueViewCount
    ]);

    const recordView = useCallback(async (questionId: number) => {
        console.log(`👁️ Recording view for question ${questionId}`);

        try {
            const currentUsername = getCurrentUsername();

            if (currentUsername && hasUserViewed(questionId, currentUsername)) {
                console.log(`👤 User ${currentUsername} already viewed question ${questionId}`);

                const createResult = await createView(questionId);

                if (createResult.success) {
                    console.log(`✅ View recorded (already viewed user) for question ${questionId}`);

                    setTimeout(() => {
                        fetchViewsList(questionId).catch(console.error);
                    }, 500);
                }

                return createResult;
            }

            const createResult = await createView(questionId);

            if (createResult.success) {
                console.log(`✅ View recorded successfully for question ${questionId}`);

                setTimeout(async () => {
                    try {
                        await fetchViewsList(questionId);
                    } catch (error) {
                        console.error('Error refreshing views:', error);
                    }
                }, 800);
            } else {
                console.error(`❌ Failed to record view for question ${questionId}:`, createResult.error);
            }

            return createResult;
        } catch (error) {
            console.error(`❌ Error in recordView for question ${questionId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }, [getCurrentUsername, hasUserViewed, createView, fetchViewsList]);

    // ==================== STATISTICS FUNCTIONS ====================
    const getStatistics = useCallback((questionId: number) => {
        const uniqueCount = getUniqueViewCount(questionId);
        const totalCount = getTotalViewCount(questionId);
        const usersList = Array.from(getUniqueUsers(questionId));
        const viewsList = getViewDetails(questionId);
        const currentUsername = getCurrentUsername();

        // Calculate first and last view dates
        let firstViewed: Date | null = null;
        let lastViewed: Date | null = null;

        if (viewsList.length > 0) {
            const timestamps = viewsList
                .map(v => new Date(v.created_at).getTime())
                .filter(timestamp => !isNaN(timestamp));

            if (timestamps.length > 0) {
                firstViewed = new Date(Math.min(...timestamps));
                lastViewed = new Date(Math.max(...timestamps));
            }
        }

        return {
            uniqueViews: uniqueCount,
            totalViews: totalCount,
            uniqueUsers: usersList,
            viewsList,
            lastViewed,
            firstViewed,
            currentUserViewed: hasUserViewed(questionId, currentUsername),
            currentUsername
        };
    }, [
        getUniqueViewCount,
        getTotalViewCount,
        getUniqueUsers,
        getViewDetails,
        getCurrentUsername,
        hasUserViewed
    ]);

    const getMultipleQuestionStats = useCallback((questionIds: number[]) => {
        const stats: Record<number, any> = {};

        questionIds.forEach(questionId => {
            stats[questionId] = getStatistics(questionId);
        });

        return stats;
    }, [getStatistics]);

    // ==================== MANAGEMENT FUNCTIONS ====================
    const initialize = useCallback(async () => {
        try {
            console.log('🚀 Initializing views system...');
            setLoading(true);
            setError(null);

            // Token validatsiyasini tekshirish (faqat mavjud bo'lsa)
            try {
                const token = tokenManager.getAccessToken();
                if (token) {
                    const isValid = await tokenManager.validateAndRefreshToken();
                    if (!isValid) {
                        console.warn('⚠️ Token validation failed, continuing anyway');
                    }
                }
            } catch (authError) {
                console.warn('⚠️ Token validation error, continuing anyway:', authError);
            }

            const result = await fetchViewsList();
            if (result.success) {
                setIsInitialized(true);
                console.log('✅ Views system initialized successfully');
                return result;
            } else {
                console.error('❌ Views system initialization failed:', result.error);
                setError(result.error?.message || 'Initialization failed');
                return result;
            }
        } catch (error) {
            console.error('❌ Error initializing views:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, [fetchViewsList]);

    const refreshQuestionViews = useCallback(async (questionId: number) => {
        try {
            console.log(`🔄 Refreshing views for question ${questionId}`);
            const result = await fetchViewsList(questionId);
            if (result.success) {
                console.log(`✅ Refreshed views for question ${questionId}`);
                return result;
            }
            return result;
        } catch (error) {
            console.error(`❌ Error refreshing views for question ${questionId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }, [fetchViewsList]);

    const clearQuestionCache = useCallback((questionId: number) => {
        viewCountCache.current.delete(questionId);
        console.log(`🗑️ Cleared cache for question ${questionId}`);
    }, []);

    const resetViews = useCallback(() => {
        setViews(new Map());
        setUniqueUsers(new Map());
        setViewDetails(new Map());
        setTotalViews(new Map());
        setIsInitialized(false);
        initializedQuestions.current.clear();
        viewCountCache.current.clear();
        setError(null);
        console.log('🔄 All views data reset');
    }, []);

    // ==================== EFFECTS ====================
    // Auto-refresh views every 5 minutes for initialized questions
    useEffect(() => {
        const refreshInterval = setInterval(() => {
            if (initializedQuestions.current.size > 0) {
                const questionIds = Array.from(initializedQuestions.current);
                console.log(`🔄 Auto-refreshing views for ${questionIds.length} questions`);

                questionIds.forEach(questionId => {
                    viewCountCache.current.delete(questionId);
                });

                // Faqat bir nechta question uchun yangilash
                const limitedIds = questionIds.slice(0, 3);
                limitedIds.forEach(questionId => {
                    refreshQuestionViews(questionId).catch(console.error);
                });
            }
        }, 300000); // 5 minutes

        return () => clearInterval(refreshInterval);
    }, [refreshQuestionViews]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            processing.current.clear();
            initializedQuestions.current.clear();
        };
    }, []);

    // ==================== RETURN VALUES ====================
    return useMemo(() => ({
        // State
        views,
        totalViews,
        uniqueUsers,
        viewDetails,
        loading,
        error,
        isInitialized,

        // Getter functions
        getUniqueViewCount,
        getTotalViewCount,
        getUniqueUsers,
        hasUserViewed,
        getViewDetails,
        getStatistics,
        getCurrentUsername,
        getCurrentUserId,
        getMultipleQuestionStats,

        // Action functions
        initialize,
        fetchViewsList,
        createView,
        recordView,
        refreshQuestionViews,
        clearQuestionCache,
        resetViews,

        // Update functions
        updateUniqueViews,
        updateTotalViews,
        updateUniqueUsers,
        updateViewDetails
    }), [
        views,
        totalViews,
        uniqueUsers,
        viewDetails,
        loading,
        error,
        isInitialized,
        getUniqueViewCount,
        getTotalViewCount,
        getUniqueUsers,
        hasUserViewed,
        getViewDetails,
        getStatistics,
        getCurrentUsername,
        getCurrentUserId,
        getMultipleQuestionStats,
        initialize,
        fetchViewsList,
        createView,
        recordView,
        refreshQuestionViews,
        clearQuestionCache,
        resetViews,
        updateUniqueViews,
        updateTotalViews,
        updateUniqueUsers,
        updateViewDetails
    ]);
};

// Hook nomi sinonim sifatida
export const useSimpleQuizViews = useQuizViews;