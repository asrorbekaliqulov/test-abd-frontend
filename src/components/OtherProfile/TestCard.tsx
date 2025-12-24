import React from 'react';
import { HelpCircle, Clock4, TrendingUp, BookOpen, ChevronRight } from 'lucide-react';

export interface Test {
    id: string;
    title: string;
    description: string;
    questionsCount: number;
    difficulty_percentage: number;
    category: {
        id: string;
        title: string;
    };
    created_at: string;
    score?: number;
    total_questions: number;
    questions: TestQuestion[];
}

export interface TestQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty_percentage: number;
}

interface TestCardProps {
    test: Test;
    onTestClick: (test: Test) => void;
}

export const TestCard: React.FC<TestCardProps> = ({ test, onTestClick }) => {
    const getDifficultyColor = (difficulty_percentage: number) => {
        if (difficulty_percentage < 33) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        if (difficulty_percentage < 66) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    };

    const getDifficultyLabel = (difficulty_percentage: number) => {
        if (difficulty_percentage < 33) return 'Oson';
        if (difficulty_percentage < 66) return 'Oʻrta';
        return 'Qiyin';
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            return new Intl.DateTimeFormat('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            }).format(date);
        } catch {
            return dateString;
        }
    };

    return (
        <div
            onClick={() => onTestClick(test)}
            className="group relative h-full min-h-[280px] rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/60 p-5 sm:p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 backdrop-blur-sm overflow-hidden flex flex-col"
        >
            {/* Gradient background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Top section */}
            <div className="relative flex flex-col gap-3 mb-5 flex-1 min-h-0">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${getDifficultyColor(test.difficulty_percentage)} text-xs font-semibold whitespace-nowrap`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                {getDifficultyLabel(test.difficulty_percentage)}
                            </div>
                            {test.score !== undefined && test.score > 0 && (
                                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 whitespace-nowrap">
                                    <TrendingUp className="w-3 h-3" />
                                    {test.score}%
                                </div>
                            )}
                        </div>

                        <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors line-clamp-1 break-words">
                            {test.title || "Nomsiz test"}
                        </h3>

                        <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed break-words min-h-[40px]">
                            {test.description || "Tavsif mavjud emas"}
                        </p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-2" />
                </div>

                {/* Category badge */}
                <div className="flex items-center gap-3 mt-auto">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20 flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-300 truncate">
                        {test.category?.title || (
                            <span className="text-rose-400/80 italic">Kategoriya yo'q</span>
                        )}
                    </span>
                </div>
            </div>

            {/* Stats section */}
            <div className="relative grid grid-cols-2 gap-4 pt-5 border-t border-gray-800/50 mt-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center group-hover:border-indigo-500/30 transition-colors flex-shrink-0">
                        <HelpCircle className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xl sm:text-2xl font-bold text-white truncate">
                            {test.total_questions || 0}
                        </span>
                        <span className="text-xs text-gray-400 whitespace-nowrap">Savollar</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center group-hover:border-amber-500/30 transition-colors flex-shrink-0">
                        <Clock4 className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-base sm:text-lg font-semibold text-white truncate">
                            {formatDate(test.created_at)}
                        </span>
                        <span className="text-xs text-gray-400 whitespace-nowrap">Yaratilgan</span>
                    </div>
                </div>
            </div>

            {/* Difficulty percentage indicator */}
            <div className="relative mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span className="truncate">Murakkablik</span>
                    <span className="font-medium text-white whitespace-nowrap">
                        {typeof test.difficulty_percentage === 'number'
                            ? test.difficulty_percentage.toFixed(1)
                            : '0.0'}%
                    </span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${
                            (test.difficulty_percentage || 0) < 33 ? 'bg-emerald-500' :
                                (test.difficulty_percentage || 0) < 66 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{
                            width: `${Math.min(test.difficulty_percentage || 0, 100)}%`
                        }}
                    />
                </div>
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-indigo-500/30 transition-colors pointer-events-none" />
        </div>
    );
};