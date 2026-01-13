"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Share, Bookmark, X, Send, Check, ThumbsUp, ThumbsDown, Loader2, Filter, Eye, MoreVertical, Smile, BarChart3, RefreshCw, ChevronUp, Sparkles, Heart, Zap, Target, TrendingUp, Clock, Users, Award, ChevronRight } from "lucide-react";
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
    { id: 'coin', emoji: '🪙', label: 'Coin', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    { id: 'like', emoji: '👍', label: 'Like', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    { id: 'love', emoji: '❤️', label: 'Love', color: 'text-red-400', bgColor: 'bg-red-500/20' },
    { id: 'clap', emoji: '👏', label: 'Clap', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    { id: 'insightful', emoji: '💡', label: 'Insightful', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
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
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
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

    // Header collapse state
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
    const [headerVisible, setHeaderVisible] = useState(true);

    // Filter state tracking
    const [activeCategory, setActiveCategory] = useState<number | "All">("All");
    const [applyingFilter, setApplyingFilter] = useState(false);

    // Bookmark state
    const [bookmarking, setBookmarking] = useState<Set<number>>(new Set());

    const containerRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const headerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isLoadingRef = useRef(false);
    const lastScrollTopRef = useRef<number>(0);
    const viewedQuizzesRef = useRef<Set<number>>(new Set());
    const initialLoadRef = useRef(false);

    // Infinite scroll state
    const [infiniteScrollState, setInfiniteScrollState] = useState(() => infiniteScrollManager.getState());

    // ==================== HEADER COLLAPSE LOGIC ====================
    useEffect(() => {
        collapseTimeoutRef.current = setTimeout(() => {
            setIsHeaderCollapsed(true);
        }, 5000);

        return () => {
            if (collapseTimeoutRef.current) {
                clearTimeout(collapseTimeoutRef.current);
            }
        };
    }, []);

    const handleHeaderMouseEnter = () => {
        if (headerTimeoutRef.current) {
            clearTimeout(headerTimeoutRef.current);
        }
        setHeaderVisible(true);
        setIsHeaderCollapsed(false);
    };

    const handleHeaderMouseLeave = () => {
        if (headerTimeoutRef.current) {
            clearTimeout(headerTimeoutRef.current);
        }

        headerTimeoutRef.current = setTimeout(() => {
            setHeaderVisible(false);
            setIsHeaderCollapsed(true);
        }, 1000);
    };

    useEffect(() => {
        const handleScroll = () => {
            if (!isHeaderCollapsed) return;

            setHeaderVisible(true);
            setIsHeaderCollapsed(false);

            if (headerTimeoutRef.current) {
                clearTimeout(headerTimeoutRef.current);
            }

            headerTimeoutRef.current = setTimeout(() => {
                setHeaderVisible(false);
                setIsHeaderCollapsed(true);
            }, 2000);
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
            if (headerTimeoutRef.current) {
                clearTimeout(headerTimeoutRef.current);
            }
        };
    }, [isHeaderCollapsed]);

    // ==================== STATISTICS FUNCTIONS ====================
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

    // ==================== LOAD QUIZZES FUNCTION ====================
    const loadQuizzes = useCallback(async (isInitialLoad: boolean = false, resetData: boolean = false, customFilters?: Partial<FilterOptions>) => {
        if (isLoadingRef.current) {
            console.log(`🚫 loadQuizzes skipped: already loading`);
            return;
        }

        try {
            await tokenManager.validateAndRefreshToken();
        } catch (authError) {
            console.error('❌ Authentication error:', authError);
            navigate('/login');
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
                infiniteScrollManager.reset();
            }

            const filtersToUse = customFilters || filterOptions;

            if (isInitialLoad || resetData) {
                const filtersForInfinite: any = { ...filtersToUse };

                if (filtersForInfinite.category === "All") {
                    delete filtersForInfinite.category;
                }

                if (filtersForInfinite.search) {
                    filtersForInfinite.search = filtersForInfinite.search.trim();
                }

                if (filtersForInfinite.is_random) {
                    filtersForInfinite.ordering = '?';
                }

                console.log("🎯 Initializing infinite scroll with filters:", filtersForInfinite);
                const initState = infiniteScrollManager.init(filtersForInfinite);
                setInfiniteScrollState(initState);

                result = await infiniteScrollManager.loadMore();
            } else {
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
                    const existingIds = new Set(prev.map(q => q.id));
                    const uniqueNewQuizzes = newQuizzes.filter(q => !existingIds.has(q.id));
                    return [...prev, ...uniqueNewQuizzes];
                });

                setHasMore(result.hasMore || false);

                const initialViews = newQuizzes.slice(0, 3);
                for (const quiz of initialViews) {
                    try {
                        await recordView(quiz.id);
                    } catch (error) {
                        console.error(`❌ Error recording view for quiz ${quiz.id}:`, error);
                    }
                }

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
    }, [filterOptions, recordView, navigate]);

    // ==================== FILTER FUNCTIONS ====================
    const applyFilter = useCallback(async (newFilters: Partial<FilterOptions>, immediate: boolean = true) => {
        if (filterTimeoutRef.current) {
            clearTimeout(filterTimeoutRef.current);
        }

        if (!immediate) {
            filterTimeoutRef.current = setTimeout(async () => {
                await applyFilterInternal(newFilters);
            }, 300);
            return;
        }

        await applyFilterInternal(newFilters);
    }, []);

    const applyFilterInternal = async (newFilters: Partial<FilterOptions>) => {
        console.log("🔄 Applying filter:", newFilters);

        const updatedFilters = {
            ...filterOptions,
            ...newFilters,
            page: 1
        };

        setFilterOptions(updatedFilters);
        setApplyingFilter(true);

        if (newFilters.category !== undefined) {
            setActiveCategory(newFilters.category);
        }

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

        try {
            await loadQuizzes(true, true, updatedFilters);
        } catch (error) {
            console.error("❌ Error applying filter:", error);
        } finally {
            setApplyingFilter(false);
        }

        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleCategorySelect = useCallback((categoryId: number | "All") => {
        console.log("🎯 Category selected:", categoryId);

        if (activeCategory === categoryId) {
            console.log("Same category selected, skipping...");
            return;
        }

        setShowFilterDropdown(false);
        setActiveCategory(categoryId);

        applyFilter({
            category: categoryId,
            is_random: false
        }, true);
    }, [activeCategory, applyFilter]);

    // ==================== ANSWER SELECTION FUNCTIONS ====================
    const selectAnswer = async (quizId: number, answerId: number) => {
        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz) return;

        if (userInteractions.submittedQuizzes.has(quizId)) return;

        if (quiz.question_type === 'multiple') {
            handleMultipleChoice(quizId, answerId);
            return;
        }

        if (submittingQuestions.has(quizId) || userInteractions.submittedQuizzes.has(quizId)) return;

        setUserInteractions(prev => {
            const newSelectedAnswers = new Map(prev.selectedAnswers);
            newSelectedAnswers.set(quizId, [answerId]);
            return {
                ...prev,
                selectedAnswers: newSelectedAnswers
            };
        });

        setSubmittingQuestions(prev => new Set(prev).add(quizId));
        try {
            const res = await quizAPI.submitAnswers({
                question: quizId,
                selected_answer_ids: [answerId]
            });

            const isCorrect = res.data?.is_correct;
            console.log(`✅ Answer submitted for quiz ${quizId}: correct=${isCorrect}`);

            // Update quiz stats immediately
            setQuizData(prev => prev.map(q => {
                if (q.id === quizId) {
                    const newCorrectCount = isCorrect ? q.correct_count + 1 : q.correct_count;
                    const newWrongCount = isCorrect ? q.wrong_count : q.wrong_count + 1;
                    const newTotal = newCorrectCount + newWrongCount;

                    return {
                        ...q,
                        correct_count: newCorrectCount,
                        wrong_count: newWrongCount,
                        stats: {
                            ...q.stats,
                            correct_attempts: newCorrectCount,
                            wrong_attempts: newWrongCount,
                            total_attempts: newTotal,
                            accuracy: newTotal > 0 ? (newCorrectCount / newTotal) * 100 : 0
                        }
                    };
                }
                return q;
            }));

            setUserInteractions(prev => ({
                ...prev,
                answerStates: new Map(prev.answerStates).set(quizId, isCorrect ? "correct" : "incorrect"),
                submittedQuizzes: new Set(prev.submittedQuizzes).add(quizId),
            }));

            if (isCorrect) {
                setCorrectAnimation(quizId);
                setTimeout(() => setCorrectAnimation(null), 2000);

                setCoinAnimation({ quizId, answerId, show: true });
                setTimeout(() => setCoinAnimation(null), 2000);
            } else {
                setShakingAnswerId(answerId);
                setTimeout(() => setShakingAnswerId(null), 1000);
            }

            // Fetch updated stats from server
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

    const handleMultipleChoice = (quizId: number, answerId: number) => {
        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz || userInteractions.submittedQuizzes.has(quizId)) return;

        setUserInteractions(prev => {
            const current = prev.selectedAnswers.get(quizId) || [];
            let newAnswers;

            if (current.includes(answerId)) {
                newAnswers = current.filter(id => id !== answerId);
            } else {
                newAnswers = [...current, answerId];
            }

            return {
                ...prev,
                selectedAnswers: new Map(prev.selectedAnswers).set(quizId, newAnswers)
            };
        });
    };

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

            // Update quiz stats immediately
            setQuizData(prev => prev.map(q => {
                if (q.id === quizId) {
                    const newCorrectCount = isCorrect ? q.correct_count + 1 : q.correct_count;
                    const newWrongCount = isCorrect ? q.wrong_count : q.wrong_count + 1;
                    const newTotal = newCorrectCount + newWrongCount;

                    return {
                        ...q,
                        correct_count: newCorrectCount,
                        wrong_count: newWrongCount,
                        stats: {
                            ...q.stats,
                            correct_attempts: newCorrectCount,
                            wrong_attempts: newWrongCount,
                            total_attempts: newTotal,
                            accuracy: newTotal > 0 ? (newCorrectCount / newTotal) * 100 : 0
                        }
                    };
                }
                return q;
            }));

            setUserInteractions(prev => ({
                ...prev,
                answerStates: new Map(prev.answerStates).set(quizId, isCorrect ? "correct" : "incorrect"),
                submittedQuizzes: new Set(prev.submittedQuizzes).add(quizId),
            }));

            if (isCorrect) {
                setCorrectAnimation(quizId);
                setTimeout(() => setCorrectAnimation(null), 2000);

                const quiz = quizData.find(q => q.id === quizId);
                if (quiz) {
                    const correctAnswer = quiz.answers.find(a => a.is_correct);
                    if (correctAnswer) {
                        setCoinAnimation({ quizId, answerId: correctAnswer.id, show: true });
                        setTimeout(() => setCoinAnimation(null), 2000);
                    }
                }
            } else {
                selected.forEach((answerId) => {
                    const answer = quizData.find(q => q.id === quizId)?.answers.find(a => a.id === answerId);
                    if (answer && !answer.is_correct) {
                        setShakingAnswerId(answerId);
                    }
                });
                setTimeout(() => setShakingAnswerId(null), 1000);
            }

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

    // ==================== REACTION FUNCTIONS ====================
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

    // ==================== FOLLOW FUNCTION ====================
    const handleFollowToggle = async (quizId: number) => {
        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz) return;

        const userId = quiz.user.id;
        if (!userId) return;

        try {
            const response = await accountsAPI.toggleFollow(userId);
            if (response.success && response.data) {
                setQuizData(prev => prev.map(q =>
                    q.id === quizId
                        ? {
                            ...q,
                            user: {
                                ...q.user,
                                is_following: response.data?.is_following ?? !q.user.is_following
                            }
                        }
                        : q
                ));

                console.log(`✅ Follow toggled: ${response.data.is_following ? 'Following' : 'Unfollowed'}`);
            }
        } catch (err) {
            console.error("❌ Toggle follow error:", err);
        }
    };

    // ==================== BOOKMARK FUNCTION ====================
    const handleBookmarkToggle = async (quizId: number) => {
        if (bookmarking.has(quizId)) return;

        setBookmarking(prev => new Set(prev).add(quizId));
        try {
            const response = await quizAPI.bookmarkQuestion(quizId);
            console.log("📌 Bookmark response:", response);

            if (response.success) {
                setQuizData(prev => prev.map(q =>
                    q.id === quizId
                        ? { ...q, is_bookmarked: response.data?.is_bookmarked ?? !q.is_bookmarked }
                        : q
                ));

                setShowDropdown(null);
            }
        } catch (err) {
            console.error("❌ Bookmark error:", err);
        } finally {
            setBookmarking(prev => {
                const newSet = new Set(prev);
                newSet.delete(quizId);
                return newSet;
            });
        }
    };

    // ==================== HELPER FUNCTIONS ====================
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

    // ==================== SCROLL AND LOAD MORE FUNCTIONS ====================
    const checkAndLoadMore = useCallback(() => {
        if (isLoadingRef.current || !hasMore || quizData.length === 0) {
            return;
        }

        const shouldLoad = infiniteScrollManager.shouldLoadMore(currentQuizIndex);

        if (shouldLoad) {
            if (loadMoreTimeoutRef.current) {
                clearTimeout(loadMoreTimeoutRef.current);
            }

            loadMoreTimeoutRef.current = setTimeout(async () => {
                try {
                    await loadQuizzes(false, false);
                } catch (error) {
                    console.error("❌ Error loading more data:", error);
                    setLoadingMore(false);
                    isLoadingRef.current = false;
                }
            }, 500);
        }
    }, [currentQuizIndex, hasMore, quizData.length, loadQuizzes]);

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
                const { scrollTop, clientHeight } = container;

                const isScrollingDown = scrollTop > lastScrollTopRef.current;
                lastScrollTopRef.current = scrollTop;

                const index = Math.floor(scrollTop / clientHeight);

                if (index >= 0 && index < quizData.length && index !== currentQuizIndex) {
                    console.log(`📜 Scrolling to quiz ${index + 1}/${quizData.length}, scrolling down: ${isScrollingDown}`);

                    const newQuiz = quizData[index];
                    if (newQuiz) {
                        if (!viewedQuizzesRef.current.has(newQuiz.id)) {
                            recordView(newQuiz.id);
                        }
                        setCurrentQuizIndex(index);
                    }

                    if (isScrollingDown) {
                        const scrollPosition = scrollTop + clientHeight;
                        const scrollHeight = container.scrollHeight;
                        const scrollThreshold = scrollHeight - 300;

                        if (scrollPosition >= scrollThreshold) {
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

    // ==================== INITIAL LOAD AND SETUP ====================
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
            } else {
                setCategories([]);
            }
        } catch (err) {
            console.error("❌ Load categories error:", err);
            setCategories([]);
        }
    }, []);

    useEffect(() => {
        if (initialLoadRef.current) return;
        initialLoadRef.current = true;

        let isMounted = true;

        const fetchInitialData = async () => {
            if (!isMounted) return;

            setIsInitialLoading(true);
            try {
                await loadCategories();
                await initializeViews();

                if (questionId) {
                    const id = Number(questionId);
                    const quizRes = await quizAPI.fetchQuizById(id);

                    if (quizRes.success && quizRes.data) {
                        const quiz: Quiz = quizRes.data;

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
                    } else {
                        await loadQuizzes(true, true);
                    }
                } else {
                    await loadQuizzes(true, true);
                }
            } catch (err) {
                console.error("❌ Initial data fetch error:", err);
            } finally {
                if (isMounted) {
                    setIsInitialLoading(false);
                }
            }
        };

        fetchInitialData();

        return () => {
            isMounted = false;
            isLoadingRef.current = false;

            if (loadMoreTimeoutRef.current) clearTimeout(loadMoreTimeoutRef.current);
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            if (headerTimeoutRef.current) clearTimeout(headerTimeoutRef.current);
            if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
            if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
        };
    }, [questionId, loadCategories, initializeViews, recordView, loadQuizzes]);

    useEffect(() => {
        const cleanup = setupScrollListener();
        return cleanup;
    }, [setupScrollListener]);

    useEffect(() => {
        if (quizData[currentQuizIndex]) {
            const quiz = quizData[currentQuizIndex];
            if (!viewedQuizzesRef.current.has(quiz.id)) {
                recordView(quiz.id);
            }
        }
    }, [currentQuizIndex, quizData, recordView]);

    // ==================== RENDER FUNCTIONS ====================
    const renderFilterDropdown = () => {
        if (!showFilterDropdown) return null;

        return (
            <div
                className="fixed inset-0 z-50 flex items-start justify-end pt-16 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={() => setShowFilterDropdown(false)}
            >
                <div
                    className="bg-gradient-to-b from-gray-900 to-black/95 backdrop-blur-xl rounded-3xl m-4 p-6 border border-white/10 shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-xl">
                                <Filter size={20} className="text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Filterlar</h3>
                        </div>
                        <button
                            onClick={() => setShowFilterDropdown(false)}
                            className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 active:scale-95"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Search Section */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            <span className="flex items-center gap-2">
                                <Sparkles size={14} />
                                Qidirish
                            </span>
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (searchTimeoutRef.current) {
                                        clearTimeout(searchTimeoutRef.current);
                                    }
                                    searchTimeoutRef.current = setTimeout(() => {
                                        applyFilter({ search: e.target.value }, false);
                                    }, 500);
                                }}
                                placeholder="Savol yoki test nomini qidiring..."
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Category Section */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-300 mb-4">
                            <span className="flex items-center gap-2">
                                <Bookmark size={14} />
                                Kategoriyalar
                            </span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleCategorySelect("All")}
                                className={`p-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 ${activeCategory === "All"
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                                }`}
                            >
                                <span className="font-medium">Barchasi</span>
                                {activeCategory === "All" && (
                                    <Check size={16} />
                                )}
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategorySelect(category.id)}
                                    className={`p-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 ${activeCategory === category.id
                                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                                    }`}
                                >
                                    <span className="mr-1">{category.emoji}</span>
                                    <span className="font-medium truncate">{category.title}</span>
                                    {activeCategory === category.id && (
                                        <Check size={16} className="ml-auto" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sorting Section */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-300 mb-4">
                            <span className="flex items-center gap-2">
                                <TrendingUp size={14} />
                                Tartiblash
                            </span>
                        </label>
                        <div className="space-y-3">
                            <button
                                onClick={() => applyFilter({ ordering: "-created_at" })}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${filterOptions.ordering === "-created_at"
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                                }`}
                            >
                                <Clock size={16} />
                                <span>Yangi → Eski</span>
                                {filterOptions.ordering === "-created_at" && (
                                    <Check size={16} className="ml-auto" />
                                )}
                            </button>
                            <button
                                onClick={() => applyFilter({ ordering: "created_at" })}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${filterOptions.ordering === "created_at"
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                                }`}
                            >
                                <Clock size={16} />
                                <span>Eski → Yangi</span>
                                {filterOptions.ordering === "created_at" && (
                                    <Check size={16} className="ml-auto" />
                                )}
                            </button>
                            <button
                                onClick={() => applyFilter({ ordering: "-difficulty_percentage" })}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${filterOptions.ordering === "-difficulty_percentage"
                                    ? "bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg shadow-red-500/25"
                                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                                }`}
                            >
                                <Zap size={16} />
                                <span>Qiyin → Oson</span>
                                {filterOptions.ordering === "-difficulty_percentage" && (
                                    <Check size={16} className="ml-auto" />
                                )}
                            </button>
                            <button
                                onClick={() => applyFilter({ ordering: "difficulty_percentage" })}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${filterOptions.ordering === "difficulty_percentage"
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25"
                                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                                }`}
                            >
                                <Zap size={16} />
                                <span>Oson → Qiyin</span>
                                {filterOptions.ordering === "difficulty_percentage" && (
                                    <Check size={16} className="ml-auto" />
                                )}
                            </button>
                            <button
                                onClick={() => applyFilter({ is_random: true, ordering: '?' })}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${filterOptions.is_random
                                    ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                                }`}
                            >
                                <Sparkles size={16} />
                                <span>Tasodifiy</span>
                                {filterOptions.is_random && (
                                    <Check size={16} className="ml-auto" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Worked Status */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-300 mb-4">
                            <span className="flex items-center gap-2">
                                <Target size={14} />
                                Holati
                            </span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => applyFilter({ worked: true })}
                                className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${filterOptions.worked
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25"
                                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                                }`}
                            >
                                <Check size={16} />
                                <span>Ishlanganlar</span>
                            </button>
                            <button
                                onClick={() => applyFilter({ unworked: true })}
                                className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${filterOptions.unworked
                                    ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25"
                                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                                }`}
                            >
                                <X size={16} />
                                <span>Ishlamaganlar</span>
                            </button>
                        </div>
                    </div>

                    {/* Difficulty Filter */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-300 mb-4">
                            <span className="flex items-center gap-2">
                                <Zap size={14} />
                                Qiyinlik darajasi
                            </span>
                        </label>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-gray-400">Minimal</span>
                                    <span className="text-blue-400 font-semibold">{filterOptions.difficulty_min || 0}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={filterOptions.difficulty_min || 0}
                                    onChange={(e) => applyFilter({ difficulty_min: parseInt(e.target.value) }, false)}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-gray-400">Maksimal</span>
                                    <span className="text-blue-400 font-semibold">{filterOptions.difficulty_max || 100}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={filterOptions.difficulty_max || 100}
                                    onChange={(e) => applyFilter({ difficulty_max: parseInt(e.target.value) }, false)}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-6 border-t border-white/10">
                        <button
                            onClick={() => {
                                const defaultFilters: FilterOptions = {
                                    category: "All",
                                    ordering: "-created_at",
                                    is_random: true
                                };
                                setFilterOptions(defaultFilters);
                                setActiveCategory("All");
                                setSearchQuery("");
                                setShowFilterDropdown(false);
                                loadQuizzes(true, true, defaultFilters);
                            }}
                            className="flex-1 px-4 py-3 bg-white/5 text-gray-300 rounded-xl font-medium hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={16} />
                            Tozalash
                        </button>
                        <button
                            onClick={() => setShowFilterDropdown(false)}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/25"
                        >
                            Qo'llash
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderCollapsedHeader = () => {
        return (
            <div
                className={`fixed top-4 right-4 z-30 transition-all duration-300 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
                onMouseEnter={handleHeaderMouseEnter}
                onMouseLeave={handleHeaderMouseLeave}
            >
                <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                        {isHeaderCollapsed ? (
                            <>
                                <button
                                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                    className={`p-3 rounded-xl transition-all duration-200 relative ${showFilterDropdown
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                                        : 'bg-white/10 text-white hover:bg-white/20 active:scale-95'
                                    }`}
                                >
                                    <Filter size={20} />
                                    {activeCategory !== "All" && (
                                        <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                                            1
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => loadQuizzes(true, true)}
                                    className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200 active:scale-95"
                                    title="Yangilash"
                                >
                                    <RefreshCw size={20} />
                                </button>
                                <button
                                    onClick={() => navigate(-1)}
                                    className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200 active:scale-95"
                                    title="Orqaga"
                                >
                                    ←
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-3 animate-fade-in">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200 active:scale-95"
                                >
                                    ←
                                </button>
                                <div className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl border border-blue-500/30">
                                    <h1 className="text-white font-semibold text-sm">Testlar</h1>
                                </div>
                                <button
                                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                    className={`p-3 rounded-xl transition-all duration-200 relative ${showFilterDropdown
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                                        : 'bg-white/10 text-white hover:bg-white/20 active:scale-95'
                                    }`}
                                >
                                    <Filter size={20} />
                                    {activeCategory !== "All" && (
                                        <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                                            1
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => loadQuizzes(true, true)}
                                    className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200 active:scale-95"
                                >
                                    <RefreshCw size={20} />
                                </button>
                                <button
                                    onClick={() => setIsHeaderCollapsed(true)}
                                    className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200 active:scale-95"
                                >
                                    <ChevronUp size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {renderFilterDropdown()}
            </div>
        );
    };

    const renderQuestionContent = (quiz: Quiz) => {
        const selectedAnswers = userInteractions.selectedAnswers.get(quiz.id) || [];
        const answerState = userInteractions.answerStates.get(quiz.id);
        const hasSubmitted = userInteractions.submittedQuizzes.has(quiz.id);
        const isMultipleChoice = quiz.question_type === 'multiple';
        const isSubmitting = submittingQuestions.has(quiz.id);

        const renderAnswers = () => {
            if (!quiz.answers || quiz.answers.length === 0) {
                return <div className="text-gray-400 text-center py-4">Javob variantlari mavjud emas</div>;
            }

            return quiz.answers.map((answer, idx) => {
                const isSelected = selectedAnswers.includes(answer.id);
                const isCorrect = answer.is_correct;
                const isShaking = shakingAnswerId === answer.id;
                const letter = answer.letter || String.fromCharCode(65 + idx);

                let bgColor = 'bg-gradient-to-r from-white/5 to-white/3';
                let borderColor = 'border-white/10';
                let textColor = 'text-gray-100';
                let shadowClass = 'shadow-lg';

                if (hasSubmitted) {
                    if (isCorrect) {
                        bgColor = 'bg-gradient-to-r from-green-500/20 to-emerald-500/15';
                        borderColor = 'border-green-500/50';
                        textColor = 'text-green-100';
                        shadowClass = 'shadow-lg shadow-green-500/25';
                    } else if (isSelected && !isCorrect) {
                        bgColor = 'bg-gradient-to-r from-red-500/20 to-rose-500/15';
                        borderColor = 'border-red-500/50';
                        textColor = 'text-red-100';
                        shadowClass = 'shadow-lg shadow-red-500/25';
                    }
                } else if (isSelected) {
                    bgColor = 'bg-gradient-to-r from-blue-500/20 to-indigo-500/15';
                    borderColor = 'border-blue-500/50';
                    textColor = 'text-white';
                    shadowClass = 'shadow-lg shadow-blue-500/25';
                }

                return (
                    <div
                        key={answer.id}
                        className={`relative mb-3 p-4 rounded-2xl border transition-all duration-300 cursor-pointer group
                            ${bgColor} ${borderColor} ${shadowClass} ${isShaking ? 'animate-shake' : ''}
                            ${!hasSubmitted ? 'hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl' : ''}
                        `}
                        onClick={() => {
                            if (!hasSubmitted && !isSubmitting) {
                                selectAnswer(quiz.id, answer.id);
                            }
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md
                                ${isSelected ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/50' : 'bg-gradient-to-br from-white/10 to-white/5'}
                                ${hasSubmitted && isCorrect ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/50' : ''}
                                ${hasSubmitted && isSelected && !isCorrect ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/50' : ''}
                            `}>
                                <span className={`font-bold text-lg ${isSelected || (hasSubmitted && isCorrect) ? 'text-white' : 'text-gray-300'}`}>
                                    {letter}
                                </span>
                            </div>
                            <div className="flex-1">
                                <div className={`text-base leading-relaxed ${textColor}`}>
                                    {answer.answer_text}
                                </div>
                            </div>

                            {hasSubmitted && isCorrect && (
                                <div className="text-green-400 animate-bounce">
                                    <Check size={24} />
                                </div>
                            )}
                            {hasSubmitted && isSelected && !isCorrect && (
                                <div className="text-red-400 animate-pulse">
                                    <X size={24} />
                                </div>
                            )}
                        </div>

                        {isMultipleChoice && !hasSubmitted && (
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-300
                                    ${isSelected ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-500' : 'bg-transparent border-gray-500'}
                                `}>
                                    {isSelected && <div className="w-3 h-3 bg-white rounded-sm"></div>}
                                </div>
                            </div>
                        )}

                        {!isMultipleChoice && !hasSubmitted && (
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300
                                    ${isSelected ? 'border-blue-500 bg-blue-500/20' : 'border-gray-500'}
                                `}>
                                    {isSelected && <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-300 rounded-full shadow-inner"></div>}
                                </div>
                            </div>
                        )}
                    </div>
                );
            });
        };

        const renderSubmitButton = () => {
            if (hasSubmitted) {
                return (
                    <div className="mt-6 space-y-4">
                        <div className={`text-center py-5 rounded-2xl font-medium backdrop-blur-sm border transition-all duration-500 animate-slide-up ${answerState === 'correct'
                            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30 shadow-2xl shadow-green-500/25'
                            : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border-red-500/30 shadow-2xl shadow-red-500/25'
                        }`}>
                            <div className="flex items-center justify-center gap-3">
                                <div className={`p-2 rounded-full ${answerState === 'correct' ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                                    {answerState === 'correct' ? '✅' : '❌'}
                                </div>
                                <span className="text-xl font-semibold">
                                    {answerState === 'correct' ? 'To\'g\'ri javob!' : 'Noto\'g\'ri javob!'}
                                </span>
                            </div>
                            <div className="mt-2 text-sm text-gray-300">
                                {answerState === 'correct' ? 'Davom eting!' : 'Yana urinib ko\'ring!'}
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const nextIndex = currentQuizIndex + 1;
                                if (nextIndex < quizData.length && containerRef.current) {
                                    containerRef.current.scrollTo({
                                        top: nextIndex * window.innerHeight,
                                        behavior: 'smooth'
                                    });
                                }
                            }}
                            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-semibold transition-all duration-300 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/35 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            Keyingi savol
                            <ChevronRight size={20} />
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
                            className={`w-full py-4 rounded-2xl font-semibold transition-all duration-300 shadow-xl ${hasSelectedAnswers && !isSubmitting
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/35 active:scale-[0.98]'
                                : 'bg-white/5 text-gray-400 cursor-not-allowed border border-white/10'
                            }`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-3">
                                    <Loader2 size={20} className="animate-spin" />
                                    <span>Tekshirilmoqda...</span>
                                </div>
                            ) : 'Javobni tekshirish'}
                        </button>
                    </div>
                );
            }

            const hasSelectedAnswer = selectedAnswers.length > 0;
            if (!hasSelectedAnswer) {
                return (
                    <div className="mt-6">
                        <div className="w-full py-4 bg-gradient-to-r from-white/5 to-white/3 backdrop-blur-sm text-gray-400 rounded-2xl font-medium text-center border border-white/10 shadow-lg">
                            Javob tanlang
                        </div>
                    </div>
                );
            }

            return null;
        };

        return (
            <div className="space-y-6">
                {quiz.media && (
                    <div className="relative rounded-3xl overflow-hidden mb-6 shadow-2xl group">
                        {quiz.media.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                                src={quiz.media}
                                alt="Question media"
                                className="w-full h-auto max-h-80 object-cover rounded-3xl transition-transform duration-700 group-hover:scale-105"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : quiz.media.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video
                                src={quiz.media}
                                className="w-full h-auto max-h-80 rounded-3xl"
                                controls
                            />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-3xl"></div>
                    </div>
                )}

                <div className="space-y-4">
                    {renderAnswers()}
                </div>

                {renderSubmitButton()}

                {coinAnimation?.show && coinAnimation.quizId === quiz.id && (
                    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                        <div className="text-6xl animate-coin-bounce">
                            🪙
                            <div className="absolute inset-0 animate-ping text-yellow-400 opacity-30">🪙</div>
                        </div>
                    </div>
                )}

                {correctAnimation === quiz.id && (
                    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                        <div className="text-8xl animate-correct-pulse">
                            <div className="relative">
                                <div className="absolute inset-0 animate-ping text-green-400 opacity-30">✅</div>
                                ✅
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderReactionsMenu = (quizId: number) => {
        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz) return null;

        const currentReaction = userInteractions.reactions.get(quizId);

        return (
            <div
                className="absolute bottom-full right-0 mb-3 p-4 bg-gradient-to-b from-gray-900 to-black/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-50"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex gap-3">
                    {REACTION_CHOICES.map((reaction) => {
                        const isActive = currentReaction === reaction.id;
                        const reactionCount = quiz.reactions_summary?.[reaction.id as keyof typeof quiz.reactions_summary] || 0;

                        return (
                            <button
                                key={reaction.id}
                                onClick={() => handleReaction(quizId, reaction.id)}
                                disabled={isReacting.has(quizId)}
                                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative group
                                    ${isActive ? 'scale-110 ring-2 ring-white/30' : 'hover:scale-105'}
                                    ${isReacting.has(quizId) ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                                    ${reaction.bgColor}
                                `}
                            >
                                <span className="text-2xl">{reaction.emoji}</span>
                                {reactionCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                                        {reactionCount}
                                    </span>
                                )}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                    {reaction.label}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderDropdownMenu = (quizId: number) => {
        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz) return null;

        return (
            <div
                className="absolute bottom-full right-0 mb-3 p-4 bg-gradient-to-b from-gray-900 to-black/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-50 min-w-[240px]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="space-y-2">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert("Link nusxalandi!");
                            setShowDropdown(null);
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 group active:scale-95"
                    >
                        <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-200">
                            <Share size={18} className="text-blue-400" />
                        </div>
                        <span>Ulashish</span>
                    </button>

                    <button
                        onClick={() => handleBookmarkToggle(quizId)}
                        disabled={bookmarking.has(quizId)}
                        className={`w-full px-4 py-3 text-left text-white hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 group active:scale-95 ${bookmarking.has(quizId) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        <div className={`p-2 rounded-lg transition-all duration-200 ${quiz.is_bookmarked
                            ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 group-hover:from-yellow-500/30 group-hover:to-yellow-600/30'
                            : 'bg-gradient-to-br from-gray-500/20 to-gray-600/20 group-hover:from-gray-500/30 group-hover:to-gray-600/20'
                        }`}>
                            {bookmarking.has(quizId) ? (
                                <Loader2 size={18} className="animate-spin text-gray-400" />
                            ) : (
                                <Bookmark size={18} className={quiz.is_bookmarked ? "text-yellow-400" : "text-gray-400"} />
                            )}
                        </div>
                        <span>{quiz.is_bookmarked ? "Bookmarkdan o'chirish" : "Bookmark qilish"}</span>
                    </button>

                    <button
                        onClick={() => {
                            setShowReactionStats(showReactionStats === quizId ? null : quizId);
                            setShowDropdown(null);
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 group active:scale-95"
                    >
                        <div className="p-2 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg group-hover:from-green-500/30 group-hover:to-green-600/30 transition-all duration-200">
                            <BarChart3 size={18} className="text-green-400" />
                        </div>
                        <span>Statistikalar</span>
                    </button>

                    <button
                        onClick={() => {
                            alert("Shikoyat yuborildi!");
                            setShowDropdown(null);
                        }}
                        className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 flex items-center gap-3 group active:scale-95"
                    >
                        <div className="p-2 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-lg group-hover:from-red-500/30 group-hover:to-red-600/30 transition-all duration-200">
                            <X size={18} />
                        </div>
                        <span>Shikoyat qilish</span>
                    </button>
                </div>
            </div>
        );
    };

    const renderReactionStats = (quizId: number) => {
        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz?.reactions_summary) return null;

        const stats = quiz.reactions_summary;
        const total = stats.total;

        return (
            <div
                className="absolute bottom-full right-0 mb-3 p-5 bg-gradient-to-b from-gray-900 to-black/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-50 min-w-[320px]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl">
                        <BarChart3 size={20} className="text-blue-400" />
                    </div>
                    <h4 className="text-white font-semibold text-lg">Reaksiya statistikasi</h4>
                </div>
                <div className="space-y-4">
                    {REACTION_CHOICES.map((reaction) => {
                        const count = stats[reaction.id as keyof typeof stats] || 0;
                        const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;

                        return (
                            <div key={reaction.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${reaction.bgColor}`}>
                                        <span className="text-xl">{reaction.emoji}</span>
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">{reaction.label}</div>
                                        <div className="text-gray-400 text-sm">{percentage}%</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-28 h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-white font-semibold w-8 text-right">{count}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center">
                        <span className="text-white font-medium">Jami reaksiyalar:</span>
                        <span className="text-blue-400 font-bold text-xl">{total}</span>
                    </div>
                </div>
            </div>
        );
    };

    // ==================== MAIN RENDER ====================
    if (isInitialLoading && quizData.length === 0) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-950">
                {renderCollapsedHeader()}
                <QuizSkeletonLoader />
            </div>
        );
    }

    if (loading && quizData.length === 0) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-24 h-24 border-[4px] border-transparent border-t-blue-500 border-r-indigo-500 rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-white text-xl font-semibold">Yuklanmoqda...</p>
                    <p className="text-gray-400 mt-2">Testlar tayyorlanmoqda</p>
                </div>
            </div>
        );
    }

    if (!loading && quizData.length === 0) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-950">
                {renderCollapsedHeader()}
                <div className="h-full flex items-center justify-center px-4">
                    <div className="text-center max-w-md">
                        <div className="text-8xl mb-6 animate-pulse">🔍</div>
                        <h2 className="text-2xl text-white mb-3 font-semibold">Testlar topilmadi</h2>
                        <p className="text-gray-400 mb-8">Boshqa filterlar bilan qayta urinib ko'ring yoki filterlarni tozalang</p>
                        <button
                            onClick={async () => {
                                const defaultFilters: FilterOptions = {
                                    category: "All",
                                    ordering: "-created_at",
                                    is_random: true
                                };
                                setFilterOptions(defaultFilters);
                                setActiveCategory("All");
                                await loadQuizzes(true, true, defaultFilters);
                            }}
                            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/35 active:scale-95 flex items-center gap-2 mx-auto"
                        >
                            <RefreshCw size={20} />
                            Filterlarni tozalash
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-950">
            <style>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-fade-in {
                    animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                
                @keyframes slide-up {
                    from { 
                        opacity: 0; 
                        transform: translateY(20px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
                
                .animate-slide-up {
                    animation: slide-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                
                .slider-thumb::-webkit-slider-thumb {
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3b82f6, #6366f1);
                    cursor: pointer;
                    border: 3px solid #ffffff;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                    transition: all 0.2s ease;
                }
                
                .slider-thumb::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
                }
                
                .slider-thumb::-moz-range-thumb {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3b82f6, #6366f1);
                    cursor: pointer;
                    border: 3px solid #ffffff;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                    transition: all 0.2s ease;
                }
                
                .slider-thumb::-moz-range-thumb:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
                    20%, 40%, 60%, 80% { transform: translateX(6px); }
                }
                
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
                }
                
                @keyframes coin-bounce {
                    0% { 
                        transform: translateY(0) scale(1) rotate(0deg); 
                        opacity: 1;
                    }
                    30% {
                        transform: translateY(-100px) scale(1.4) rotate(180deg);
                        opacity: 0.9;
                    }
                    60% {
                        transform: translateY(-200px) scale(1.2) rotate(360deg);
                        opacity: 0.7;
                    }
                    90% {
                        transform: translateY(-300px) scale(0.8) rotate(540deg);
                        opacity: 0.4;
                    }
                    100% { 
                        transform: translateY(-350px) scale(0.5) rotate(720deg); 
                        opacity: 0;
                    }
                }
                
                .animate-coin-bounce {
                    animation: coin-bounce 2s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
                }
                
                @keyframes correct-pulse {
                    0% { 
                        transform: scale(0.3) rotate(-45deg); 
                        opacity: 0;
                        filter: blur(4px);
                    }
                    50% {
                        transform: scale(1.3) rotate(15deg);
                        opacity: 1;
                        filter: blur(0px);
                    }
                    70% {
                        transform: scale(1.1) rotate(-5deg);
                        opacity: 1;
                    }
                    100% { 
                        transform: scale(1) rotate(0deg); 
                        opacity: 1;
                    }
                }
                
                .animate-correct-pulse {
                    animation: correct-pulse 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
                }
            `}</style>

            {renderCollapsedHeader()}

            <div
                ref={containerRef}
                className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory pt-16 md:pt-20"
            >
                {quizData.map((quiz, idx) => {
                    const userReaction = userInteractions.reactions.get(quiz.id);
                    const finalViewCount = getFinalViewCount(quiz.id);
                    const uniqueViewCount = getQuizUniqueViews(quiz.id);
                    const correctCount = getCorrectCount(quiz.id);
                    const wrongCount = getWrongCount(quiz.id);
                    const totalReactions = quiz.reactions_summary?.total || 0;
                    const hasSubmitted = userInteractions.submittedQuizzes.has(quiz.id);
                    const currentStats = quizStats.get(quiz.id);
                    const accuracy = currentStats?.accuracy || quiz.stats?.accuracy || 0;

                    return (
                        <div
                            key={`${quiz.id}-${idx}`}
                            className="h-screen w-full snap-start flex justify-center items-center relative px-4 md:px-0"
                            onClick={() => {
                                if (showReactions === quiz.id) setShowReactions(null);
                                if (showDropdown === quiz.id) setShowDropdown(null);
                                if (showReactionStats === quiz.id) setShowReactionStats(null);
                                if (showFilterDropdown) setShowFilterDropdown(false);
                            }}
                        >
                            {/* Background Gradient */}
                            <div className="absolute inset-0 max-w-2xl mx-auto">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10"></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/90"></div>
                            </div>

                            <div className="relative w-full max-w-2xl mx-auto h-full px-4 md:px-6 flex flex-col justify-center rounded-3xl">
                                {/* Telegram Ads - Collapsible */}
                                <div className={`absolute top-4 left-0 right-0 z-20 px-4 transition-all duration-500 ${isHeaderCollapsed ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                                    <div className="flex items-center justify-center">
                                        <a
                                            href="https://t.me/testabduz"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/10 p-4 hover:from-white/20 hover:to-white/10 transition-all duration-500 w-full rounded-2xl group max-w-lg mx-auto shadow-xl"
                                        >
                                            <div className="relative">
                                                <img src={Logo} alt="logo" className="w-12 h-12 rounded-xl shadow-lg"/>
                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                                            </div>
                                            <div className="text-left flex-1 min-w-0">
                                                <div className="text-xs text-gray-300 truncate">Telegram ads</div>
                                                <div className="text-base text-white font-semibold truncate">TestAbd.uz</div>
                                                <div className="text-xs bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate">Bilim va daromad manbai</div>
                                            </div>
                                            <ChevronRight size={20} className="text-gray-400 group-hover:text-white transition-colors duration-300" />
                                        </a>
                                    </div>
                                </div>

                                {/* Question Card */}
                                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 mb-6 shadow-2xl border border-white/10 mt-24">
                                    <div className="text-lg leading-relaxed text-white font-medium">
                                        {quiz.question_text}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 mt-4">
                                        {quiz.has_worked && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/15 rounded-full border border-green-500/30 text-sm">
                                                <Check size={14} className="text-green-400" />
                                                <span className="text-green-300 font-medium">Ishlangan</span>
                                            </div>
                                        )}
                                        {quiz.difficulty_percentage > 0 && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/15 rounded-full border border-yellow-500/30 text-sm">
                                                <Zap size={14} className="text-yellow-400" />
                                                <span className="text-yellow-300 font-medium">{quiz.difficulty_percentage}% qiyin</span>
                                            </div>
                                        )}
                                        {quiz.category && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/15 rounded-full border border-purple-500/30 text-sm">
                                                <span>{quiz.category.title}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Question Content */}
                                <div className="mb-28">
                                    {renderQuestionContent(quiz)}
                                </div>

                                {/* User Info Card - Fixed Bottom */}
                                <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-auto md:max-w-2xl md:mx-auto z-10">
                                    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-4 w-full border border-white/10 shadow-2xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="relative">
                                                    <img
                                                        src={quiz.user.profile_image || defaultAvatar}
                                                        alt={quiz.user.username}
                                                        className="w-14 h-14 rounded-xl border-2 border-white/30 object-cover cursor-pointer hover:scale-105 transition-transform duration-300 shadow-lg"
                                                        onClick={() => navigate(`/profile/${quiz.user.username}`)}
                                                    />
                                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-white font-semibold cursor-pointer hover:text-blue-400 transition-colors duration-300 truncate text-lg"
                                                         onClick={() => navigate(`/profile/${quiz.user.username}`)}>
                                                        @{quiz.user.username}
                                                    </div>
                                                    <div className="text-white/70 text-sm truncate">
                                                        {quiz.test_title}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFollowToggle(quiz.id);
                                                }}
                                                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ml-3 ${quiz.user.is_following
                                                    ? "bg-gradient-to-r from-white/10 to-white/5 text-white border border-white/20 hover:from-white/20 hover:to-white/10 active:scale-95"
                                                    : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 active:scale-95 shadow-lg shadow-green-500/25"
                                                }`}
                                            >
                                                {quiz.user.is_following ? "Following" : "Follow"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats and Action Buttons - Sidebar */}
                                <div className="fixed right-6 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 z-20">
                                    {/* Correct Answers */}
                                    <div className="relative group">
                                        <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-emerald-500/15 rounded-2xl flex flex-col items-center justify-center border border-green-500/30 shadow-xl shadow-green-500/10 group-hover:shadow-green-500/20 transition-all duration-500 group-hover:scale-105">
                                            <Check size={20} className="text-green-400" />
                                            <span className="text-white font-bold text-sm mt-1">{correctCount}</span>
                                        </div>
                                        <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-black/90 px-3 py-2 rounded-lg text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                            To'g'ri javoblar
                                        </div>
                                    </div>

                                    {/* Wrong Answers */}
                                    <div className="relative group">
                                        <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-rose-500/15 rounded-2xl flex flex-col items-center justify-center border border-red-500/30 shadow-xl shadow-red-500/10 group-hover:shadow-red-500/20 transition-all duration-500 group-hover:scale-105">
                                            <X size={20} className="text-red-400" />
                                            <span className="text-white font-bold text-sm mt-1">{wrongCount}</span>
                                        </div>
                                        <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-black/90 px-3 py-2 rounded-lg text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                            Noto'g'ri javoblar
                                        </div>
                                    </div>

                                    {/* Views */}
                                    <div className="relative group">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-indigo-500/15 rounded-2xl flex flex-col items-center justify-center border border-blue-500/30 shadow-xl shadow-blue-500/10 group-hover:shadow-blue-500/20 transition-all duration-500 group-hover:scale-105">
                                            <Eye size={20} className="text-blue-400" />
                                            <span className="text-white font-bold text-sm mt-1">{finalViewCount}</span>
                                        </div>
                                        <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-black/90 px-3 py-2 rounded-lg text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                            Ko'rishlar
                                            {uniqueViewCount > 0 && (
                                                <div className="text-blue-300 text-xs">({uniqueViewCount} unique)</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reactions */}
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowReactions(showReactions === quiz.id ? null : quiz.id);
                                                setShowDropdown(null);
                                                setShowReactionStats(null);
                                                if (showFilterDropdown) setShowFilterDropdown(false);
                                            }}
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center hover:scale-105 transition-all duration-500 relative border shadow-xl active:scale-95 ${userReaction
                                                ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/15 border-yellow-500/30 shadow-yellow-500/10 hover:shadow-yellow-500/20 text-yellow-400'
                                                : 'bg-gradient-to-br from-purple-500/20 to-pink-500/15 border-purple-500/30 shadow-purple-500/10 hover:shadow-purple-500/20 text-white'
                                            }`}
                                        >
                                            {isReacting.has(quiz.id) ? (
                                                <Loader2 size={20} className="animate-spin" />
                                            ) : (
                                                <Heart size={20} fill={userReaction ? "currentColor" : "none"} />
                                            )}
                                            {totalReactions > 0 && (
                                                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-lg font-bold">
                                                    {totalReactions}
                                                </span>
                                            )}
                                        </button>
                                        {showReactions === quiz.id && renderReactionsMenu(quiz.id)}
                                    </div>

                                    {/* More Options */}
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowDropdown(showDropdown === quiz.id ? null : quiz.id);
                                                setShowReactions(null);
                                                setShowReactionStats(null);
                                                if (showFilterDropdown) setShowFilterDropdown(false);
                                            }}
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center hover:scale-105 transition-all duration-500 bg-gradient-to-br from-gray-500/20 to-gray-600/15 border border-gray-500/30 shadow-xl shadow-gray-500/10 hover:shadow-gray-500/20 text-white active:scale-95"
                                        >
                                            <MoreVertical size={20} />
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
                        <div className="flex flex-col items-center gap-5">
                            <div className="w-16 h-16 border-[4px] border-transparent border-t-blue-500 border-r-indigo-500 border-b-purple-500 border-l-pink-500 rounded-full animate-spin shadow-xl"></div>
                            <span className="text-white text-sm font-medium">Yangi savollar yuklanmoqda...</span>
                        </div>
                    </div>
                )}

                {!hasMore && !loading && !loadingMore && quizData.length > 0 && (
                    <div className="h-screen w-full flex justify-center items-center snap-start">
                        <div className="text-center px-4 max-w-md">
                            <div className="text-7xl mb-6 animate-bounce">🎉</div>
                            <h2 className="text-2xl text-white mb-3 font-bold">Barcha savollarni ko'rib chiqdingiz!</h2>
                            <p className="text-gray-400 mb-8">Yangi savollar tez orada qo'shiladi. Yana o'qishni davom ettirish uchun boshiga qayting.</p>
                            <button
                                onClick={() => {
                                    if (containerRef.current) {
                                        containerRef.current.scrollTo({
                                            top: 0,
                                            behavior: "smooth"
                                        });
                                    }
                                }}
                                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/35 active:scale-95 flex items-center gap-3 mx-auto"
                            >
                                <ChevronUp size={20} />
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