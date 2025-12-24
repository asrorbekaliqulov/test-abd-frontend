"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Share, Bookmark, X, Send, Check, ThumbsUp, ThumbsDown, Loader2, Filter, Eye, MoreVertical, Smile, BarChart3, Flag, Download, Copy, EyeOff, Trash2 } from "lucide-react";
import { quizAPI, accountsAPI, quizViewsAPI } from "../utils/api";
import { Link, useParams, useNavigate } from "react-router-dom";
import Logo from "./assets/images/logo.jpg";
import defaultAvatar from "./assets/images/defaultuseravatar.png";
import QuizSkeletonLoader from "./QuizSkeletonLoader";

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
    views?: number;
    test_title: string;
    test_description: string;
    difficulty_percentage: number;
    is_bookmarked?: boolean;
    user: QuizUser;
    created_at: string;
    round_image: string | null;
    category?: string | Category | Category[] | null;
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
}

interface ReactionsSummary {
    coin: number;
    like: number;
    love: number;
    clap: number;
    insightful: number;
    total: number;
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
const PRELOAD_THRESHOLD = 8; // 8-savolda yangi yuklash
const MIN_QUIZZES_BEFORE_LOAD = 3; // Eng kamida 3 ta savol qolganda yangi yuklash

const QuizPage: React.FC<QuizPageProps> = ({ theme = "dark" }) => {
    const navigate = useNavigate();
    const { questionId } = useParams<{ questionId: string }>();

    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [quizData, setQuizData] = useState<Quiz[]>([]);
    const [userInteractions, setUserInteractions] = useState({
        selectedAnswers: new Map<number, number[]>(),
        textAnswers: new Map<number, string>(),
        answerStates: new Map<number, "correct" | "incorrect">(),
        reactions: new Map<number, string>(),
    });

    const [submittingQuestions, setSubmittingQuestions] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | "All">("All");
    const [modalOpen, setModalOpen] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const containerRef = useRef<HTMLDivElement>(null);

    // Refs
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isLoadingRef = useRef(false);
    const lastLoadMoreTimeRef = useRef(0);
    const currentBatchRef = useRef(0);
    const lastQuizIndexRef = useRef(0);
    const hasRenderedLoadingRef = useRef(false);
    const categoryBatchRef = useRef<Map<number, number>>(new Map());

    // Quiz Views State
    const [quizUniqueViewers, setQuizUniqueViewers] = useState<Map<number, number>>(new Map());
    const [viewedQuizzes, setViewedQuizzes] = useState<Set<number>>(new Set());

    // UI State'lar
    const [showReactions, setShowReactions] = useState<number | null>(null);
    const [showDropdown, setShowDropdown] = useState<number | null>(null);
    const [showReactionStats, setShowReactionStats] = useState<number | null>(null);
    const [isReacting, setIsReacting] = useState<Set<number>>(new Set());
    const [quizReactions, setQuizReactions] = useState<Map<number, QuizReaction>>(new Map());

    // Filter State
    const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
    const [categoryNextPageUrls, setCategoryNextPageUrls] = useState<Map<number, string | null>>(new Map());
    const [categoryHasMore, setCategoryHasMore] = useState<Map<number, boolean>>(new Map());
    const [categoryLoading, setCategoryLoading] = useState<Set<number>>(new Set());
    const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);

    // Helper Functions
    const getUniqueViewersCount = useCallback((quizId: number): number => {
        return quizUniqueViewers.get(quizId) || 0;
    }, [quizUniqueViewers]);

    const updateUniqueViewers = useCallback((quizId: number, count: number) => {
        setQuizUniqueViewers(prev => {
            const newMap = new Map(prev);
            newMap.set(quizId, count);
            return newMap;
        });
    }, []);

    const loadUniqueViewersFromAPI = useCallback(async (quizId: number) => {
        try {
            const result = await quizViewsAPI.getQuizViews(quizId);
            if (result.success && result.uniqueViewers && result.uniqueViewers > 0) {
                updateUniqueViewers(quizId, result.uniqueViewers);
                return result.uniqueViewers;
            }
        } catch (err) {
            console.error(`Error loading unique viewers from API for quiz ${quizId}:`, err);
        }
        return 0;
    }, [updateUniqueViewers]);

    const loadMultipleUniqueViewers = useCallback(async (quizIds: number[]) => {
        if (quizIds.length === 0) return;
        const batchSize = 5;
        for (let i = 0; i < quizIds.length; i += batchSize) {
            const batch = quizIds.slice(i, i + batchSize);
            await Promise.all(batch.map(quizId => loadUniqueViewersFromAPI(quizId)));
        }
    }, [loadUniqueViewersFromAPI]);

    const recordView = useCallback(async (quizId: number) => {
        if (viewedQuizzes.has(quizId)) return;

        const localUniqueViewers = quizViewsAPI.addLocalView(quizId);

        setViewedQuizzes(prev => {
            const newSet = new Set(prev);
            newSet.add(quizId);
            return newSet;
        });

        updateUniqueViewers(quizId, Math.max(
            getUniqueViewersCount(quizId),
            localUniqueViewers
        ));

        try {
            const result = await quizViewsAPI.addQuizView(quizId);
            if (result.success && result.uniqueViewers && result.uniqueViewers > 0) {
                updateUniqueViewers(quizId, result.uniqueViewers);
            }
        } catch (err) {
            console.error(`Failed to record view to backend for quiz ${quizId}:`, err);
        }
    }, [viewedQuizzes, getUniqueViewersCount, updateUniqueViewers]);

    const getViewsFromQuizData = useCallback((quizId: number): number => {
        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz) return 0;
        return quiz.unique_viewers ||
            quiz.view_count ||
            quiz.views ||
            quiz.total_views ||
            0;
    }, [quizData]);

    const getFinalViewCount = useCallback((quizId: number): number => {
        const backendViews = getViewsFromQuizData(quizId);
        const stateViews = getUniqueViewersCount(quizId);
        const localViews = quizViewsAPI.getLocalUniqueViewers(quizId);
        return Math.max(backendViews, stateViews, localViews);
    }, [getViewsFromQuizData, getUniqueViewersCount]);

    // Reaction Functions
    const loadQuizReactions = useCallback(async (quizId: number) => {
        try {
            const result = await quizAPI.getQuizReactions(quizId);
            if (result.success && result.data) {
                const reactionsData = Array.isArray(result.data.results) ? result.data.results : [];
                const stats: ReactionsSummary = {
                    coin: 0,
                    like: 0,
                    love: 0,
                    clap: 0,
                    insightful: 0,
                    total: 0
                };

                let userReaction: string | null = null;
                let userReactionId: number | null = null;

                reactionsData.forEach((reaction: any) => {
                    const type = reaction.reaction_type;
                    if (type && Object.prototype.hasOwnProperty.call(stats, type)) {
                        stats[type as keyof ReactionsSummary]++;
                        stats.total++;
                    }

                    if (reaction.user === 1) {
                        userReaction = type;
                        userReactionId = reaction.id;
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

                if (userReactionId) {
                    setQuizReactions(prev => {
                        const newMap = new Map(prev);
                        newMap.set(quizId, {
                            id: userReactionId!,
                            quiz: quizId,
                            user: 1,
                            reaction_type: userReaction!,
                            created_at: new Date().toISOString()
                        });
                        return newMap;
                    });
                }
            }
        } catch (err) {
            console.error(`Error loading reactions for quiz ${quizId}:`, err);
        }
    }, []);

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
                            user: 1,
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
            console.error("Reaction error:", err);
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

    const deleteReaction = async (reactionId: number, quizId: number) => {
        try {
            const result = await quizAPI.deleteReaction(reactionId);
            if (result.success) {
                setUserInteractions(prev => {
                    const newReactions = new Map(prev.reactions);
                    newReactions.delete(quizId);
                    return { ...prev, reactions: newReactions };
                });
                setQuizReactions(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(quizId);
                    return newMap;
                });
                setQuizData(prev => prev.map(q => {
                    if (q.id === quizId && q.reactions_summary) {
                        const userReaction = q.user_reaction;
                        const updatedStats = { ...q.reactions_summary };
                        if (userReaction && userReaction in updatedStats) {
                            updatedStats[userReaction as keyof typeof updatedStats] =
                                Math.max(0, updatedStats[userReaction as keyof typeof updatedStats] - 1);
                            updatedStats.total = Math.max(0, updatedStats.total - 1);
                        }
                        return {
                            ...q,
                            reactions_summary: updatedStats,
                            user_reaction: null
                        };
                    }
                    return q;
                }));
            }
        } catch (err) {
            console.error("Delete reaction error:", err);
        }
    };

    const hideQuiz = async (quizId: number) => {
        try {
            setQuizData(prev => prev.filter(q => q.id !== quizId));
            setFilteredQuizzes(prev => prev.filter(q => q.id !== quizId));
        } catch (err) {
            console.error("Hide quiz error:", err);
        }
    };

    const copyQuiz = async (quizId: number) => {
        try {
            const quiz = quizData.find(q => q.id === quizId);
            if (quiz) {
                const quizText = `${quiz.question_text}\n\n${quiz.answers.map(a => `${a.letter}. ${a.answer_text}`).join('\n')}`;
                await navigator.clipboard.writeText(quizText);
                alert("Quiz nusxalandi!");
            }
        } catch (err) {
            console.error("Copy quiz error:", err);
        }
    };

    const downloadQuiz = (quizId: number) => {
        const quiz = quizData.find(q => q.id === quizId);
        if (!quiz) return;

        const quizDataStr = JSON.stringify({
            question: quiz.question_text,
            answers: quiz.answers,
            correct_count: quiz.correct_count,
            wrong_count: quiz.wrong_count,
            views: getFinalViewCount(quizId),
            reactions: quiz.reactions_summary,
            created_at: quiz.created_at
        }, null, 2);

        const blob = new Blob([quizDataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz-${quizId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const reportQuiz = async (quizId: number) => {
        const reason = prompt("Shikoyat sababini kiriting:");
        if (!reason) return;
        try {
            console.log("Reporting quiz", quizId, "with reason:", reason);
            alert("Shikoyatingiz qabul qilindi!");
        } catch (err) {
            console.error("Report quiz error:", err);
        }
    };

    // Shuffle Array
    const shuffleArray = <T,>(arr: T[]): T[] => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Preload Images
    const preloadImages = useCallback((quizzes: Quiz[]) => {
        const newPreloads = new Set<string>();
        quizzes.forEach(q => {
            [q.round_image, q.user.profile_image].forEach(src => {
                if (src && !preloadedImages.has(src)) {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = src;
                    newPreloads.add(src);
                }
            });
        });
        if (newPreloads.size > 0) {
            setPreloadedImages(prev => new Set([...prev, ...newPreloads]));
        }
    }, [preloadedImages]);

    // Filter Logic
    const quizHasCategory = useCallback((quizCategory: Quiz["category"], categoryId: number): boolean => {
        if (!quizCategory) return false;

        if (typeof quizCategory === "string") {
            try {
                const parsed = JSON.parse(quizCategory);
                if (Array.isArray(parsed)) {
                    return parsed.some((cat: any) => cat.id === categoryId);
                } else if (parsed && typeof parsed === 'object') {
                    return parsed.id === categoryId;
                }
            } catch {
                return quizCategory === categoryId.toString();
            }
            return false;
        }

        if (typeof quizCategory === "number") {
            return quizCategory === categoryId;
        }

        if (Array.isArray(quizCategory)) {
            return quizCategory.some(cat => {
                if (typeof cat === 'number') return cat === categoryId;
                if (typeof cat === 'object' && cat !== null) return (cat as Category).id === categoryId;
                return false;
            });
        }

        if (typeof quizCategory === "object" && quizCategory !== null) {
            return (quizCategory as Category).id === categoryId;
        }

        return false;
    }, []);

    // Fetch Functions - Tuzatilgan versiya
    const fetchQuizzes = useCallback(async (url?: string | null, isInitialLoad: boolean = false) => {
        if (isLoadingRef.current || (!isInitialLoad && !hasMore)) return;

        isLoadingRef.current = true;
        setLoading(true);

        const loadingTimer = setTimeout(() => {
            if (isLoadingRef.current) {
                setShowLoadingIndicator(true);
                hasRenderedLoadingRef.current = true;
            }
        }, 1000);

        try {
            const res = await quizAPI.fetchRecommendedTests(url || undefined, BATCH_SIZE);
            let results: Quiz[] = Array.isArray(res.data?.results) ? res.data.results : [];

            if (results.length === 0) {
                setHasMore(false);
                return;
            }

            results = shuffleArray(results);
            const newQuizIds = results.map(q => q.id);

            setQuizData(prev => {
                const existingIds = new Set(prev.map(q => q.id));
                const unique = results.filter(q => !existingIds.has(q.id));
                return [...prev, ...unique];
            });

            if (selectedCategory === "All") {
                setFilteredQuizzes(prev => {
                    const existingIds = new Set(prev.map(q => q.id));
                    const unique = results.filter(q => !existingIds.has(q.id));
                    return [...prev, ...unique];
                });
            }

            // Background tasks
            await loadMultipleUniqueViewers(newQuizIds);

            // Load reactions and record views in parallel
            const backgroundPromises = newQuizIds.map(async (quizId) => {
                await loadQuizReactions(quizId);
                await recordView(quizId);
            });
            await Promise.all(backgroundPromises);

            // Update batch counter
            if (url) {
                currentBatchRef.current++;
            }

            setHasMore(Boolean(res.data?.next) && results.length >= BATCH_SIZE);
            preloadImages(results);

            lastLoadMoreTimeRef.current = Date.now();

        } catch (err) {
            console.error("Fetch quizzes error:", err);
        } finally {
            clearTimeout(loadingTimer);
            isLoadingRef.current = false;
            setLoading(false);
            setShowLoadingIndicator(false);
            hasRenderedLoadingRef.current = false;
        }
    }, [hasMore, selectedCategory, loadMultipleUniqueViewers, loadQuizReactions, recordView, preloadImages]);

    const fetchQuizzesByCategory = useCallback(async (categoryId: number, url?: string | null, isInitialLoad: boolean = false) => {
        if (categoryLoading.has(categoryId) || (!isInitialLoad && !(categoryHasMore.get(categoryId) ?? true))) return;

        setCategoryLoading(prev => new Set(prev).add(categoryId));
        isLoadingRef.current = true;

        const loadingTimer = setTimeout(() => {
            if (isLoadingRef.current) {
                setShowLoadingIndicator(true);
                hasRenderedLoadingRef.current = true;
            }
        }, 1000);

        try {
            const endpoint = url || `/api/quiz/questions/?category=${categoryId}&page_size=${BATCH_SIZE}`;
            const res = await quizAPI.fetchQuizzesByCategory(endpoint);
            let results: Quiz[] = Array.isArray(res.data?.results) ? res.data.results : [];

            if (results.length === 0) {
                setCategoryHasMore(prev => {
                    const newMap = new Map(prev);
                    newMap.set(categoryId, false);
                    return newMap;
                });
                return;
            }

            results = shuffleArray(results);
            const newQuizIds = results.map(q => q.id);

            setQuizData(prev => {
                const existingIds = new Set(prev.map(q => q.id));
                const unique = results.filter(q => !existingIds.has(q.id));
                return [...prev, ...unique];
            });

            if (selectedCategory === categoryId) {
                setFilteredQuizzes(prev => {
                    const existingIds = new Set(prev.map(q => q.id));
                    const unique = results.filter(q => !existingIds.has(q.id));
                    return [...prev, ...unique];
                });
            }

            // Background tasks
            await loadMultipleUniqueViewers(newQuizIds);

            // Load reactions and record views in parallel
            const backgroundPromises = newQuizIds.map(async (quizId) => {
                await loadQuizReactions(quizId);
                await recordView(quizId);
            });
            await Promise.all(backgroundPromises);

            // Update category batch counter
            const currentBatch = categoryBatchRef.current.get(categoryId) || 0;
            categoryBatchRef.current.set(categoryId, currentBatch + 1);

            // Update next page URL and hasMore
            setCategoryNextPageUrls(prev => {
                const newMap = new Map(prev);
                newMap.set(categoryId, res.data?.next || null);
                return newMap;
            });

            setCategoryHasMore(prev => {
                const newMap = new Map(prev);
                newMap.set(categoryId, Boolean(res.data?.next) && results.length >= BATCH_SIZE);
                return newMap;
            });

            preloadImages(results);
            lastLoadMoreTimeRef.current = Date.now();

        } catch (err) {
            console.error(`Fetch quizzes for category ${categoryId} error:`, err);
        } finally {
            clearTimeout(loadingTimer);
            setCategoryLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete(categoryId);
                return newSet;
            });
            isLoadingRef.current = false;
            setShowLoadingIndicator(false);
            hasRenderedLoadingRef.current = false;
        }
    }, [selectedCategory, categoryLoading, categoryHasMore, loadMultipleUniqueViewers, loadQuizReactions, recordView, preloadImages]);

    // Category Change Effect
    useEffect(() => {
        const handleCategoryChange = async () => {
            currentBatchRef.current = 0;
            categoryBatchRef.current.clear();

            if (selectedCategory === "All") {
                setQuizData([]);
                setFilteredQuizzes([]);
                setHasMore(true);
                await fetchQuizzes(undefined, true);
            } else {
                const categoryId = Number(selectedCategory);
                const filteredFromExisting = quizData.filter(q => quizHasCategory(q.category, categoryId));

                if (filteredFromExisting.length > 0) {
                    setFilteredQuizzes(filteredFromExisting);

                    if (filteredFromExisting.length >= BATCH_SIZE * 2) {
                        return;
                    }
                } else {
                    setFilteredQuizzes([]);
                }

                const hasMoreForCategory = categoryHasMore.get(categoryId) ?? true;
                const nextUrlForCategory = categoryNextPageUrls.get(categoryId);

                if (hasMoreForCategory) {
                    await fetchQuizzesByCategory(categoryId, nextUrlForCategory, true);
                }
            }

            if (containerRef.current) {
                setTimeout(() => {
                    if (containerRef.current) {
                        containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
                    }
                }, 100);
            }
            setCurrentQuizIndex(0);
            lastQuizIndexRef.current = 0;
        };
        handleCategoryChange();
    }, [selectedCategory]);

    // Load More Effect - Tuzatilgan versiya
    useEffect(() => {
        if (filteredQuizzes.length === 0 || isLoadingRef.current) return;

        const now = Date.now();

        // Minimum 1.5 soniya kutish yangi yuklash uchun (avvalgidan kamroq)
        if (now - lastLoadMoreTimeRef.current < 1500) return;

        // 8-savolda yangi batch yuklash
        const shouldLoadMore = currentQuizIndex >= (lastQuizIndexRef.current + PRELOAD_THRESHOLD);
        // Agar 3 ta savoldan kam qolsa yangi yuklash
        const isNearEnd = currentQuizIndex >= filteredQuizzes.length - MIN_QUIZZES_BEFORE_LOAD;

        if ((shouldLoadMore || isNearEnd) && !isLoadingRef.current) {
            lastQuizIndexRef.current = currentQuizIndex;

            if (selectedCategory === "All") {
                if (hasMore) {
                    console.log(`Loading more quizzes. Current: ${filteredQuizzes.length}, Index: ${currentQuizIndex}`);
                    fetchQuizzes();
                }
            } else {
                const categoryId = Number(selectedCategory);
                const hasMoreForCategory = categoryHasMore.get(categoryId) ?? true;
                const nextUrlForCategory = categoryNextPageUrls.get(categoryId);

                if (hasMoreForCategory) {
                    console.log(`Loading more quizzes for category ${categoryId}. Current: ${filteredQuizzes.length}, Index: ${currentQuizIndex}`);
                    fetchQuizzesByCategory(categoryId, nextUrlForCategory);
                }
            }

            lastLoadMoreTimeRef.current = now;
        }
    }, [
        currentQuizIndex,
        filteredQuizzes.length,
        selectedCategory,
        hasMore,
        categoryHasMore,
        categoryNextPageUrls,
        fetchQuizzes,
        fetchQuizzesByCategory
    ]);

    // Load Categories
    const loadCategories = useCallback(async () => {
        try {
            const res = await quizAPI.fetchCategories();
            if (res && res.data) {
                let data: Category[] = [];
                if (Array.isArray(res.data)) {
                    data = res.data;
                } else if (res.data.results && Array.isArray(res.data.results)) {
                    data = res.data.results;
                } else if (res.data.categories && Array.isArray(res.data.categories)) {
                    data = res.data.categories;
                } else if (typeof res.data === 'object') {
                    data = Object.values(res.data);
                }
                setCategories(data);
            } else {
                setCategories([]);
            }
        } catch (err) {
            console.error("Load categories error:", err);
            setCategories([]);
        }
    }, []);

    // Scroll Handling - Tuzatilgan versiya
    const handleScroll = useCallback(() => {
        if (!containerRef.current || isLoadingRef.current) return;

        const container = containerRef.current;
        const { scrollTop, scrollHeight, clientHeight } = container;

        // Calculate current index based on scroll position
        const index = Math.floor(scrollTop / clientHeight);

        // Ensure index is within bounds
        if (index !== currentQuizIndex && index >= 0 && index < filteredQuizzes.length) {
            const newQuiz = filteredQuizzes[index];
            if (newQuiz) {
                recordView(newQuiz.id);
                setCurrentQuizIndex(index);

                // Agar savol soni kam bo'lsa, yangi yuklash
                if (filteredQuizzes.length - index <= MIN_QUIZZES_BEFORE_LOAD) {
                    if (!isLoadingRef.current) {
                        const now = Date.now();
                        if (now - lastLoadMoreTimeRef.current > 1500) {
                            if (selectedCategory === "All" && hasMore) {
                                fetchQuizzes();
                            } else if (selectedCategory !== "All") {
                                const categoryId = Number(selectedCategory);
                                const hasMoreForCategory = categoryHasMore.get(categoryId) ?? true;
                                const nextUrlForCategory = categoryNextPageUrls.get(categoryId);

                                if (hasMoreForCategory) {
                                    fetchQuizzesByCategory(categoryId, nextUrlForCategory);
                                }
                            }
                            lastLoadMoreTimeRef.current = now;
                        }
                    }
                }
            }
        }
    }, [currentQuizIndex, filteredQuizzes, recordView, selectedCategory, hasMore, categoryHasMore, categoryNextPageUrls, fetchQuizzes, fetchQuizzesByCategory]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let scrollAnimationFrame: number;
        let lastScrollTime = 0;

        const onScroll = () => {
            const now = Date.now();

            if (now - lastScrollTime < 50) return;
            lastScrollTime = now;

            if (scrollAnimationFrame) {
                cancelAnimationFrame(scrollAnimationFrame);
            }

            scrollAnimationFrame = requestAnimationFrame(() => {
                handleScroll();
            });
        };

        container.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            container.removeEventListener("scroll", onScroll);
            if (scrollAnimationFrame) {
                cancelAnimationFrame(scrollAnimationFrame);
            }
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [handleScroll]);

    // Initial Data Fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsInitialLoading(true);
            try {
                if (questionId) {
                    const id = Number(questionId);
                    const quizRes = await quizAPI.fetchTestById(id);
                    if (quizRes.data) {
                        const quiz: Quiz = quizRes.data;
                        setQuizData([quiz]);
                        setFilteredQuizzes([quiz]);
                        await loadUniqueViewersFromAPI(id);
                        await loadQuizReactions(id);
                        await recordView(id);
                    }
                } else {
                    await loadCategories();
                    await fetchQuizzes(undefined, true);
                }
            } catch (err) {
                console.error("Initial data fetch error:", err);
            } finally {
                setTimeout(() => {
                    setIsInitialLoading(false);
                }, 500);
            }
        };
        fetchInitialData();
    }, [questionId]);

    // Preload Images Effect
    useEffect(() => {
        if (filteredQuizzes.length === 0) return;
        const upcomingQuizzes = filteredQuizzes.slice(
            Math.max(0, currentQuizIndex - 1),
            Math.min(filteredQuizzes.length, currentQuizIndex + 3)
        );
        preloadImages(upcomingQuizzes);
    }, [currentQuizIndex, filteredQuizzes, preloadImages]);

    // Answer Handlers
    const selectAnswer = async (quizId: number, answerId: number) => {
        if (submittingQuestions.has(quizId)) return;
        setSubmittingQuestions(prev => new Set(prev).add(quizId));
        try {
            const res = await quizAPI.submitAnswers({
                question: quizId,
                selected_answer_ids: [answerId]
            });
            const isCorrect = res.data?.is_correct;
            setUserInteractions(prev => ({
                ...prev,
                selectedAnswers: new Map(prev.selectedAnswers).set(quizId, [answerId]),
                answerStates: new Map(prev.answerStates).set(quizId, isCorrect ? "correct" : "incorrect"),
            }));
            setQuizData(prev => prev.map(q =>
                q.id === quizId
                    ? {
                        ...q,
                        correct_count: isCorrect ? q.correct_count + 1 : q.correct_count,
                        wrong_count: !isCorrect ? q.wrong_count + 1 : q.wrong_count
                    }
                    : q
            ));
            setFilteredQuizzes(prev => prev.map(q =>
                q.id === quizId
                    ? {
                        ...q,
                        correct_count: isCorrect ? q.correct_count + 1 : q.correct_count,
                        wrong_count: !isCorrect ? q.wrong_count + 1 : q.wrong_count
                    }
                    : q
            ));
        } catch (err) {
            console.error("Select answer error:", err);
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
        if (answerState) return;
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
        if (selected.length === 0 || submittingQuestions.has(quizId)) return;
        setSubmittingQuestions(prev => new Set(prev).add(quizId));
        try {
            const res = await quizAPI.submitAnswers({
                question: quizId,
                selected_answer_ids: selected
            });
            const isCorrect = res.data?.is_correct;
            setUserInteractions(prev => ({
                ...prev,
                answerStates: new Map(prev.answerStates).set(quizId, isCorrect ? "correct" : "incorrect")
            }));
            setQuizData(prev => prev.map(q =>
                q.id === quizId
                    ? {
                        ...q,
                        correct_count: isCorrect ? q.correct_count + 1 : q.correct_count,
                        wrong_count: !isCorrect ? q.wrong_count + 1 : q.wrong_count
                    }
                    : q
            ));
            setFilteredQuizzes(prev => prev.map(q =>
                q.id === quizId
                    ? {
                        ...q,
                        correct_count: isCorrect ? q.correct_count + 1 : q.correct_count,
                        wrong_count: !isCorrect ? q.wrong_count + 1 : q.wrong_count
                    }
                    : q
            ));
        } catch (err) {
            console.error("Submit multiple choice error:", err);
        } finally {
            setSubmittingQuestions(prev => {
                const newSet = new Set(prev);
                newSet.delete(quizId);
                return newSet;
            });
        }
    };

    const handleTextAnswer = async (quizId: number) => {
        const textAnswer = userInteractions.textAnswers.get(quizId)?.trim();
        if (!textAnswer || submittingQuestions.has(quizId)) return;
        setSubmittingQuestions(prev => new Set(prev).add(quizId));
        try {
            const res = await quizAPI.submitTextAnswers({
                question: quizId,
                written_answer: textAnswer
            });
            const isCorrect = res.data?.is_correct;
            setUserInteractions(prev => ({
                ...prev,
                answerStates: new Map(prev.answerStates).set(quizId, isCorrect ? "correct" : "incorrect")
            }));
            setQuizData(prev => prev.map(q =>
                q.id === quizId
                    ? {
                        ...q,
                        correct_count: isCorrect ? q.correct_count + 1 : q.correct_count,
                        wrong_count: !isCorrect ? q.wrong_count + 1 : q.wrong_count
                    }
                    : q
            ));
            setFilteredQuizzes(prev => prev.map(q =>
                q.id === quizId
                    ? {
                        ...q,
                        correct_count: isCorrect ? q.correct_count + 1 : q.correct_count,
                        wrong_count: !isCorrect ? q.wrong_count + 1 : q.wrong_count
                    }
                    : q
            ));
        } catch (err) {
            console.error("Text answer error:", err);
        } finally {
            setSubmittingQuestions(prev => {
                const newSet = new Set(prev);
                newSet.delete(quizId);
                return newSet;
            });
        }
    };

    // Follow / Save Handlers
    const handleFollow = async (userId: number) => {
        try {
            await accountsAPI.toggleFollow(userId);
            setQuizData(prev => prev.map(q =>
                q.user.id === userId
                    ? {
                        ...q,
                        user: {
                            ...q.user,
                            is_following: !q.user.is_following
                        }
                    }
                    : q
            ));
            setFilteredQuizzes(prev => prev.map(q =>
                q.user.id === userId
                    ? {
                        ...q,
                        user: {
                            ...q.user,
                            is_following: !q.user.is_following
                        }
                    }
                    : q
            ));
        } catch (err) {
            console.error("Follow error:", err);
        }
    };

    const handleSave = async (quizId: number) => {
        try {
            await quizAPI.bookmarkQuestion({ question: quizId });
            setQuizData(prev => prev.map(q =>
                q.id === quizId
                    ? { ...q, is_bookmarked: !q.is_bookmarked }
                    : q
            ));
            setFilteredQuizzes(prev => prev.map(q =>
                q.id === quizId
                    ? { ...q, is_bookmarked: !q.is_bookmarked }
                    : q
            ));
        } catch (err) {
            console.error("Bookmark error:", err);
        }
    };

    const shareQuestion = async (quizId: number) => {
        const shareUrl = `${window.location.origin}/questions/${quizId}`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: "TestAbd savoli",
                    text: "Mana bir qiziqarli savol!",
                    url: shareUrl
                });
            } else {
                await navigator.clipboard.writeText(shareUrl);
                alert("Link nusxalandi!");
            }
        } catch (err) {
            console.error("Share error:", err);
        }
    };

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

    // Render Functions
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
        const userReaction = quizReactions.get(quizId);
        const totalReactions = quiz?.reactions_summary?.total || 0;

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
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        shareQuestion(quizId);
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-700 transition text-white text-sm"
                >
                    <Share size={16} />
                    <span>Ulashish</span>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setModalOpen(true);
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-700 transition text-white text-sm"
                >
                    <Filter size={16} />
                    <span>Filter</span>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSave(quizId);
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-700 transition text-white text-sm"
                >
                    <Bookmark size={16} className={quiz?.is_bookmarked ? "fill-current text-yellow-400" : ""} />
                    <span>{quiz?.is_bookmarked ? "Bookmarkdan o'chirish" : "Bookmark"}</span>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        downloadQuiz(quizId);
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-700 transition text-white text-sm"
                >
                    <Download size={16} />
                    <span>Yuklab olish</span>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        copyQuiz(quizId);
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-700 transition text-white text-sm"
                >
                    <Copy size={16} />
                    <span>Nusxalash</span>
                </button>
                {userReaction && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteReaction(userReaction.id, quizId);
                        }}
                        className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-700 transition text-red-400 text-sm"
                    >
                        <Trash2 size={16} />
                        <span>Reaksiyani o'chirish</span>
                    </button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        hideQuiz(quizId);
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-700 transition text-red-400 text-sm"
                >
                    <EyeOff size={16} />
                    <span>Yashirish</span>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        reportQuiz(quizId);
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-700 transition text-red-400 text-sm"
                >
                    <Flag size={16} />
                    <span>Shikoyat qilish</span>
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
                    <span className="text-gray-400 text-xs">Jami: {totalReactions} ta reaksiya</span>
                </div>
            </div>
        );
    };

    const renderQuestionContent = useCallback((quiz: Quiz) => {
        const isSubmitting = submittingQuestions.has(quiz.id);
        const selectedAnswers = userInteractions.selectedAnswers.get(quiz.id) || [];
        const answerState = userInteractions.answerStates.get(quiz.id);
        const hasAnswered = selectedAnswers.length > 0 || answerState !== undefined;
        const optionsCount = quiz.answers.length;

        if (quiz.question_type === "text_input") {
            const textAnswer = userInteractions.textAnswers.get(quiz.id) || "";
            return (
                <div className="space-y-4">
                    <div className="relative">
                        <textarea
                            value={textAnswer}
                            onChange={(e) =>
                                setUserInteractions(prev => ({
                                    ...prev,
                                    textAnswers: new Map(prev.textAnswers).set(quiz.id, e.target.value),
                                }))
                            }
                            placeholder="Javobingizni bu yerga yozing..."
                            disabled={hasAnswered || isSubmitting}
                            rows={4}
                            className={`w-full px-5 py-4 rounded-xl bg-black/40 backdrop-blur-lg border border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-white/70 focus:ring-2 focus:ring-white/20 transition-all shadow-lg resize-none ${
                                hasAnswered ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                        />
                        {answerState && (
                            <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                                answerState === "correct" ? "bg-green-500" : "bg-red-500"
                            }`}>
                                {answerState === "correct" ? (
                                    <Check size={16} className="text-white"/>
                                ) : (
                                    <X size={16} className="text-white"/>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => handleTextAnswer(quiz.id)}
                        disabled={!textAnswer.trim() || hasAnswered || isSubmitting}
                        className={`self-end px-6 py-3 rounded-xl bg-black/40 backdrop-blur-lg border border-white/30 text-white font-medium flex items-center gap-2 transition-all shadow-lg ${
                            isSubmitting
                                ? "bg-blue-500/40 cursor-not-allowed"
                                : textAnswer.trim() && !hasAnswered
                                    ? "hover:bg-black/50 hover:border-white/50 hover:shadow-xl"
                                    : "opacity-50 cursor-not-allowed"
                        }`}
                    >
                        {isSubmitting ? (
                            <Loader2 size={20} className="animate-spin"/>
                        ) : (
                            <Send size={20}/>
                        )}
                        <span>{isSubmitting ? "Yuborilmoqda..." : "Javobni yuborish"}</span>
                    </button>
                    {answerState && (
                        <div className={`text-center py-2 px-4 rounded-lg ${
                            answerState === "correct"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}>
                            {answerState === "correct" ? "✅ To'g'ri javob!" : "❌ Noto'g'ri javob"}
                        </div>
                    )}
                </div>
            );
        }

        if (quiz.question_type === "multiple") {
            return (
                <div className="space-y-3 sm:space-y-4">
                    <div className="grid gap-3 sm:gap-4">
                        {quiz.answers.map(option => {
                            const isSelected = selectedAnswers.includes(option.id);
                            const showCorrect = answerState && option.is_correct;
                            const showIncorrect = answerState && isSelected && !option.is_correct;
                            const btnClass = showCorrect
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
                                    disabled={answerState !== undefined || isSubmitting}
                                    className={`flex items-center gap-3 sm:gap-4 px-5 py-4 rounded-xl bg-black/40 backdrop-blur-lg border transition-all text-left shadow-lg ${btnClass}`}
                                >
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
                    {selectedAnswers.length > 0 && !answerState && (
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

        if (isTrueFalseQuestion(quiz)) {
            return (
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    {quiz.answers.map(option => {
                        const isSelected = selectedAnswers.includes(option.id);
                        const isCorrect = option.is_correct;
                        const showCorrect = answerState && isCorrect;
                        const showIncorrect = answerState && isSelected && !isCorrect;
                        const isUserCorrect = isSelected && answerState === "correct";
                        const getBtnClass = () => {
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
                                disabled={hasAnswered || isSubmitting}
                                className={`flex flex-col items-center justify-center gap-3 sm:gap-4 py-6 sm:py-8 px-4 sm:px-6 rounded-xl bg-black/40 backdrop-blur-lg border transition-all shadow-lg ${getBtnClass()}`}
                            >
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

        const circleSize = optionsCount <= 3
            ? "w-8 h-8 sm:w-10 sm:h-10"
            : optionsCount === 4
                ? "w-7 h-7 sm:w-8 sm:h-8"
                : "w-6 h-6 sm:w-7 sm:h-7";
        const fontSize = optionsCount <= 3
            ? "text-base sm:text-lg"
            : "text-sm sm:text-base";
        const gap = optionsCount <= 3
            ? "gap-3 sm:gap-4"
            : "gap-2 sm:gap-3";

        return (
            <div className={`grid ${gap} ${optionsCount >= 5 ? "max-h-[50vh] overflow-y-auto pr-2" : ""}`}>
                {quiz.answers.map(option => {
                    const isSelected = selectedAnswers.includes(option.id);
                    const showCorrect = answerState && option.is_correct;
                    const showIncorrect = answerState && isSelected && !option.is_correct;
                    const isUserCorrect = isSelected && answerState === "correct";
                    const getBtnClass = () => {
                        if (showIncorrect) return "border-red-400/60 bg-red-500/30";
                        if (isUserCorrect || showCorrect) return "border-green-400/60 bg-green-500/30";
                        if (isSelected) return "border-blue-400/60 bg-blue-500/30";
                        return "border-white/30 hover:bg-black/50 hover:border-white/40";
                    };
                    const getCircleClass = () => {
                        if (showIncorrect) return "bg-red-500 text-white";
                        if (isUserCorrect || showCorrect) return "bg-green-500 text-white";
                        if (isSelected) return "bg-blue-500 text-white";
                        return "bg-white/30 text-white";
                    };
                    return (
                        <button
                            key={option.id}
                            onClick={() => selectAnswer(quiz.id, option.id)}
                            disabled={hasAnswered || isSubmitting}
                            className={`flex items-center gap-3 sm:gap-4 px-3 py-3 rounded-xl bg-black/40 backdrop-blur-lg border transition-all text-left shadow-lg ${getBtnClass()}`}
                        >
                            <div className={`${circleSize} rounded-full flex items-center justify-center font-medium ${getCircleClass()}`}>
                                {option.letter}
                            </div>
                            <span className={`flex-1 ${fontSize} font-medium text-white`}>
                                {option.answer_text}
                            </span>
                            {isSubmitting && isSelected && (
                                <Loader2 size={16} className="animate-spin text-white"/>
                            )}
                            {isUserCorrect && <Check size={18} className="text-green-400"/>}
                            {showIncorrect && <X size={18} className="text-red-400"/>}
                        </button>
                    );
                })}
            </div>
        );
    }, [submittingQuestions, userInteractions, handleTextAnswer, handleMultipleChoice, submitMultipleChoice, selectAnswer, isTrueFalseQuestion]);

    // Styles
    const styles = `
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
    `;

    // Loading State
    if (isInitialLoading) {
        return (
            <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
                <QuizSkeletonLoader />
            </div>
        );
    }

    // Empty State
    if (filteredQuizzes.length === 0 && !loading) {
        return (
            <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">😔</div>
                    <h2 className="text-xl text-white mb-2">Savollar topilmadi</h2>
                    <p className="text-gray-400 mb-6">Tanlangan kategoriyada savollar mavjud emas</p>
                    <button
                        onClick={() => setSelectedCategory("All")}
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
            <style>{styles}</style>

            {/* Category Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
                    <div
                        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                        onClick={() => setModalOpen(false)}
                    />
                    <div className="relative bg-gray-800 rounded-xl shadow-lg w-11/12 max-w-md max-h-[70vh] flex flex-col z-50 border border-gray-700">
                        <div className="p-4 border-b border-gray-700">
                            <h2 className="text-lg font-semibold text-white">Kategoriyani tanlang</h2>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            <div className="flex flex-col gap-2">
                                <button
                                    className={`px-4 py-3 rounded-lg text-left transition ${
                                        selectedCategory === "All"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    }`}
                                    onClick={() => setSelectedCategory("All")}
                                >
                                    Barchasi
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        className={`px-4 py-3 rounded-lg text-left transition flex items-center gap-3 ${
                                            selectedCategory === cat.id
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                        }`}
                                        onClick={() => {
                                            setSelectedCategory(cat.id);
                                            setModalOpen(false);
                                        }}
                                    >
                                        <span className="text-lg">{cat.emoji}</span>
                                        <span>{cat.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-700 flex justify-end">
                            <button
                                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                                onClick={() => setModalOpen(false)}
                            >
                                Yopish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Container */}
            <div className="h-full overflow-y-auto scrollbar-hide">
                <div
                    ref={containerRef}
                    className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {/* Questions */}
                    {filteredQuizzes.map((quiz, idx) => {
                        const userReaction = userInteractions.reactions.get(quiz.id);
                        const finalViewCount = getFinalViewCount(quiz.id);
                        const totalReactions = quiz.reactions_summary?.total || 0;

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

                                <div className="relative w-full max-w-2xl mx-auto h-full px-2 sm:px-6 flex flex-col justify-center">
                                    <div className="absolute top-1 left-0 right-0 z-20 px-1">
                                        <div className="flex items-center justify-center">
                                            <Link
                                                to="https://t.me/testabduz"
                                                className="flex items-center gap-4 bg-black/40 backdrop-blur-lg border border-transparent px-3 py-2 hover:bg-black/50 transition w-full"
                                            >
                                                <img src={Logo} alt="logo" className="w-12 h-12"/>
                                                <div className="text-left">
                                                    <div className="text-xs md:text-sm text-gray-300">Telegam ads</div>
                                                    <div className="text-xs md:text-sm text-white">TestAbd.uz</div>
                                                    <div className="text-xs md:text-sm text-blue-400">TestAbd.uz - Bilim va daromad manbai</div>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="glass-morphism rounded-xl p-4 sm:p-6 mb-6 shadow-lg">
                                        <div className="text-sm sm:text-lg leading-relaxed text-white">
                                            {quiz.question_text}
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
                                                        className="w-10 h-10 rounded-full border-2 border-white/30 object-cover"
                                                        onClick={() => navigate(`/profile/${quiz.user.username}`)}
                                                    />
                                                    <div>
                                                        <div className="text-white font-medium text-sm md:text-lg">
                                                            @{quiz.user.username}
                                                        </div>
                                                        <div className="text-white/60 text-xs md:text-sm">
                                                            {quiz.test_title}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFollow(quiz.user.id);
                                                    }}
                                                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                                                        quiz.user.is_following
                                                            ? "bg-transparent text-white border border-white/30"
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
                                                <span className="text-green-400 font-bold">✓</span>
                                            </div>
                                            <span className="text-xs text-white mt-1">{quiz.correct_count}</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 bg-red-500/30 rounded-full flex items-center justify-center border border-red-500/50">
                                                <span className="text-red-400 font-bold">✗</span>
                                            </div>
                                            <span className="text-xs text-white mt-1">{quiz.wrong_count}</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 bg-blue-500/30 rounded-full flex items-center justify-center border border-blue-500/50">
                                                <Eye size={18} className="text-blue-400"/>
                                            </div>
                                            <span className="text-xs text-white mt-1 font-bold">
                                                {finalViewCount}
                                            </span>
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

                    {/* Loading Indicator */}
                    {showLoadingIndicator && isLoadingRef.current && filteredQuizzes.length > 0 && (
                        <div className="h-screen w-full flex justify-center items-center snap-start">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-white text-sm">Yangi savollar yuklanmoqda...</span>
                            </div>
                        </div>
                    )}

                    {/* End of content */}
                    {!hasMore && !isLoadingRef.current && filteredQuizzes.length > 0 && (
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
        </div>
    );
};

export default QuizPage;