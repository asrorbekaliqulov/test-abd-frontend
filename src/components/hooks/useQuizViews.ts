// src/hooks/useSimpleQuizViews.ts - TO'LIQ TO'G'RILANGAN VERSIYA
import { useState, useCallback, useRef, useEffect } from 'react';
import { quizViewsAPI } from '../../utils/api.ts';

interface ViewUser {
    username: string;
    [key: string]: any; // other possible user fields
}

interface QuizView {
    id: number;
    question: number;  // Important: question field, not quiz
    user: ViewUser;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    updated_at?: string;
    timestamp?: string;
}

export const useSimpleQuizViews = () => {
    const [views, setViews] = useState<Map<number, number>>(new Map());
    const [uniqueUsers, setUniqueUsers] = useState<Map<number, Set<string>>>(new Map());
    const [viewDetails, setViewDetails] = useState<Map<number, QuizView[]>>(new Map());
    const [totalViews, setTotalViews] = useState<Map<number, number>>(new Map());
    const [isInitialized, setIsInitialized] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const processing = useRef<Set<number>>(new Set());
    const initializedQuestions = useRef<Set<number>>(new Set());
    const viewCountCache = useRef<Map<number, {timestamp: number, count: number}>>(new Map());
    const CACHE_DURATION = 60000; // 1 daqiqa cache

    // Helper functions
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

    // Update functions
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

    // Get current username
    const getCurrentUsername = useCallback((): string | null => {
        try {
            const token = localStorage.getItem('access_token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.username || null;
            }
        } catch (error) {
            console.error('❌ Error getting username from token:', error);
        }
        return null;
    }, []);

    // Get current user ID
    const getCurrentUserId = useCallback((): number | null => {
        try {
            const token = localStorage.getItem('access_token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.user_id || payload.id || null;
            }
        } catch (error) {
            console.error('❌ Error getting user ID from token:', error);
        }
        return null;
    }, []);

    // Calculate unique users by username
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

    // Fetch views list - IMPROVED FUNCTION
    const fetchViewsList = useCallback(async (questionId?: number) => {
        try {
            console.log(`📊 Fetching views list ${questionId ? `for question ${questionId}` : 'for all questions'}`);

            const result = await quizViewsAPI.getQuizViews(questionId);

            if (result.success) {
                const viewsData = Array.isArray(result.results) ? result.results : [];
                console.log(`📊 Received ${viewsData.length} views from /quiz/question-views/`);

                const questionViewMap = new Map<number, QuizView[]>();

                // Group views by question ID
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
                        timestamp: view.timestamp || view.created_at
                    });
                });

                // Update states for each question
                questionViewMap.forEach((viewList, qId) => {
                    const uniqueStats = calculateUniqueUsers(viewList);

                    updateViewDetails(qId, viewList);
                    updateUniqueViews(qId, uniqueStats.count);
                    updateUniqueUsers(qId, uniqueStats.users);
                    updateTotalViews(qId, viewList.length);

                    console.log(`📊 Question ${qId}: ${viewList.length} total views, ${uniqueStats.count} unique users`);

                    // Mark as initialized
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
                error
            };
        }
    }, [calculateUniqueUsers, updateViewDetails, updateUniqueViews, updateUniqueUsers, updateTotalViews]);

    // Create a new view - IMPROVED FUNCTION
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

            // Call API to create view
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
                    timestamp: result.data.timestamp || result.data.created_at
                };

                // Update local state
                const currentDetails = getViewDetails(questionId);
                const updatedDetails = [...currentDetails, newView];

                updateViewDetails(questionId, updatedDetails);
                updateTotalViews(questionId, updatedDetails.length);

                // Update unique users if we have a username
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

    // Record view - main entry point
    const recordView = useCallback(async (questionId: number) => {
        console.log(`👁️ Recording view for question ${questionId}`);

        try {
            // Check if current user already viewed
            const currentUsername = getCurrentUsername();

            if (currentUsername && hasUserViewed(questionId, currentUsername)) {
                console.log(`👤 User ${currentUsername} already viewed question ${questionId}`);

                // Still record to backend for total count (but not unique)
                const createResult = await createView(questionId);

                if (createResult.success) {
                    console.log(`✅ View recorded (already viewed user) for question ${questionId}`);

                    // Refresh after delay
                    setTimeout(() => {
                        fetchViewsList(questionId).catch(console.error);
                    }, 500);
                }

                return createResult;
            }

            // Create new view (new unique user or anonymous)
            const createResult = await createView(questionId);

            if (createResult.success) {
                console.log(`✅ View recorded successfully for question ${questionId}`);

                // Refresh views list after delay
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
                error
            };
        }
    }, [getCurrentUsername, hasUserViewed, createView, fetchViewsList]);

    // Get statistics
    const getStatistics = useCallback((questionId: number) => {
        const uniqueCount = getUniqueViewCount(questionId);
        const totalCount = getTotalViewCount(questionId);
        const usersList = Array.from(getUniqueUsers(questionId));
        const viewsList = getViewDetails(questionId);
        const currentUsername = getCurrentUsername();

        return {
            uniqueViews: uniqueCount,
            totalViews: totalCount,
            uniqueUsers: usersList,
            viewsList,
            lastViewed: viewsList.length > 0
                ? new Date(Math.max(...viewsList.map(v => new Date(v.created_at).getTime())))
                : null,
            firstViewed: viewsList.length > 0
                ? new Date(Math.min(...viewsList.map(v => new Date(v.created_at).getTime())))
                : null,
            currentUserViewed: hasUserViewed(questionId, currentUsername),
            currentUsername: currentUsername
        };
    }, [
        getUniqueViewCount,
        getTotalViewCount,
        getUniqueUsers,
        getViewDetails,
        getCurrentUsername,
        hasUserViewed
    ]);

    // Initialize
    const initialize = useCallback(async () => {
        try {
            console.log('🚀 Initializing views system...');
            setLoading(true);
            setError(null);

            const result = await fetchViewsList();
            if (result.success) {
                setIsInitialized(true);
                console.log('✅ Views system initialized successfully');
            } else {
                console.error('❌ Views system initialization failed:', result.error);
                setError(result.error?.message || 'Initialization failed');
            }
            return result;
        } catch (error) {
            console.error('❌ Error initializing views:', error);
            setError(error instanceof Error ? error.message : 'Unknown error');
            return {
                success: false,
                error
            };
        } finally {
            setLoading(false);
        }
    }, [fetchViewsList]);

    // Refresh specific question views
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
                error
            };
        }
    }, [fetchViewsList]);

    // Get views for multiple questions
    const getMultipleQuestionStats = useCallback((questionIds: number[]) => {
        const stats: Record<number, any> = {};

        questionIds.forEach(questionId => {
            stats[questionId] = getStatistics(questionId);
        });

        return stats;
    }, [getStatistics]);

    // Clear cache for a question
    const clearQuestionCache = useCallback((questionId: number) => {
        viewCountCache.current.delete(questionId);
        console.log(`🗑️ Cleared cache for question ${questionId}`);
    }, []);

    // Reset all views
    const resetViews = useCallback(() => {
        setViews(new Map());
        setUniqueUsers(new Map());
        setViewDetails(new Map());
        setTotalViews(new Map());
        setIsInitialized(false);
        initializedQuestions.current.clear();
        viewCountCache.current.clear();
        console.log('🔄 All views data reset');
    }, []);

    // Auto-refresh views for active questions
    useEffect(() => {
        const refreshInterval = setInterval(() => {
            if (initializedQuestions.current.size > 0) {
                const questionIds = Array.from(initializedQuestions.current);
                console.log(`🔄 Auto-refreshing views for ${questionIds.length} questions`);

                questionIds.forEach(questionId => {
                    // Clear cache for active questions
                    viewCountCache.current.delete(questionId);
                });
            }
        }, 300000); // Every 5 minutes

        return () => clearInterval(refreshInterval);
    }, []);

    return {
        // State
        views,
        totalViews,
        uniqueUsers,
        viewDetails,
        loading,
        error,
        isInitialized,

        // Getters
        getUniqueViewCount,
        getTotalViewCount,
        getUniqueUsers,
        hasUserViewed,
        getViewDetails,
        getStatistics,
        getCurrentUsername,
        getCurrentUserId,
        getMultipleQuestionStats,

        // Operations
        initialize,
        fetchViewsList,
        createView,
        recordView,
        refreshQuestionViews,
        clearQuestionCache,
        resetViews,

        // Updates
        updateUniqueViews,
        updateTotalViews,
        updateUniqueUsers,
        updateViewDetails
    };
};