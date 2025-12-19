// src/hooks/useQuizViews.ts
import { useState, useCallback, useEffect } from 'react';
import { quizViewsAPI } from '../utils/api';

interface UseQuizViewsReturn {
    getQuizViews: (quizId: number) => number;
    recordView: (quizId: number) => Promise<void>;
    views: Map<number, number>;
    updateViews: (quizId: number, count: number) => void;
    refreshViews: (quizIds: number[]) => Promise<void>;
}

export const useQuizViews = (): UseQuizViewsReturn => {
    const [views, setViews] = useState<Map<number, number>>(new Map());
    const [viewedQuizzes, setViewedQuizzes] = useState<Set<number>>(new Set());

    // Get views count for a quiz
    const getQuizViews = useCallback((quizId: number): number => {
        return views.get(quizId) || 0;
    }, [views]);

    // Update views count for a quiz
    const updateViews = useCallback((quizId: number, count: number) => {
        setViews(prev => new Map(prev).set(quizId, count));
    }, []);

    // Record a new view for a quiz
    const recordView = useCallback(async (quizId: number): Promise<void> => {
        try {
            // Check if we've already recorded a view for this quiz in this session
            if (viewedQuizzes.has(quizId)) {
                return;
            }

            // Record the view via API
            const result = await quizViewsAPI.addQuizView(quizId);

            if (result.success) {
                // Update local views count
                const currentViews = getQuizViews(quizId);
                updateViews(quizId, currentViews + 1);

                // Mark as viewed in this session
                setViewedQuizzes(prev => new Set(prev).add(quizId));
            }
        } catch (error) {
            console.error(`Failed to record view for quiz ${quizId}:`, error);
        }
    }, [getQuizViews, updateViews, viewedQuizzes]);

    // Load views for multiple quizzes
    const refreshViews = useCallback(async (quizIds: number[]): Promise<void> => {
        if (quizIds.length === 0) return;

        try {
            // Fetch views for all quiz IDs
            const viewPromises = quizIds.map(async (quizId) => {
                try {
                    const result = await quizViewsAPI.getQuizViews(quizId);
                    return {
                        quizId,
                        views: result.success ? result.totalViews : 0
                    };
                } catch (error) {
                    console.error(`Failed to get views for quiz ${quizId}:`, error);
                    return { quizId, views: 0 };
                }
            });

            const viewResults = await Promise.all(viewPromises);

            // Update views map
            const newViews = new Map(views);
            viewResults.forEach(result => {
                newViews.set(result.quizId, result.views);
            });

            setViews(newViews);
        } catch (error) {
            console.error('Failed to refresh views:', error);
        }
    }, [views]);

    // Auto-refresh views every 30 seconds for visible quizzes
    useEffect(() => {
        if (views.size === 0) return;

        const interval = setInterval(async () => {
            const quizIds = Array.from(views.keys());
            await refreshViews(quizIds);
        }, 30000);

        return () => clearInterval(interval);
    }, [views, refreshViews]);

    return {
        getQuizViews,
        recordView,
        views,
        updateViews,
        refreshViews,
    };
};