"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Share, Bookmark, X, Send, Check, ThumbsUp, ThumbsDown, Loader2, Filter, Eye } from "lucide-react";
import { quizAPI, accountsAPI, quizViewsAPI } from "../utils/api";
import { Link, useParams, useNavigate } from "react-router-dom";
import Logo from "../components/assets/images/logo.jpg";
import defaultAvatar from "../components/assets/images/defaultuseravatar.png";
import QuizSkeletonLoader from "./QuizSkeletonLoader.tsx";

interface QuizPageProps {
    theme?: string;
}

export interface Category {
    id: number;
    title: string;
    slug: string;
    emoji: string;
}

interface Quiz {
    id: number;
    question_text: string;
    question_type: string;
    media: string | null;
    answers: Array<{ id: number; letter: string; answer_text: string; is_correct: boolean }>;
    correct_count: number;
    wrong_count: number;
    views?: number;
    test_title: string;
    test_description: string;
    difficulty_percentage: number;
    is_bookmarked?: boolean;
    user: { id: number; username: string; profile_image: string | null; is_following?: boolean };
    created_at: string;
    round_image: string | null;
    category?: string | Category | Category[] | null;
}

const QuizPage: React.FC<QuizPageProps> = ({ theme = "dark" }) => {
    const navigate = useNavigate();
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [quizData, setQuizData] = useState<Quiz[]>([]);
    const [userInteractions, setUserInteractions] = useState({
        selectedAnswers: new Map<number, number[]>(),
        textAnswers: new Map<number, string>(),
        answerStates: new Map<number, "correct" | "incorrect">(),
    });
    const [submittingQuestions, setSubmittingQuestions] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | "All" | null>("All");
    const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout>();

    const { questionId } = useParams<{ questionId: string }>();
    const [quizViews, setQuizViews] = useState<Map<number, number>>(new Map());

    // ------------------- VIEWS FUNCTIONS -------------------
    const getQuizViews = useCallback((quizId: number): number => {
        return quizViews.get(quizId) || 0;
    }, [quizViews]);

    const updateQuizViews = useCallback((quizId: number, count: number) => {
        console.log(`Updating views for quiz ${quizId}: ${count}`);
        setQuizViews(prev => {
            const newMap = new Map(prev);
            newMap.set(quizId, count);
            return newMap;
        });
    }, []);

    // Record a view for a quiz
    const recordView = useCallback(async (quizId: number) => {
        console.log(`Recording view for quiz ${quizId}`);
        try {
            // First increment locally for immediate UI update
            const currentViews = getQuizViews(quizId);
            updateQuizViews(quizId, currentViews + 1);

            // Then send to server
            const result = await quizViewsAPI.addQuizView(quizId);
            console.log('Record view result:', result);

            // If server responds with updated count, use that
            if (result.success && result.totalViews) {
                updateQuizViews(quizId, result.totalViews);
            }
        } catch (err) {
            console.error(`Failed to record view for quiz ${quizId}:`, err);
        }
    }, [getQuizViews, updateQuizViews]);

    // Load views for a quiz
    const loadQuizViews = useCallback(async (quizId: number) => {
        console.log(`Loading views for quiz ${quizId}`);
        try {
            const result = await quizViewsAPI.getQuizViews(quizId);
            console.log('Load views result:', result);

            if (result.success) {
                updateQuizViews(quizId, result.totalViews);
            } else {
                console.warn(`Failed to load views for quiz ${quizId}:`, result.error);
                updateQuizViews(quizId, 0);
            }
        } catch (err) {
            console.error(`Error loading views for quiz ${quizId}:`, err);
            updateQuizViews(quizId, 0);
        }
    }, [updateQuizViews]);

    // Load views for multiple quizzes
    const loadMultipleQuizViews = useCallback(async (quizIds: number[]) => {
        if (quizIds.length === 0) return;

        console.log(`Loading views for ${quizIds.length} quizzes`);

        // Load views for each quiz sequentially to avoid overwhelming the server
        for (const quizId of quizIds) {
            await loadQuizViews(quizId);
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }, [loadQuizViews]);

    // ------------------- SHUFFLE ARRAY -------------------
    const shuffleArray = <T,>(arr: T[]): T[] => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // ------------------- PRELOAD IMAGES -------------------
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

    // ------------------- FILTER LOGIC -------------------
    const quizHasCategory = useCallback((quizCategory: Quiz["category"], selectedCategory: number) => {
        if (!quizCategory) return false;

        if (typeof quizCategory === "number") {
            return quizCategory === selectedCategory;
        }

        if (Array.isArray(quizCategory)) {
            return quizCategory.some(cat => cat.id === selectedCategory);
        }

        if (typeof quizCategory === "object" && quizCategory !== null) {
            return (quizCategory as Category).id === selectedCategory;
        }

        return false;
    }, []);

    const filteredQuizzes = useMemo(() => {
        if (selectedCategory === "All" || selectedCategory === null) {
            return quizData;
        }

        const catId = Number(selectedCategory);
        return quizData.filter(q => quizHasCategory(q.category, catId));
    }, [quizData, selectedCategory, quizHasCategory]);

    // ------------------- INITIAL DATA FETCH -------------------
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsInitialLoading(true);
            try {
                if (questionId) {
                    const id = Number(questionId);
                    console.log(`Loading single quiz with ID: ${id}`);

                    const quizRes = await quizAPI.fetchTestById(id);

                    if (quizRes.data) {
                        const quiz: Quiz = quizRes.data;
                        setQuizData([quiz]);

                        // Load views for this quiz
                        await loadQuizViews(id);

                        // Record view for the current quiz
                        await recordView(id);
                    }
                } else {
                    console.log('Loading multiple quizzes');
                    await fetchQuizzes();
                }

                await loadCategories();
            } catch (err) {
                console.error("Initial data fetch error:", err);
            } finally {
                setIsInitialLoading(false);
            }
        };

        fetchInitialData();
    }, [questionId]);

    // ------------------- FETCH QUIZZES -------------------
    const fetchQuizzes = useCallback(async (url?: string | null) => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const res = await quizAPI.fetchRecommendedTests(url || undefined);
            let results: Quiz[] = Array.isArray(res.data.results) ? res.data.results : [];

            if (results.length === 0) {
                setHasMore(false);
                return;
            }

            // Shuffle only new results
            results = shuffleArray(results);

            // Get IDs of new quizzes
            const newQuizIds = results.map(q => q.id);

            // First add quizzes to state
            setQuizData(prev => {
                const existingIds = new Set(prev.map(q => q.id));
                const unique = results.filter(q => !existingIds.has(q.id));
                return [...prev, ...unique];
            });

            // Then load views for new quizzes
            await loadMultipleQuizViews(newQuizIds);

            // Record views for new quizzes (each gets +1 view when first loaded)
            for (const quizId of newQuizIds) {
                await recordView(quizId);
            }

            setNextPageUrl(res.data.next || null);
            setHasMore(Boolean(res.data.next));

            // Preload images for new quizzes
            preloadImages(results);
        } catch (err) {
            console.error("Fetch quizzes error:", err);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, loadMultipleQuizViews, recordView, preloadImages]);

    // ------------------- LOAD CATEGORIES -------------------
    const loadCategories = useCallback(async () => {
        try {
            const res = await quizAPI.fetchCategories();
            const data: Category[] = Array.isArray(res.data)
                ? res.data
                : res.data.results || [];
            setCategories(data);
        } catch (err) {
            console.error("Load categories error:", err);
            setCategories([]);
        }
    }, []);

    // ------------------- RESET ON CATEGORY CHANGE -------------------
    useEffect(() => {
        if (!containerRef.current) return;

        containerRef.current.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        setCurrentQuizIndex(0);
    }, [selectedCategory]);

    // ------------------- SCROLL HANDLING -------------------
    const handleScroll = useCallback(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const { scrollTop, clientHeight, scrollHeight } = container;

        // Calculate current index
        const index = Math.floor(scrollTop / clientHeight);

        if (index !== currentQuizIndex && index >= 0 && index < filteredQuizzes.length) {
            // Record view for new quiz when scrolled to
            const newQuiz = filteredQuizzes[index];
            if (newQuiz) {
                console.log(`User scrolled to quiz ${newQuiz.id}, recording view`);
                recordView(newQuiz.id);
            }
            setCurrentQuizIndex(index);
        }

        // Infinite scroll logic
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

        if (isNearBottom && !loading && hasMore && filteredQuizzes.length > 0) {
            fetchQuizzes(nextPageUrl);
        }
    }, [currentQuizIndex, filteredQuizzes, loading, hasMore, nextPageUrl, fetchQuizzes, recordView]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onScroll = () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            scrollTimeoutRef.current = setTimeout(handleScroll, 50);
        };

        container.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            container.removeEventListener("scroll", onScroll);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [handleScroll]);

    // ------------------- DEBUG: Log views state -------------------
    useEffect(() => {
        console.log('Current quizViews state:', Array.from(quizViews.entries()));
    }, [quizViews]);

    // ------------------- PRELOAD IMAGES FOR UPCOMING QUIZZES -------------------
    useEffect(() => {
        if (filteredQuizzes.length === 0) return;

        const upcomingQuizzes = filteredQuizzes.slice(
            Math.max(0, currentQuizIndex - 1),
            Math.min(filteredQuizzes.length, currentQuizIndex + 3)
        );

        preloadImages(upcomingQuizzes);
    }, [currentQuizIndex, filteredQuizzes, preloadImages]);

    // ==================== QOLGAN BARCHA FUNKSIYALAR O'ZGARMASAN QOLDI ====================
    // ANSWER HANDLERS, FOLLOW/SAVE HANDLERS, RENDER QUESTION CONTENT - HAMMASI O'ZGARMADI

    // ------------------- ANSWER HANDLERS -------------------
    const selectAnswer = async (quizId: number, answerId: number) => {
        if (submittingQuestions.has(quizId)) return;

        setSubmittingQuestions(prev => new Set(prev).add(quizId));

        try {
            const res = await quizAPI.submitAnswers({
                question: quizId,
                selected_answer_ids: [answerId]
            });

            const isCorrect = res.data.is_correct;

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
        } catch (err) {
            console.error("Select answer error:", err);
            alert("Javobni yuborishda xato. Iltimos, qayta urinib ko'ring.");
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

            const isCorrect = res.data.is_correct;

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
        } catch (err) {
            console.error("Submit multiple choice error:", err);
            alert("Javobni yuborishda xato. Iltimos, qayta urinib ko'ring.");
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

            const isCorrect = res.data.is_correct;

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
        } catch (err) {
            console.error("Text answer error:", err);
            alert("Javobni yuborishda xato. Iltimos, qayta urinib ko'ring.");
        } finally {
            setSubmittingQuestions(prev => {
                const newSet = new Set(prev);
                newSet.delete(quizId);
                return newSet;
            });
        }
    };

    // ------------------- FOLLOW / SAVE HANDLERS -------------------
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
        } catch (err) {
            console.error("Follow error:", err);
            alert("Follow qilishda xato. Iltimos, qayta urinib ko'ring.");
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
        } catch (err) {
            console.error("Bookmark error:", err);
            alert("Bookmark qilishda xato. Iltimos, qayta urinib ko'ring.");
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
                alert("Havola nusxalandi: " + shareUrl);
            }
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                console.error("Share error:", err);
            }
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

    // ------------------- RENDER QUESTION CONTENT -------------------
    const renderQuestionContent = useCallback((quiz: Quiz) => {
        const isSubmitting = submittingQuestions.has(quiz.id);
        const selectedAnswers = userInteractions.selectedAnswers.get(quiz.id) || [];
        const answerState = userInteractions.answerStates.get(quiz.id);
        const hasAnswered = selectedAnswers.length > 0 || answerState !== undefined;
        const optionsCount = quiz.answers.length;

        // TEXT INPUT
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

        // MULTIPLE CHOICE
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

        // TRUE/FALSE
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

        // SINGLE CHOICE (DEFAULT)
        const paddingClass = optionsCount <= 3
            ? "p-4 sm:p-5"
            : optionsCount === 4
                ? "p-3 sm:p-4"
                : "p-3 sm:p-3";

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

    // ------------------- STYLES -------------------
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
        
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        @media (max-width: 480px) {
            .mobile-optimized {
                font-size: 0.9rem;
            }
            
            .mobile-sidebar {
                bottom: 20vh !important;
            }
        }
    `;

    // ------------------- RENDER -------------------
    if (isInitialLoading) {
        return (
            <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
                <QuizSkeletonLoader />
            </div>
        );
    }

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
                                        selectedCategory === "All" || selectedCategory === null
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

            {/* Share Menu */}
            {showShareMenu && (
                <>
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 animate-fade-in"
                        onClick={() => setShowShareMenu(false)}
                    />
                    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 rounded-t-2xl p-6 z-50 animate-slide-in">
                        <h3 className="text-xl font-bold text-white text-center mb-6">Ulashish</h3>
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { name: "WhatsApp", color: "bg-green-500", icon: "📱" },
                                { name: "Telegram", color: "bg-blue-500", icon: "✈️" },
                                { name: "Instagram", color: "bg-pink-500", icon: "📷" },
                                { name: "Facebook", color: "bg-blue-600", icon: "👥" },
                                { name: "Copy Link", color: "bg-gray-500", icon: "🔗" },
                                { name: "Report", color: "bg-red-500", icon: "🚩" },
                                { name: "Close", color: "bg-gray-600", icon: "✕" },
                            ].map((item, index) => (
                                <button
                                    key={item.name}
                                    onClick={() => {
                                        if (item.name === "Close") {
                                            setShowShareMenu(false);
                                        } else if (item.name === "Copy Link") {
                                            navigator.clipboard.writeText(window.location.href);
                                            alert("Havola nusxalandi!");
                                        }
                                    }}
                                    className="flex flex-col items-center gap-2 p-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition"
                                >
                                    <div className={`w-10 h-10 ${item.color} rounded-full flex items-center justify-center text-white text-lg`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-xs text-gray-300 text-center font-medium">
                                        {item.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Main Container */}
            <div className="h-full overflow-y-auto scrollbar-hide">
                <div
                    ref={containerRef}
                    className="h-full overflow-y-scroll snap-y snap-mandatory"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {/* Questions */}
                    {filteredQuizzes.map((quiz, idx) => {
                        const selectedAnswers = userInteractions.selectedAnswers.get(quiz.id) || [];
                        const answerState = userInteractions.answerStates.get(quiz.id);
                        const hasAnswered = selectedAnswers.length > 0 || answerState !== undefined;
                        const optionsCount = quiz.answers.length;
                        const isCurrent = idx === currentQuizIndex;
                        const currentViews = getQuizViews(quiz.id);

                        return (
                            <div
                                key={`${quiz.id}-${idx}`}
                                className="h-screen w-full snap-start flex justify-center items-center relative"
                            >
                                {/* Background */}
                                <div
                                    className="absolute inset-0 max-w-2xl mx-auto"
                                    style={{
                                        backgroundImage: `url(${quiz.round_image || "/placeholder.svg"})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        backgroundRepeat: "no-repeat",
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
                                </div>

                                {/* Question Card - MAX-W-2XL ICHIDA */}
                                <div className="relative w-full max-w-2xl mx-auto h-full px-4 sm:px-6 flex flex-col justify-center">

                                    {/* Filter Button va Logo - MAX-W-2XL ICHIDA */}
                                    <div className="absolute top-4 left-0 right-0 z-20 px-5">
                                        <div className="flex items-center justify-between">
                                            <button
                                                title="Filter"
                                                onClick={() => setModalOpen(true)}
                                                className="w-10 h-10 md:flex rounded-full glass-morphism hidden items-center justify-center text-white hover:bg-black/50 transition-all shadow-lg"
                                            >
                                                <Filter size={18}/>
                                            </button>
                                            <Link
                                                to="https://t.me/testabduz"
                                                className="flex items-center gap-2 bg-black/40 backdrop-blur-lg border border-white/30 rounded-lg px-3 py-2 hover:bg-black/50 transition w-full md:w-auto"
                                            >
                                                <img src={Logo} alt="logo" className="w-8 h-8"/>
                                                <div className="text-left">
                                                    <div className="text-xs text-gray-300">Telegam ads</div>
                                                    <div className="text-xs text-blue-400">TestAbd.uz - Bilim va daromad manbai</div>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Question Text */}
                                    <div className="glass-morphism rounded-xl p-4 sm:p-6 mb-6 shadow-lg">
                                        <div className="text-sm sm:text-lg leading-relaxed text-white">
                                            {quiz.question_text}
                                        </div>
                                    </div>

                                    {/* Answers */}
                                    <div className={`${optionsCount >= 5 ? "max-h-[50vh]" : ""}`}>
                                        {renderQuestionContent(quiz)}
                                    </div>

                                    {/* User Info */}
                                    <div className="absolute bottom-20 left-4 right-4">
                                        <div className="glass-morphism rounded-xl p-4 max-w-md">
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
                                                    onClick={() => handleFollow(quiz.user.id)}
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

                                    {/* Sidebar Actions - VIEWS FIXED */}
                                    <div className="absolute right-4 bottom-1/4 flex flex-col gap-4">
                                        {/* Correct Count */}
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 bg-green-500/30 rounded-full flex items-center justify-center border border-green-500/50">
                                                <span className="text-green-400 font-bold">✓</span>
                                            </div>
                                            <span className="text-xs text-white mt-1">{quiz.correct_count}</span>
                                        </div>

                                        {/* Wrong Count */}
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 bg-red-500/30 rounded-full flex items-center justify-center border border-red-500/50">
                                                <span className="text-red-400 font-bold">✗</span>
                                            </div>
                                            <span className="text-xs text-white mt-1">{quiz.wrong_count}</span>
                                        </div>

                                        {/* Views - NOW SHOWS REAL VIEWS */}
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 bg-blue-500/30 rounded-full flex items-center justify-center border border-blue-500/50">
                                                <Eye size={18} className="text-blue-400"/>
                                            </div>
                                            <span className="text-xs text-white mt-1">
                                                {currentViews}
                                            </span>
                                        </div>

                                        {/* Share */}
                                        <button
                                            onClick={() => shareQuestion(quiz.id)}
                                            className="w-10 h-10 glass-morphism rounded-full flex items-center justify-center hover:bg-black/50 transition"
                                        >
                                            <Share size={18} className="text-white"/>
                                        </button>

                                        {/* Filter */}
                                        <button
                                            title="Filter"
                                            onClick={() => setModalOpen(true)}
                                            className="w-10 h-10 p-2 rounded-full glass-morphism md:hidden flex items-center justify-center text-white hover:bg-black/50 transition-all shadow-lg"
                                        >
                                            <Filter size={18}/>
                                        </button>

                                        {/* Bookmark */}
                                        <button
                                            onClick={() => handleSave(quiz.id)}
                                            className={`w-10 h-10 glass-morphism rounded-full flex items-center justify-center hover:bg-black/50 transition ${
                                                quiz.is_bookmarked ? "text-yellow-400" : "text-white"
                                            }`}
                                        >
                                            <Bookmark size={18} className={quiz.is_bookmarked ? "fill-current" : ""}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="h-screen w-full flex justify-center items-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-white">Qo'shimcha savollar yuklanmoqda...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizPage;