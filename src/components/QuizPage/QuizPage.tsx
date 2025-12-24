"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Share, Bookmark, X, Send, Check, ThumbsUp, ThumbsDown, Loader2, Filter, Eye, MoreVertical, Smile, BarChart3, Search, RefreshCw } from "lucide-react";
import { quizAPI, accountsAPI } from "../../utils/api";
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

const BATCH_SIZE = 10;
const MIN_QUIZZES_BEFORE_LOAD = 2;

const QuizPage: React.FC<QuizPageProps> = ({ theme = "dark" }) => {
    const navigate = useNavigate();
    const { questionId } = useParams<{ questionId: string }>();

    // useSimpleQuizViews hook ni ishlatish
    const {
        getStatistics,
        recordView: recordQuizView,
        initialize: initializeViews,
        getCurrentUserId,
        fetchViewsList,
        updateTotalViews,
        updateUniqueViews
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

    // Animation states
    const [shakingAnswerId, setShakingAnswerId] = useState<number | null>(null);
    const [coinAnimation, setCoinAnimation] = useState<{ quizId: number, answerId: number, show: boolean } | null>(null);
    const [correctAnimation, setCorrectAnimation] = useState<number | null>(null);

    // Filter states
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        category: "All",
        page_size: BATCH_SIZE,
        ordering: "-created_at",
        is_random: true
    });
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const [submittingQuestions, setSubmittingQuestions] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
    const [quizReactions, setQuizReactions] = useState<Map<number, QuizReaction>>(new Map());
    const [isReacting, setIsReacting] = useState<Set<number>>(new Set());

    // UI State'lar
    const [showReactions, setShowReactions] = useState<number | null>(null);
    const [showDropdown, setShowDropdown] = useState<number | null>(null);
    const [showReactionStats, setShowReactionStats] = useState<number | null>(null);

    // Quiz Stats State'lar
    const [quizStats, setQuizStats] = useState<Map<number, {
        views: number;
        unique_views: number;
        correct_attempts: number;
        wrong_attempts: number;
        total_attempts: number;
        accuracy: number;
    }>>(new Map());

    const [viewedQuizzes, setViewedQuizzes] = useState<Set<number>>(new Set());

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isLoadingRef = useRef(false);
    const lastLoadMoreTimeRef = useRef(0);
    const currentPageRef = useRef(1);

    // Infinite loopni oldini olish uchun flag
    const isLoadMoreInProgressRef = useRef(false);

    // Stats Functions - useCallback bilan muammolarni oldini olish
    const fetchQuizStats = useCallback(async (quizId: number): Promise<void> => {
        try {
            const statsResponse = await quizAPI.getQuestionStats(quizId);
            console.log(`📊 Stats response for quiz ${quizId}:`, statsResponse);

            if (statsResponse.success && statsResponse.data) {
                const stats = statsResponse.data;

                // Stats Map ni yangilash
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

                // QuizData ni yangilash
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

    // Record View - useCallback bilan muammolarni oldini olish
    const recordView = useCallback(async (quizId: number): Promise<void> => {
        if (viewedQuizzes.has(quizId)) return;

        console.log(`👁️ Recording view for quiz ${quizId}`);

        try {
            // useSimpleQuizViews orqali view yozish
            const result = await recordQuizView(quizId);

            if (result.success) {
                // Local state ni yangilash
                setViewedQuizzes(prev => {
                    const newSet = new Set(prev);
                    newSet.add(quizId);
                    return newSet;
                });

                // Stats ni yangilash
                await fetchQuizStats(quizId);

                console.log(`✅ View recorded for quiz ${quizId}`);
            }
        } catch (err) {
            console.error(`❌ Error recording view for quiz ${quizId}:`, err);
        }
    }, [viewedQuizzes, recordQuizView, fetchQuizStats]);

    // Load Categories
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

    // Fetch Random Quizzes - TUZATILGAN VERSIYA
    const fetchRandomQuizzes = useCallback(async (isInitialLoad: boolean = false) => {
        if (isLoadingRef.current || (!isInitialLoad && !hasMore)) return;

        isLoadingRef.current = true;
        setLoading(true);
        console.log(`🔄 fetchRandomQuizzes called: isInitialLoad=${isInitialLoad}, hasMore=${hasMore}`);

        try {
            const pageToFetch = isInitialLoad ? 1 : currentPageRef.current;

            console.log(`🎲 Fetching random quizzes: page=${pageToFetch}, page_size=${BATCH_SIZE}`);

            const res = await quizAPI.fetchRandomQuizzes(BATCH_SIZE, pageToFetch);

            console.log("📥 Random quizzes response:", res);

            if (!res.success) {
                console.error("❌ Failed to fetch random quizzes:", res.error);
                setHasMore(false);
                return;
            }

            let results: Quiz[] = [];
            let nextPage: string | null = null;

            // Response strukturasini aniqlash
            if (res.data?.results && Array.isArray(res.data.results)) {
                results = res.data.results;
                nextPage = res.data.next || null;
                console.log(`🎯 Found ${results.length} quizzes in results array`);
            } else if (Array.isArray(res.data)) {
                results = res.data;
                console.log(`🎯 Found ${results.length} quizzes in direct array`);
            } else if (res.data?.data && Array.isArray(res.data.data)) {
                results = res.data.data;
                console.log(`🎯 Found ${results.length} quizzes in data array`);
            } else {
                console.warn("⚠️ No quiz data found in response");
                setHasMore(false);
                return;
            }

            if (results.length === 0) {
                console.log("📭 No more quizzes available");
                setHasMore(false);
                return;
            }

            // Format quiz data
            const formattedResults = results.map((quiz: any) => ({
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

            const newQuizIds = formattedResults.map(q => q.id);
            console.log(`📝 Formatted ${formattedResults.length} quizzes with IDs:`, newQuizIds);

            // QuizData ga qo'shish
            setQuizData(prev => {
                if (isInitialLoad) {
                    return formattedResults;
                } else {
                    const existingIds = new Set(prev.map(q => q.id));
                    const unique = formattedResults.filter(q => !existingIds.has(q.id));
                    return [...prev, ...unique];
                }
            });

            // Har bir yangi quiz uchun stats olish - sequential
            for (const quizId of newQuizIds) {
                try {
                    await fetchQuizStats(quizId);
                } catch (error) {
                    console.error(`❌ Error fetching initial stats for quiz ${quizId}:`, error);
                }
            }

            // Record views for first few quizzes - sequential yozish
            const initialViews = newQuizIds.slice(0, 3);
            for (const quizId of initialViews) {
                try {
                    await recordView(quizId);
                } catch (error) {
                    console.error(`❌ Error recording view for quiz ${quizId}:`, error);
                }
            }

            // Lazy load remaining views
            const remainingQuizzes = newQuizIds.slice(3);
            if (remainingQuizzes.length > 0) {
                setTimeout(() => {
                    remainingQuizzes.forEach(async (quizId) => {
                        try {
                            await recordView(quizId);
                        } catch (error) {
                            console.error(`❌ Error lazy recording view for quiz ${quizId}:`, error);
                        }
                    });
                }, 1500);
            }

            // Pagination logic
            const hasMoreResults = results.length >= BATCH_SIZE;
            setHasMore(hasMoreResults);

            if (!isInitialLoad && hasMoreResults) {
                currentPageRef.current += 1;
            }

            // Next page URL
            if (nextPage) {
                setNextPageUrl(nextPage);
            } else if (hasMoreResults) {
                setNextPageUrl(`/api/quiz/random/?page=${pageToFetch + 1}&page_size=${BATCH_SIZE}`);
            } else {
                setNextPageUrl(null);
            }

            console.log(`📄 Pagination: hasMore=${hasMoreResults}, nextPageUrl=${nextPageUrl}, currentPageRef=${currentPageRef.current}`);

            lastLoadMoreTimeRef.current = Date.now();

        } catch (err: any) {
            console.error("❌ Fetch random quizzes error:", err);
            setHasMore(false);
        } finally {
            isLoadingRef.current = false;
            setLoading(false);
            isLoadMoreInProgressRef.current = false;
            console.log(`✅ fetchRandomQuizzes completed: isInitialLoad=${isInitialLoad}`);
        }
    }, [hasMore, fetchQuizStats, recordView]);

    // Fetch Quizzes with Filters
    const fetchQuizzesWithFilters = useCallback(async (filters: FilterOptions, isInitialLoad: boolean = false, url?: string) => {
        if (isLoadingRef.current || (!isInitialLoad && !hasMore)) return;

        isLoadingRef.current = true;
        setLoading(true);
        console.log(`🔄 fetchQuizzesWithFilters called: isInitialLoad=${isInitialLoad}, hasMore=${hasMore}, url=${url}`);

        try {
            let res;

            if (url) {
                res = await quizAPI.fetchQuizzesByUrl(url);
            } else {
                // Tozalangan filterlar bilan so'rov yuborish
                const cleanFilters: any = { ...filters };

                // Agar "All" bo'lsa, category ni o'chirish
                if (cleanFilters.category === "All") {
                    delete cleanFilters.category;
                }

                // Agar worked/unworked undefined bo'lsa, o'chirish
                if (cleanFilters.worked === undefined) {
                    delete cleanFilters.worked;
                }
                if (cleanFilters.unworked === undefined) {
                    delete cleanFilters.unworked;
                }

                console.log("🔍 Fetching with filters:", cleanFilters);
                res = await quizAPI.fetchQuizzesWithFilters(cleanFilters);
            }

            console.log("📥 Filtered quizzes response:", res);

            if (!res.success) {
                console.error("❌ Failed to fetch filtered quizzes:", res.error);
                setHasMore(false);
                return;
            }

            let results: Quiz[] = [];
            let nextPage: string | null = null;

            // Response strukturasini aniqlash
            if (res.data?.results && Array.isArray(res.data.results)) {
                results = res.data.results;
                nextPage = res.data.next || null;
            } else if (Array.isArray(res.data)) {
                results = res.data;
            } else if (res.data?.data && Array.isArray(res.data.data)) {
                results = res.data.data;
            }

            console.log(`📊 Got ${results.length} filtered quizzes, nextPage: ${nextPage}`);

            if (results.length === 0) {
                console.log("📭 No quizzes found with current filters");
                setHasMore(false);
                return;
            }

            // Format quiz data
            const formattedResults = results.map((quiz: any) => ({
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

            const newQuizIds = formattedResults.map(q => q.id);

            // QuizData ga qo'shish
            setQuizData(prev => {
                if (isInitialLoad || !url) {
                    return formattedResults;
                } else {
                    const existingIds = new Set(prev.map(q => q.id));
                    const unique = formattedResults.filter(q => !existingIds.has(q.id));
                    return [...prev, ...unique];
                }
            });

            // Har bir yangi quiz uchun stats olish - sequential
            for (const quizId of newQuizIds) {
                try {
                    await fetchQuizStats(quizId);
                } catch (error) {
                    console.error(`❌ Error fetching stats for quiz ${quizId}:`, error);
                }
            }

            // Record views - sequential
            const initialViews = newQuizIds.slice(0, 3);
            for (const quizId of initialViews) {
                try {
                    await recordView(quizId);
                } catch (error) {
                    console.error(`❌ Error recording view for quiz ${quizId}:`, error);
                }
            }

            // Lazy load remaining
            const remainingQuizzes = newQuizIds.slice(3);
            if (remainingQuizzes.length > 0) {
                setTimeout(() => {
                    remainingQuizzes.forEach(async (quizId) => {
                        try {
                            await recordView(quizId);
                        } catch (error) {
                            console.error(`❌ Error lazy recording view for quiz ${quizId}:`, error);
                        }
                    });
                }, 1500);
            }

            // Pagination logic
            const hasMoreResults = results.length >= BATCH_SIZE;
            setHasMore(hasMoreResults || !!nextPage);

            if (nextPage) {
                setNextPageUrl(nextPage);
            } else {
                setNextPageUrl(null);
            }

            if (!isInitialLoad && hasMoreResults && !url) {
                currentPageRef.current += 1;
            }

            lastLoadMoreTimeRef.current = Date.now();

        } catch (err: any) {
            console.error("❌ Fetch filtered quizzes error:", err);
            setHasMore(false);
        } finally {
            isLoadingRef.current = false;
            setLoading(false);
            isLoadMoreInProgressRef.current = false;
            console.log(`✅ fetchQuizzesWithFilters completed: isInitialLoad=${isInitialLoad}`);
        }
    }, [hasMore, fetchQuizStats, recordView]);

    // Apply Filter
    const applyFilter = useCallback(async (newFilters: Partial<FilterOptions>) => {
        console.log("🔄 applyFilter called with:", newFilters);

        const updatedFilters = {
            ...filterOptions,
            ...newFilters,
            page: 1,
            page_size: BATCH_SIZE
        };

        setFilterOptions(updatedFilters);
        currentPageRef.current = 1;

        // Reset states
        setCurrentQuizIndex(0);
        setQuizData([]);
        setHasMore(true);
        setNextPageUrl(null);
        setUserInteractions({
            selectedAnswers: new Map(),
            textAnswers: new Map(),
            answerStates: new Map(),
            reactions: new Map(),
            submittedQuizzes: new Set(),
        });
        setViewedQuizzes(new Set());
        setQuizStats(new Map());

        try {
            // Agar random tanlansa
            if (updatedFilters.is_random) {
                console.log("🎲 Applying random filter");
                await fetchRandomQuizzes(true);
            } else {
                // Filterlar bilan fetch
                console.log("🔍 Applying filter with options:", updatedFilters);
                await fetchQuizzesWithFilters(updatedFilters, true);
            }
        } catch (error) {
            console.error("❌ Apply filter error:", error);
        }

        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [filterOptions, fetchRandomQuizzes, fetchQuizzesWithFilters]);

    // Reset Filters
    const resetFilters = useCallback(async () => {
        console.log("🔄 resetFilters called");

        const defaultFilters: FilterOptions = {
            category: "All",
            page_size: BATCH_SIZE,
            ordering: "-created_at",
            is_random: true
        };
        setFilterOptions(defaultFilters);
        setSearchQuery("");
        currentPageRef.current = 1;

        // Reset states
        setCurrentQuizIndex(0);
        setQuizData([]);
        setHasMore(true);
        setNextPageUrl(null);
        setUserInteractions({
            selectedAnswers: new Map(),
            textAnswers: new Map(),
            answerStates: new Map(),
            reactions: new Map(),
            submittedQuizzes: new Set(),
        });
        setViewedQuizzes(new Set());
        setQuizStats(new Map());

        // Fetch random quizzes
        await fetchRandomQuizzes(true);

        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [fetchRandomQuizzes]);

    // Load More Effect - INFINITE LOOP MUAMMOSINI TUZATISH
    const loadMoreData = useCallback(async () => {
        // Agar yuklanayotgan bo'lsa yoki boshqa bir yuklash jarayonda bo'lsa, to'xtat
        if (isLoadingRef.current || isLoadMoreInProgressRef.current || !hasMore || quizData.length === 0) {
            console.log(`🚫 loadMoreData skipped: isLoadingRef=${isLoadingRef.current}, isLoadMoreInProgressRef=${isLoadMoreInProgressRef.current}, hasMore=${hasMore}, quizData.length=${quizData.length}`);
            return;
        }

        const now = Date.now();
        // Minimum 1 soniya kutish
        if (now - lastLoadMoreTimeRef.current < 1000) {
            console.log(`⏰ loadMoreData: Too soon since last load, waiting...`);
            return;
        }

        const remainingQuizzes = quizData.length - currentQuizIndex - 1;

        console.log(`🔍 LoadMore check: currentIndex=${currentQuizIndex}, total=${quizData.length}, remaining=${remainingQuizzes}, MIN_QUIZZES_BEFORE_LOAD=${MIN_QUIZZES_BEFORE_LOAD}`);

        if (remainingQuizzes <= MIN_QUIZZES_BEFORE_LOAD) {
            console.log(`🔍 Loading more quizzes. Current index: ${currentQuizIndex}, Total: ${quizData.length}, Remaining: ${remainingQuizzes}`);

            // Flag ni true qilish
            isLoadMoreInProgressRef.current = true;
            console.log(`🚩 isLoadMoreInProgressRef set to TRUE`);

            try {
                if (filterOptions.is_random) {
                    console.log("🎲 Loading more random quizzes...");
                    await fetchRandomQuizzes(false);
                } else if (nextPageUrl) {
                    console.log(`🔗 Loading more with nextPageUrl: ${nextPageUrl}`);
                    await fetchQuizzesWithFilters(filterOptions, false, nextPageUrl);
                } else {
                    console.log(`📄 Loading more with page: ${currentPageRef.current + 1}`);
                    await fetchQuizzesWithFilters({
                        ...filterOptions,
                        page: currentPageRef.current + 1
                    }, false);
                }
            } finally {
                lastLoadMoreTimeRef.current = now;
                // Flag ni false qilish
                isLoadMoreInProgressRef.current = false;
                console.log(`🚩 isLoadMoreInProgressRef set to FALSE`);
            }
        }
    }, [currentQuizIndex, quizData.length, hasMore, filterOptions, nextPageUrl, fetchRandomQuizzes, fetchQuizzesWithFilters]);

    // Scroll Handling - useCallback bilan muammolarni oldini olish
    const handleScroll = useCallback(() => {
        if (!containerRef.current || isLoadingRef.current || quizData.length === 0) return;

        const container = containerRef.current;
        const { scrollTop, scrollHeight, clientHeight } = container;

        // Hozirgi quiz indeksini hisoblash (scroll snap uchun)
        const index = Math.round(scrollTop / clientHeight);

        console.log(`📜 Scroll: index=${index}, currentIndex=${currentQuizIndex}, scrollTop=${scrollTop}, clientHeight=${clientHeight}`);

        if (index >= 0 && index < quizData.length && index !== currentQuizIndex) {
            console.log(`🔄 Scrolling to quiz ${index + 1}/${quizData.length}`);
            const newQuiz = quizData[index];
            if (newQuiz) {
                // Faqat bir marta recordView chaqirish
                if (!viewedQuizzes.has(newQuiz.id)) {
                    recordView(newQuiz.id);
                }
                setCurrentQuizIndex(index);

                // Scroll bilan yangi quizga o'tganda load more ni tekshirish
                // setTimeout ni olib tashlaymiz, chunki bu infinite loopga olib kelishi mumkin
                // loadMoreData ni alohida useEffect ichida chaqiramiz
            }
        }
    }, [currentQuizIndex, quizData, viewedQuizzes, recordView]);

    // Scroll event listener
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onScroll = () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            scrollTimeoutRef.current = setTimeout(() => {
                handleScroll();
            }, 100);
        };

        container.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            container.removeEventListener("scroll", onScroll);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [handleScroll]);

    // Current quiz index o'zgarganda load more ni tekshirish
    useEffect(() => {
        console.log(`🔄 useEffect: currentQuizIndex changed to ${currentQuizIndex}`);

        // Faqat currentQuizIndex o'zgarganda loadMoreData ni chaqirish
        if (currentQuizIndex > 0) {
            // setTimeout bilan chaqirish to avoid race conditions
            const timer = setTimeout(() => {
                loadMoreData();
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [currentQuizIndex, loadMoreData]);

    // Initial Data Fetch
    useEffect(() => {
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

                        await fetchQuizStats(id);

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
                        console.log(`✅ Loaded specific quiz: ${quiz.question_text.substring(0, 50)}...`);
                    } else {
                        console.error(`❌ Failed to fetch quiz with ID ${id}`);
                        // Fallback to random quizzes
                        await fetchRandomQuizzes(true);
                    }
                } else {
                    // Default: random savollar
                    console.log("🎲 Loading random quizzes...");
                    await fetchRandomQuizzes(true);
                }
            } catch (err) {
                console.error("❌ Initial data fetch error:", err);
            } finally {
                if (isMounted) {
                    setTimeout(() => {
                        setIsInitialLoading(false);
                        console.log("✅ Initial loading complete");
                    }, 500);
                }
            }
        };

        // Faqat bir marta chaqirish
        fetchInitialData();

        return () => {
            isMounted = false;
        };
    }, [questionId]);

    // Search Handler
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

    // Search debounce
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            if (searchQuery.trim() !== "") {
                handleSearch();
            } else if (searchQuery === "") {
                resetFilters();
            }
        }, 500);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, handleSearch, resetFilters]);

    // Reaction Functions
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

    // Answer Handlers
    const selectAnswer = async (quizId: number, answerId: number) => {
        if (submittingQuestions.has(quizId) || userInteractions.submittedQuizzes.has(quizId)) return;

        setSubmittingQuestions(prev => new Set(prev).add(quizId));
        try {
            const res = await quizAPI.submitAnswers({
                question: quizId,
                selected_answer_ids: [answerId]
            });

            const isCorrect = res.data?.is_correct;
            console.log(`✅ Answer submitted for quiz ${quizId}: correct=${isCorrect}`);

            // User interactions yangilash
            setUserInteractions(prev => ({
                ...prev,
                selectedAnswers: new Map(prev.selectedAnswers).set(quizId, [answerId]),
                answerStates: new Map(prev.answerStates).set(quizId, isCorrect ? "correct" : "incorrect"),
                submittedQuizzes: new Set(prev.submittedQuizzes).add(quizId),
            }));

            // Animatsiyalar
            if (isCorrect) {
                setCorrectAnimation(quizId);
                setTimeout(() => setCorrectAnimation(null), 2000);

                setCoinAnimation({ quizId, answerId, show: true });
                setTimeout(() => setCoinAnimation(null), 2000);
            } else {
                setShakingAnswerId(answerId);
                setTimeout(() => setShakingAnswerId(null), 1000);
            }

            // Stats ni yangilash
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
        const answerState = userInteractions.answerStates.get(quizId);
        if (answerState || userInteractions.submittedQuizzes.has(quizId)) return;

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

            setUserInteractions(prev => ({
                ...prev,
                answerStates: new Map(prev.answerStates).set(quizId, isCorrect ? "correct" : "incorrect"),
                submittedQuizzes: new Set(prev.submittedQuizzes).add(quizId),
            }));

            // Animatsiyalar
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

            // Stats ni yangilash
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

    // Utility Functions
    const getFinalViewCount = useCallback((quizId: number): number => {
        // Avval quizData'dan
        const quiz = quizData.find(q => q.id === quizId);
        if (quiz?.view_count) return quiz.view_count;

        // Keyin quizStats'dan
        const stats = quizStats.get(quizId);
        if (stats?.views) return stats.views;

        // Oxirida useSimpleQuizViews'dan
        const viewStats = getStatistics(quizId);
        return viewStats.totalViews || 0;
    }, [quizData, quizStats, getStatistics]);

    const getQuizUniqueViews = useCallback((quizId: number): number => {
        // Avval quizData'dan
        const quiz = quizData.find(q => q.id === quizId);
        if (quiz?.unique_viewers) return quiz.unique_viewers;

        // Keyin quizStats'dan
        const stats = quizStats.get(quizId);
        if (stats?.unique_views) return stats.unique_views;

        // Oxirida useSimpleQuizViews'dan
        const viewStats = getStatistics(quizId);
        return viewStats.uniqueViews || 0;
    }, [quizData, quizStats, getStatistics]);

    const getCorrectCount = useCallback((quizId: number): number => {
        // Avval quizData'dan
        const quiz = quizData.find(q => q.id === quizId);
        if (quiz?.correct_count) return quiz.correct_count;

        // Keyin quizStats'dan
        const stats = quizStats.get(quizId);
        if (stats?.correct_attempts) return stats.correct_attempts;

        return 0;
    }, [quizData, quizStats]);

    const getWrongCount = useCallback((quizId: number): number => {
        // Avval quizData'dan
        const quiz = quizData.find(q => q.id === quizId);
        if (quiz?.wrong_count) return quiz.wrong_count;

        // Keyin quizStats'dan
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

    // Render Functions (UI o'zgarmadi)
    const renderReactionsMenu = (quizId: number) => {
        const userReaction = userInteractions.reactions.get(quizId);
        const quiz = quizData.find(q => q.id === quizId);
        const isReactingQuiz = isReacting.has(quizId);
        if (!quiz) return null;

        return (
            <div className="absolute right-0 bottom-full mb-2 bg-gray-800 rounded-xl p-3 shadow-xl border border-gray-700 z-50 animate-fade-in">
                <div className="flex gap-2">
                    {REACTION_CHOICES.map(reaction => {
                        const reactionCount = quiz.reactions_summary?.[reaction.id as keyof typeof quiz.reactions_summary] || 0;
                        const isActive = userReaction === reaction.id;
                        return (
                            <button
                                key={reaction.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleReaction(quizId, reaction.id);
                                }}
                                disabled={isReactingQuiz}
                                className={`flex flex-col items-center p-2 rounded-lg transition-all hover:bg-gray-700 ${
                                    isActive ? 'bg-blue-500/20 border border-blue-500/30' : ''
                                } ${isReactingQuiz ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={`${reaction.label} (${reactionCount})`}
                            >
                                {isReactingQuiz && isActive ? (
                                    <Loader2 size={20} className="animate-spin text-white" />
                                ) : (
                                    <span className="text-2xl">{reaction.emoji}</span>
                                )}
                                {reactionCount > 0 && (
                                    <span className="text-xs text-gray-300 mt-1">{reactionCount}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderDropdownMenu = (quizId: number) => {
        const quiz = quizData.find(q => q.id === quizId);
        const totalReactions = quiz?.reactions_summary?.total || 0;
        const viewStats = getStatistics(quizId);

        return (
            <div className="absolute right-0 bottom-full mb-2 bg-gray-800 rounded-xl p-2 shadow-xl border border-gray-700 z-50 animate-fade-in min-w-[200px]">
                {totalReactions > 0 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowReactionStats(showReactionStats === quizId ? null : quizId);
                            setShowDropdown(null);
                        }}
                        className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-700 transition text-white text-sm"
                    >
                        <BarChart3 size={16} />
                        <span>Reaksiya statistikasi</span>
                    </button>
                )}
                {viewStats.totalViews > 0 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            alert(`${quizId} - IDli savolga ${viewStats.totalViews} marta ko'rilgan. ${viewStats.uniqueViews} ta foydalanuvchi ko'rgan.`);
                        }}
                        className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-700 transition text-white text-sm"
                    >
                        <Eye size={16} />
                        <span>Views statistikasi</span>
                    </button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(`${window.location.origin}/questions/${quizId}`);
                        alert("Link nusxalandi!");
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-700 transition text-white text-sm"
                >
                    <Share size={16} />
                    <span>Ulashish</span>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowFilterModal(true);
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-700 transition text-white text-sm"
                >
                    <Filter size={16} />
                    <span>Filter</span>
                </button>
                <button
                    onClick={async (e) => {
                        e.stopPropagation();
                        try {
                            const response = await quizAPI.bookmarkQuestion({
                                question: quizId
                            });
                            if (response.status === 201) {
                                alert("Savol saqlandi!");
                            } else if (response.status === 200) {
                                alert("Savol saqlanganlar ro'yxatidan olib tashlandi");
                            }
                        } catch (err) {
                            console.error("Bookmark error:", err);
                        }
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-700 transition text-white text-sm"
                >
                    <Bookmark size={16} className={quiz?.is_bookmarked ? "fill-current text-yellow-400" : ""} />
                    <span>Saqlash</span>
                </button>
            </div>
        );
    };

    const renderReactionStats = (quizId: number) => {
        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz || !quiz.reactions_summary) return null;
        const totalReactions = quiz.reactions_summary.total || 0;
        if (totalReactions === 0) return null;

        return (
            <div className="absolute right-0 bottom-full mb-2 bg-gray-800 rounded-xl p-4 shadow-xl border border-gray-700 z-50 animate-fade-in min-w-[200px]">
                <h4 className="text-white font-medium mb-3 text-sm">Reaksiyalar statistikasi</h4>
                <div className="space-y-2">
                    {REACTION_CHOICES.map(reaction => {
                        const count = quiz.reactions_summary![reaction.id as keyof typeof quiz.reactions_summary] || 0;
                        const percentage = totalReactions > 0 ? Math.round((count / totalReactions) * 100) : 0;
                        return (
                            <div key={reaction.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{reaction.emoji}</span>
                                    <span className="text-gray-300 text-sm">{reaction.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-white text-sm font-medium w-8 text-right">
                                        {count}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700 text-center">
                    <span className="text-gray-400 text-xs">Jami: ${totalReactions} ta reaksiya</span>
                </div>
            </div>
        );
    };

    const renderFilterModal = () => {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
                <div
                    className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                    onClick={() => setShowFilterModal(false)}
                />
                <div className="relative bg-gray-800 rounded-xl shadow-lg w-11/12 max-w-md max-h-[80vh] flex flex-col z-50 border border-gray-700">
                    <div className="p-4 border-b border-gray-700">
                        <h2 className="text-lg font-semibold text-white">Filterlar</h2>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 space-y-4">
                        {/* Category */}
                        <div>
                            <label className="text-white text-sm mb-2 block">Kategoriya</label>
                            <select
                                value={filterOptions.category === "All" ? "All" : filterOptions.category}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    applyFilter({
                                        category: value === "All" ? "All" : Number(value),
                                        is_random: false
                                    });
                                }}
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
                            >
                                <option value="All">Barcha kategoriyalar</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.emoji} {cat.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sort */}
                        <div>
                            <label className="text-white text-sm mb-2 block">Saralash</label>
                            <select
                                value={filterOptions.ordering || "-created_at"}
                                onChange={(e) => applyFilter({
                                    ordering: e.target.value as FilterOptions['ordering'],
                                    is_random: false
                                })}
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
                            >
                                <option value="-created_at">Yangi → Eski</option>
                                <option value="created_at">Eski → Yangi</option>
                                <option value="difficulty_percentage">Oson → Qiyin</option>
                                <option value="-difficulty_percentage">Qiyin → Oson</option>
                            </select>
                        </div>

                        {/* Worked/Unworked Filters */}
                        <div className="space-y-2">
                            <label className="text-white text-sm block">Ishlanganlik holati</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="worked"
                                        checked={filterOptions.worked === true}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                applyFilter({
                                                    worked: true,
                                                    unworked: undefined,
                                                    is_random: false
                                                });
                                            }
                                        }}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-white text-sm">Ishlangan</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="worked"
                                        checked={filterOptions.unworked === true}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                applyFilter({
                                                    worked: undefined,
                                                    unworked: true,
                                                    is_random: false
                                                });
                                            }
                                        }}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-white text-sm">Ishlanmagan</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="worked"
                                        checked={filterOptions.worked === undefined && filterOptions.unworked === undefined}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                applyFilter({
                                                    worked: undefined,
                                                    unworked: undefined,
                                                    is_random: false
                                                });
                                            }
                                        }}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-white text-sm">Hammasi</span>
                                </label>
                            </div>
                        </div>

                        {/* Random */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="random"
                                checked={filterOptions.is_random || false}
                                onChange={(e) => applyFilter({
                                    is_random: e.target.checked,
                                    category: "All",
                                    ordering: "-created_at",
                                    worked: undefined,
                                    unworked: undefined,
                                    search: undefined,
                                    difficulty_min: undefined,
                                    difficulty_max: undefined
                                })}
                                className="w-5 h-5"
                            />
                            <label htmlFor="random" className="text-white text-sm">
                                Tasodifiy savollar
                            </label>
                        </div>

                        {/* Difficulty Range */}
                        <div>
                            <label className="text-white text-sm mb-2 block">Qiyinlik darajasi</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="Min"
                                    value={filterOptions.difficulty_min || ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        applyFilter({
                                            difficulty_min: value ? Number(value) : undefined,
                                            is_random: false
                                        });
                                    }}
                                    className="w-20 px-3 py-2 bg-gray-700 text-white rounded-lg"
                                />
                                <span className="text-white">-</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="Max"
                                    value={filterOptions.difficulty_max || ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        applyFilter({
                                            difficulty_max: value ? Number(value) : undefined,
                                            is_random: false
                                        });
                                    }}
                                    className="w-20 px-3 py-2 bg-gray-700 text-white rounded-lg"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-700 flex gap-3 justify-between">
                        <button
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            onClick={() => {
                                resetFilters();
                                setShowFilterModal(false);
                            }}
                        >
                            Tozalash
                        </button>
                        <div className="flex gap-3">
                            <button
                                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                                onClick={() => setShowFilterModal(false)}
                            >
                                Yopish
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderQuestionContent = (quiz: Quiz) => {
        const isSubmitting = submittingQuestions.has(quiz.id);
        const selectedAnswers = userInteractions.selectedAnswers.get(quiz.id) || [];
        const answerState = userInteractions.answerStates.get(quiz.id);
        const hasSubmitted = userInteractions.submittedQuizzes.has(quiz.id);
        const showCorrectAnimation = correctAnimation === quiz.id;

        // Shake animation style
        const getShakeStyle = (answerId: number) => {
            if (shakingAnswerId === answerId) {
                return {
                    animation: 'shake 0.5s ease-in-out',
                };
            }
            return {};
        };

        // Coin animation component
        const renderCoinAnimation = (answerId: number) => {
            if (coinAnimation?.quizId === quiz.id && coinAnimation?.answerId === answerId && coinAnimation.show) {
                return (
                    <div className="absolute top-0 left-0 right-0 flex justify-center z-50">
                        <div className="animate-coin-bounce">
                            <span className="text-3xl">🪙</span>
                        </div>
                    </div>
                );
            }
            return null;
        };

        // Correct answer overlay animation
        const renderCorrectAnimation = () => {
            if (showCorrectAnimation) {
                return (
                    <div className="absolute inset-0 flex items-center justify-center z-40">
                        <div className="animate-correct-pulse">
                            <div className="text-6xl mb-4">🎉</div>
                            <div className="text-2xl text-white font-bold bg-green-500/80 px-6 py-3 rounded-full">
                                To'g'ri!
                            </div>
                        </div>
                    </div>
                );
            }
            return null;
        };

        if (isTrueFalseQuestion(quiz)) {
            return (
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    {renderCorrectAnimation()}
                    {quiz.answers.map(option => {
                        const isSelected = selectedAnswers.includes(option.id);
                        const isCorrect = option.is_correct;
                        const showCorrect = answerState && isCorrect;
                        const showIncorrect = answerState && isSelected && !isCorrect;
                        const isUserCorrect = isSelected && answerState === "correct";
                        const getBtnClass = () => {
                            if (hasSubmitted) {
                                if (isCorrect) return "border-green-400/60 bg-green-500/30";
                                if (isSelected && !isCorrect) return "border-red-400/60 bg-red-500/30";
                            }
                            if (isUserCorrect || showCorrect) return "border-green-400/60 bg-green-500/30";
                            if (showIncorrect) return "border-red-400/60 bg-red-500/30";
                            if (isSelected) return "border-blue-400/60 bg-blue-500/30";
                            return "border-white/30 hover:bg-black/50 hover:border-white/40";
                        };
                        const isTrue = ["true", "ha", "yes", "to'g'ri", "rost"].includes(
                            option.answer_text.toLowerCase()
                        );
                        return (
                            <button
                                key={option.id}
                                onClick={() => selectAnswer(quiz.id, option.id)}
                                disabled={hasSubmitted || isSubmitting}
                                style={getShakeStyle(option.id)}
                                className={`relative flex flex-col items-center justify-center gap-3 sm:gap-4 py-6 sm:py-8 px-4 sm:px-6 rounded-xl bg-black/40 backdrop-blur-lg border transition-all shadow-lg ${getBtnClass()}`}
                            >
                                {renderCoinAnimation(option.id)}
                                {isTrue ? (
                                    <ThumbsUp size={28} className="text-green-400 sm:w-8 sm:h-8"/>
                                ) : (
                                    <ThumbsDown size={28} className="text-red-400 sm:w-8 sm:h-8"/>
                                )}
                                <span className="text-base sm:text-lg font-medium text-white">
                                    {option.answer_text}
                                </span>
                                {isSubmitting && isSelected && (
                                    <Loader2 size={16} className="animate-spin text-white"/>
                                )}
                                {isUserCorrect && <Check size={20} className="text-green-400"/>}
                                {showIncorrect && <X size={20} className="text-red-400"/>}
                            </button>
                        );
                    })}
                </div>
            );
        }

        if (quiz.question_type === "multiple") {
            return (
                <div className="space-y-3 sm:space-y-4">
                    {renderCorrectAnimation()}
                    <div className="grid gap-3 sm:gap-4 w-full">
                        {quiz.answers.map(option => {
                            const isSelected = selectedAnswers.includes(option.id);
                            const showCorrect = answerState && option.is_correct;
                            const showIncorrect = answerState && isSelected && !option.is_correct;
                            const btnClass = hasSubmitted
                                ? (option.is_correct ? "border-green-400/60 bg-green-500/30" :
                                    isSelected && !option.is_correct ? "border-red-400/60 bg-red-500/30" : "border-white/30")
                                : showCorrect
                                    ? "border-green-400/60 bg-green-500/30"
                                    : showIncorrect
                                        ? "border-red-400/60 bg-red-500/30"
                                        : isSelected
                                            ? "border-blue-400/60 bg-blue-500/30"
                                            : "border-white/30 hover:bg-black/50 hover:border-white/40";
                            const circleClass = showCorrect
                                ? "bg-green-500 text-white"
                                : showIncorrect
                                    ? "bg-red-500 text-white"
                                    : isSelected
                                        ? "bg-blue-500 text-white"
                                        : "bg-white/30 text-white";
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleMultipleChoice(quiz.id, option.id)}
                                    disabled={hasSubmitted || isSubmitting}
                                    style={getShakeStyle(option.id)}
                                    className={`relative flex w-full items-center gap-3 sm:gap-4 px-5 py-4 rounded-xl bg-black/40 backdrop-blur-lg border transition-all text-left shadow-lg ${btnClass}`}
                                >
                                    {renderCoinAnimation(option.id)}
                                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${circleClass}`}>
                                        {(isSelected || showCorrect) && <Check size={14}/>}
                                        {showIncorrect && <X size={14}/>}
                                    </div>
                                    <span className="flex-1 font-medium text-white text-sm sm:text-base">
                                        {option.answer_text}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {selectedAnswers.length > 0 && !hasSubmitted && (
                        <button
                            onClick={() => submitMultipleChoice(quiz.id)}
                            disabled={isSubmitting}
                            className={`w-full py-4 rounded-xl bg-black/40 backdrop-blur-lg border border-white/30 text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg ${
                                isSubmitting ? "bg-blue-500/40" : "hover:bg-black/50 hover:border-white/40"
                            }`}
                        >
                            {isSubmitting ? (
                                <Loader2 size={20} className="animate-spin"/>
                            ) : (
                                <Send size={20}/>
                            )}
                            <span>Javobni yuborish ({selectedAnswers.length} ta tanlangan)</span>
                        </button>
                    )}
                </div>
            );
        }

        // Default single choice
        return (
            <div className="space-y-3 sm:space-y-4">
                {renderCorrectAnimation()}
                {quiz.answers.map(option => {
                    const isSelected = selectedAnswers.includes(option.id);
                    const isCorrect = option.is_correct;
                    const showCorrect = answerState && isCorrect;
                    const showIncorrect = answerState && isSelected && !isCorrect;
                    const btnClass = hasSubmitted
                        ? (isCorrect ? "border-green-400/60 bg-green-500/30" :
                            isSelected && !isCorrect ? "border-red-400/60 bg-red-500/30" : "border-white/30")
                        : showCorrect
                            ? "border-green-400/60 bg-green-500/30"
                            : showIncorrect
                                ? "border-red-400/60 bg-red-500/30"
                                : isSelected
                                    ? "border-blue-400/60 bg-blue-500/30"
                                    : "border-white/30 hover:bg-black/50 hover:border-white/40";
                    const circleClass = showCorrect
                        ? "bg-green-500 text-white"
                        : showIncorrect
                            ? "bg-red-500 text-white"
                            : isSelected
                                ? "bg-blue-500 text-white"
                                : "bg-white/30 text-white";
                    return (
                        <button
                            key={option.id}
                            onClick={() => selectAnswer(quiz.id, option.id)}
                            disabled={hasSubmitted || isSubmitting}
                            style={getShakeStyle(option.id)}
                            className={`relative flex items-center w-full gap-3 sm:gap-4 px-5 py-4 rounded-xl bg-black/40 backdrop-blur-lg border transition-all text-left shadow-lg ${btnClass}`}
                        >
                            {renderCoinAnimation(option.id)}
                            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${circleClass}`}>
                                {option.letter}
                            </div>
                            <span className="flex-1 font-medium text-white text-sm sm:text-base">
                                {option.answer_text}
                            </span>
                            {isSubmitting && isSelected && (
                                <Loader2 size={16} className="animate-spin text-white"/>
                            )}
                            {isSelected && answerState === "correct" && <Check size={18} className="text-green-400"/>}
                            {showIncorrect && <X size={18} className="text-red-400"/>}
                        </button>
                    );
                })}
            </div>
        );
    };

    // Loading State
    if (isInitialLoading) {
        return (
            <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
                <QuizSkeletonLoader />
            </div>
        );
    }

    // Empty State
    if (quizData.length === 0 && !loading) {
        return (
            <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">😔</div>
                    <h2 className="text-xl text-white mb-2">Savollar topilmadi</h2>
                    <p className="text-gray-400 mb-6">Tanlangan filterda savollar mavjud emas</p>
                    <button
                        onClick={resetFilters}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Barcha savollarni ko'rish
                    </button>
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
                
                /* Shake Animation */
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                
                /* Coin Animation */
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
                
                /* Correct Answer Animation */
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
            `}</style>

            {/* Search Input */}
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-md px-4">
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Savollarni qidirish..."
                        className="w-full px-4 py-3 bg-black/40 backdrop-blur-lg border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
                    />
                    {isSearching ? (
                        <Loader2 className="absolute right-3 top-3 animate-spin text-white" size={20} />
                    ) : (
                        <Search className="absolute right-3 top-3 text-white" size={20} />
                    )}
                </div>
            </div>

            {/* Filter Modal */}
            {showFilterModal && renderFilterModal()}

            {/* Main Container */}
            <div
                ref={containerRef}
                className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
            >
                {/* Questions */}
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
                                {/* Logo and Telegram Link */}
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

                                {/* Question Card */}
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

                                {/* Answers */}
                                <div>
                                    {renderQuestionContent(quiz)}
                                </div>

                                {/* User Info */}
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

                                {/* Stats Icons */}
                                <div className="absolute right-4 bottom-1/4 flex flex-col gap-4">
                                    {/* Correct Count */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 bg-green-500/30 rounded-full flex items-center justify-center border border-green-500/50">
                                            <span className="text-green-400 font-bold text-lg">✓</span>
                                        </div>
                                        <span className="text-xs text-white mt-1 font-bold">
                                            {correctCount}
                                        </span>
                                    </div>

                                    {/* Wrong Count */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 bg-red-500/30 rounded-full flex items-center justify-center border border-red-500/50">
                                            <span className="text-red-400 font-bold text-lg">✗</span>
                                        </div>
                                        <span className="text-xs text-white mt-1 font-bold">
                                            {wrongCount}
                                        </span>
                                    </div>

                                    {/* Views Count */}
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

                                    {/* Reactions */}
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

                                    {/* More Options */}
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

                {/* Loading Indicator */}
                {loading && quizData.length > 0 && (
                    <div className="h-screen w-full flex justify-center items-center snap-start">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-white text-sm">Yangi savollar yuklanmoqda...</span>
                        </div>
                    </div>
                )}

                {/* End of content */}
                {!hasMore && !loading && quizData.length > 0 && (
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