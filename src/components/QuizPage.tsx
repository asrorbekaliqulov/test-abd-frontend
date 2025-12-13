"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Share, Bookmark, X, Send, Check, ThumbsUp, ThumbsDown, Loader2, Filter } from "lucide-react";
import { quizAPI, accountsAPI } from "../utils/api";
import { Link } from "react-router-dom";
import Logo from "../components/assets/images/logo.jpg";
import defaultAvatar from "../components/assets/images/defaultuseravatar.png";

interface QuizPageProps { theme?: string }

export interface Category { id: number; title: string; slug: string; emoji: string; }

interface Quiz {
    id: number;
    question_text: string;
    question_type: string;
    media: string | null;
    answers: Array<{ id: number; letter: string; answer_text: string; is_correct: boolean }>;
    correct_count: number;
    wrong_count: number;
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
    const [batchIndices, setBatchIndices] = useState<number[]>([]);
    const [nextPageUrl, setNextPageUrl] = useState<string | undefined>();
    const [modalOpen, setModalOpen] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    // ------------------- UTILITIES -------------------
    const shuffleArray = <T,>(arr: T[]): T[] => arr.sort(() => Math.random() - 0.5);

    const preloadImages = useCallback((quizzes: Quiz[]) => {
        quizzes.forEach(q => {
            [q.round_image, q.user.profile_image].forEach(src => {
                if (src && !preloadedImages.has(src)) {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = src;
                    setPreloadedImages(prev => new Set(prev).add(src!));
                }
            });
        });
    }, [preloadedImages]);

    // ------------------- FETCH DATA -------------------
    const fetchQuizzes = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await quizAPI.fetchRecommendedTests(nextPageUrl);
            let results: Quiz[] = Array.isArray(res.data.results) ? res.data.results : [];
            results = shuffleArray(results).slice(0, 10);
            const existingIds = new Set(quizData.map(q => q.id));
            const newQuizzes = results.filter(q => !existingIds.has(q.id));
            if (!newQuizzes.length) return;
            const batchStart = quizData.length;
            setBatchIndices(prev => [...prev, batchStart]);
            setQuizData(prev => [...prev, ...newQuizzes]);
            setNextPageUrl(res.data.next);
            preloadImages(newQuizzes);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [loading, nextPageUrl, quizData, preloadImages]);

    const loadCategories = useCallback(async () => {
        try {
            const res = await quizAPI.fetchCategories();
            const data: Category[] = Array.isArray(res.data) ? res.data : res.data.results || [];
            setCategories(data);
        } catch { setCategories([]); }
    }, []);

    useEffect(() => { fetchQuizzes(); loadCategories(); }, []);

    // ------------------- FILTER -------------------
    const quizHasCategory = (quizCategory: Quiz["category"], selectedCategory: number) => {
        if (!quizCategory) return false;
        if (typeof quizCategory === "number") return quizCategory === selectedCategory;
        if (Array.isArray(quizCategory)) return quizCategory.some(cat => cat.id === selectedCategory);
        if (typeof quizCategory === "object") return quizCategory.id === selectedCategory;
        return false;
    };
    const filteredQuizzes = useMemo(() => {
        if (selectedCategory === "All") return quizData;
        return quizData.filter(q => quizHasCategory(q.category, Number(selectedCategory)));
    }, [quizData, selectedCategory]);

    // ------------------- SCROLL -------------------
    const handleScroll = useCallback(() => {
        if (!containerRef.current) return;
        const newIndex = Math.floor(containerRef.current.scrollTop / containerRef.current.clientHeight);
        if (newIndex !== currentQuizIndex && newIndex >= 0 && newIndex < filteredQuizzes.length) setCurrentQuizIndex(newIndex);

        const batchStart = batchIndices[batchIndices.length - 1] ?? 0;
        if (newIndex - batchStart === 7) fetchQuizzes();
    }, [currentQuizIndex, filteredQuizzes.length, batchIndices, fetchQuizzes]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        let timeoutId: NodeJS.Timeout;
        const throttledScroll = () => { clearTimeout(timeoutId); timeoutId = setTimeout(handleScroll, 50); };
        container.addEventListener("scroll", throttledScroll, { passive: true });
        return () => { container.removeEventListener("scroll", throttledScroll); clearTimeout(timeoutId); };
    }, [handleScroll]);

    useEffect(() => {
        if (!quizData.length) return;
        preloadImages(filteredQuizzes.slice(currentQuizIndex + 1, currentQuizIndex + 4));
    }, [currentQuizIndex, filteredQuizzes, preloadImages]);

    // ------------------- ANSWER HANDLERS -------------------
    const selectAnswer = async (quizId: number, answerId: number) => {
        if (submittingQuestions.has(quizId)) return;
        setSubmittingQuestions(prev => new Set(prev).add(quizId));
        try {
            const res = await quizAPI.submitAnswers({ question: quizId, selected_answer_ids: [answerId] });
            const isCorrect = res.data.is_correct;
            setUserInteractions(prev => ({
                ...prev,
                selectedAnswers: new Map(prev.selectedAnswers).set(quizId, [answerId]),
                answerStates: new Map(prev.answerStates).set(quizId, isCorrect ? "correct" : "incorrect"),
            }));
            setQuizData(prev => prev.map(q => q.id === quizId
                ? { ...q, correct_count: isCorrect ? q.correct_count + 1 : q.correct_count, wrong_count: !isCorrect ? q.wrong_count + 1 : q.wrong_count }
                : q));
        } catch (err) { console.error(err); alert("Javobni yuborishda xato."); }
        finally { setSubmittingQuestions(prev => { const newSet = new Set(prev); newSet.delete(quizId); return newSet; }); }
    };

    const handleMultipleChoice = (quizId: number, answerId: number) => {
        const answerState = userInteractions.answerStates.get(quizId);
        if (answerState) return;
        setUserInteractions(prev => {
            const current = prev.selectedAnswers.get(quizId) || [];
            const newAnswers = current.includes(answerId) ? current.filter(id => id !== answerId) : [...current, answerId];
            return { ...prev, selectedAnswers: new Map(prev.selectedAnswers).set(quizId, newAnswers) };
        });
    };

    const submitMultipleChoice = async (quizId: number) => {
        const selected = userInteractions.selectedAnswers.get(quizId) || [];
        if (!selected.length || submittingQuestions.has(quizId)) return;
        setSubmittingQuestions(prev => new Set(prev).add(quizId));
        try {
            const res = await quizAPI.submitAnswers({ question: quizId, selected_answer_ids: selected });
            const isCorrect = res.data.is_correct;
            setUserInteractions(prev => ({ ...prev, answerStates: new Map(prev.answerStates).set(quizId, isCorrect ? "correct" : "incorrect") }));
            setQuizData(prev => prev.map(q => q.id === quizId
                ? { ...q, correct_count: isCorrect ? q.correct_count + 1 : q.correct_count, wrong_count: !isCorrect ? q.wrong_count + 1 : q.wrong_count }
                : q));
        } catch (err) { console.error(err); alert("Javobni yuborishda xato."); }
        finally { setSubmittingQuestions(prev => { const newSet = new Set(prev); newSet.delete(quizId); return newSet; }); }
    };

    const handleTextAnswer = async (quizId: number) => {
        const textAnswer = userInteractions.textAnswers.get(quizId)?.trim();
        if (!textAnswer || submittingQuestions.has(quizId)) return;
        setSubmittingQuestions(prev => new Set(prev).add(quizId));
        try {
            const res = await quizAPI.submitTextAnswers({ question: quizId, written_answer: textAnswer });
            const isCorrect = res.data.is_correct;
            setUserInteractions(prev => ({ ...prev, answerStates: new Map(prev.answerStates).set(quizId, isCorrect ? "correct" : "incorrect") }));
            setQuizData(prev => prev.map(q => q.id === quizId
                ? { ...q, correct_count: isCorrect ? q.correct_count + 1 : q.correct_count, wrong_count: !isCorrect ? q.wrong_count + 1 : q.wrong_count }
                : q));
        } catch (err) { console.error(err); alert("Javobni yuborishda xato."); }
        finally { setSubmittingQuestions(prev => { const newSet = new Set(prev); newSet.delete(quizId); return newSet; }); }
    };

    // ------------------- FOLLOW / SAVE -------------------
    const handleFollow = async (user_id: number) => {
        try {
            await accountsAPI.toggleFollow(user_id);
            setQuizData(prev => prev.map(q => q.user.id === user_id ? { ...q, user: { ...q.user, is_following: !q.user.is_following } } : q));
        } catch (err) { console.error(err); alert("Follow qilishda xato."); }
    };

    const handleSave = (quizId: number) => {
        quizAPI.bookmarkQuestion({ question: quizId })
            .then(() => setQuizData(prev => prev.map(q => q.id === quizId ? { ...q, is_bookmarked: !q.is_bookmarked } : q)))
            .catch(err => { console.error(err); alert("Bookmark qilishda xato."); });
    };

    const shareQuestion = (quizId: number) => {
        const shareUrl = `${window.location.origin}/questions/${quizId}`;
        navigator.share ? navigator.share({ title: "TestAbd savoli", text: "Mana bir qiziqarli savol!", url: shareUrl }).catch(console.error)
            : navigator.clipboard.writeText(shareUrl).then(() => alert("Havola nusxalandi: " + shareUrl));
    };

    const isTrueFalseQuestion = (quiz: Quiz) => quiz.question_type === "true_false" || (quiz.answers.length === 2 && quiz.answers.some(a => ["true", "ha", "yes"].includes(a.answer_text.toLowerCase())) && quiz.answers.some(a => ["false", "yo'q", "no"].includes(a.answer_text.toLowerCase())));

    console.log("QUIZ DATA LENGTH: ", quizData.length);

    const renderQuestionContent = (quiz: Quiz) => {
        const isSubmitting = submittingQuestions.has(quiz.id);
        const selectedAnswers = userInteractions.selectedAnswers.get(quiz.id) || [];
        const answerState = userInteractions.answerStates.get(quiz.id);
        const hasAnswered = selectedAnswers.length > 0 || answerState !== undefined;
        const optionsCount = quiz.answers.length;

        // -------- TEXT INPUT --------
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
                        disabled={hasAnswered}
                        rows={4}
                        className={`w-full px-5 py-4 rounded-xl bg-black/40 backdrop-blur-lg border border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-white/70 focus:ring-2 focus:ring-white/20 transition-all shadow-lg resize-none ${hasAnswered ? "opacity-70 cursor-not-allowed" : ""}`}
                    />
                        {answerState && (
                            <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${answerState === "correct" ? "bg-green-500" : "bg-red-500"}`}>
                                {answerState === "correct" ? <Check size={16} className="text-white"/> : <X size={16} className="text-white"/>}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => handleTextAnswer(quiz.id)}
                        disabled={!textAnswer.trim() || hasAnswered || isSubmitting}
                        className={`self-end px-6 py-3 rounded-xl bg-black/40 backdrop-blur-lg border border-white/30 text-white font-medium flex items-center gap-2 transition-all shadow-lg ${isSubmitting ? "bg-blue-500/40 cursor-not-allowed" : textAnswer.trim() && !hasAnswered ? "hover:bg-black/50 hover:border-white/50 hover:shadow-xl" : "opacity-50 cursor-not-allowed"}`}
                    >
                        {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <Send size={20}/>}
                        <span>{isSubmitting ? "Yuborilmoqda..." : "Javobni yuborish"}</span>
                    </button>

                    {answerState && (
                        <div className={`text-center py-2 px-4 rounded-lg ${answerState === "correct" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                            {answerState === "correct" ? "✅ To'g'ri javob!" : "❌ Noto'g'ri javob"}
                        </div>
                    )}
                </div>
            );
        }

        // -------- MULTIPLE CHOICE --------
        if (quiz.question_type === "multiple") {
            return (
                <div className="space-y-3 sm:space-y-4">
                    <div className="grid gap-3 sm:gap-4">
                        {quiz.answers.map(option => {
                            const isSelected = selectedAnswers.includes(option.id);
                            const showCorrect = answerState && option.is_correct;
                            const showIncorrect = answerState && isSelected && !option.is_correct;

                            const btnClass = showCorrect ? "border-green-400/60 bg-green-500/30"
                                : showIncorrect ? "border-red-400/60 bg-red-500/30"
                                    : isSelected ? "border-blue-400/60 bg-blue-500/30"
                                        : "border-white/30 hover:bg-black/50 hover:border-white/40";

                            const circleClass = showCorrect ? "bg-green-500 text-white"
                                : showIncorrect ? "bg-red-500 text-white"
                                    : isSelected ? "bg-blue-500 text-white"
                                        : "bg-white/30 text-white";

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleMultipleChoice(quiz.id, option.id)}
                                    disabled={answerState !== undefined}
                                    className={`flex items-center gap-3 sm:gap-4 px-5 py-4 rounded-xl bg-black/40 backdrop-blur-lg border transition-all text-left shadow-lg ${btnClass}`}
                                >
                                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${circleClass}`}>
                                        {(isSelected || showCorrect) && <Check size={14}/>}
                                        {showIncorrect && <X size={14}/>}
                                    </div>
                                    <span className="flex-1 font-medium text-white text-sm sm:text-base">{option.answer_text}</span>
                                </button>
                            );
                        })}
                    </div>

                    {selectedAnswers.length > 0 && !answerState && (
                        <button
                            onClick={() => submitMultipleChoice(quiz.id)}
                            disabled={isSubmitting}
                            className={`w-full py-4 rounded-xl bg-black/40 backdrop-blur-lg border border-white/30 text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg ${isSubmitting ? "bg-blue-500/40" : "hover:bg-black/50 hover:border-white/40"}`}
                        >
                            {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <Send size={20}/>}
                            <span>Javobni yuborish ({selectedAnswers.length} ta tanlangan)</span>
                        </button>
                    )}
                </div>
            );
        }

        // -------- TRUE/FALSE --------
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

                        const isTrue = ["true", "ha", "yes", "to'g'ri"].includes(option.answer_text.toLowerCase());

                        return (
                            <button
                                key={option.id}
                                onClick={() => selectAnswer(quiz.id, option.id)}
                                disabled={hasAnswered || isSubmitting}
                                className={`flex flex-col items-center justify-center gap-3 sm:gap-4 py-6 sm:py-8 px-4 sm:px-6 rounded-xl bg-black/40 backdrop-blur-lg border transition-all shadow-lg ${getBtnClass()}`}
                            >
                                {isTrue ? <ThumbsUp size={28} className="text-green-400 sm:w-8 sm:h-8"/> : <ThumbsDown size={28} className="text-red-400 sm:w-8 sm:h-8"/>}
                                <span className="text-base sm:text-lg font-medium text-white">{option.answer_text}</span>
                                {isSubmitting && isSelected && <Loader2 size={16} className="animate-spin text-white"/>}
                                {isUserCorrect && <Check size={20} className="text-green-400"/>}
                                {showIncorrect && <X size={20} className="text-red-400"/>}
                            </button>
                        );
                    })}
                </div>
            );
        }

        // -------- SINGLE CHOICE (DEFAULT) --------
        const paddingClass = optionsCount <= 3 ? "p-4 sm:p-5" : optionsCount === 4 ? "p-3 sm:p-4" : "p-3 sm:p-3";
        const circleSize = optionsCount <= 3 ? "w-8 h-8 sm:w-10 sm:h-10" : optionsCount === 4 ? "w-7 h-7 sm:w-8 sm:h-8" : "w-6 h-6 sm:w-7 sm:h-7";
        const fontSize = optionsCount <= 3 ? "text-base sm:text-lg" : "text-sm sm:text-base";
        const gap = optionsCount <= 3 ? "gap-3 sm:gap-4" : "gap-2 sm:gap-3";

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
                            <span className={`flex-1 ${fontSize} font-medium text-white`}>{option.answer_text}</span>
                            {isSubmitting && isSelected && <Loader2 size={16} className="animate-spin text-white"/>}
                            {isUserCorrect && <Check size={18} className="text-green-400"/>}
                            {showIncorrect && <X size={18} className="text-red-400"/>}
                        </button>
                    );
                })}
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
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes slideIn {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        .animate-pulse-custom {
          animation: pulse 2s infinite;
        }
        
        .animate-slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }

        @media screen and (max-width: 414px) and (max-height: 896px) {
          .mobile-sidebar {
            bottom: 25vh !important;
          }
          
          .mobile-sidebar button {
            width: 3.5rem !important;
            height: 3.5rem !important;
          }
          
          .mobile-sidebar .follow-btn {
            width: 2rem !important;
            height: 2rem !important;
          }
        }

        @media screen and (max-width: 480px) {
          .mobile-sidebar {
            bottom: 22vh;
          }
        }
      `}</style>

            <div
                ref={containerRef}
                className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative z-10 bg-theme-primary"
                style={{scrollbarWidth: "none", msOverflowStyle: "none"}}
            >

                {filteredQuizzes.length === 0 ? (
                    <div
                        className="h-screen w-full flex justify-center items-center animate-fade-in gap-3">
                        <div
                            className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className={"text-xl font-medium text-white"}>Yuklanmoqda...</span>
                    </div>
                ) : (filteredQuizzes?.map((quiz, idx) => {
                    const selectedAnswers = userInteractions.selectedAnswers.get(quiz.id) || [];
                    const answerState = userInteractions.answerStates.get(quiz.id);
                    const hasSelected = selectedAnswers.length > 0 || answerState !== undefined;
                    const isSubmitting = submittingQuestions.has(quiz.id);
                    const optionsCount = quiz.answers.length;
                    const isCurrentQuestion = idx === currentQuizIndex;

                    return (
                        <div
                            key={`${quiz.id}-${idx}`}
                            className="h-screen w-full snap-start flex justify-center items-center relative"
                        >
                            <div
                                className="relative w-full h-full max-w-2xl mx-auto px-4 sm:px-6 overflow-hidden"
                                style={{
                                    backgroundImage: `url(${quiz.round_image || "/placeholder.svg?height=800&width=400"})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    backgroundRepeat: "no-repeat",
                                }}
                            >
                                <div
                                    className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70 z-1"></div>
                                <div
                                    className={`absolute bottom-20 left-5sm:bottom-4 sm:left-3 column items-center space-x-3 z-10 glass-morphism rounded-xl p-3 max-w-xs`}>
                                    <div className={"flex flex-row items-center justify-start gap-4"}>
                                        <a href={`/profile/${quiz.user.username}`}
                                           className="flex items-center space-x-3">
                                            <img
                                                src={quiz.user.profile_image || defaultAvatar}
                                                alt="Creator"
                                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white/30 cursor-pointer hover:scale-110 transition-transform object-cover shadow-lg"
                                                loading="lazy"
                                                decoding={"async"}
                                            />

                                            <div>
                                                <span
                                                    className="text-white font-medium text-sm">@{quiz.user.username}</span>
                                                <div className="text-white/60 text-xs">{quiz.test_title}</div>
                                            </div>
                                        </a>
                                        <button
                                            title={`${quiz.user.is_following ? `Unfollow ${quiz.user.username}` : `Follow ${quiz.user.username}`}`}
                                            onClick={() => handleFollow(quiz.user.id)}
                                            className={`follow-btn w-auto h-auto sm:w-auto sm:h-auto py-0.5 px-2 border-2 rounded-sm border-white/30 backdrop-blur-sm flex items-center justify-center font-medium transition-all hover:scale-105 text-xs sm:text-sm ${quiz.user.is_following ? "bg-transparent text-white" : "bg-green-500 text-white"}`}
                                        >
                                            {quiz.user.is_following ? "Following" : "Follow"}
                                        </button>
                                    </div>
                                    {quiz.test_description && (
                                        <p className="text-white/70 text-xs mt-2 line-clamp-2">{quiz.test_description}</p>
                                    )}
                                </div>

                                <div
                                    className={`absolute top-24 left-4 right-4 sm:top-23 sm:left-6 sm:right-6 bg-black/40 backdrop-blur-lg border border-white/30 rounded-xl p-4 sm:p-6 z-5 shadow-lg`}
                                >
                                    <div
                                        className="text-sm sm:text-base leading-relaxed text-white text-opacity-95">
                                        {quiz.question_text}
                                    </div>
                                </div>

                                {/* Filter Button */}
                                <div className="flex flex-row items-center justify-between gap-1 absolute top-2 left-2 w-[95%]">
                                    <div className="flex flex-row items-center justify-center gap-1">

                                        <button
                                            title="Filter"
                                            onClick={() => setModalOpen(true)}
                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 backdrop-blur-lg border border-white/30 flex items-center justify-center text-white hover:bg-black/50 transition-all shadow-lg"
                                        >
                                            <Filter size={18}/>
                                        </button>
                                    </div>

                                    <Link
                                        to="https://t.me/testabduz"
                                        className="flex w-auto h-14 bg-blue-950 border border-gray-600 p-1"
                                    >
                                        <div className="flex flex-row items-center justify-center gap-1">
                                            <div className={"flex flex-col items-start"}>
                                                <span className={"text-xs text-gray-300"}>TestAbd.uz</span>
                                                <span className={"text-xs text-gray-300"}><span className={"text-xs text-blue-5                                                                                                                                                             00"}>TestAbd.uz </span>- Bu nafaqat bilim, balki daromad manbai.</span>
                                            </div>
                                            <img src={Logo} alt="logo" className={"flex w-10 h-10"}/>
                                        </div>
                                    </Link>
                                </div>


                                {/* Modal */}
                                {modalOpen && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                                        {/* Background */}
                                        <div
                                            className="absolute inset-0 bg-black bg-opacity-50"
                                            onClick={() => setModalOpen(false)}
                                        />

                                        {/* Modal */}
                                        <div className="relative bg-white rounded-xl shadow-lg w-80 sm:w-96 md:w-[28rem] lg:w-[32rem] max-h-[85vh] flex flex-col">

                                            <h2 className="text-lg font-semibold p-4 border-b">Select Category</h2>

                                            {/* Scrollable content */}
                                            <div className="p-4 overflow-y-auto flex-1">
                                                <div className="flex flex-col gap-2">

                                                    <button
                                                        className={`px-4 py-2 rounded ${
                                                            selectedCategory === "All" || selectedCategory === null
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-gray-200"
                                                        }`}
                                                        onClick={() => setSelectedCategory("All")}
                                                    >
                                                        All
                                                    </button>

                                                    {categories.map(cat => (
                                                        <button
                                                            key={cat.id}
                                                            className={`px-4 py-2 rounded ${
                                                                selectedCategory === cat.id
                                                                    ? "bg-blue-600 text-white"
                                                                    : "bg-gray-200"
                                                            }`}
                                                            onClick={() => setSelectedCategory(cat.id)}
                                                        >
                                                            {cat.emoji} {cat.title}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="p-4 border-t flex justify-end gap-2">
                                                <button
                                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                                                    onClick={() => setModalOpen(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                                    onClick={() => setModalOpen(false)}
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div
                                    className={`absolute ${isTrueFalseQuestion(quiz)
                                        ? "top-1/3"
                                        : optionsCount <= 3
                                            ? "top-1/3"
                                            : optionsCount === 4
                                                ? "top-[30%]"
                                                : "top-[28%]"
                                    } left-4 right-8 sm:left-6 sm:right-20 z-5 ${optionsCount >= 5 ? "max-h-[45vh]" : ""}`}
                                >
                                    {quiz.answers && quiz.answers.length > 0 ? (
                                        renderQuestionContent(quiz)
                                    ) : (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="flex items-center gap-3 text-white">
                                                <Loader2 size={24} className="animate-spin"/>
                                                <span
                                                    className="text-base sm:text-lg">Variantlar yuklanmoqda...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div
                                    className={`absolute right-3 mobile-sidebar flex flex-col gap-2 sm:gap-3 z-10`}
                                    style={{bottom: "15vh"}}
                                >
                                    <div className="flex flex-col items-center">
                                        <button
                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all">
                                            <div
                                                className="w-9 h-9 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                                                                    <span
                                                                        className="text-white text-xs font-bold">✓</span>
                                            </div>
                                        </button>
                                        <span
                                            className="text-xs sm:text-sm font-medium text-white text-center">{quiz.correct_count}</span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <button
                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full  flex items-center justify-center text-white transition-all">
                                            <div
                                                className="w-9 h-9 sm:w-8 sm:h-8 bg-red-500 rounded-full flex items-center justify-center">
                                                                    <span
                                                                        className="text-white text-xs font-bold">✗</span>
                                            </div>
                                        </button>
                                        <span
                                            className="text-xs sm:text-sm font-medium text-white text-center">{quiz.wrong_count}</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-1">
                                        <button
                                            title={"Share"}
                                            onClick={() => shareQuestion(quiz.id)}
                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white transition-all"
                                        >
                                            <Share size={20} className="sm:w-5 sm:h-5"/>
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <button
                                            title={"Save"}
                                            onClick={() => handleSave(quiz.id)}
                                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${quiz.is_bookmarked
                                                ? "bg-transparent text-yellow-400"
                                                : "bg-transparent text-white"
                                            }`}
                                        >
                                            <Bookmark size={20}
                                                      className={`sm:w-5 sm:h-5 ${quiz.is_bookmarked ? "fill-current" : ""}`}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }))}

                {loading && (
                    <div
                        className="h-screen w-full flex justify-center items-center animate-fade-in">
                        <div
                            className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {showShareMenu && (
                <>
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 animate-fade-in"
                        onClick={() => setShowShareMenu(false)}
                    ></div>
                    <div
                        className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 rounded-t-2xl p-6 sm:p-8 z-50 animate-slide-in">
                        <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-6">Ulashish</h3>
                        <div className="grid grid-cols-4 gap-4 sm:gap-6">
                            {[
                                {name: "WhatsApp", color: "bg-green-500", icon: "📱"},
                                {name: "Telegram", color: "bg-blue-500", icon: "✈️"},
                                {name: "Instagram", color: "bg-pink-500", icon: "📷"},
                                {name: "Facebook", color: "bg-blue-600", icon: "👥"},
                                {name: "Copy Link", color: "bg-gray-500", icon: "🔗"},
                                {name: "Download", color: "bg-green-600", icon: "⬇️"},
                                {name: "Report", color: "bg-red-500", icon: "🚩"},
                                {name: "Close", color: "bg-gray-600", icon: "✕"},
                            ].map((item, index) => (
                                <button
                                    key={item.name}
                                    onClick={() => setShowShareMenu(false)}
                                    className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-all animate-fade-in-up"
                                    style={{animationDelay: `${index * 0.05}s`}}
                                >
                                    <div
                                        className={`w-10 h-10 sm:w-12 sm:h-12 ${item.color} rounded-full flex items-center justify-center text-white text-lg sm:text-xl`}
                                    >
                                        {item.icon}
                                    </div>
                                    <span
                                        className="text-xs sm:text-sm text-gray-300 text-center font-medium">{item.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )
            }
        </div>
    )
}

export default QuizPage
