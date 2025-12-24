import React from 'react';
import { BookOpen, Clock4, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

export interface Question {
    id: number;
    question_text: string;
    description: string;
    difficulty_percentage: number;
    test_title: string;
    created_at: string;
    correct_count: number;
    wrong_count: number;
}

interface QuestionCardProps {
    question: Question;
    onQuestionClick: (question: Question) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, onQuestionClick }) => {
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

    const calculateSuccessRate = () => {
        const total = question.correct_count + question.wrong_count;
        return total > 0 ? Math.round((question.correct_count / total) * 100) : 0;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(date);
    };

    const successRate = calculateSuccessRate();
    const totalAttempts = question.correct_count + question.wrong_count;

    return (
        <div
            onClick={() => onQuestionClick(question)}
            className="group relative h-full rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/30 p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 backdrop-blur-sm overflow-hidden flex flex-col"
        >
            {/* Gradient background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Top section with title and difficulty */}
            <div className="relative flex flex-col gap-3 mb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${getDifficultyColor(question.difficulty_percentage)} text-xs font-semibold`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                {getDifficultyLabel(question.difficulty_percentage)}
                            </div>
                            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-800/50 text-gray-300 text-xs font-semibold border border-gray-700">
                                <BarChart3 className="w-3 h-3" />
                                {question.difficulty_percentage.toFixed(1)}%
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors line-clamp-2 leading-tight">
                            {question.question_text}
                        </h3>
                    </div>
                </div>

                {/* Test title */}
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-300 truncate">
                        {question.test_title}
                    </span>
                </div>
            </div>

            {/* Description */}
            <div className="relative mb-6 flex-1">
                <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">
                    {question.description}
                </p>
            </div>

            {/* Stats section - Horizontal layout */}
            <div className="relative grid grid-cols-3 gap-3 pt-5 border-t border-gray-800/50">
                {/* Correct Answers */}
                <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircleOutlineIcon className="text-emerald-400" style={{ fontSize: '18px' }} />
                        <span className="text-lg font-bold text-white">{question.correct_count}</span>
                    </div>
                    <span className="text-xs text-emerald-300/80">To'g'ri</span>
                </div>

                {/* Wrong Answers */}
                <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20">
                    <div className="flex items-center gap-2 mb-1">
                        <CancelOutlinedIcon className="text-rose-400" style={{ fontSize: '18px' }} />
                        <span className="text-lg font-bold text-white">{question.wrong_count}</span>
                    </div>
                    <span className="text-xs text-rose-300/80">Noto'g'ri</span>
                </div>

                {/* Success Rate */}
                <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/20">
                    <div className="flex items-center gap-2 mb-1">
                        {successRate >= 50 ? (
                            <TrendingUp className="w-4 h-4 text-indigo-400" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-amber-400" />
                        )}
                        <span className={`text-lg font-bold ${successRate >= 50 ? 'text-indigo-300' : 'text-amber-300'}`}>
                            {successRate}%
                        </span>
                    </div>
                    <span className="text-xs text-gray-400">Muvaffaqiyat</span>
                </div>
            </div>

            {/* Bottom section with date and total attempts */}
            <div className="relative mt-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center group-hover:border-amber-500/30 transition-colors">
                        <Clock4 className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                            {formatDate(question.created_at)}
                        </span>
                        <span className="text-xs text-gray-400">Yaratilgan</span>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-sm font-semibold text-white">{totalAttempts}</div>
                    <div className="text-xs text-gray-400">Urinishlar</div>
                </div>
            </div>

            {/* Progress bar for success rate */}
            <div className="relative mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Muvaffaqiyat darajasi</span>
                    <span className="font-medium text-white">{successRate}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${
                            successRate >= 70 ? 'bg-emerald-500' :
                                successRate >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${successRate}%` }}
                    />
                </div>
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-indigo-500/30 transition-colors pointer-events-none" />
        </div>
    );
};