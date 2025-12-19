// src/components/QuizViewTracker.tsx
import React, { useEffect, useRef } from 'react';
import { useQuizViews } from '../hooks/useQuizViews';

interface QuizViewTrackerProps {
    quizId: number;
    autoTrack?: boolean;
    delay?: number;
    onViewRecorded?: (views: number) => void;
    children?: React.ReactNode;
}

export const QuizViewTracker: React.FC<QuizViewTrackerProps> = ({
                                                                    quizId,
                                                                    autoTrack = true,
                                                                    delay = 1000,
                                                                    onViewRecorded,
                                                                    children,
                                                                }) => {
    const { getQuizViews, recordView, updateViews } = useQuizViews();
    const hasTracked = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!autoTrack || hasTracked.current) return;

        timeoutRef.current = setTimeout(() => {
            const trackView = async () => {
                await recordView(quizId);
                const newViews = getQuizViews(quizId);
                onViewRecorded?.(newViews);
            };

            trackView();
            hasTracked.current = true;
        }, delay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [quizId, autoTrack, delay, recordView, getQuizViews, onViewRecorded]);

    // Manual tracking function
    const trackView = async () => {
        await recordView(quizId);
        const newViews = getQuizViews(quizId);
        onViewRecorded?.(newViews);
        return newViews;
    };

    // Update views from external source
    const setViews = (count: number) => {
        updateViews(quizId, count);
    };

    // Get current views
    const currentViews = getQuizViews(quizId);

    return (
        <>
            {children}
        </>
    );
};

// Hook for component usage
export const useQuizViewTracker = (quizId: number) => {
    const { getQuizViews, recordView, updateViews } = useQuizViews();

    const trackView = async () => {
        await recordView(quizId);
        return getQuizViews(quizId);
    };

    const setViews = (count: number) => {
        updateViews(quizId, count);
    };

    const views = getQuizViews(quizId);

    return {
        views,
        trackView,
        setViews,
        refreshView: trackView, // Alias
    };
};