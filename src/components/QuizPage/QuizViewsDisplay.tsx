// src/components/QuizViewsDisplay.tsx
import React from 'react';
import { Eye, RefreshCw, TrendingUp } from 'lucide-react';

interface QuizViewsDisplayProps {
    quizId: number;
    viewsCount: number;
    onRefresh?: () => void;
    showTrend?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const QuizViewsDisplay: React.FC<QuizViewsDisplayProps> = ({
                                                                      quizId,
                                                                      viewsCount,
                                                                      onRefresh,
                                                                      showTrend = false,
                                                                      size = 'md',
                                                                      className = '',
                                                                  }) => {
    // Format the views count
    const formatViews = (count: number): string => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        }
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    };

    // Get size classes
    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return {
                    container: 'w-8 h-8',
                    icon: 'w-3 h-3',
                    text: 'text-xs'
                };
            case 'lg':
                return {
                    container: 'w-12 h-12',
                    icon: 'w-5 h-5',
                    text: 'text-base'
                };
            case 'md':
            default:
                return {
                    container: 'w-10 h-10',
                    icon: 'w-4 h-4',
                    text: 'text-sm'
                };
        }
    };

    const sizeClasses = getSizeClasses();

    return (
        <div className={`flex flex-col items-center ${className}`}>
            <div className="relative">
                <div className={`${sizeClasses.container} bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30 group hover:bg-blue-500/30 transition-colors`}>
                    <Eye className={`${sizeClasses.icon} text-blue-400`} />

                    {onRefresh && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRefresh();
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-700"
                            title="Viewsni yangilash"
                        >
                            <RefreshCw size={10} className="text-white" />
                        </button>
                    )}
                </div>

                {showTrend && viewsCount > 100 && (
                    <div className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <TrendingUp size={8} className="text-white" />
                    </div>
                )}
            </div>

            <div className={`mt-1 flex items-center gap-1 ${sizeClasses.text}`}>
                <span className="text-white font-medium">{formatViews(viewsCount)}</span>
                <span className="text-gray-400">views</span>
            </div>
        </div>
    );
};

// With Stats variant
interface QuizViewsWithStatsProps {
    quizId: number;
    views: number;
    todayViews?: number;
    uniqueViewers?: number;
    isLoading?: boolean;
}

export const QuizViewsWithStats: React.FC<QuizViewsWithStatsProps> = ({
                                                                          quizId,
                                                                          views,
                                                                          todayViews = 0,
                                                                          uniqueViewers = 0,
                                                                          isLoading = false,
                                                                      }) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gray-700/30 rounded-full animate-pulse" />
                <div className="h-4 w-12 bg-gray-700/30 rounded mt-1 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="glass-morphism rounded-lg p-3 min-w-[120px]">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Eye size={16} className="text-blue-400" />
                    <span className="text-white font-medium text-sm">Ko'rishlar</span>
                </div>
                <span className="text-blue-400 font-bold">{views}</span>
            </div>

            <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                    <span className="text-gray-400">Bugun:</span>
                    <span className="text-green-400">{todayViews}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">No'yob:</span>
                    <span className="text-yellow-400">{uniqueViewers}</span>
                </div>
            </div>
        </div>
    );
};