"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Share, Bookmark, X, Send, Check, ThumbsUp, ThumbsDown, Loader2, Filter, Eye, MoreVertical, Smile, BarChart3, Search, RefreshCw } from "lucide-react";
import { quizAPI, accountsAPI, tokenManager, infiniteScrollManager } from "../../utils/api";
import { useParams, useNavigate } from "react-router-dom";
import Logo from "../assets/images/logo.jpg";
import defaultAvatar from "../assets/images/defaultuseravatar.png";
import QuizSkeletonLoader from "./QuizSkeletonLoader";
import { useSimpleQuizViews } from "../hooks/useQuizViews";

interface QuizPageProps {
    theme?: string;
}

export interface Category {
    id: number;
    title: string;
    slug: string;
    emoji: string;
}

interface QuizReaction {
    id: number;
    quiz: number;
    user: number;
    reaction_type: string;
    created_at: string;
}

interface Answer {
    id: number;
    letter: string;
    answer_text: string;
    is_correct: boolean;
}

interface QuizUser {
    id: number;
    username: string;
    profile_image: string | null;
    is_following?: boolean;
}

interface Quiz {
    id: number;
    question_text: string;
    question_type: string;
    media: string | null;
    answers: Answer[];
    correct_count: number;
    wrong_count: number;
    test_title: string;
    test_description: string;
    difficulty_percentage: number;
    is_bookmarked?: boolean;
    user: QuizUser;
    created_at: string;
    round_image: string | null;
    category?: {
        id: number;
        title: string;
        slug: string;
    };
    view_count?: number;
    unique_viewers?: number;
    total_views?: number;
    reactions_summary?: {
        coin: number;
        like: number;
        love: number;
        clap: number;
        insightful: number;
        total: number;
    };
    user_reaction?: string | null;
    has_worked?: boolean;
    stats?: {
        total_attempts: number;
        correct_attempts: number;
        wrong_attempts: number;
        accuracy: number;
        average_time: number;
    };
}

interface FilterOptions {
    category?: number | "All";
    created?: "new" | "old";
    difficulty_min?: number;
    difficulty_max?: number;
    worked?: boolean;
    unworked?: boolean;
    is_random?: boolean;
    ordering?: "created_at" | "-created_at" | "difficulty_percentage" | "-difficulty_percentage";
    search?: string;
    page?: number;
    page_size?: number;
}

const REACTION_CHOICES = [
    { id: 'coin', emoji: '🪙', label: 'Coin' },
    { id: 'like', emoji: '👍', label: 'Like' },
    { id: 'love', emoji: '❤️', label: 'Love' },
    { id: 'clap', emoji: '👏', label: 'Clap' },
    { id: 'insightful', emoji: '💡', label: 'Insightful' },
] as const;

type ReactionType = typeof REACTION_CHOICES[number]['id'];

const INFINITE_SCROLL_PAGE_SIZE = 10;
const INFINITE_SCROLL_THRESHOLD = 2;
const SCROLL_DEBOUNCE_DELAY = 100;

const QuizPage: React.FC<QuizPageProps> = ({ theme = "dark" }) => {
    const navigate = useNavigate();
    const { questionId } = useParams<{ questionId: string }>();

    const {
        getStatistics,
        recordView: recordQuizView,
        initialize: initializeViews,
        getCurrentUserId
    } = useSimpleQuizViews();

    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [quizData, setQuizData] = useState<Quiz[]>([]);
    const [userInteractions, setUserInteractions] = useState({
        selectedAnswers: new Map<number, number[]>(),
        textAnswers: new Map<number, string>(),
        answerStates: new Map<number, "correct" | "incorrect">(),
        reactions: new Map<number, string>(),
        submittedQuizzes: new Set<number>(),
    });

    const [shakingAnswerId, setShakingAnswerId] = useState<number | null>(null);
    const [coinAnimation, setCoinAnimation] = useState<{ quizId: number, answerId: number, show: boolean } | null>(null);
    const [correctAnimation, setCorrectAnimation] = useState<number | null>(null);

    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        category: "All",
        ordering: "-created_at",
        is_random: true
    });
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const [submittingQuestions, setSubmittingQuestions] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [quizReactions, setQuizReactions] = useState<Map<number, QuizReaction>>(new Map());
    const [isReacting, setIsReacting] = useState<Set<number>>(new Set());

    const [showReactions, setShowReactions] = useState<number | null>(null);
    const [showDropdown, setShowDropdown] = useState<number | null>(null);
    const [showReactionStats, setShowReactionStats] = useState<number | null>(null);

    const [quizStats, setQuizStats] = useState<Map<number, {
        views: number;
        unique_views: number;
        correct_attempts: number;
        wrong_attempts: number;
        total_attempts: number;
        accuracy: number;
    }>>(new Map());

    const containerRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isLoadingRef = useRef(false);
    const lastScrollTopRef = useRef<number>(0);
    const viewedQuizzesRef = useRef<Set<number>>(new Set());
    const initialLoadRef = useRef(false);

    // Infinite scroll state
    const [infiniteScrollState, setInfiniteScrollState] = useState(() => infiniteScrollManager.getState());

    // ==================== JAVOB TANLASH VA SUBMIT QILISH FUNKSIYALARI ====================

    // Javobni tanlash funksiyasi
    const selectAnswer = async (quizId: number, answerId: number) => {
        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz) return;

        // Agar savol submit qilingan bo'lsa, yana tanlashga ruxsat bermaslik
        if (userInteractions.submittedQuizzes.has(quizId)) return;

        // Agar multiple choice bo'lsa
        if (quiz.question_type === 'multiple') {
            handleMultipleChoice(quizId, answerId);
            return;
        }

        // Agar single choice bo'lsa
        if (submittingQuestions.has(quizId) || userInteractions.submittedQuizzes.has(quizId)) return;

        // Javobni tanlash (state da saqlash)
        setUserInteractions(prev => {
            const newSelectedAnswers = new Map(prev.selectedAnswers);
            newSelectedAnswers.set(quizId, [answerId]);
            return {
                ...prev,
                selectedAnswers: newSelectedAnswers
            };
        });

        // Submit qilish
        setSubmittingQuestions(prev => new Set(prev).add(quizId));
        try {
            const res = await quizAPI.submitAnswers({
                question: quizId,
                selected_answer_ids: [answerId]
            });

            const isCorrect = res.data?.is_correct;
            console.log(`✅ Answer submitted for quiz ${quizId}: correct=${isCorrect}`);

            setUserInteractions(prev => ({
                ...prev,
                answerStates: new Map(prev.answerStates).set(quizId, isCorrect ? "correct" : "incorrect"),
                submittedQuizzes: new Set(prev.submittedQuizzes).add(quizId),
            }));

            if (isCorrect) {
                // To'g'ri javob animatsiyasi
                setCorrectAnimation(quizId);
                setTimeout(() => setCorrectAnimation(null), 2000);

                // Coin animatsiyasi
                setCoinAnimation({ quizId, answerId, show: true });
                setTimeout(() => setCoinAnimation(null), 2000);
            } else {
                // Noto'g'ri javob animatsiyasi
                setShakingAnswerId(answerId);
                setTimeout(() => setShakingAnswerId(null), 1000);
            }

            // Statistikani yangilash
            setTimeout(async () => {
                try {
                    await fetchQuizStats(quizId);
                } catch (error) {
                    console.error(`❌ Error updating stats for quiz ${quizId}:`, error);
                }
            }, 500);

        } catch (err) {
            console.error("❌ Select answer error:", err);
        } finally {
            setSubmittingQuestions(prev => {
                const newSet = new Set(prev);
                newSet.delete(quizId);
                return newSet;
            });
        }
    };

    // Multiple choice javob tanlash
    const handleMultipleChoice = (quizId: number, answerId: number) => {
        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz || userInteractions.submittedQuizzes.has(quizId)) return;

        setUserInteractions(prev => {
            const current = prev.selectedAnswers.get(quizId) || [];
            let newAnswers;

            // Agar answer allaqachon tanlangan bo'lsa, olib tashlash
            if (current.includes(answerId)) {
                newAnswers = current.filter(id => id !== answerId);
            } else {
                // Yangi javobni qo'shish
                newAnswers = [...current, answerId];
            }

            return {
                ...prev,
                selectedAnswers: new Map(prev.selectedAnswers).set(quizId, newAnswers)
            };
        });
    };

    // Multiple choice submit qilish
    const submitMultipleChoice = async (quizId: number) => {
        const selected = userInteractions.selectedAnswers.get(quizId) || [];
        if (selected.length === 0 || submittingQuestions.has(quizId) || userInteractions.submittedQuizzes.has(quizId)) return;

        setSubmittingQuestions(prev => new Set(prev).add(quizId));
        try {
            const res = await quizAPI.submitAnswers({
                question: quizId,
                selected_answer_ids: selected
            });

            const isCorrect = res.data?.is_correct;
            console.log(`✅ Multiple choice submitted for quiz ${quizId}: correct=${isCorrect}`);

            setUserInteractions(prev => ({
                ...prev,
                answerStates: new Map(prev.answerStates).set(quizId, isCorrect ? "correct" : "incorrect"),
                submittedQuizzes: new Set(prev.submittedQuizzes).add(quizId),
            }));

            if (isCorrect) {
                // To'g'ri javob animatsiyasi
                setCorrectAnimation(quizId);
                setTimeout(() => setCorrectAnimation(null), 2000);

                // Coin animatsiyasi
                const quiz = quizData.find(q => q.id === quizId);
                if (quiz) {
                    const correctAnswer = quiz.answers.find(a => a.is_correct);
                    if (correctAnswer) {
                        setCoinAnimation({ quizId, answerId: correctAnswer.id, show: true });
                        setTimeout(() => setCoinAnimation(null), 2000);
                    }
                }
            } else {
                // Noto'g'ri tanlangan javoblar uchun animatsiya
                selected.forEach((answerId) => {
                    const answer = quizData.find(q => q.id === quizId)?.answers.find(a => a.id === answerId);
                    if (answer && !answer.is_correct) {
                        setShakingAnswerId(answerId);
                    }
                });
                setTimeout(() => setShakingAnswerId(null), 1000);
            }

            // Statistikani yangilash
            setTimeout(async () => {
                try {
                    await fetchQuizStats(quizId);
                } catch (error) {
                    console.error(`❌ Error updating stats for quiz ${quizId}:`, error);
                }
            }, 500);

        } catch (err) {
            console.error("❌ Submit multiple choice error:", err);
        } finally {
            setSubmittingQuestions(prev => {
                const newSet = new Set(prev);
                newSet.delete(quizId);
                return newSet;
            });
        }
    };

    // ==================== RENDER QUESTION CONTENT FUNKSIYASI ====================

    const renderQuestionContent = (quiz: Quiz) => {
        const selectedAnswers = userInteractions.selectedAnswers.get(quiz.id) || [];
        const answerState = userInteractions.answerStates.get(quiz.id);
        const hasSubmitted = userInteractions.submittedQuizzes.has(quiz.id);
        const isMultipleChoice = quiz.question_type === 'multiple';
        const isSubmitting = submittingQuestions.has(quiz.id);

        // Javoblarni render qilish
        const renderAnswers = () => {
            if (!quiz.answers || quiz.answers.length === 0) {
                return <div className="text-gray-400 text-center py-4">Javob variantlari mavjud emas</div>;
            }

            return quiz.answers.map((answer, idx) => {
                const isSelected = selectedAnswers.includes(answer.id);
                const isCorrect = answer.is_correct;
                const isShaking = shakingAnswerId === answer.id;
                const letter = answer.letter || String.fromCharCode(65 + idx);

                // Submit qilinganidan keyin ko'rinish
                let bgColor = 'bg-white/5';
                let borderColor = 'border-white/10';
                let textColor = 'text-gray-200';

                if (hasSubmitted) {
                    if (isCorrect) {
                        bgColor = 'bg-green-500/20';
                        borderColor = 'border-green-500';
                        textColor = 'text-green-400';
                    } else if (isSelected && !isCorrect) {
                        bgColor = 'bg-red-500/20';
                        borderColor = 'border-red-500';
                        textColor = 'text-red-400';
                    }
                } else if (isSelected) {
                    bgColor = 'bg-blue-500/20';
                    borderColor = 'border-blue-500';
                    textColor = 'text-white';
                }

                return (
                    <div
                        key={answer.id}
                        className={`relative mb-3 p-4 rounded-lg border transition-all cursor-pointer
                            ${bgColor} ${borderColor} ${isShaking ? 'animate-shake' : ''}
                            ${!hasSubmitted ? 'hover:bg-white/10' : ''}
                        `}
                        onClick={() => {
                            if (!hasSubmitted && !isSubmitting) {
                                selectAnswer(quiz.id, answer.id);
                            }
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                ${isSelected ? 'bg-blue-500' : 'bg-white/10'}
                                ${hasSubmitted && isCorrect ? 'bg-green-500' : ''}
                                ${hasSubmitted && isSelected && !isCorrect ? 'bg-red-500' : ''}
                            `}>
                                <span className={`font-bold ${isSelected || (hasSubmitted && isCorrect) ? 'text-white' : 'text-gray-300'}`}>
                                    {letter}
                                </span>
                            </div>
                            <div className="flex-1">
                                <div className={`text-sm md:text-base ${textColor}`}>
                                    {answer.answer_text}
                                </div>
                            </div>

                            {/* Check iconlari */}
                            {hasSubmitted && isCorrect && (
                                <div className="text-green-400">
                                    <Check size={20} />
                                </div>
                            )}
                            {hasSubmitted && isSelected && !isCorrect && (
                                <div className="text-red-400">
                                    <X size={20} />
                                </div>
                            )}
                        </div>

                        {/* Multiple choice uchun checkbox */}
                        {isMultipleChoice && !hasSubmitted && (
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 cursor-pointer"
                                    checked={isSelected}
                                    onChange={() => handleMultipleChoice(quiz.id, answer.id)}
                                    disabled={hasSubmitted || isSubmitting}
                                />
                            </div>
                        )}

                        {/* Single choice uchun radio */}
                        {!isMultipleChoice && !hasSubmitted && (
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                <input
                                    type="radio"
                                    name={`quiz-${quiz.id}`}
                                    className="w-5 h-5 cursor-pointer"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    disabled={hasSubmitted || isSubmitting}
                                />
                            </div>
                        )}
                    </div>
                );
            });
        };

        // Submit tugmasi
        const renderSubmitButton = () => {
            if (hasSubmitted) {
                return (
                    <div className="mt-6">
                        <div className={`text-center py-3 rounded-lg font-medium ${
                            answerState === 'correct'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                            {answerState === 'correct' ? '✅ To\'g\'ri javob!' : '❌ Noto\'g\'ri javob!'}
                        </div>
                        <button
                            onClick={() => {
                                // Keyingi savolga o'tish
                                const nextIndex = currentQuizIndex + 1;
                                if (nextIndex < quizData.length && containerRef.current) {
                                    containerRef.current.scrollTo({
                                        top: nextIndex * window.innerHeight,
                                        behavior: 'smooth'
                                    });
                                }
                            }}
                            className="w-full mt-3 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                        >
                            Keyingi savol
                        </button>
                    </div>
                );
            }

            if (isMultipleChoice) {
                const hasSelectedAnswers = selectedAnswers.length > 0;
                return (
                    <div className="mt-6">
                        <button
                            onClick={() => submitMultipleChoice(quiz.id)}
                            disabled={!hasSelectedAnswers || isSubmitting}
                            className={`w-full py-3 rounded-lg font-medium transition ${
                                hasSelectedAnswers && !isSubmitting
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 size={18} className="animate-spin" />
                                    Tekshirilmoqda...
                                </div>
                            ) : 'Javobni tekshirish'}
                        </button>
                    </div>
                );
            }

            // Single choice uchun submit tugmasi (agar javob tanlanmagan bo'lsa)
            const hasSelectedAnswer = selectedAnswers.length > 0;
            if (!hasSelectedAnswer) {
                return (
                    <div className="mt-6">
                        <div className="w-full py-3 bg-gray-700 text-gray-400 rounded-lg font-medium text-center">
                            Javob tanlang
                        </div>
                    </div>
                );
            }

            return null; // Single choice da javob tanlangandan so'ng avtomatik submit qilinadi
        };

        return (
            <div className="space-y-4">
                {/* Media content (image/video) */}
                {quiz.media && (
                    <div className="relative rounded-lg overflow-hidden mb-4">
                        {quiz.media.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                                src={quiz.media}
                                alt="Question media"
                                className="w-full h-auto max-h-64 object-cover rounded-lg"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : quiz.media.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video
                                src={quiz.media}
                                className="w-full h-auto max-h-64 rounded-lg"
                                controls
                            />
                        ) : null}
                    </div>
                )}

                {/* Answers */}
                <div className="space-y-2">
                    {renderAnswers()}
                </div>

                {/* Submit button */}
                {renderSubmitButton()}

                {/* Coin animatsiyasi */}
                {coinAnimation?.show && coinAnimation.quizId === quiz.id && (
                    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                        <div className="text-4xl animate-coin-bounce">
                            🪙
                        </div>
                    </div>
                )}

                {/* Correct animatsiyasi */}
                {correctAnimation === quiz.id && (
                    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                        <div className="text-6xl animate-correct-pulse">
                            ✅
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ==================== FILTER MODAL RENDER FUNKSIYASI ====================
    const renderFilterModal = () => {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">Filterlar</h3>
                        <button
                            onClick={() => setShowFilterModal(false)}
                            className="text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Category filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Kategoriya
                            </label>
                            <select
                                value={filterOptions.category === "All" ? "All" : filterOptions.category}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    applyFilter({
                                        category: value === "All" ? "All" : parseInt(value)
                                    });
                                }}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                            >
                                <option value="All">Hammasi</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.emoji} {cat.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Difficulty filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Qiyinlik darajasi
                            </label>
                            <div className="flex gap-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={filterOptions.difficulty_min || 0}
                                    onChange={(e) => applyFilter({
                                        difficulty_min: parseInt(e.target.value)
                                    })}
                                    className="flex-1"
                                />
                                <div className="text-white text-sm">
                                    {filterOptions.difficulty_min || 0}%
                                </div>
                            </div>
                        </div>

                        {/* Worked filter */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-white">
                                <input
                                    type="checkbox"
                                    checked={filterOptions.worked || false}
                                    onChange={(e) => applyFilter({
                                        worked: e.target.checked,
                                        unworked: false
                                    })}
                                    className="w-4 h-4"
                                />
                                Ishlàganlar
                            </label>
                            <label className="flex items-center gap-2 text-white">
                                <input
                                    type="checkbox"
                                    checked={filterOptions.unworked || false}
                                    onChange={(e) => applyFilter({
                                        unworked: e.target.checked,
                                        worked: false
                                    })}
                                    className="w-4 h-4"
                                />
                                Ishlanmaganlar
                            </label>
                        </div>

                        {/* Sort order */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Tartiblash
                            </label>
                            <select
                                value={filterOptions.ordering || "-created_at"}
                                onChange={(e) => applyFilter({
                                    ordering: e.target.value as FilterOptions['ordering']
                                })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                            >
                                <option value="-created_at">Yangi → Eski</option>
                                <option value="created_at">Eski → Yangi</option>
                                <option value="difficulty_percentage">Oson → Qiyin</option>
                                <option value="-difficulty_percentage">Qiyin → Oson</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button
                            onClick={() => {
                                resetFilters();
                                setShowFilterModal(false);
                            }}
                            className="flex-1 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
                        >
                            Tozalash
                        </button>
                        <button
                            onClick={() => setShowFilterModal(false)}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Saqlash
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ==================== REACTIONS MENU RENDER FUNKSIYASI ====================
    const renderReactionsMenu = (quizId: number) => {
        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz) return null;

        const currentReaction = userInteractions.reactions.get(quizId);

        return (
            <div
                className="absolute bottom-full right-0 mb-2 p-2 bg-gray-900/90 backdrop-blur-lg rounded-xl border border-gray-700 shadow-lg z-50"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex gap-2">
                    {REACTION_CHOICES.map((reaction) => {
                        const isActive = currentReaction === reaction.id;
                        const reactionCount = quiz.reactions_summary?.[reaction.id as keyof typeof quiz.reactions_summary] || 0;

                        return (
                            <button
                                key={reaction.id}
                                onClick={() => handleReaction(quizId, reaction.id)}
                                disabled={isReacting.has(quizId)}
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition relative
                                    ${isActive ? 'bg-gray-800' : 'hover:bg-gray-800'}
                                    ${isReacting.has(quizId) ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                {reaction.emoji}
                                {reactionCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {reactionCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ==================== DROPDOWN MENU RENDER FUNKSIYASI ====================
    const renderDropdownMenu = (quizId: number) => {
        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz) return null;

        return (
            <div
                className="absolute bottom-full right-0 mb-2 p-2 bg-gray-900/90 backdrop-blur-lg rounded-xl border border-gray-700 shadow-lg z-50 min-w-[200px]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="space-y-1">
                    <button
                        onClick={() => {
                            // Share functionality
                            navigator.clipboard.writeText(window.location.href);
                            alert("Link nusxalandi!");
                            setShowDropdown(null);
                        }}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 rounded-lg flex items-center gap-3"
                    >
                        <Share size={18} />
                        Ulashish
                    </button>

                    <button
                        onClick={async () => {
                            try {
                                const response = await quizAPI.toggleBookmark(quizId);
                                if (response.success) {
                                    setQuizData(prev => prev.map(q =>
                                        q.id === quizId
                                            ? { ...q, is_bookmarked: response.data?.is_bookmarked }
                                            : q
                                    ));
                                }
                            } catch (err) {
                                console.error("Bookmark error:", err);
                            } finally {
                                setShowDropdown(null);
                            }
                        }}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 rounded-lg flex items-center gap-3"
                    >
                        <Bookmark size={18} />
                        {quiz.is_bookmarked ? "Bookmarkdan o'chirish" : "Bookmark qilish"}
                    </button>

                    <button
                        onClick={() => {
                            setShowReactionStats(showReactionStats === quizId ? null : quizId);
                            setShowDropdown(null);
                        }}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 rounded-lg flex items-center gap-3"
                    >
                        <BarChart3 size={18} />
                        Statistikalar
                    </button>

                    <button
                        onClick={() => {
                            // Report functionality
                            alert("Report submitted!");
                            setShowDropdown(null);
                        }}
                        className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-800 rounded-lg"
                    >
                        Shikoyat qilish
                    </button>
                </div>
            </div>
        );
    };

    // ==================== REACTION STATS RENDER FUNKSIYASI ====================
    const renderReactionStats = (quizId: number) => {
        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz?.reactions_summary) return null;

        const stats = quiz.reactions_summary;
        const total = stats.total;

        return (
            <div
                className="absolute bottom-full right-0 mb-2 p-4 bg-gray-900/90 backdrop-blur-lg rounded-xl border border-gray-700 shadow-lg z-50 min-w-[300px]"
                onClick={(e) => e.stopPropagation()}
            >
                <h4 className="text-white font-medium mb-3">Reaksiya statistikasi</h4>
                <div className="space-y-2">
                    {REACTION_CHOICES.map((reaction) => {
                        const count = stats[reaction.id as keyof typeof stats] || 0;
                        const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;

                        return (
                            <div key={reaction.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{reaction.emoji}</span>
                                    <span className="text-white text-sm">{reaction.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">{count}</span>
                                    <span className="text-gray-400 text-sm">({percentage}%)</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-700">
                    <div className="flex justify-between text-white">
                        <span>Jami:</span>
                        <span className="font-medium">{total}</span>
                    </div>
                </div>
            </div>
        );
    };

    // ==================== HEADER RENDER FUNKSIYASI ====================
    const renderHeader = () => (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-2xl px-4">
            <div className="flex items-center justify-between glass-morphism rounded-xl p-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 text-white hover:bg-white/10 rounded-lg transition"
                    >
                        ←
                    </button>
                    <h1 className="text-white font-medium text-sm md:text-base">Testlar</h1>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Qidirish..."
                            className="pl-10 pr-4 py-2 bg-black/40 backdrop-blur-lg border border-white/10 rounded-lg text-white placeholder-gray-400 text-sm w-40 md:w-48 focus:outline-none focus:border-blue-500 transition"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Loader2 size={16} className="animate-spin text-blue-400" />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowFilterModal(true)}
                        className="p-2 text-white hover:bg-white/10 rounded-lg transition"
                    >
                        <Filter size={20} />
                    </button>

                    <button
                        onClick={() => loadQuizzes(true, true)}
                        className="p-2 text-white hover:bg-white/10 rounded-lg transition"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>
        </div>
    );

    // ==================== ASOSIY FUNKSIYALAR (O'ZGARMAGAN) ====================

    // fetchQuizStats funksiyasi
    const fetchQuizStats = useCallback(async (quizId: number): Promise<void> => {
        try {
            const statsResponse = await quizAPI.getQuestionStats(quizId);
            console.log(`📊 Stats response for quiz ${quizId}:`, statsResponse);

            if (statsResponse.success && statsResponse.data) {
                const stats = statsResponse.data;

                setQuizStats(prev => {
                    const newMap = new Map(prev);
                    newMap.set(quizId, {
                        views: stats.total_views || stats.view_count || 0,
                        unique_views: stats.unique_viewers || 0,
                        correct_attempts: stats.correct_attempts || stats.correct_count || 0,
                        wrong_attempts: stats.wrong_attempts || stats.wrong_count || 0,
                        total_attempts: stats.total_attempts ||
                            ((stats.correct_count || 0) + (stats.wrong_count || 0)),
                        accuracy: stats.accuracy || 0,
                    });
                    return newMap;
                });

                setQuizData(prev => prev.map(q => {
                    if (q.id === quizId) {
                        return {
                            ...q,
                            correct_count: stats.correct_count || stats.correct_attempts || q.correct_count || 0,
                            wrong_count: stats.wrong_count || stats.wrong_attempts || q.wrong_count || 0,
                            view_count: stats.view_count || stats.total_views || q.view_count || 0,
                            unique_viewers: stats.unique_viewers || q.unique_viewers || 0,
                            total_views: stats.total_views || stats.view_count || q.total_views || 0,
                            stats: {
                                total_attempts: stats.total_attempts || 0,
                                correct_attempts: stats.correct_attempts || 0,
                                wrong_attempts: stats.wrong_attempts || 0,
                                accuracy: stats.accuracy || 0,
                                average_time: stats.average_time || 0,
                            }
                        };
                    }
                    return q;
                }));
            }
        } catch (err) {
            console.error(`❌ Error fetching stats for quiz ${quizId}:`, err);
        }
    }, []);

    // Stable recordView funksiyasi
    const recordView = useCallback(async (quizId: number): Promise<void> => {
        if (viewedQuizzesRef.current.has(quizId)) return;

        console.log(`👁️ Recording view for quiz ${quizId}`);

        try {
            const result = await recordQuizView(quizId);

            if (result.success) {
                viewedQuizzesRef.current.add(quizId);
                await fetchQuizStats(quizId);
                console.log(`✅ View recorded for quiz ${quizId}`);
            }
        } catch (err) {
            console.error(`❌ Error recording view for quiz ${quizId}:`, err);
        }
    }, [recordQuizView, fetchQuizStats]);

    const loadCategories = useCallback(async () => {
        try {
            const res = await quizAPI.fetchCategories();
            if (res && res.success && res.data) {
                let data: Category[] = [];
                if (Array.isArray(res.data)) {
                    data = res.data;
                } else if (res.data.results && Array.isArray(res.data.results)) {
                    data = res.data.results;
                }
                setCategories(data);
                console.log(`🏷️ Loaded ${data.length} categories`);
            } else {
                console.warn("⚠️ No categories found");
                setCategories([]);
            }
        } catch (err) {
            console.error("❌ Load categories error:", err);
            setCategories([]);
        }
    }, []);

    // Stable loadQuizzes funksiyasi
    const loadQuizzes = useCallback(async (isInitialLoad: boolean = false, resetData: boolean = false) => {
        if (isLoadingRef.current) {
            console.log(`🚫 loadQuizzes skipped: already loading`);
            return;
        }

        // Token validatsiyasini tekshirish
        try {
            await tokenManager.validateAndRefreshToken();
        } catch (authError) {
            console.error('❌ Authentication error:', authError);
            return;
        }

        isLoadingRef.current = true;

        if (isInitialLoad) {
            setLoading(true);
            setIsInitialLoading(true);
        } else {
            setLoadingMore(true);
        }

        console.log(`🔄 loadQuizzes called: isInitialLoad=${isInitialLoad}, resetData=${resetData}`);

        try {
            let result;

            if (resetData) {
                // Ma'lumotlarni tozalash va yangidan boshlash
                infiniteScrollManager.reset();
            }

            if (isInitialLoad || resetData) {
                // Infinite scroll ni filterlar bilan initialize qilish
                const filtersForInfinite: any = { ...filterOptions };

                if (filtersForInfinite.category === "All") {
                    delete filtersForInfinite.category;
                }

                if (filtersForInfinite.search) {
                    filtersForInfinite.search = filtersForInfinite.search.trim();
                }

                // Is_random filterini infinite scroll uchun moslashtirish
                if (filtersForInfinite.is_random) {
                    filtersForInfinite.ordering = '?';
                }

                console.log("🎯 Initializing infinite scroll with filters:", filtersForInfinite);
                const initState = infiniteScrollManager.init(filtersForInfinite);
                setInfiniteScrollState(initState);

                // Dastlabki batch ni yuklash
                result = await infiniteScrollManager.loadMore();
            } else {
                // Keyingi batch ni yuklash
                result = await infiniteScrollManager.loadMore();
            }

            console.log("📥 Infinite scroll result:", {
                success: result.success,
                hasMore: result.hasMore,
                loadedItems: result.results?.length || 0
            });

            if (result.success && result.results) {
                const newQuizzes: Quiz[] = result.results.map((quiz: any) => ({
                    ...quiz,
                    id: quiz.id || Date.now() + Math.random(),
                    category: quiz.category || undefined,
                    view_count: quiz.view_count || quiz.total_views || 0,
                    unique_viewers: quiz.unique_viewers || 0,
                    total_views: quiz.total_views || quiz.view_count || 0,
                    correct_count: quiz.correct_count || quiz.correct_attempts || 0,
                    wrong_count: quiz.wrong_count || quiz.wrong_attempts || 0,
                    stats: quiz.stats || {
                        total_attempts: (quiz.correct_count || 0) + (quiz.wrong_count || 0),
                        correct_attempts: quiz.correct_count || 0,
                        wrong_attempts: quiz.wrong_count || 0,
                        accuracy: quiz.accuracy || 0,
                        average_time: quiz.average_time || 0,
                    },
                    has_worked: quiz.has_worked || false,
                    answers: quiz.answers || []
                }));

                setQuizData(prev => {
                    if (resetData || isInitialLoad) {
                        return newQuizzes;
                    }
                    // Yangi savollarni qo'shish, lekin duplicate ID larni oldini olish
                    const existingIds = new Set(prev.map(q => q.id));
                    const uniqueNewQuizzes = newQuizzes.filter(q => !existingIds.has(q.id));
                    return [...prev, ...uniqueNewQuizzes];
                });

                setHasMore(result.hasMore || false);

                // Faqat dastlabki 3 ta savol uchun view record qilish
                const initialViews = newQuizzes.slice(0, 3);
                for (const quiz of initialViews) {
                    try {
                        await recordView(quiz.id);
                    } catch (error) {
                        console.error(`❌ Error recording view for quiz ${quiz.id}:`, error);
                    }
                }

                // Qolgan savollar uchun backgroundda view record qilish
                const remainingQuizzes = newQuizzes.slice(3);
                if (remainingQuizzes.length > 0) {
                    setTimeout(() => {
                        remainingQuizzes.forEach(async (quiz) => {
                            try {
                                await recordView(quiz.id);
                            } catch (error) {
                                console.error(`❌ Error lazy recording view for quiz ${quiz.id}:`, error);
                            }
                        });
                    }, 1000);
                }

                console.log(`✅ Loaded ${newQuizzes.length} quizzes, hasMore: ${result.hasMore}`);
            } else {
                console.error("❌ Failed to load quizzes:", result.error);
                setHasMore(false);
            }

            // Infinite scroll state ni yangilash
            setInfiniteScrollState(infiniteScrollManager.getState());

        } catch (err: any) {
            console.error("❌ Load quizzes error:", err);
            setHasMore(false);
        } finally {
            isLoadingRef.current = false;
            if (isInitialLoad) {
                setLoading(false);
                setIsInitialLoading(false);
            } else {
                setLoadingMore(false);
            }
            console.log(`✅ loadQuizzes completed: isInitialLoad=${isInitialLoad}`);
        }
    }, [filterOptions, recordView]);

    // Stable applyFilter funksiyasi
    const applyFilter = useCallback(async (newFilters: Partial<FilterOptions>) => {
        console.log("🔄 applyFilter called with:", newFilters);

        const updatedFilters = {
            ...filterOptions,
            ...newFilters,
            page: 1
        };

        setFilterOptions(updatedFilters);

        // State ni tozalash
        setCurrentQuizIndex(0);
        setQuizData([]);
        setHasMore(true);
        setUserInteractions({
            selectedAnswers: new Map(),
            textAnswers: new Map(),
            answerStates: new Map(),
            reactions: new Map(),
            submittedQuizzes: new Set(),
        });
        viewedQuizzesRef.current.clear();
        setQuizStats(new Map());

        // Infinite scroll ni yangi filterlar bilan initialize qilish
        const filtersForInfinite: any = { ...updatedFilters };

        if (filtersForInfinite.category === "All") {
            delete filtersForInfinite.category;
        }

        if (filtersForInfinite.search) {
            filtersForInfinite.search = filtersForInfinite.search.trim();
        }

        if (filtersForInfinite.is_random) {
            filtersForInfinite.ordering = '?';
        }

        console.log("🔄 Updating infinite scroll filters:", filtersForInfinite);

        infiniteScrollManager.reset();
        const initState = infiniteScrollManager.init(filtersForInfinite);
        setInfiniteScrollState(initState);

        // Yangi savollarni yuklash
        await loadQuizzes(true, true);

        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [filterOptions, loadQuizzes]);

    // Stable resetFilters funksiyasi
    const resetFilters = useCallback(async () => {
        console.log("🔄 resetFilters called");

        const defaultFilters: FilterOptions = {
            category: "All",
            ordering: "-created_at",
            is_random: true
        };
        setFilterOptions(defaultFilters);
        setSearchQuery("");

        // State ni tozalash
        setCurrentQuizIndex(0);
        setQuizData([]);
        setHasMore(true);
        setUserInteractions({
            selectedAnswers: new Map(),
            textAnswers: new Map(),
            answerStates: new Map(),
            reactions: new Map(),
            submittedQuizzes: new Set(),
        });
        viewedQuizzesRef.current.clear();
        setQuizStats(new Map());

        // Infinite scroll ni reset qilish
        infiniteScrollManager.reset();
        const initState = infiniteScrollManager.init(defaultFilters);
        setInfiniteScrollState(initState);

        await loadQuizzes(true, true);

        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [loadQuizzes]);

    // Stable checkAndLoadMore funksiyasi
    const checkAndLoadMore = useCallback(() => {
        if (isLoadingRef.current || !hasMore || quizData.length === 0) {
            console.log(`🚫 checkAndLoadMore skipped: isLoading=${isLoadingRef.current}, hasMore=${hasMore}, quizCount=${quizData.length}`);
            return;
        }

        // Infinite scroll manager orqali tekshirish - FAQAT SCROLL PASTGA BORGANDA
        const shouldLoad = infiniteScrollManager.shouldLoadMore(currentQuizIndex);

        console.log(`🔍 Infinite scroll check: currentIndex=${currentQuizIndex}, totalLoaded=${quizData.length}, shouldLoad=${shouldLoad}`);

        if (shouldLoad) {
            console.log(`⏳ Loading more quizzes. Current index: ${currentQuizIndex}`);

            // Load more timeout ni tozalash
            if (loadMoreTimeoutRef.current) {
                clearTimeout(loadMoreTimeoutRef.current);
            }

            // Debounce qo'shish
            loadMoreTimeoutRef.current = setTimeout(async () => {
                try {
                    console.log(`🚀 Starting loadMore from checkAndLoadMore`);
                    await loadQuizzes(false, false);
                } catch (error) {
                    console.error("❌ Error loading more data:", error);
                    setLoadingMore(false);
                    isLoadingRef.current = false;
                }
            }, 500);
        }
    }, [currentQuizIndex, hasMore, quizData.length, loadQuizzes]);

    // Stable scroll event listener
    const setupScrollListener = useCallback(() => {
        const container = containerRef.current;
        if (!container || quizData.length === 0) return;

        const onScroll = () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            scrollTimeoutRef.current = setTimeout(() => {
                if (!containerRef.current || quizData.length === 0) return;

                const container = containerRef.current;
                const { scrollTop, clientHeight, scrollHeight } = container;

                // Scroll yo'nalishini aniqlash
                const isScrollingDown = scrollTop > lastScrollTopRef.current;
                lastScrollTopRef.current = scrollTop;

                // Hozirgi scroll pozitsiyasi bo'yicha indeksni hisoblash
                const index = Math.floor(scrollTop / clientHeight);

                if (index >= 0 && index < quizData.length && index !== currentQuizIndex) {
                    console.log(`📜 Scrolling to quiz ${index + 1}/${quizData.length}, scrolling down: ${isScrollingDown}`);

                    const newQuiz = quizData[index];
                    if (newQuiz) {
                        // Agar bu savolga view record qilinmagan bo'lsa
                        if (!viewedQuizzesRef.current.has(newQuiz.id)) {
                            recordView(newQuiz.id);
                        }
                        setCurrentQuizIndex(index);
                    }

                    // Faqat pastga scroll qilganda va oxiriga yaqinlashganda loadMore ni tekshirish
                    if (isScrollingDown) {
                        const scrollPosition = scrollTop + clientHeight;
                        const scrollThreshold = scrollHeight - 300; // 300px oldin tekshirish

                        if (scrollPosition >= scrollThreshold) {
                            console.log(`🔍 Reached scroll threshold, checking loadMore...`);
                            checkAndLoadMore();
                        }
                    }
                }

            }, SCROLL_DEBOUNCE_DELAY);
        };

        container.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            container.removeEventListener("scroll", onScroll);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [quizData.length, currentQuizIndex, checkAndLoadMore, recordView]);

    // Setup scroll listener
    useEffect(() => {
        const cleanup = setupScrollListener();
        return cleanup;
    }, [setupScrollListener]);

    // currentQuizIndex o'zgarganda faqat view record qilish
    useEffect(() => {
        console.log(`🔄 currentQuizIndex changed to ${currentQuizIndex}, total quizzes: ${quizData.length}`);

        // Faqat view record qilish
        if (quizData[currentQuizIndex]) {
            const quiz = quizData[currentQuizIndex];
            if (!viewedQuizzesRef.current.has(quiz.id)) {
                recordView(quiz.id);
            }
        }
    }, [currentQuizIndex, quizData, recordView]);

    // Dastlabki yuklash - FIXED
    useEffect(() => {
        if (initialLoadRef.current) return;
        initialLoadRef.current = true;

        let isMounted = true;

        const fetchInitialData = async () => {
            if (!isMounted) return;

            setIsInitialLoading(true);
            try {
                console.log("🚀 Starting initial data fetch...");
                await loadCategories();
                await initializeViews();

                if (questionId) {
                    const id = Number(questionId);
                    console.log(`📋 Fetching specific quiz with ID: ${id}`);
                    const quizRes = await quizAPI.fetchQuizById(id);

                    if (quizRes.success && quizRes.data) {
                        const quiz: Quiz = quizRes.data;

                        // Infinite scroll ni reset qilish va faqat bitta quiz bilan ishlash
                        infiniteScrollManager.reset();
                        infiniteScrollManager.addItem(quiz);
                        setInfiniteScrollState(infiniteScrollManager.getState());

                        setQuizData([{
                            ...quiz,
                            correct_count: quiz.correct_count || 0,
                            wrong_count: quiz.wrong_count || 0,
                            view_count: quiz.view_count || quiz.total_views || 0,
                            unique_viewers: quiz.unique_viewers || 0,
                            stats: quiz.stats || {
                                total_attempts: 0,
                                correct_attempts: 0,
                                wrong_attempts: 0,
                                accuracy: 0,
                                average_time: 0,
                            }
                        }]);

                        await recordView(id);
                        setHasMore(false);
                        console.log(`✅ Loaded specific quiz: ${quiz.question_text.substring(0, 50)}...`);
                    } else {
                        console.error(`❌ Failed to fetch quiz with ID ${id}`);
                        await loadQuizzes(true, true);
                    }
                } else {
                    console.log("🎲 Loading initial batch of quizzes with infinite scroll...");
                    await loadQuizzes(true, true);
                }
            } catch (err) {
                console.error("❌ Initial data fetch error:", err);
            } finally {
                if (isMounted) {
                    setIsInitialLoading(false);
                    console.log("✅ Initial loading complete");
                }
            }
        };

        fetchInitialData();

        return () => {
            isMounted = false;
            isLoadingRef.current = false;

            // Cleanup timeouts
            if (loadMoreTimeoutRef.current) {
                clearTimeout(loadMoreTimeoutRef.current);
            }
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [questionId]);

    const handleSearch = useCallback(async () => {
        if (searchQuery.trim() === "") {
            await resetFilters();
            return;
        }

        setIsSearching(true);
        await applyFilter({
            search: searchQuery.trim(),
            is_random: false,
            category: "All",
            ordering: "-created_at"
        });
        setIsSearching(false);
    }, [searchQuery, applyFilter, resetFilters]);

    // Search debounce - FIXED
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Faqat searchQuery bo'sh bo'lganda yoki to'liq o'zgarganida reset qilish
        if (searchQuery === "") {
            resetFilters();
        } else {
            searchTimeoutRef.current = setTimeout(() => {
                if (searchQuery.trim() !== "") {
                    handleSearch();
                }
            }, 500);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    const loadQuizReactions = useCallback(async (quizId: number) => {
        try {
            const result = await quizAPI.getQuizReactions(quizId);
            if (result.success && result.data) {
                const reactionsData = Array.isArray(result.data.results) ? result.data.results : [];
                const stats: any = {
                    coin: 0,
                    like: 0,
                    love: 0,
                    clap: 0,
                    insightful: 0,
                    total: 0
                };

                let userReaction: string | null = null;
                const currentUserId = getCurrentUserId();

                reactionsData.forEach((reaction: any) => {
                    const type = reaction.reaction_type;
                    if (type && stats.hasOwnProperty(type)) {
                        stats[type]++;
                        stats.total++;
                    }

                    if (reaction.user === currentUserId) {
                        userReaction = type;
                    }
                });

                setQuizData(prev => prev.map(q =>
                    q.id === quizId
                        ? {
                            ...q,
                            reactions_summary: stats,
                            user_reaction: userReaction
                        }
                        : q
                ));

                if (userReaction) {
                    setUserInteractions(prev => ({
                        ...prev,
                        reactions: new Map(prev.reactions).set(quizId, userReaction)
                    }));
                }
            }
        } catch (err) {
            console.error(`❌ Error loading reactions for quiz ${quizId}:`, err);
        }
    }, [getCurrentUserId]);

    const handleReaction = async (quizId: number, reactionType: string) => {
        setIsReacting(prev => new Set(prev).add(quizId));
        try {
            const previousReaction = userInteractions.reactions.get(quizId);
            const quiz = quizData.find(q => q.id === quizId);
            if (!quiz) return;

            setUserInteractions(prev => {
                const newReactions = new Map(prev.reactions);
                if (previousReaction === reactionType) {
                    newReactions.delete(quizId);
                } else {
                    newReactions.set(quizId, reactionType);
                }
                return { ...prev, reactions: newReactions };
            });

            setQuizData(prev => prev.map(q => {
                if (q.id === quizId) {
                    const currentStats = q.reactions_summary || {
                        coin: 0, like: 0, love: 0, clap: 0, insightful: 0, total: 0
                    };
                    const updatedStats = { ...currentStats };

                    if (previousReaction && previousReaction in updatedStats) {
                        updatedStats[previousReaction as keyof typeof updatedStats] =
                            Math.max(0, updatedStats[previousReaction as keyof typeof updatedStats] - 1);
                        updatedStats.total = Math.max(0, updatedStats.total - 1);
                    }

                    if (previousReaction !== reactionType) {
                        updatedStats[reactionType as keyof typeof updatedStats] =
                            (updatedStats[reactionType as keyof typeof updatedStats] || 0) + 1;
                        updatedStats.total++;
                    }

                    return {
                        ...q,
                        reactions_summary: updatedStats,
                        user_reaction: previousReaction === reactionType ? null : reactionType
                    };
                }
                return q;
            }));

            const result = await quizAPI.addOrUpdateReaction(quizId, reactionType);
            if (result.success && result.data) {
                if (result.data.removed) {
                    setQuizReactions(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(quizId);
                        return newMap;
                    });
                } else {
                    setQuizReactions(prev => {
                        const newMap = new Map(prev);
                        newMap.set(quizId, {
                            id: result.data.id || Date.now(),
                            quiz: quizId,
                            user: getCurrentUserId() || 0,
                            reaction_type: reactionType,
                            created_at: new Date().toISOString()
                        });
                        return newMap;
                    });
                }
            } else {
                await loadQuizReactions(quizId);
            }
        } catch (err) {
            console.error("❌ Reaction error:", err);
            await loadQuizReactions(quizId);
        } finally {
            setShowReactions(null);
            setIsReacting(prev => {
                const newSet = new Set(prev);
                newSet.delete(quizId);
                return newSet;
            });
        }
    };

    const getFinalViewCount = useCallback((quizId: number): number => {
        const quiz = quizData.find(q => q.id === quizId);
        if (quiz?.view_count) return quiz.view_count;

        const stats = quizStats.get(quizId);
        if (stats?.views) return stats.views;

        const viewStats = getStatistics(quizId);
        return viewStats.totalViews || 0;
    }, [quizData, quizStats, getStatistics]);

    const getQuizUniqueViews = useCallback((quizId: number): number => {
        const quiz = quizData.find(q => q.id === quizId);
        if (quiz?.unique_viewers) return quiz.unique_viewers;

        const stats = quizStats.get(quizId);
        if (stats?.unique_views) return stats.unique_views;

        const viewStats = getStatistics(quizId);
        return viewStats.uniqueViews || 0;
    }, [quizData, quizStats, getStatistics]);

    const getCorrectCount = useCallback((quizId: number): number => {
        const quiz = quizData.find(q => q.id === quizId);
        if (quiz?.correct_count) return quiz.correct_count;

        const stats = quizStats.get(quizId);
        if (stats?.correct_attempts) return stats.correct_attempts;

        return 0;
    }, [quizData, quizStats]);

    const getWrongCount = useCallback((quizId: number): number => {
        const quiz = quizData.find(q => q.id === quizId);
        if (quiz?.wrong_count) return quiz.wrong_count;

        const stats = quizStats.get(quizId);
        if (stats?.wrong_attempts) return stats.wrong_attempts;

        return 0;
    }, [quizData, quizStats]);

    const isTrueFalseQuestion = useCallback((quiz: Quiz): boolean => {
        if (quiz.question_type === "true_false") return true;
        if (quiz.answers.length === 2) {
            const answerTexts = quiz.answers.map(a => a.answer_text.toLowerCase());
            const hasTrue = answerTexts.some(text =>
                ["true", "ha", "yes", "to'g'ri", "rost"].includes(text)
            );
            const hasFalse = answerTexts.some(text =>
                ["false", "yo'q", "no", "noto'g'ri", "yolg'on"].includes(text)
            );
            return hasTrue && hasFalse;
        }
        return false;
    }, []);

    // Memoize helper funksiyalar
    const memoizedHelpers = useMemo(() => ({
        getFinalViewCount,
        getQuizUniqueViews,
        getCorrectCount,
        getWrongCount,
        isTrueFalseQuestion
    }), [getFinalViewCount, getQuizUniqueViews, getCorrectCount, getWrongCount, isTrueFalseQuestion]);

    // Skeleton loader
    if (isInitialLoading && quizData.length === 0) {
        return (
            <div className="fixed inset-0 bg-gray-900">
                {renderHeader()}
                <QuizSkeletonLoader />
            </div>
        );
    }

    // Loading state
    if (loading && quizData.length === 0) {
        return (
            <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    // No quizzes found
    if (!loading && quizData.length === 0) {
        return (
            <div className="fixed inset-0 bg-gray-900">
                {renderHeader()}
                <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4">😕</div>
                        <h2 className="text-2xl text-white mb-2">Testlar topilmadi</h2>
                        <p className="text-gray-400 mb-6">Boshqa filterlar bilan qayta urinib ko'ring</p>
                        <button
                            onClick={resetFilters}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Filterlarni tozalash
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-900">
            <style>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .animate-fade-in {
                    animation: fadeIn 0.2s ease-out forwards;
                }
                
                .glass-morphism {
                    background: rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                
                @keyframes coin-bounce {
                    0% { 
                        transform: translateY(0) scale(1); 
                        opacity: 1;
                    }
                    25% {
                        transform: translateY(-50px) scale(1.2);
                        opacity: 0.9;
                    }
                    50% {
                        transform: translateY(-100px) scale(1.3);
                        opacity: 0.8;
                    }
                    75% {
                        transform: translateY(-150px) scale(1.2);
                        opacity: 0.6;
                    }
                    100% { 
                        transform: translateY(-200px) scale(1); 
                        opacity: 0;
                    }
                }
                
                .animate-coin-bounce {
                    animation: coin-bounce 2s ease-out forwards;
                }
                
                @keyframes correct-pulse {
                    0% { 
                        transform: scale(0.5); 
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.1);
                        opacity: 1;
                    }
                    100% { 
                        transform: scale(1); 
                        opacity: 1;
                    }
                }
                
                .animate-correct-pulse {
                    animation: correct-pulse 0.6s ease-out forwards;
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>

            {/* Filter Modal */}
            {showFilterModal && renderFilterModal()}

            {/* Header */}
            {renderHeader()}

            {/* Main Container */}
            <div
                ref={containerRef}
                className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory pt-20"
            >
                {quizData.map((quiz, idx) => {
                    const userReaction = userInteractions.reactions.get(quiz.id);
                    const finalViewCount = memoizedHelpers.getFinalViewCount(quiz.id);
                    const uniqueViewCount = memoizedHelpers.getQuizUniqueViews(quiz.id);
                    const correctCount = memoizedHelpers.getCorrectCount(quiz.id);
                    const wrongCount = memoizedHelpers.getWrongCount(quiz.id);
                    const totalReactions = quiz.reactions_summary?.total || 0;
                    const hasSubmitted = userInteractions.submittedQuizzes.has(quiz.id);
                    const currentStats = quizStats.get(quiz.id);
                    const accuracy = currentStats?.accuracy || quiz.stats?.accuracy || 0;
                    const viewStats = getStatistics(quiz.id);

                    return (
                        <div
                            key={`${quiz.id}-${idx}`}
                            className="h-screen w-full snap-start flex justify-center items-center relative"
                            onClick={() => {
                                if (showReactions === quiz.id) setShowReactions(null);
                                if (showDropdown === quiz.id) setShowDropdown(null);
                                if (showReactionStats === quiz.id) setShowReactionStats(null);
                            }}
                        >
                            <div
                                className="absolute inset-0 max-w-2xl mx-auto"
                                style={{
                                    backgroundImage: `url(${quiz.round_image || "/placeholder.svg"})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
                            </div>

                            <div className="relative w-full max-w-2xl mx-auto h-full px-2 sm:px-6 flex flex-col justify-center rounded-lg">
                                <div className="absolute top-3 left-0 right-0 z-20 px-1 rounded-lg">
                                    <div className="flex items-center justify-center rounded-lg">
                                        <a
                                            href="https://t.me/testabduz"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 bg-black/40 backdrop-blur-lg border border-transparent px-3 py-2 hover:bg-black/50 transition w-full"
                                        >
                                            <img src={Logo} alt="logo" className="w-12 h-12"/>
                                            <div className="text-left">
                                                <div className="text-xs md:text-sm text-gray-300">Telegram ads</div>
                                                <div className="text-xs md:text-sm text-white">TestAbd.uz</div>
                                                <div className="text-xs md:text-sm text-blue-400">TestAbd.uz - Bilim va daromad manbai</div>
                                            </div>
                                        </a>
                                    </div>
                                </div>

                                <div className="glass-morphism rounded-xl p-4 sm:p-6 mb-6 shadow-lg">
                                    <div className="text-sm sm:text-lg leading-relaxed text-white">
                                        {quiz.question_text}
                                    </div>
                                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-300">
                                        {quiz.has_worked && (
                                            <div className="flex items-center gap-1 text-green-400">
                                                <Check size={14} />
                                                <span>Ishlangan</span>
                                            </div>
                                        )}
                                        {quiz.difficulty_percentage > 0 && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-yellow-400">⚡</span>
                                                <span>Qiyinlik: {quiz.difficulty_percentage}%</span>
                                            </div>
                                        )}
                                        {finalViewCount > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Eye size={14} />
                                                <span>Views: {finalViewCount}</span>
                                                {uniqueViewCount > 0 && (
                                                    <span className="text-blue-300">({uniqueViewCount} unique)</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    {renderQuestionContent(quiz)}
                                </div>

                                <div className="absolute bottom-[88px] left-1 right-1">
                                    <div className="glass-morphism md:rounded-xl p-4 w-full">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={quiz.user.profile_image || defaultAvatar}
                                                    alt={quiz.user.username}
                                                    className="w-10 h-10 rounded-full border-2 border-white/30 object-cover cursor-pointer"
                                                    onClick={() => navigate(`/profile/${quiz.user.username}`)}
                                                />
                                                <div>
                                                    <div className="text-white font-medium text-sm md:text-lg cursor-pointer hover:text-blue-400 transition"
                                                         onClick={() => navigate(`/profile/${quiz.user.username}`)}>
                                                        @{quiz.user.username}
                                                    </div>
                                                    <div className="text-white/60 text-xs md:text-sm">
                                                        {quiz.test_title}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        const userId = quiz.user.id;
                                                        if (userId) {
                                                            const response = await accountsAPI.toggleFollow(userId);
                                                            if (response.success && response.data) {
                                                                setQuizData(prev => prev.map(q =>
                                                                    q.id === quiz.id
                                                                        ? {
                                                                            ...q,
                                                                            user: {
                                                                                ...q.user,
                                                                                is_following: response.data.is_following
                                                                            }
                                                                        }
                                                                        : q
                                                                ));
                                                            }
                                                        }
                                                    } catch (err) {
                                                        console.error("❌ Toggle follow error:", err);
                                                    }
                                                }}
                                                className={`px-3 py-1 rounded text-sm font-medium transition ${
                                                    quiz.user.is_following
                                                        ? "bg-transparent text-white border border-white/30 hover:bg-white/10"
                                                        : "bg-green-600 text-white hover:bg-green-700"
                                                }`}
                                            >
                                                {quiz.user.is_following ? "Following" : "Follow"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute right-4 bottom-1/4 flex flex-col gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 bg-green-500/30 rounded-full flex items-center justify-center border border-green-500/50">
                                            <span className="text-green-400 font-bold text-lg">✓</span>
                                        </div>
                                        <span className="text-xs text-white mt-1 font-bold">
                                            {correctCount}
                                        </span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 bg-red-500/30 rounded-full flex items-center justify-center border border-red-500/50">
                                            <span className="text-red-400 font-bold text-lg">✗</span>
                                        </div>
                                        <span className="text-xs text-white mt-1 font-bold">
                                            {wrongCount}
                                        </span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 bg-blue-500/30 rounded-full flex items-center justify-center border border-blue-500/50">
                                            <Eye size={18} className="text-blue-400"/>
                                        </div>
                                        <span className="text-xs text-white mt-1 font-bold">
                                            {finalViewCount}
                                        </span>
                                        {uniqueViewCount > 0 && (
                                            <span className="text-xs text-blue-300">({uniqueViewCount})</span>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowReactions(showReactions === quiz.id ? null : quiz.id);
                                                setShowDropdown(null);
                                                setShowReactionStats(null);
                                            }}
                                            className={`w-10 h-10 glass-morphism rounded-full flex items-center justify-center hover:bg-black/50 transition relative ${
                                                userReaction ? 'text-yellow-400' : 'text-white'
                                            }`}
                                        >
                                            {isReacting.has(quiz.id) ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <Smile size={18}/>
                                            )}
                                            {totalReactions > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                    {totalReactions}
                                                </span>
                                            )}
                                        </button>
                                        {showReactions === quiz.id && renderReactionsMenu(quiz.id)}
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowDropdown(showDropdown === quiz.id ? null : quiz.id);
                                                setShowReactions(null);
                                                setShowReactionStats(null);
                                            }}
                                            className="w-10 h-10 glass-morphism rounded-full flex items-center justify-center hover:bg-black/50 transition text-white"
                                        >
                                            <MoreVertical size={18}/>
                                        </button>
                                        {showDropdown === quiz.id && renderDropdownMenu(quiz.id)}
                                    </div>
                                    {showReactionStats === quiz.id && totalReactions > 0 && (
                                        <div className="relative">
                                            {renderReactionStats(quiz.id)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {loadingMore && (
                    <div className="h-screen w-full flex justify-center items-center snap-start">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-white text-sm">Yangi savollar yuklanmoqda...</span>
                        </div>
                    </div>
                )}

                {!hasMore && !loading && !loadingMore && quizData.length > 0 && (
                    <div className="h-screen w-full flex justify-center items-center snap-start">
                        <div className="text-center">
                            <div className="text-4xl mb-4">🎉</div>
                            <h2 className="text-xl text-white mb-2">Barcha savollarni ko'rib chiqdingiz!</h2>
                            <p className="text-gray-400 mb-6">Yangi savollar tez orada qo'shiladi</p>
                            <button
                                onClick={() => {
                                    if (containerRef.current) {
                                        containerRef.current.scrollTo({
                                            top: 0,
                                            behavior: "smooth"
                                        });
                                    }
                                }}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Boshiga qaytish
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizPage;