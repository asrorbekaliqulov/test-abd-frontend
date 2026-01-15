"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Share, Bookmark, X, Check, Loader2, Filter, Eye, MoreVertical, Heart, Zap, Target, TrendingUp, Clock, Search } from "lucide-react";
import { quizAPI, accountsAPI, tokenManager } from "../../utils/api";
import { useParams, useNavigate } from "react-router-dom";
import Logo from "../assets/images/logo.jpg";
import defaultAvatar from "../assets/images/defaultuseravatar.png";
import QuizSkeletonLoader from "./QuizSkeletonLoader";
import { useSimpleQuizViews } from "../hooks/useQuizViews";
import adsIcon from "../assets/images/ads.webp";

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

interface QuizStats {
    total_attempts: number;
    correct_attempts: number;
    wrong_attempts: number;
    accuracy: number;
    average_time: number;
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
    stats?: QuizStats;
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

const INFINITE_SCROLL_PAGE_SIZE = 10;
const SCROLL_THRESHOLD = 10; // Faqat 10px qolganda load qilish (juda sezgir)
const LOAD_DEBOUNCE = 50; // 50ms debounce (tezroq javob)
const LOAD_THROTTLE = 300; // 300ms throttle

const QuizPage: React.FC<QuizPageProps> = ({ theme = "dark" }: QuizPageProps) => {
    const navigate = useNavigate();
    const { questionId } = useParams<{ questionId: string }>();

    const {
        getStatistics,
        recordView: recordQuizView,
        initialize: initializeViews,
        getCurrentUserId
    } = useSimpleQuizViews();

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
        is_random: false,
        page_size: INFINITE_SCROLL_PAGE_SIZE
    });
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [submittingQuestions, setSubmittingQuestions] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
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

    const [activeCategory, setActiveCategory] = useState<number | "All">("All");
    const [applyingFilter, setApplyingFilter] = useState(false);
    const [bookmarking, setBookmarking] = useState<Set<number>>(new Set());

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Infinite scroll refs - OPTIMIZED
    const isLoadingRef = useRef(false);
    const isThrottledRef = useRef(false);
    const viewedQuizzesRef = useRef<Set<number>>(new Set());
    const initialLoadRef = useRef(false);
    const pageRef = useRef(1);
    const hasMoreRef = useRef(true);
    const lastScrollYRef = useRef(0);
    const lastLoadTimeRef = useRef(0);
    const scrollDirectionRef = useRef<'up' | 'down'>('down');
    const scrollCountRef = useRef(0);
    const isScrollingRef = useRef(false);

    const [bgSeed, setBgSeed] = useState<number>(Date.now());

    // ==================== STATISTICS FUNCTIONS ====================
    const fetchQuizStats = useCallback(async (quizId: number): Promise<void> => {
        try {
            const statsResponse = await quizAPI.getQuestionStats(quizId);
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

    // ==================== VIEW RECORDING FUNCTION ====================
    const recordView = useCallback(async (quizId: number): Promise<void> => {
        if (viewedQuizzesRef.current.has(quizId)) return;

        try {
            const result = await recordQuizView(quizId);
            if (result.success) {
                viewedQuizzesRef.current.add(quizId);
                setTimeout(() => {
                    fetchQuizStats(quizId);
                }, 100);
            }
        } catch (err) {
            console.error(`❌ Error recording view for quiz ${quizId}:`, err);
        }
    }, [recordQuizView, fetchQuizStats]);

    // ==================== ULTRA SENSITIVE INFINITE SCROLL FUNCTIONS ====================
    const loadQuizzes = useCallback(async (
        isInitialLoad: boolean = false,
        resetData: boolean = false,
        customFilters?: Partial<FilterOptions>
    ) => {
        if (isLoadingRef.current) {
            console.log(`🚫 Skipping load - already loading`);
            return;
        }

        // Throttle check
        const now = Date.now();
        if (now - lastLoadTimeRef.current < LOAD_THROTTLE) {
            console.log(`⏱️ Throttled - too frequent loads`);
            return;
        }

        if (isInitialLoad || resetData) {
            pageRef.current = 1;
            hasMoreRef.current = true;
        }

        if (!hasMoreRef.current && !isInitialLoad && !resetData) {
            console.log(`⏹️ No more quizzes to load`);
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
        lastLoadTimeRef.current = now;

        if (isInitialLoad) {
            setLoading(true);
            setIsInitialLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const filtersToUse = {
                ...filterOptions,
                ...customFilters,
                page: pageRef.current,
                page_size: INFINITE_SCROLL_PAGE_SIZE
            };

            if (filtersToUse.category === "All") {
                delete filtersToUse.category;
            }

            if (filtersToUse.search === "") {
                delete filtersToUse.search;
            }

            if (filtersToUse.is_random) {
                filtersToUse.ordering = '?';
            }

            console.log(`📥 Loading page ${pageRef.current}`);

            const result = await quizAPI.fetchQuizzes(filtersToUse);

            if (result.success && result.data) {
                let newQuizzes: Quiz[] = [];

                if (result.data.results && Array.isArray(result.data.results)) {
                    newQuizzes = result.data.results;
                    hasMoreRef.current = !!result.data.next;
                } else if (Array.isArray(result.data)) {
                    newQuizzes = result.data;
                    hasMoreRef.current = newQuizzes.length === INFINITE_SCROLL_PAGE_SIZE;
                }

                const formattedQuizzes: Quiz[] = newQuizzes.map((quiz: any) => ({
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
                        return formattedQuizzes;
                    }
                    const existingIds = new Set(prev.map(q => q.id));
                    const uniqueNewQuizzes = formattedQuizzes.filter(q => !existingIds.has(q.id));
                    return [...prev, ...uniqueNewQuizzes];
                });

                // Update hasMore state
                setHasMore(hasMoreRef.current);

                if (formattedQuizzes.length > 0) {
                    pageRef.current += 1;
                }

                // Record views
                const quizzesToRecord = resetData || isInitialLoad ? formattedQuizzes :
                    formattedQuizzes.filter(q => !viewedQuizzesRef.current.has(q.id));

                // Use Promise.all for parallel view recording
                const viewPromises = quizzesToRecord.map((quiz) =>
                    recordView(quiz.id).catch(error => {
                        console.error(`❌ Error recording view for quiz ${quiz.id}:`, error);
                    })
                );

                await Promise.all(viewPromises);

                console.log(`✅ Loaded ${formattedQuizzes.length} quizzes, hasMore: ${hasMoreRef.current}`);
            } else {
                console.error("❌ Failed to load quizzes:", result.error);
                hasMoreRef.current = false;
                setHasMore(false);
            }

        } catch (err: any) {
            console.error("❌ Load quizzes error:", err);
            hasMoreRef.current = false;
            setHasMore(false);
        } finally {
            isLoadingRef.current = false;
            if (isInitialLoad) {
                setLoading(false);
                setIsInitialLoading(false);
            } else {
                setLoadingMore(false);
            }
        }
    }, [filterOptions, navigate, recordView]);

    // ==================== ULTRA SENSITIVE SCROLL HANDLER ====================
    const handleScroll = useCallback(() => {
        if (!containerRef.current || isLoadingRef.current || !hasMoreRef.current) return;

        const container = containerRef.current;
        const { scrollTop, scrollHeight, clientHeight } = container;
        const currentScrollY = scrollTop;

        // Scroll direction tracking
        scrollDirectionRef.current = currentScrollY > lastScrollYRef.current ? 'down' : 'up';
        lastScrollYRef.current = currentScrollY;

        // Faqat pastga scroll qilganda load qilish
        if (scrollDirectionRef.current !== 'down') {
            return;
        }

        // Calculate scroll position
        const scrollPosition = scrollTop + clientHeight;
        const totalHeight = scrollHeight;
        const remaining = totalHeight - scrollPosition;

        // ULTRA SENSITIVE: Agar faqat 10px qolganda (juda sezgir)
        const shouldLoad = remaining <= SCROLL_THRESHOLD;

        if (shouldLoad) {
            scrollCountRef.current++;

            // Clear any existing timeout
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
            }

            // Minimal debounce for ultra sensitive scrolling
            loadTimeoutRef.current = setTimeout(() => {
                if (!isLoadingRef.current && hasMoreRef.current) {
                    console.log(`🔄 Ultra sensitive scroll triggered (${scrollCountRef.current})`);
                    loadQuizzes(false, false);
                }
            }, LOAD_DEBOUNCE);
        }
    }, [loadQuizzes]);

    // ==================== OPTIMIZED SCROLL EVENT LISTENER ====================
    const setupScrollListener = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        let ticking = false;
        let lastScrollTime = 0;

        const handleScrollEvent = () => {
            if (!ticking) {
                const now = Date.now();
                // Throttle scroll events for performance
                if (now - lastScrollTime > 16) { // ~60fps
                    requestAnimationFrame(() => {
                        handleScroll();
                        ticking = false;
                    });
                    ticking = true;
                    lastScrollTime = now;
                }
            }
        };

        // Use passive scroll listener for better performance
        container.addEventListener('scroll', handleScrollEvent, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScrollEvent);
        };
    }, [handleScroll]);

    // ==================== FILTER FUNCTIONS ====================
    const applyFilter = useCallback(async (newFilters: Partial<FilterOptions>) => {
        console.log("🔄 Applying filter:", newFilters);

        const updatedFilters = {
            ...filterOptions,
            ...newFilters,
            page: 1,
            page_size: INFINITE_SCROLL_PAGE_SIZE
        };

        setFilterOptions(updatedFilters);
        setApplyingFilter(true);

        if (newFilters.category !== undefined) {
            setActiveCategory(newFilters.category);
        }

        // Reset states
        viewedQuizzesRef.current.clear();
        setQuizStats(new Map());
        isLoadingRef.current = false;
        setShowFilterModal(false);
        setBgSeed(Date.now());

        try {
            await loadQuizzes(true, true, updatedFilters);
        } catch (error) {
            console.error("❌ Error applying filter:", error);
        } finally {
            setApplyingFilter(false);
        }

        // Scroll to top
        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [filterOptions, loadQuizzes]);

    const handleCategorySelect = useCallback((categoryId: number | "All") => {
        if (activeCategory === categoryId) return;
        setActiveCategory(categoryId);
        applyFilter({
            category: categoryId,
            is_random: false
        });
    }, [activeCategory, applyFilter]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            applyFilter({ search: query.trim() });
        }, 500);
    }, [applyFilter]);

    const resetFilters = useCallback(async () => {
        const defaultFilters: FilterOptions = {
            category: "All",
            ordering: "-created_at",
            is_random: false,
            page_size: INFINITE_SCROLL_PAGE_SIZE
        };

        setFilterOptions(defaultFilters);
        setActiveCategory("All");
        setSearchQuery("");
        setBgSeed(Date.now());

        // Reset scroll states
        pageRef.current = 1;
        hasMoreRef.current = true;
        viewedQuizzesRef.current.clear();
        isLoadingRef.current = false;

        await loadQuizzes(true, true, defaultFilters);
    }, [loadQuizzes]);

    // ==================== ANSWER SELECTION FUNCTIONS ====================
    const selectAnswer = async (quizId: number, answerId: number) => {
        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz || userInteractions.submittedQuizzes.has(quizId)) return;

        if (quiz.question_type === 'multiple') {
            handleMultipleChoice(quizId, answerId);
            return;
        }

        if (submittingQuestions.has(quizId) || userInteractions.submittedQuizzes.has(quizId)) return;

        setUserInteractions(prev => ({
            ...prev,
            selectedAnswers: new Map(prev.selectedAnswers).set(quizId, [answerId])
        }));

        setSubmittingQuestions(prev => new Set(prev).add(quizId));
        try {
            const res = await quizAPI.submitAnswers({
                question: quizId,
                selected_answer_ids: [answerId]
            });

            const isCorrect = res.data?.is_correct;
            console.log(`✅ Answer submitted for quiz ${quizId}: correct=${isCorrect}`);

            setQuizData(prev => prev.map(q => {
                if (q.id === quizId) {
                    const currentCorrect = q.correct_count || 0;
                    const currentWrong = q.wrong_count || 0;

                    const newCorrectCount = isCorrect ? currentCorrect + 1 : currentCorrect;
                    const newWrongCount = !isCorrect ? currentWrong + 1 : currentWrong;
                    const newTotal = newCorrectCount + newWrongCount;

                    return {
                        ...q,
                        correct_count: newCorrectCount,
                        wrong_count: newWrongCount,
                        stats: q.stats ? {
                            ...q.stats,
                            correct_attempts: newCorrectCount,
                            wrong_attempts: newWrongCount,
                            total_attempts: newTotal,
                            accuracy: newTotal > 0 ? (newCorrectCount / newTotal) * 100 : 0
                        } : {
                            total_attempts: newTotal,
                            correct_attempts: newCorrectCount,
                            wrong_attempts: newWrongCount,
                            accuracy: newTotal > 0 ? (newCorrectCount / newTotal) * 100 : 0,
                            average_time: 0
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

            setTimeout(async () => {
                try {
                    if (isCorrect) {
                        await quizAPI.incrementCorrectCount(quizId);
                    } else {
                        await quizAPI.incrementWrongCount(quizId);
                    }
                    fetchQuizStats(quizId);
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

        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz) return;

        setSubmittingQuestions(prev => new Set(prev).add(quizId));
        try {
            const res = await quizAPI.submitAnswers({
                question: quizId,
                selected_answer_ids: selected
            });

            const isCorrect = res.data?.is_correct;
            console.log(`✅ Multiple choice submitted for quiz ${quizId}: correct=${isCorrect}`);

            setQuizData(prev => prev.map(q => {
                if (q.id === quizId) {
                    const currentCorrect = q.correct_count || 0;
                    const currentWrong = q.wrong_count || 0;

                    const newCorrectCount = isCorrect ? currentCorrect + 1 : currentCorrect;
                    const newWrongCount = !isCorrect ? currentWrong + 1 : currentWrong;
                    const newTotal = newCorrectCount + newWrongCount;

                    return {
                        ...q,
                        correct_count: newCorrectCount,
                        wrong_count: newWrongCount,
                        stats: q.stats ? {
                            ...q.stats,
                            correct_attempts: newCorrectCount,
                            wrong_attempts: newWrongCount,
                            total_attempts: newTotal,
                            accuracy: newTotal > 0 ? (newCorrectCount / newTotal) * 100 : 0
                        } : {
                            total_attempts: newTotal,
                            correct_attempts: newCorrectCount,
                            wrong_attempts: newWrongCount,
                            accuracy: newTotal > 0 ? (newCorrectCount / newTotal) * 100 : 0,
                            average_time: 0
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

                const correctAnswer = quiz.answers.find(a => a.is_correct);
                if (correctAnswer) {
                    setCoinAnimation({ quizId, answerId: correctAnswer.id, show: true });
                    setTimeout(() => setCoinAnimation(null), 2000);
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
                    if (isCorrect) {
                        await quizAPI.incrementCorrectCount(quizId);
                    } else {
                        await quizAPI.incrementWrongCount(quizId);
                    }
                    fetchQuizStats(quizId);
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
                    // No need to set quizReactions since we don't use it
                } else {
                    // No need to set quizReactions since we don't use it
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

    // ==================== NAVIGATION TO USER PROFILE ====================
    const navigateToUserProfile = (userId: number, username: string) => {
        navigate(`/profile/${username}?userId=${userId}`);
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

    // ==================== REACTION MENU ====================
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
                                    <span className="absolute -top-2 -right-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
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

    // ==================== DROPDOWN MENU ====================
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
        if (quiz?.correct_count !== undefined && quiz.correct_count !== null) {
            return quiz.correct_count;
        }

        const stats = quizStats.get(quizId);
        if (stats?.correct_attempts !== undefined && stats.correct_attempts !== null) {
            return stats.correct_attempts;
        }

        return 0;
    }, [quizData, quizStats]);

    const getWrongCount = useCallback((quizId: number): number => {
        const quiz = quizData.find(q => q.id === quizId);
        if (quiz?.wrong_count !== undefined && quiz.wrong_count !== null) {
            return quiz.wrong_count;
        }

        const stats = quizStats.get(quizId);
        if (stats?.wrong_attempts !== undefined && stats.wrong_attempts !== null) {
            return stats.wrong_attempts;
        }

        return 0;
    }, [quizData, quizStats]);

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
                        const quiz: any = quizRes.data;

                        const formattedQuiz = {
                            ...quiz,
                            correct_count: quiz.correct_count || quiz.correct_attempts || 0,
                            wrong_count: quiz.wrong_count || quiz.wrong_attempts || 0,
                            view_count: quiz.view_count || quiz.total_views || 0,
                            unique_viewers: quiz.unique_viewers || 0,
                            stats: quiz.stats || {
                                total_attempts: (quiz.correct_count || 0) + (quiz.wrong_count || 0),
                                correct_attempts: quiz.correct_count || 0,
                                wrong_attempts: quiz.wrong_count || 0,
                                accuracy: quiz.accuracy || 0,
                                average_time: quiz.average_time || 0,
                            }
                        };

                        setQuizData([formattedQuiz]);
                        setHasMore(false);
                        hasMoreRef.current = false;

                        await recordView(id);
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
            if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
        };
    }, [questionId, loadCategories, initializeViews, recordView, loadQuizzes]);

    // Setup scroll listener for ultra sensitive infinite scroll
    useEffect(() => {
        const cleanup = setupScrollListener();
        return cleanup;
    }, [setupScrollListener]);

    // ==================== FILTER MODAL ====================
    const renderFilterModal = () => {
        if (!showFilterModal) return null;

        return (
            <div className="fixed inset-0 max-w-2xl mx-auto z-50 bg-black/90 backdrop-blur-sm">
                <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/95 to-transparent border-b border-white/10">
                    <button
                        onClick={() => setShowFilterModal(false)}
                        className="p-2 text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="text-white font-semibold text-lg">Filterlar</div>
                    <button
                        onClick={resetFilters}
                        className="px-4 py-1.5 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors"
                    >
                        Tozalash
                    </button>
                </div>

                <div className="h-full pt-16 pb-20 overflow-y-auto">
                    <div className="px-4 py-6">
                        <div className="mb-8">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Savollarni qidiring..."
                                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                                />
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-white font-semibold text-lg mb-4">Kategoriyalar</h3>
                            <div className="flex space-x-3 overflow-y-auto pb-2 scrollbar-hide flex-col">
                                <button
                                    onClick={() => handleCategorySelect("All")}
                                    className={`flex-shrink-0 px-5 py-3 rounded-full transition-all duration-300 ${activeCategory === "All"
                                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                                        : "bg-white/10 text-white hover:bg-white/20"
                                    }`}
                                >
                                    <span className="font-medium">Barchasi</span>
                                </button>
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => handleCategorySelect(category.id)}
                                        className={`flex-shrink-0 px-5 py-3 rounded-full transition-all duration-300 flex items-center gap-2 ${activeCategory === category.id
                                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                                            : "bg-white/10 text-white hover:bg-white/20"
                                        }`}
                                    >
                                        <span className="text-lg">{category.emoji}</span>
                                        <span className="font-medium">{category.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-10">
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-xl shadow-blue-500/25 active:scale-[0.98]"
                            >
                                Natijalarni ko'rish
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ==================== HEADER ====================
    const renderHeader = () => {
        return (
            <div className="fixed top-0 left-0 right-0 z-40 max-w-2xl mx-auto bg-gradient-to-b from-black/95 to-transparent backdrop-blur-lg border-b border-white/10">
                <div className="container mx-auto px-4 md:py-3 py-1">
                    <div className="flex items-center justify-between">
                        <div onClick={() => { navigate(`https://t.me/testabduz`) }} className="flex items-center gap-3 md:py-2 py-1 px-1 cursor-pointer md:h-auto" title={"Telegram Group"}>
                            <img src={Logo} alt="logo" className="w-10 h-10 md:w-14 md:h-14 rounded-sm" />
                            <div>
                                <h1 className="text-white font-bold md:text-lg text-sm flex flex-row items-center">Telegram <img src={adsIcon} alt="ads" className={"flex w-12 h-10"} /></h1>
                                <p className="text-gray-400 md:text-xs text-[11px]">TestAbd.uz rasmiy telegram kanali bu yerda siz TestAbd haqida to'liq bilib olasiz va uangiliklardan xabardor bo'lasiz.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowFilterModal(true)}
                                className={`md:p-3 p-2 rounded-full transition-all duration-200 ${activeCategory !== "All" || searchQuery || filterOptions.worked || filterOptions.unworked
                                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                                    : "bg-white/10 text-white hover:bg-white/20"
                                }`}
                            >
                                <Filter className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ==================== QUESTION CONTENT RENDER ====================
    const renderQuestionContent = (quiz: Quiz) => {
        const selectedAnswers = userInteractions.selectedAnswers.get(quiz.id) || [];
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

                let bgColor = 'bg-white/5';
                let borderColor = 'border-white/10';
                let textColor = 'text-white';

                if (hasSubmitted) {
                    if (isCorrect) {
                        bgColor = 'bg-green-500/20';
                        borderColor = 'border-green-500/50';
                        textColor = 'text-green-100';
                    } else if (isSelected && !isCorrect) {
                        bgColor = 'bg-red-500/20';
                        borderColor = 'border-red-500/50';
                        textColor = 'text-red-100';
                    }
                } else if (isSelected) {
                    bgColor = 'bg-blue-500/20';
                    borderColor = 'border-blue-500/50';
                }

                return (
                    <div
                        key={answer.id}
                        className={`md:p-3 p-2 w-[85%] rounded-2xl border transition-all duration-300 cursor-pointer ${bgColor} ${borderColor} ${isShaking ? 'animate-shake' : ''
                        } ${!hasSubmitted ? 'hover:bg-white/10 active:scale-[0.98]' : ''}`}
                        onClick={() => {
                            if (!hasSubmitted && !isSubmitting) {
                                if (isMultipleChoice) {
                                    handleMultipleChoice(quiz.id, answer.id);
                                } else {
                                    selectAnswer(quiz.id, answer.id);
                                }
                            }
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`md:w-12 md:h-12 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-white/10'
                            } ${hasSubmitted && isCorrect ? 'bg-gradient-to-r from-green-500 to-emerald-600' : ''} ${hasSubmitted && isSelected && !isCorrect ? 'bg-gradient-to-r from-red-500 to-rose-600' : ''
                            }`}>
                                <span className="font-bold md:text-lg text-sm text-white">{letter}</span>
                            </div>
                            <div className="flex-1">
                                <div className={`${textColor} md:text-xl text-xs`}>{answer.answer_text}</div>
                            </div>
                            {hasSubmitted && isCorrect && (
                                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full">
                                    <Check className="md:w-5 md:h-5 w-2 h-2 text-white" />
                                </div>
                            )}
                            {hasSubmitted && isSelected && !isCorrect && (
                                <div className="p-2 bg-gradient-to-r from-red-500 to-rose-600 rounded-full">
                                    <X className="md:w-5 md:h-5 w-2 h-2 text-white" />
                                </div>
                            )}
                            {isMultipleChoice && !hasSubmitted && (
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-transparent' : 'border-white/30'
                                }`}>
                                    {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                </div>
                            )}
                        </div>
                    </div>
                );
            });
        };

        const renderSubmitButton = () => {
            if (hasSubmitted) {
                return null;
            }

            if (isMultipleChoice) {
                const hasSelectedAnswers = selectedAnswers.length > 0;
                return (
                    <div className="mt-6">
                        <button
                            onClick={() => submitMultipleChoice(quiz.id)}
                            disabled={!hasSelectedAnswers || isSubmitting}
                            className={`w-full py-4 rounded-2xl font-semibold transition-all duration-300 shadow-xl ${hasSelectedAnswers && !isSubmitting
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/35 active:scale-[0.98]'
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
                    <div>
                    </div>
                );
            }

            return null;
        };

        return (
            <div className="space-y-6">
                {quiz.media && (
                    <div className="relative rounded-2xl overflow-hidden mb-6 shadow-xl group">
                        {quiz.media.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                                src={quiz.media}
                                alt="Question media"
                                className="w-full h-auto max-h-80 object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        ) : quiz.media.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video
                                src={quiz.media}
                                className="w-full h-auto max-h-80 rounded-2xl"
                                controls
                            />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl"></div>
                    </div>
                )}

                <div className="space-y-3">
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

    // ==================== BACKGROUND IMAGE FUNCTION ====================
    const getBackgroundImageUrl = useCallback(() => {
        const width = 672;
        const height = Math.floor(window.innerHeight * 0.9);
        return `https://picsum.photos/seed/${bgSeed}/${width}/${height}`;
    }, [bgSeed]);

    // ==================== MAIN RENDER ====================
    if (isInitialLoading && quizData.length === 0) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-950">
                {renderHeader()}
                <div className="h-[90vh] mt-16 overflow-y-auto">
                    <QuizSkeletonLoader />
                </div>
            </div>
        );
    }

    if (loading && quizData.length === 0) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-950">
                {renderHeader()}
                <div className="h-[90vh] mt-16 flex flex-col items-center justify-center">
                    <div className="text-center">
                        <div className="w-20 h-20 border-[3px] border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
                        <p className="text-white text-xl font-semibold">Yuklanmoqda...</p>
                        <p className="text-gray-400 mt-2">Savollar tayyorlanmoqda</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!loading && quizData.length === 0) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-950">
                {renderHeader()}
                <div className="h-[90vh] mt-16 flex items-center justify-center px-4">
                    <div className="text-center max-w-md">
                        <div className="text-7xl mb-6 animate-pulse">🔍</div>
                        <h2 className="text-2xl text-white mb-3 font-semibold">Savollar topilmadi</h2>
                        <p className="text-gray-400 mb-8">Boshqa filterlar bilan qayta urinib ko'ring</p>
                        <button
                            onClick={() => setShowFilterModal(true)}
                            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/35 active:scale-95 flex items-center gap-2 mx-auto"
                        >
                            <Filter size={20} />
                            Filterlarni o'zgartirish
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
                
                .slider-thumb::-webkit-slider-thumb {
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
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
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
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

                .instagram-scroll-container {
                    scroll-snap-type: y proximity;
                }
                
                .instagram-post {
                    scroll-snap-align: start;
                    min-height: 90vh;
                }
            `}</style>

            {renderHeader()}
            {renderFilterModal()}

            {/* Background image */}
            <div
                className="fixed inset-0 z-0 max-w-2xl mx-auto"
                style={{
                    backgroundImage: `url(${getBackgroundImageUrl()})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed',
                    opacity: 0.3,
                    filter: 'blur(4px)',
                }}
            />

            {/* Main content with ULTRA SENSITIVE infinite scroll */}
            <div
                ref={containerRef}
                className="h-[90vh] mt-16 overflow-y-auto scrollbar-hide instagram-scroll-container relative z-10"
            >
                <div className="container mt-14 mx-auto max-w-2xl pb-24">
                    {quizData.map((quiz) => {
                        const userReaction = userInteractions.reactions.get(quiz.id);
                        const finalViewCount = getFinalViewCount(quiz.id);
                        const correctCount = getCorrectCount(quiz.id);
                        const wrongCount = getWrongCount(quiz.id);

                        return (
                            <div
                                key={quiz.id}
                                className="mb-4 min-h-[80vh] justify-center bg-gradient-to-br items-center w-2xl from-black/80 via-black/70 to-black/80 backdrop-blur-xl border border-white/10 overflow-hidden rounded-2xl instagram-post"
                                style={{
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
                                    marginBottom: '24px'
                                }}
                            >
                                <div className="flex flex-col justify-center my-auto h-full md:mt-36 mt-20">
                                    <div className="px-4 my-auto h-auto absoute top-50">
                                        <div className="text-white font-medium mb-3 md:text-2xl text-md bg-black/50 backdrop-blur-sm p-4 rounded-2xl">
                                            {quiz.question_text}
                                        </div>

                                        {quiz.media && (
                                            <div className="rounded-xl overflow-hidden mb-4 shadow-lg">
                                                {quiz.media.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                    <img
                                                        src={quiz.media}
                                                        alt="Question media"
                                                        className="w-full h-auto max-h-96 object-cover"
                                                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                        }}
                                                    />
                                                ) : quiz.media.match(/\.(mp4|webm|ogg)$/i) ? (
                                                    <video
                                                        src={quiz.media}
                                                        className="w-full h-auto max-h-96"
                                                        controls
                                                    />
                                                ) : null}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {quiz.has_worked && (
                                                <span className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-full text-xs flex items-center gap-1 backdrop-blur-sm">
                                                    <Check size={12} /> Ishlangan
                                                </span>
                                            )}
                                            {quiz.difficulty_percentage > 0 && (
                                                <span className="px-3 py-1.5 bg-yellow-500/20 text-yellow-300 rounded-full text-xs flex items-center gap-1 backdrop-blur-sm">
                                                    <Zap size={12} /> {quiz.difficulty_percentage}% qiyin
                                                </span>
                                            )}
                                            {quiz.category && (
                                                <span className="md:px-3 px-2 md:py-1.5 py-1 bg-purple-500/20 text-purple-300 rounded-full md:text-xs text-[11px] backdrop-blur-sm">
                                                    {quiz.category.title}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            {renderQuestionContent(quiz)}
                                        </div>
                                    </div>

                                    <div className="md:px-4 px-1 md:py-4 py-2 fixed bottom-52 right-0 flex-col flex w-auto border border-gray-800/50" style={{ backgroundColor: "rgba(0, 0, 0, 0.7)", borderTopLeftRadius: "30px", borderBottomLeftRadius: "30px", backdropFilter: 'blur(10px)' }}>
                                        <div className="flex items-center flex-col justify-between mb-3 gap-2">
                                            <div className="flex items-center gap-4 flex-col">
                                                <div className="text-center flex flex-col items-center gap-1">
                                                    <div className="bg-green-600/80 backdrop-blur-sm md:w-10 md:h-10 w-6 h-6 p-1.5 rounded-full flex items-center justify-center">
                                                        <Check size={20} className={"text-white font-semibold"} />
                                                    </div>
                                                    <div className="text-green-400 font-bold md:text-md text-xs">{correctCount}</div>
                                                </div>
                                                <div className="text-center flex flex-col items-center gap-1">
                                                    <div className="bg-red-600/80 backdrop-blur-sm md:w-10 md:h-10 w-6 h-6 p-1.5 rounded-full flex items-center justify-center">
                                                        <X size={20} className={"text-white font-semibold"} />
                                                    </div>
                                                    <div className="text-red-400 font-bold md:text-md text-xs">{wrongCount}</div>
                                                </div>
                                                <div className="text-center flex flex-col items-center gap-1">
                                                    <div className="bg-blue-600/80 backdrop-blur-sm md:w-10 md:h-10 w-6 h-6 p-1.5 rounded-full flex items-center justify-center">
                                                        <Eye size={20} className={"text-white font-semibold"} />
                                                    </div>
                                                    <div className="text-blue-400 font-bold md:text-md text-xs">{finalViewCount}</div>
                                                </div>
                                            </div>

                                            <div className="relative gap-3 flex-col flex">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowReactions(showReactions === quiz.id ? null : quiz.id);
                                                    }}
                                                    className={`p-2 rounded-full backdrop-blur-sm ${userReaction
                                                        ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/15 border border-yellow-500/30 text-yellow-400'
                                                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                                    }`}
                                                >
                                                    {isReacting.has(quiz.id) ? (
                                                        <Loader2 size={18} className="animate-spin" />
                                                    ) : (
                                                        <Heart size={18} fill={userReaction ? "currentColor" : "none"} />
                                                    )}
                                                </button>
                                                {showReactions === quiz.id && renderReactionsMenu(quiz.id)}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowDropdown(showDropdown === quiz.id ? null : quiz.id);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-white relative backdrop-blur-sm bg-white/5 rounded-full border border-white/10"
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                    {showDropdown === quiz.id && renderDropdownMenu(quiz.id)}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 fixed bottom-14 w-full max-w-2xl">
                                        <div className="flex items-center justify-between backdrop-blur-lg bg-black/50 rounded-2xl p-3 border border-white/10">
                                            <div
                                                className="flex items-center gap-5 cursor-pointer hover:opacity-80 transition-opacity w-full justify-between"
                                            >
                                                <div className="flex items-center gap-2" onClick={() => navigateToUserProfile(quiz.user.id, quiz.user.username)}>
                                                    <img
                                                        src={quiz.user.profile_image || defaultAvatar}
                                                        alt={quiz.user.username}
                                                        className="w-10 h-10 rounded-full border-2 border-white/30"
                                                    />
                                                    <div>
                                                        <div className="text-white font-semibold md:text-md text-sm hover:text-blue-400 transition-colors">
                                                            @{quiz.user.username}
                                                        </div>
                                                        <div className="text-gray-400 text-xs">{quiz.test_title}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleFollowToggle(quiz.id)}
                                                    className="px-4 py-1.5 md:text-sm text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 active:scale-95 backdrop-blur-sm"
                                                >
                                                    {quiz.user.is_following ? 'Following' : 'Follow'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Loading indicator */}
                    {loadingMore && (
                        <div className="py-8 flex justify-center backdrop-blur-sm bg-black/30 rounded-2xl mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 border-2 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
                                <span className="text-gray-300">Yangi savollar yuklanmoqda...</span>
                            </div>
                        </div>
                    )}

                    {!hasMore && quizData.length > 0 && !loadingMore && (
                        <div className="py-8 text-center backdrop-blur-sm bg-black/30 rounded-2xl mb-24">
                            <div className="text-gray-300 mb-2">Barcha savollarni ko'rib chiqdingiz 👏</div>
                            <div className="text-gray-400 text-sm mb-4">Yangilarini ko'rish uchun filterni o'zgartiring</div>
                            <button
                                onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white rounded-full text-sm hover:from-blue-500/30 hover:to-purple-600/30 transition-colors border border-white/10"
                            >
                                Boshiga qaytish
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizPage;