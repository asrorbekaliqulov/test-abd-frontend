"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Share, Bookmark, X, Check, Loader2, Filter, Eye, MoreVertical, Heart, Zap } from "lucide-react";
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
const SCROLL_THRESHOLD = 100;
const DEBOUNCE_DELAY = 300;

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
    const scrollDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Infinite scroll refs
    const isLoadingRef = useRef(false);
    const viewedQuizzesRef = useRef<Set<number>>(new Set());
    const initialLoadRef = useRef(false);
    const pageRef = useRef(1);
    const hasMoreRef = useRef(true);
    const lastLoadTimeRef = useRef(0);
    
    // Scroll uchun state'lar
    const currentQuizIndexRef = useRef(0);
    const isScrollingRef = useRef(false);
    const lastScrollYRef = useRef(0);
    const touchStartYRef = useRef(0);

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

    // ==================== LOAD RANDOM QUIZZES (quiz/random) ====================
    const loadRandomQuizzes = useCallback(async (
        isInitialLoad: boolean = false,
        resetData: boolean = false
    ) => {
        if (isLoadingRef.current) return;

        const now = Date.now();
        if (now - lastLoadTimeRef.current < 1000) {
            return;
        }

        if (isInitialLoad || resetData) {
            pageRef.current = 1;
            hasMoreRef.current = true;
            currentQuizIndexRef.current = 0;
        }

        if (!hasMoreRef.current && !isInitialLoad && !resetData) {
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
            // FAQQAT quiz/random API dan yuklaymiz
            const result = await quizAPI.fetchRandomQuizzes({
                page: pageRef.current,
                page_size: INFINITE_SCROLL_PAGE_SIZE,
            });

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

                setHasMore(hasMoreRef.current);

                if (formattedQuizzes.length > 0) {
                    pageRef.current += 1;
                }

                // Record views
                const quizzesToRecord = resetData || isInitialLoad ? formattedQuizzes :
                    formattedQuizzes.filter(q => !viewedQuizzesRef.current.has(q.id));

                // Parallel view recording
                const viewPromises = quizzesToRecord.map((quiz) =>
                    recordView(quiz.id).catch(error => {
                        console.error(`❌ Error recording view for quiz ${quiz.id}:`, error);
                    })
                );

                await Promise.all(viewPromises);

            } else {
                hasMoreRef.current = false;
                setHasMore(false);
            }

        } catch (err: any) {
            console.error("❌ Load random quizzes error:", err);
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
    }, [navigate, recordView]);

    // ==================== LOAD FILTERED QUIZZES (quiz/qs/category=?) ====================
    const loadFilteredQuizzes = useCallback(async (
        categoryId: number,
        isInitialLoad: boolean = false,
        resetData: boolean = false
    ) => {
        if (isLoadingRef.current) return;

        const now = Date.now();
        if (now - lastLoadTimeRef.current < 1000) {
            return;
        }

        if (isInitialLoad || resetData) {
            pageRef.current = 1;
            hasMoreRef.current = true;
            currentQuizIndexRef.current = 0;
        }

        if (!hasMoreRef.current && !isInitialLoad && !resetData) {
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
            // FAQQAT quiz/qs/category=? API dan yuklaymiz
            const result = await quizAPI.fetchQuizzesByCategory(categoryId, {
                page: pageRef.current,
                page_size: INFINITE_SCROLL_PAGE_SIZE,
            });

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

                setHasMore(hasMoreRef.current);

                if (formattedQuizzes.length > 0) {
                    pageRef.current += 1;
                }

                // Record views
                const quizzesToRecord = resetData || isInitialLoad ? formattedQuizzes :
                    formattedQuizzes.filter(q => !viewedQuizzesRef.current.has(q.id));

                const viewPromises = quizzesToRecord.map((quiz) =>
                    recordView(quiz.id).catch(error => {
                        console.error(`❌ Error recording view for quiz ${quiz.id}:`, error);
                    })
                );

                await Promise.all(viewPromises);

            } else {
                hasMoreRef.current = false;
                setHasMore(false);
            }

        } catch (err: any) {
            console.error("❌ Load filtered quizzes error:", err);
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
    }, [navigate, recordView]);

    // ==================== MAIN LOAD FUNCTION ====================
    const loadQuizzes = useCallback(async (
        isInitialLoad: boolean = false,
        resetData: boolean = false
    ) => {
        const isRandomMode = activeCategory === "All";

        if (isRandomMode) {
            await loadRandomQuizzes(isInitialLoad, resetData);
        } else {
            await loadFilteredQuizzes(activeCategory as number, isInitialLoad, resetData);
        }
    }, [loadRandomQuizzes, loadFilteredQuizzes, activeCategory]);

    // ==================== INSTAGRAM-STYLE INFINITE SCROLL ====================
    const handleScroll = useCallback(() => {
        if (!containerRef.current || isScrollingRef.current) return;

        const container = containerRef.current;
        const currentScrollY = container.scrollTop;
        const scrollDelta = currentScrollY - lastScrollYRef.current;

        // Pastga scroll qilish (positive delta)
        if (scrollDelta > SCROLL_THRESHOLD) {
            // Keyingi quizga o'tish
            moveToNextQuiz();
        }
        // Yuqoriga scroll qilish (negative delta)
        else if (scrollDelta < -SCROLL_THRESHOLD) {
            // Oldingi quizga o'tish
            moveToPrevQuiz();
        }

        lastScrollYRef.current = currentScrollY;

        // Agar oxirgi quizga yetib borgan bo'lsa, yangi quizlar yuklash
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const scrollBottom = scrollHeight - (currentScrollY + clientHeight);

        // 8-raqamli quizga yetganda yangi 10ta yuklash (faqat random mode uchun)
        if (activeCategory === "All" && 
            currentQuizIndexRef.current >= quizData.length - 2 && 
            !isLoadingRef.current && 
            hasMoreRef.current) {
            loadMoreQuizzes();
        }
        // Filter mode uchun ham oxirgi 2tasida yuklash
        else if (activeCategory !== "All" && 
                 currentQuizIndexRef.current >= quizData.length - 2 && 
                 !isLoadingRef.current && 
                 hasMoreRef.current) {
            loadMoreQuizzes();
        }
    }, [quizData.length, activeCategory]);

    const moveToNextQuiz = useCallback(() => {
        if (isScrollingRef.current || !containerRef.current) return;

        isScrollingRef.current = true;
        currentQuizIndexRef.current = Math.min(
            currentQuizIndexRef.current + 1,
            quizData.length - 1
        );

        scrollToQuiz(currentQuizIndexRef.current);

        setTimeout(() => {
            isScrollingRef.current = false;
        }, DEBOUNCE_DELAY);
    }, [quizData.length]);

    const moveToPrevQuiz = useCallback(() => {
        if (isScrollingRef.current || !containerRef.current) return;

        isScrollingRef.current = true;
        currentQuizIndexRef.current = Math.max(currentQuizIndexRef.current - 1, 0);
        scrollToQuiz(currentQuizIndexRef.current);

        setTimeout(() => {
            isScrollingRef.current = false;
        }, DEBOUNCE_DELAY);
    }, []);

    const scrollToQuiz = useCallback((index: number) => {
        if (!containerRef.current) return;

        const quizHeight = window.innerHeight * 0.9; // 90vh
        const targetScroll = index * quizHeight;

        containerRef.current.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
    }, []);

    const loadMoreQuizzes = useCallback(() => {
        if (isLoadingRef.current || !hasMoreRef.current) return;

        if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
        }

        loadTimeoutRef.current = setTimeout(() => {
            loadQuizzes(false, false);
        }, 500);
    }, [loadQuizzes]);

    // ==================== TOUCH HANDLERS FOR MOBILE ====================
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!containerRef.current) return;
        touchStartYRef.current = e.touches[0].clientY;
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!containerRef.current || isScrollingRef.current) return;
        
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchStartYRef.current - touchEndY;
        
        if (Math.abs(deltaY) < 50) return; // Minimal swipe uchun
        
        isScrollingRef.current = true;

        if (deltaY > 0) {
            // Pastga swipe (keyingi quiz)
            moveToNextQuiz();
        } else {
            // Yuqoriga swipe (oldingi quiz)
            moveToPrevQuiz();
        }

        setTimeout(() => {
            isScrollingRef.current = false;
        }, DEBOUNCE_DELAY);
    }, [moveToNextQuiz, moveToPrevQuiz]);

    // ==================== SETUP SCROLL LISTENER ====================
    const setupScrollListener = useCallback(() => {
        const container = containerRef.current;
        if (!container) return () => { };

        const handleScrollEvent = () => {
            if (scrollDebounceRef.current) {
                clearTimeout(scrollDebounceRef.current);
            }

            scrollDebounceRef.current = setTimeout(() => {
                handleScroll();
            }, 50);
        };

        container.addEventListener('scroll', handleScrollEvent, { passive: true });
        
        return () => {
            container.removeEventListener('scroll', handleScrollEvent);
            if (scrollDebounceRef.current) {
                clearTimeout(scrollDebounceRef.current);
            }
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
            }
        };
    }, [handleScroll]);

    // ==================== FILTER FUNCTIONS ====================
    const applyFilter = useCallback(async (categoryId: number | "All") => {
        setActiveCategory(categoryId);
        setApplyingFilter(true);

        // Reset states
        viewedQuizzesRef.current.clear();
        setQuizStats(new Map());
        isLoadingRef.current = false;
        currentQuizIndexRef.current = 0;
        lastScrollYRef.current = 0;
        setShowFilterModal(false);
        setBgSeed(Date.now());

        try {
            if (categoryId === "All") {
                // Random mode - quiz/random API dan yuklash
                await loadRandomQuizzes(true, true);
            } else {
                // Filter mode - quiz/qs/category=? API dan yuklash
                await loadFilteredQuizzes(categoryId, true, true);
            }
        } catch (error) {
            console.error("❌ Error applying filter:", error);
        } finally {
            setApplyingFilter(false);
        }

        // Scroll to top
        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [loadRandomQuizzes, loadFilteredQuizzes]);

    const handleCategorySelect = useCallback((categoryId: number | "All") => {
        if (activeCategory === categoryId) return;
        applyFilter(categoryId);
    }, [activeCategory, applyFilter]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            console.log("Search:", query);
        }, 500);
    }, []);

    const resetFilters = useCallback(async () => {
        setActiveCategory("All");
        setSearchQuery("");
        setBgSeed(Date.now());

        // Reset scroll states
        pageRef.current = 1;
        hasMoreRef.current = true;
        viewedQuizzesRef.current.clear();
        isLoadingRef.current = false;
        currentQuizIndexRef.current = 0;
        lastScrollYRef.current = 0;

        await loadRandomQuizzes(true, true);
    }, [loadRandomQuizzes]);

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
                // Reaction muvaffaqiyatli qo'shildi
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

    // ==================== REACTION MENU (MARKAZGA) ====================
    const renderReactionsMenu = (quizId: number) => {
        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz) return null;

        const currentReaction = userInteractions.reactions.get(quizId);

        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowReactions(null);
                }}
            >
                <div
                    className="pointer-events-auto p-4 bg-gradient-to-b from-gray-900 to-black/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl transform -translate-y-16"
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
                                    className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative group
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
            </div>
        );
    };

    // ==================== DROPDOWN MENU (MARKAZGA) ====================
    const renderDropdownMenu = (quizId: number) => {
        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz) return null;

        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(null);
                }}
            >
                <div
                    className="pointer-events-auto p-4 bg-gradient-to-b from-gray-900 to-black/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl min-w-[200px] transform -translate-y-12 md:translate-x-[72%] translate-x-[12%]"
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

    // ==================== USER PROFILE SECTION (PASTGA) ====================
    const renderUserProfileSection = (quiz: Quiz) => (
        <div className="fixed bottom-16 border-t border-white/10 w-full">
            <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-3 rounded-xl transition-colors w-[95%]"
                onClick={() => navigateToUserProfile(quiz.user.id, quiz.user.username)}
            >
                <img
                    src={quiz.user.profile_image || defaultAvatar}
                    alt={quiz.user.username}
                    className="md:w-10 md:h-10 h-7 w-7 rounded-full border-2 border-white/30"
                />
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold hover:text-blue-400 transition-colors">
                            @{quiz.user.username}
                        </h3>
                        {quiz.user.is_following && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                                Following
                            </span>
                        )}
                    </div>
                    <p className="text-gray-400 md:text-sm text-xs">{quiz.test_title}</p>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleFollowToggle(quiz.id);
                    }}
                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 active:scale-95 backdrop-blur-sm ${
                        quiz.user.is_following 
                            ? 'bg-white/10 text-white hover:bg-white/20' 
                            : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                    }`}
                >
                    {quiz.user.is_following ? 'Following' : 'Follow'}
                </button>
            </div>
        </div>
    );

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
                        // Boshida random quizlarni yuklash
                        await loadRandomQuizzes(true, true);
                    }
                } else {
                    // Boshida random quizlarni yuklash
                    await loadRandomQuizzes(true, true);
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
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
        };
    }, [questionId, loadCategories, initializeViews, recordView, loadRandomQuizzes]);

    // Setup scroll listener
    useEffect(() => {
        const cleanup = setupScrollListener();
        return cleanup;
    }, [setupScrollListener]);

    // ==================== SIMPLIFIED FILTER MODAL ====================
    const renderFilterModal = () => {
        if (!showFilterModal) return null;

        return (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
                <div className="absolute max-w-2xl mx-auto top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/95 to-transparent border-b border-white/10">
                    <button
                        onClick={() => setShowFilterModal(false)}
                        className="p-2 text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="text-white font-semibold text-lg">Kategoriyalar</div>
                    <button
                        onClick={resetFilters}
                        className="px-4 py-1.5 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors"
                    >
                        Tozalash
                    </button>
                </div>

                <div className="h-full max-w-2xl mx-auto pt-16 pb-20 overflow-y-auto">
                    <div className="px-4 py-6">
                        <div className="mb-8">
                            <h3 className="text-white font-semibold text-lg mb-4">Kategoriyalar</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => handleCategorySelect("All")}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${activeCategory === "All"
                                        ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30"
                                        : "bg-white/5 hover:bg-white/10 border border-white/10"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${activeCategory === "All"
                                            ? "bg-gradient-to-r from-blue-500 to-purple-600"
                                            : "bg-white/10"
                                            }`}>
                                            <Filter className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-white font-medium">Barchasi (Random)</div>
                                            <div className="text-gray-400 text-sm">Tasodifiy savollar</div>
                                        </div>
                                    </div>
                                    {activeCategory === "All" && (
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategorySelect(category.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${activeCategory === category.id
                                        ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30"
                                        : "bg-white/5 hover:bg-white/10 border border-white/10"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${activeCategory === category.id
                                            ? "bg-gradient-to-r from-blue-500 to-purple-600"
                                            : "bg-white/10"
                                            }`}>
                                            <span className="text-lg">{category.emoji}</span>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-white font-medium">{category.title}</div>
                                            <div className="text-gray-400 text-sm">{category.slug}</div>
                                        </div>
                                    </div>
                                    {activeCategory === category.id && (
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    )}
                                </button>
                            ))}
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
                <div className="container mx-auto px-4 py-2">
                    <div className="flex items-center justify-between">
                        <div onClick={() => { navigate(`https://t.me/testabduz`) }} className="flex items-center gap-2 cursor-pointer" title={"Telegram Group"}>
                            <img src={Logo} alt="logo" className="w-10 h-10 rounded-sm" />
                            <div className="flex flex-col">
                                <h1 className="text-white font-bold text-sm flex flex-row items-center">Telegram <img src={adsIcon} alt="ads" className={"flex w-10 h-8"} /></h1>
                                <p className="text-gray-400 text-xs">TestAbd.uz rasmiy telegram kanali</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowFilterModal(true)}
                            className={`p-2 rounded-full transition-all duration-200 ${activeCategory !== "All"
                                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                                : "bg-white/10 text-white hover:bg-white/20"
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                        </button>
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
                return <div className="text-gray-400 text-center py-2 text-sm">Javob variantlari mavjud emas</div>;
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
                        className={`p-2.5 w-[85%] rounded-xl border transition-all duration-300 cursor-pointer ${bgColor} ${borderColor} ${isShaking ? 'animate-shake' : ''
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
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-white/10'
                            } ${hasSubmitted && isCorrect ? 'bg-gradient-to-r from-green-500 to-emerald-600' : ''} ${hasSubmitted && isSelected && !isCorrect ? 'bg-gradient-to-r from-red-500 to-rose-600' : ''
                            }`}>
                                <span className="font-bold text-sm text-white">{letter}</span>
                            </div>
                            <div className="flex-1">
                                <div className={`${textColor} text-sm`}>{answer.answer_text}</div>
                            </div>
                            {hasSubmitted && isCorrect && (
                                <div className="p-1.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}
                            {hasSubmitted && isSelected && !isCorrect && (
                                <div className="p-1.5 bg-gradient-to-r from-red-500 to-rose-600 rounded-full">
                                    <X className="w-3 h-3 text-white" />
                                </div>
                            )}
                            {isMultipleChoice && !hasSubmitted && (
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-transparent' : 'border-white/30'
                                }`}>
                                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
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
                    <div className="mt-4">
                        <button
                            onClick={() => submitMultipleChoice(quiz.id)}
                            disabled={!hasSelectedAnswers || isSubmitting}
                            className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${hasSelectedAnswers && !isSubmitting
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-2xl active:scale-[0.98]'
                                : 'bg-white/5 text-gray-400 cursor-not-allowed border border-white/10'
                                }`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-sm">Tekshirilmoqda...</span>
                                </div>
                            ) : 'Javobni tekshirish'}
                        </button>
                    </div>
                );
            }

            const hasSelectedAnswer = selectedAnswers.length > 0;
            if (!hasSelectedAnswer) {
                return null;
            }

            return null;
        };

        return (
            <div className="space-y-4">
                {quiz.media && (
                    <div className="relative rounded-xl overflow-hidden mb-4 group">
                        {quiz.media.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                                src={quiz.media}
                                alt="Question media"
                                className="w-full h-auto max-h-48 object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        ) : quiz.media.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video
                                src={quiz.media}
                                className="w-full h-auto max-h-48 rounded-xl"
                                controls
                            />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-xl"></div>
                    </div>
                )}

                <div className="space-y-2">
                    {renderAnswers()}
                </div>

                {renderSubmitButton()}
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
                        <div className="w-16 h-16 border-2 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-white font-semibold">Yuklanmoqda...</p>
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
                        <div className="text-6xl mb-4 animate-pulse">🔍</div>
                        <h2 className="text-xl text-white mb-2 font-semibold">Savollar topilmadi</h2>
                        <p className="text-gray-400 mb-6">Boshqa kategoriyalarni tanlab ko'ring</p>
                        <button
                            onClick={() => setShowFilterModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 active:scale-95 flex items-center gap-2 mx-auto"
                        >
                            <Filter size={18} />
                            Kategoriya tanlash
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
                    scroll-snap-type: y mandatory;
                }
                
                .instagram-post {
                    scroll-snap-align: start;
                    scroll-snap-stop: always;
                    height: 90vh;
                    flex-shrink: 0;
                }

                /* Loading animation */
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
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

            {/* Instagram-style scroll container */}
            <div
                ref={containerRef}
                className="h-[90vh] mt-14 overflow-y-auto scrollbar-hide instagram-scroll-container relative z-10"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div className="flex flex-col"> 
                    {quizData.map((quiz, index) => {
                        const userReaction = userInteractions.reactions.get(quiz.id);
                        const finalViewCount = getFinalViewCount(quiz.id);
                        const correctCount = getCorrectCount(quiz.id);
                        const wrongCount = getWrongCount(quiz.id);

                        return (
                            <div
                                key={quiz.id}
                                className="mx-auto md:max-w-2xl w-full py-4 px-3 instagram-post backdrop-blur-xl overflow-hidden animate-fadeIn relative"
                                style={{
                                    animationDelay: `${index * 0.05}s`
                                }}
                            >
                                <div className="h-full flex flex-col">
                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {quiz.has_worked && (
                                            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full md:text-xs text-[10px] flex items-center gap-1 backdrop-blur-sm">
                                                <Check size={10} /> Ishlangan
                                            </span>
                                        )}
                                        {quiz.difficulty_percentage > 0 && (
                                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full md:text-xs text-[10px] flex items-center gap-1 backdrop-blur-sm">
                                                <Zap size={10} /> {quiz.difficulty_percentage}% qiyin
                                            </span>
                                        )}
                                        {quiz.category && (
                                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full md:text-xs text-[10px] backdrop-blur-sm">
                                                {quiz.category.title}
                                            </span>
                                        )}
                                        {activeCategory === "All" && (
                                            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full md:text-xs text-[10px] flex items-center gap-1 backdrop-blur-sm">
                                                <Zap size={10} /> Random
                                            </span>
                                        )}
                                    </div>

                                    {/* Question text */}
                                    <div className="text-white font-medium mb-4 md:text-lg text-md bg-transparent backdrop-blur-sm p-4 rounded-xl">
                                        {quiz.question_text}
                                    </div>

                                    {quiz.media && (
                                        <div className="rounded-xl overflow-hidden mb-4 shadow-lg">
                                            {quiz.media.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                <img
                                                    src={quiz.media}
                                                    alt="Question media"
                                                    className="w-full h-auto max-h-48 object-cover"
                                                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                    }}
                                                />
                                            ) : quiz.media.match(/\.(mp4|webm|ogg)$/i) ? (
                                                <video
                                                    src={quiz.media}
                                                    className="w-full h-auto max-h-48"
                                                    controls
                                                />
                                            ) : null}
                                        </div>
                                    )}

                                    {/* Question content */}
                                    {renderQuestionContent(quiz)}

                                    {/* USER PROFILE SECTION (PASTGA) */}
                                    {renderUserProfileSection(quiz)}

                                    {/* Action buttons (ONG TOMON, MARKAZDA) */}
                                    <div className="absolute right-4 top-[40%] transform -translate-y-1/2 z-20">
                                        <div className="flex flex-col gap-2">
                                            {/* Reaction button */}
                                            
                                            <div className="mt-4 flex flex-col items-center justify-center gap-2 bg-transparent w-auto backdrop-blur-sm rounded-xl">
                                                <div className="text-center flex flex-col items-center">
                                                    <div className="bg-green-600/80 backdrop-blur-sm md:w-8 md:h-8 w-6 h-6 rounded-full flex items-center justify-center">
                                                        <Check className="text-white flex md:w-6 md:h-6 w-4 h-4" />
                                                    </div>
                                                    <div className="text-green-400 font-bold md:text-sm text-xs md:mt-1 mt-0">{correctCount}</div>
                                                </div>
                                                <div className="text-center flex flex-col items-center">
                                                    <div className="bg-red-600/80 backdrop-blur-sm md:w-8 md:h-8 w-6 h-6 rounded-full flex items-center justify-center">
                                                        <X className="text-white flex md:w-6 md:h-6 w-4 h-4" />
                                                    </div>
                                                    <div className="text-red-400 font-bold text-xs md:mt-1 mt-0">{wrongCount}</div>
                                                </div>
                                                <div className="text-center flex flex-col items-center">
                                                    <div className="bg-blue-600/80 backdrop-blur-sm md:w-8 md:h-8 w-6 h-6 rounded-full flex items-center justify-center">
                                                        <Eye className="text-white flex md:w-6 md:h-6 w-4 h-4" />
                                                    </div>
                                                    <div className="text-blue-400 font-bold text-xs md:mt-1 mt-0">{finalViewCount}</div>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowReactions(showReactions === quiz.id ? null : quiz.id);
                                                        setShowDropdown(null);
                                                    }}
                                                    className={`md:p-2 p-1 rounded-full backdrop-blur-sm shadow-lg ${
                                                        userReaction
                                                            ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/15 border border-yellow-500/30 text-yellow-400'
                                                            : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                                    }`}
                                                >
                                                    {isReacting.has(quiz.id) ? (
                                                        <Loader2 className="animate-spin w-4 h-4" />
                                                    ) : (
                                                        <Heart fill={userReaction ? "currentColor" : "none"} className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                            
                                            {/* More options button */}
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowDropdown(showDropdown === quiz.id ? null : quiz.id);
                                                        setShowReactions(null);
                                                    }}
                                                    className="md:p-2 p-1 text-white hover:text-white relative backdrop-blur-sm bg-white/5 rounded-full border border-white/10 shadow-lg"
                                                >
                                                    <MoreVertical className=" w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reactions menu (MARKAZGA) */}
                                {showReactions === quiz.id && renderReactionsMenu(quiz.id)}
                                
                                {/* Dropdown menu (MARKAZGA) */}
                                {showDropdown === quiz.id && renderDropdownMenu(quiz.id)}
                                
                                {/* Animations */}
                                {coinAnimation?.show && coinAnimation.quizId === quiz.id && (
                                    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                                        <div className="text-5xl animate-coin-bounce">
                                            🪙
                                            <div className="absolute inset-0 animate-ping text-yellow-400 opacity-30">🪙</div>
                                        </div>
                                    </div>
                                )}

                                {correctAnimation === quiz.id && (
                                    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                                        <div className="text-6xl animate-correct-pulse">
                                            <div className="relative">
                                                <div className="absolute inset-0 animate-ping text-green-400 opacity-30">✅</div>
                                                ✅
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Loading indicator */}
                    {loadingMore && (
                        <div className="instagram-post flex items-center justify-center bg-black/30 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 border-2 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
                                <span className="text-gray-300 text-sm">Yangi savollar yuklanmoqda...</span>
                            </div>
                        </div>
                    )}

                    {!hasMore && quizData.length > 0 && !loadingMore && (
                        <div className="instagram-post flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
                            <div className="text-center px-4">
                                <div className="text-5xl mb-3">👏</div>
                                <div className="text-gray-300 text-base mb-2">Barcha savollarni ko'rib chiqdingiz!</div>
                                <div className="text-gray-400 text-xs mb-4">Yangilarini ko'rish uchun filterni o'zgartiring</div>
                                <button
                                    onClick={() => {
                                        currentQuizIndexRef.current = 0;
                                        if (containerRef.current) {
                                            containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                    className="px-5 py-2 bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white rounded-lg text-xs hover:from-blue-500/30 hover:to-purple-600/30 transition-colors border border-white/10"
                                >
                                    Boshiga qaytish
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizPage;