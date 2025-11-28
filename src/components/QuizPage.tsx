"use client"

import type React from "react"
import {useState, useEffect, useRef, useCallback} from "react"
import {Share, Bookmark, X, Send, Check, ThumbsUp, ThumbsDown, Loader2, Filter} from "lucide-react"
import {quizAPI, accountsAPI} from "../utils/api"
import {Link} from "react-router-dom";
import adsIcon from "./assets/images/ads.svg";

interface QuizPageProps {
    theme: string
}

export interface Category {
    id: number;
    title: string;
    slug: string;
    emoji: string;
}

interface Quiz {
    id: number
    question_text: string
    question_type: string
    media: string | null
    answers: Array<{
        id: number
        letter: string
        answer_text: string
        is_correct: boolean
    }>
    correct_count: number
    wrong_count: number
    test_title: string
    test_description: string
    difficulty_percentage: number
    is_bookmarked?: boolean
    user: {
        id: number
        username: string
        profile_image: string | null
        is_badged?: boolean
        is_premium?: boolean
        is_following?: boolean
    }
    created_at: string
    round_image: string | null
    category?: string | Category | Category[] | null;
}

const QuizPage: React.FC<QuizPageProps> = ({theme = "dark"}) => {
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
    const [userInteractions, setUserInteractions] = useState({
        follows: new Set<string>(),
        saves: new Set<number>(),
        selectedAnswers: new Map<number, number[]>(),
        textAnswers: new Map<number, string>(),
        answerStates: new Map<number, "correct" | "incorrect">(),
    })
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)
    const [showShareMenu, setShowShareMenu] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const [nextPageUrl, setNextPageUrl] = useState<string | undefined>(undefined)
    const [quizData, setQuizData] = useState<Quiz[]>([])
    const [submittingQuestions, setSubmittingQuestions] = useState<Set<number>>(new Set())
    const [batchIndices, setBatchIndices] = useState<number[]>([])
    const [animateIn, setAnimateIn] = useState(true)
    const [direction, setDirection] = useState<"up" | "down">("up")
    const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set())
    const [isScrolling, setIsScrolling] = useState(false)

    // Timer states
    const [questionTimers, setQuestionTimers] = useState<Map<number, number>>(new Map())
    const [questionStartTimes, setQuestionStartTimes] = useState<Map<number, number>>(new Map())
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const [currentTimerQuestionId, setCurrentTimerQuestionId] = useState<number | null>(null)

    // Categoriyalar
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | "All" | null>(null);
    const [modalOpen, setModalOpen] = useState(false);


// --- Helper: Quiz kategoriyasining nomini olish
    const getQuizCategoryName = (quiz: Quiz): string => {
        const cat = quiz.category;

        if (!cat) return "Noma'lum";

        // backend: number bo‘lib keladi (ID)
        if (typeof cat === "number") {
            const found = categories.find(c => c.id === cat);
            return found?.title || "Noma'lum";
        }

        return "Noma'lum";
    };


// Massivni tasodifiy aralashtirish (xatosiz)
    const shuffleArray = <T,>(array: T[]): T[] => {
        if (!Array.isArray(array) || array.length === 0) return [];
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };


// --- Quizlarni yuklash
    const loadAllQuizzes = async (): Promise<void> => {
        setLoading(true);
        try {
            let allQuizzes: Quiz[] = [];
            let url: string | null = "/quiz/questions/";

            while (url) {
                const res = await quizAPI.fetchQuestions(url);
                const data: Quiz[] = Array.isArray(res.data.results) ? res.data.results : [];
                allQuizzes = allQuizzes.concat(data);
                url = res.data.next || null;
            }

            setQuizData(shuffleArray(allQuizzes));

        } catch (err) {
            console.error("Quiz API error:", err);
            setQuizData([]);
        } finally {
            setLoading(false);
        }
    };


// --- Categorylarni yuklash
    const loadCategories = async () => {
        try {
            const res = await quizAPI.fetchCategories();
            const data: Category[] = Array.isArray(res.data) ? res.data : res.data.results || [];
            setCategories(data);
        } catch (err) {
            console.error("Category API error:", err);
            setCategories([]);
        }
    };

    useEffect(() => {
        loadAllQuizzes();
        loadCategories();
    }, []);


// --- FRONTEND FILTER — backenddan číslo kelgan category ID bo‘yicha!
    const filteredQuizzes =
        selectedCategory && selectedCategory !== "All"
            ? quizData.filter(q => q.category === selectedCategory)
            : quizData;

    // Preload images function
    const preloadImages = useCallback(
        (startIndex: number, count = 5) => {
            for (let i = startIndex; i < Math.min(startIndex + count, quizData.length); i++) {
                const quiz = quizData[i]
                if (quiz?.round_image && !preloadedImages.has(quiz.round_image)) {
                    const img = new Image()
                    img.crossOrigin = "anonymous"
                    img.onload = () => {
                        setPreloadedImages((prev) => new Set(prev).add(quiz.round_image!))
                    }
                    img.onerror = () => {
                        console.warn(`Failed to preload image: ${quiz.round_image}`)
                    }
                    img.src = quiz.round_image
                }

                if (quiz?.user.profile_image && !preloadedImages.has(quiz.user.profile_image)) {
                    const img = new Image()
                    img.crossOrigin = "anonymous"
                    img.onload = () => {
                        setPreloadedImages((prev) => new Set(prev).add(quiz.user.profile_image!))
                    }
                    img.onerror = () => {
                        console.warn(`Failed to preload profile image: ${quiz.user.profile_image}`)
                    }
                    img.src = quiz.user.profile_image
                }
            }
        },
        [quizData, preloadedImages],
    )

    // Start question timer
    const startQuestionTimer = useCallback(
        (quizId: number) => {
            if (userInteractions.answerStates.has(quizId)) {
                return
            }

            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current)
                timerIntervalRef.current = null
            }

            const now = Date.now()
            setQuestionStartTimes((prev) => new Map(prev).set(quizId, now))
            setQuestionTimers((prev) => new Map(prev).set(quizId, 0))
            setCurrentTimerQuestionId(quizId)

            timerIntervalRef.current = setInterval(() => {
                setQuestionTimers((prev) => {
                    const newMap = new Map(prev)
                    const startTime = questionStartTimes.get(quizId)
                    if (startTime) {
                        const elapsed = Math.floor((Date.now() - startTime) / 1000)
                        newMap.set(quizId, elapsed)
                    }
                    return newMap
                })
            }, 1000)
        },
        [userInteractions.answerStates],
    )

    // Stop question timer
    const stopQuestionTimer = useCallback(
        (quizId: number) => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current)
                timerIntervalRef.current = null
            }

            setCurrentTimerQuestionId(null)

            const startTime = questionStartTimes.get(quizId)
            if (startTime) {
                const finalDuration = Math.floor((Date.now() - startTime) / 1000)
                setQuestionTimers((prev) => new Map(prev).set(quizId, finalDuration))
                return finalDuration
            }
            return 0
        },
        [questionStartTimes],
    )

    const fetchQuizzes = async (url?: string) => {
        if (loading) return
        setLoading(true)
        try {
            const response = await quizAPI.fetchRecommendedTests(url)
            const data = response.data

            const newBatchStart = quizData.length
            setBatchIndices((prev) => [...prev, newBatchStart])

            // Remove duplicates by ID
            setQuizData((prev) => {
                const existingIds = new Set(prev.map((quiz) => quiz.id))
                const newQuizzes = data.results.filter((quiz: Quiz) => !existingIds.has(quiz.id))
                const updatedQuizzes = [...prev, ...newQuizzes]
                setTimeout(() => preloadImages(newBatchStart, 10), 100)
                return updatedQuizzes
            })
            setNextPageUrl(data.next)
            setHasMore(!!data.next)
            setPage((prevPage) => prevPage + 1)
        } catch (error) {
            console.error("Savollarni yuklashda xatolik:", error)
            alert("Savollarni yuklashda xato yuz berdi. Qaytadan urinib ko‘ring.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchQuizzes()
    }, [])
    ////////////////////////////////////////////////////////////

    useEffect(() => {
        if (quizData.length > 0) {
            preloadImages(currentQuizIndex + 1, 3)
        }
    }, [currentQuizIndex, preloadImages])

    useEffect(() => {
        if (quizData.length > 0 && currentQuizIndex >= 0 && currentQuizIndex < quizData.length) {
            const currentQuiz = quizData[currentQuizIndex]
            if (currentQuiz) {
                startQuestionTimer(currentQuiz.id)
            }
        }
    }, [quizData.length, currentQuizIndex, startQuestionTimer])

    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current)
            }
        }
    }, [])

    const handleScroll = useCallback(() => {
        if (!containerRef.current || !hasMore) return

        const container = containerRef.current
        const scrollTop = container.scrollTop
        const clientHeight = container.clientHeight
        const newIndex = Math.floor(scrollTop / clientHeight)

        if (!isScrolling) {
            setIsScrolling(true)
            setTimeout(() => setIsScrolling(false), 150)
        }

        if (newIndex !== currentQuizIndex && newIndex >= 0 && newIndex < quizData.length) {
            setDirection(newIndex > currentQuizIndex ? "up" : "down")
            setAnimateIn(false)

            setTimeout(() => {
                setCurrentQuizIndex(newIndex)
                setAnimateIn(true)

                const newQuiz = quizData[newIndex]
                if (newQuiz) {
                    startQuestionTimer(newQuiz.id)
                }
            }, 30)
        }

        // Load more content at question 8
        if (newIndex >= 0 && newIndex < quizData.length) {
            const currentBatchIndex = batchIndices.findIndex((startIndex, i) => {
                const endIndex = i < batchIndices.length - 1 ? batchIndices[i + 1] - 1 : quizData.length - 1
                return newIndex >= startIndex && newIndex <= endIndex
            })

            if (currentBatchIndex !== -1) {
                const batchStartIndex = batchIndices[currentBatchIndex]
                const relativeIndex = newIndex - batchStartIndex

                if (relativeIndex === 8 && nextPageUrl && !loading) {
                    fetchQuizzes(nextPageUrl)
                }
            }
        }
    }, [currentQuizIndex, quizData, hasMore, nextPageUrl, batchIndices, loading, isScrolling, startQuestionTimer])

    const selectAnswer = async (quizId: number, answerId: number) => {
        const selectedAnswers = userInteractions.selectedAnswers.get(quizId) || []
        if (selectedAnswers.length > 0 || submittingQuestions.has(quizId)) return

        const duration = stopQuestionTimer(quizId)

        setSubmittingQuestions((prev) => new Set(prev).add(quizId))

        try {
            const res = await quizAPI.submitAnswers({
                question: quizId,
                selected_answer_ids: [answerId],
                duration: duration,
            })

            const isCorrect = res.data.is_correct

            setUserInteractions((prev) => ({
                ...prev,
                selectedAnswers: new Map(prev.selectedAnswers).set(quizId, [answerId]),
                answerStates: new Map(prev.answerStates).set(quizId, isCorrect ? "correct" : "incorrect"),
            }))

            setQuizData((prevQuizzes) =>
                prevQuizzes.map((quiz) =>
                    quiz.id === quizId
                        ? {
                            ...quiz,
                            correct_count: isCorrect ? quiz.correct_count + 1 : quiz.correct_count,
                            wrong_count: !isCorrect ? quiz.wrong_count + 1 : quiz.wrong_count,
                        }
                        : quiz,
                ),
            )
        } catch (err) {
            console.error("Yechim jo'natishda xato:", err)
            alert("Javobni yuborishda xato yuz berdi. Qaytadan urinib ko‘ring.")
        } finally {
            setSubmittingQuestions((prev) => {
                const newSet = new Set(prev)
                newSet.delete(quizId)
                return newSet
            })
        }
    }

    const handleMultipleChoice = (quizId: number, answerId: number) => {
        const answerState = userInteractions.answerStates.get(quizId)
        if (answerState) return

        setUserInteractions((prev) => {
            const current = prev.selectedAnswers.get(quizId) || []
            const newAnswers = current.includes(answerId) ? current.filter((id) => id !== answerId) : [...current, answerId]
            const updated = new Map(prev.selectedAnswers)
            updated.set(quizId, newAnswers)
            return {
                ...prev,
                selectedAnswers: updated,
            }
        })
    }

    const submitMultipleChoice = async (quizId: number) => {
        const selected = userInteractions.selectedAnswers.get(quizId) || []
        if (selected.length === 0 || submittingQuestions.has(quizId)) return

        const duration = stopQuestionTimer(quizId)

        setSubmittingQuestions((prev) => new Set(prev).add(quizId))

        try {
            const response = await quizAPI.submitAnswers({
                question: quizId,
                selected_answer_ids: selected,
                duration: duration,
            })

            const isCorrect = response.data.is_correct

            setUserInteractions((prev) => ({
                ...prev,
                answerStates: new Map(prev.answerStates).set(quizId, isCorrect ? "correct" : "incorrect"),
            }))

            setQuizData((prevQuizzes) =>
                prevQuizzes.map((quiz) =>
                    quiz.id === quizId
                        ? {
                            ...quiz,
                            correct_count: isCorrect ? quiz.correct_count + 1 : quiz.correct_count,
                            wrong_count: !isCorrect ? quiz.wrong_count + 1 : quiz.wrong_count,
                        }
                        : quiz,
                ),
            )
        } catch (error) {
            console.error("Javobni yuborishda xatolik:", error)
            alert("Javobni yuborishda xato yuz berdi. Qaytadan urinib ko‘ring.")
        } finally {
            setSubmittingQuestions((prev) => {
                const newSet = new Set(prev)
                newSet.delete(quizId)
                return newSet
            })
        }
    }

    const handleTextAnswer = async (quizId: number) => {
        const textAnswer = userInteractions.textAnswers.get(quizId)
        if (!textAnswer?.trim() || submittingQuestions.has(quizId)) return

        const duration = stopQuestionTimer(quizId)

        setSubmittingQuestions((prev) => new Set(prev).add(quizId))

        try {
            const response = await quizAPI.submitTextAnswers({
                question: quizId,
                written_answer: textAnswer.trim(),
                duration: duration,
            })

            const isCorrect = response.data.is_correct

            setUserInteractions((prev) => ({
                ...prev,
                answerStates: new Map(prev.answerStates).set(quizId, isCorrect ? "correct" : "incorrect"),
            }))

            setQuizData((prevQuizzes) =>
                prevQuizzes.map((quiz) =>
                    quiz.id === quizId
                        ? {
                            ...quiz,
                            correct_count: isCorrect ? quiz.correct_count + 1 : quiz.correct_count,
                            wrong_count: !isCorrect ? quiz.wrong_count + 1 : quiz.wrong_count,
                        }
                        : quiz,
                ),
            )
        } catch (error) {
            console.error("Javobni yuborishda xatolik:", error)
            alert("Javobni yuborishda xato yuz berdi. Qaytadan urinib ko‘ring.")
        } finally {
            setSubmittingQuestions((prev) => {
                const newSet = new Set(prev)
                newSet.delete(quizId)
                return newSet
            })
        }
    }

    const shareQuestion = (quizId: number) => {
        const shareUrl = `${window.location.origin}/questions/${quizId}`

        if (navigator.share) {
            navigator
                .share({
                    title: "TestAbd savoli",
                    text: "Mana bir qiziqarli savol!",
                    url: shareUrl,
                })
                .then(() => {
                    console.log("Ulashildi!")
                })
                .catch((err) => {
                    console.error("Ulashishda xatolik:", err)
                })
        } else {
            navigator.clipboard
                .writeText(shareUrl)
                .then(() => {
                    alert("Havola nusxalandi: " + shareUrl)
                })
                .catch(() => {
                    console.error("Havolani nusxalab bo'lmadi.")
                })
        }
    }

    const handleFollow = async (user_id: number) => {
        try {
            await accountsAPI.toggleFollow(user_id)

            setQuizData((prev) =>
                prev.map((quiz) =>
                    quiz.user.id === user_id
                        ? {
                            ...quiz,
                            user: {
                                ...quiz.user,
                                is_following: !quiz.user.is_following,
                            },
                        }
                        : quiz,
                ),
            )
        } catch (error) {
            console.error("Follow toggle failed:", error)
            alert("Follow qilishda xato yuz berdi. Qaytadan urinib ko‘ring.")
        }
    }

    const handleSave = (quizId: number) => {
        quizAPI
            .bookmarkQuestion({question: quizId})
            .then((res) => {
                setQuizData((prev) =>
                    prev.map((quiz) => (quiz.id === quizId ? {...quiz, is_bookmarked: !quiz.is_bookmarked} : quiz)),
                )
            })
            .catch((err) => {
                console.error("Bookmark toggle xatolik:", err)
                alert("Bookmark qilishda xato yuz berdi. Qaytadan urinib ko‘ring.")
            })
    }

    useEffect(() => {
        const container = containerRef.current
        if (container) {
            let timeoutId: NodeJS.Timeout
            const throttledScroll = () => {
                clearTimeout(timeoutId)
                timeoutId = setTimeout(handleScroll, 50)
            }

            container.addEventListener("scroll", throttledScroll, {passive: true})
            return () => {
                container.removeEventListener("scroll", throttledScroll)
                clearTimeout(timeoutId)
            }
        }
    }, [handleScroll])

    const isTrueFalseQuestion = (quiz: Quiz) => {
        return (
            quiz.question_type === "true_false" ||
            (quiz.answers.length === 2 &&
                quiz.answers.some((answer) => ["true", "to'g'ri", "ha", "yes"].includes(answer.answer_text.toLowerCase())) &&
                quiz.answers.some((answer) => ["false", "noto'g'ri", "yo'q", "no"].includes(answer.answer_text.toLowerCase())))
        )
    }

    const renderQuestionContent = (quiz: Quiz) => {
        const isSubmitting = submittingQuestions.has(quiz.id)
        const selectedAnswers = userInteractions.selectedAnswers.get(quiz.id) || []
        const answerState = userInteractions.answerStates.get(quiz.id)
        const hasSelected = selectedAnswers.length > 0 || answerState !== undefined
        const optionsCount = quiz.answers.length

        if (quiz.question_type === "text_input") {
            const textAnswer = userInteractions.textAnswers.get(quiz.id) || ""

            return (
                <div className="space-y-4">
                    <div className="flex flex-col gap-4">
                        <div className="relative">
              <textarea
                  value={textAnswer}
                  onChange={(e) =>
                      setUserInteractions((prev) => ({
                          ...prev,
                          textAnswers: new Map(prev.textAnswers).set(quiz.id, e.target.value),
                      }))
                  }
                  placeholder="Javobingizni bu yerga yozing..."
                  disabled={hasSelected}
                  rows={4}
                  className={`w-full px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 rounded-xl bg-black/40 backdrop-blur-lg border border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-white/70 focus:ring-2 focus:ring-white/20 transition-all text-base sm:text-lg md:text-xl shadow-lg resize-none ${hasSelected ? "opacity-70 cursor-not-allowed" : ""}`}
              />
                            {answerState && (
                                <div
                                    className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${answerState === "correct" ? "bg-green-500" : "bg-red-500"}`}
                                >
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
                            disabled={!textAnswer.trim() || hasSelected || isSubmitting}
                            className={`self-end px-6 py-3 sm:px-8 sm:py-4 rounded-xl bg-black/40 backdrop-blur-lg border border-white/30 text-white font-medium flex items-center gap-2 transition-all text-base sm:text-lg shadow-lg ${isSubmitting
                                ? "bg-blue-500/40 cursor-not-allowed"
                                : textAnswer.trim() && !hasSelected
                                    ? "hover:bg-black/50 hover:border-white/50 hover:shadow-xl"
                                    : "opacity-50 cursor-not-allowed"
                            }`}
                        >
                            {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <Send size={20}/>}
                            <span>{isSubmitting ? "Yuborilmoqda..." : "Javobni yuborish"}</span>
                        </button>

                        {answerState && (
                            <div
                                className={`text-center py-2 px-4 rounded-lg ${answerState === "correct"
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                                }`}
                            >
                                {answerState === "correct" ? "✅ To'g'ri javob!" : "❌ Noto'g'ri javob"}
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        if (quiz.question_type === "multiple") {

            return (
                <div className="space-y-3 sm:space-y-4">
                    <div className={`grid gap-3 sm:gap-4`}>
                        {quiz.answers.map((option) => {
                            const isSelected = selectedAnswers.includes(option.id)
                            const showCorrect = answerState && option.is_correct
                            const showIncorrect = answerState && isSelected && !option.is_correct

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleMultipleChoice(quiz.id, option.id)}
                                    disabled={answerState !== undefined}
                                    className={`flex items-center gap-3 sm:gap-4 px-5 py-4 rounded-xl bg-black/40 backdrop-blur-lg border transition-all text-left shadow-lg ${showCorrect
                                        ? "border-green-400/60 bg-green-500/30"
                                        : showIncorrect
                                            ? "border-red-400/60 bg-red-500/30"
                                            : isSelected
                                                ? "border-blue-400/60 bg-blue-500/30"
                                                : "border-white/30 hover:bg-black/50 hover:border-white/40"
                                    } disabled:opacity-70`}
                                >
                                    <div
                                        className={`${optionsCount <= 3 ? "w-5 h-5 sm:w-6 sm:h-6" : "w-4 h-4 sm:w-5 sm:h-5"} rounded flex items-center justify-center transition-all ${showCorrect
                                            ? "bg-green-500 text-white"
                                            : showIncorrect
                                                ? "bg-red-500 text-white"
                                                : isSelected
                                                    ? "bg-blue-500 text-white"
                                                    : "bg-white/30 text-white"
                                        }`}
                                    >
                                        {(isSelected || showCorrect) && <Check size={optionsCount <= 3 ? 16 : 14}/>}
                                        {showIncorrect && <X size={optionsCount <= 3 ? 16 : 14}/>}
                                    </div>
                                    <span
                                        className={`flex-1 font-medium text-white ${optionsCount <= 3 ? "text-base sm:text-lg" : "text-sm sm:text-base"}`}
                                    >
                    {option.answer_text}
                  </span>
                                </button>
                            )
                        })}
                    </div>

                    {selectedAnswers.length > 0 && !answerState && (
                        <button
                            onClick={() => submitMultipleChoice(quiz.id)}
                            disabled={isSubmitting}
                            className={`w-full py-4 sm:py-5 rounded-xl bg-black/40 backdrop-blur-lg border border-white/30 text-white font-medium flex items-center justify-center gap-2 transition-all text-base sm:text-lg shadow-lg ${isSubmitting ? "bg-blue-500/40" : "hover:bg-black/50 hover:border-white/40"} disabled:opacity-50`}
                        >
                            {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <Send size={20}/>}
                            <span>Javobni yuborish ({selectedAnswers.length} ta tanlangan)</span>
                        </button>
                    )}
                </div>
            )
        }

        if (isTrueFalseQuestion(quiz)) {
            return (
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    {quiz.answers.map((option) => {
                        const isSelected = selectedAnswers.includes(option.id)
                        const isCorrect = option.is_correct
                        const showCorrect = answerState && isCorrect
                        const showIncorrect = answerState && isSelected && !isCorrect
                        const isUserCorrect = isSelected && answerState === "correct"

                        const getButtonClass = () => {
                            if (isUserCorrect || showCorrect) return "border-green-400/60 bg-green-500/30"
                            if (showIncorrect) return "border-red-400/60 bg-red-500/30"
                            if (isSelected) return "border-blue-400/60 bg-blue-500/30"
                            return "border-white/30 hover:bg-black/50 hover:border-white/40"
                        }

                        const isTrue = ["true", "to'g'ri", "ha", "yes"].includes(option.answer_text.toLowerCase())

                        return (
                            <button
                                key={option.id}
                                onClick={() => selectAnswer(quiz.id, option.id)}
                                disabled={hasSelected || isSubmitting}
                                className={`flex flex-col items-center justify-center gap-3 sm:gap-4 py-6 sm:py-8 px-4 sm:px-6 rounded-xl bg-black/40 backdrop-blur-lg border transition-all shadow-lg ${getButtonClass()} disabled:opacity-70`}
                            >
                                {isTrue ? (
                                    <ThumbsUp size={28} className="text-green-400 sm:w-8 sm:h-8"/>
                                ) : (
                                    <ThumbsDown size={28} className="text-red-400 sm:w-8 sm:h-8"/>
                                )}
                                <span
                                    className="text-base sm:text-lg font-medium text-white">{option.answer_text}</span>
                                {isSubmitting && isSelected && <Loader2 size={16} className="animate-spin text-white"/>}
                                {isUserCorrect && <Check size={20} className="text-green-400"/>}
                                {showIncorrect && <X size={20} className="text-red-400"/>}
                            </button>
                        )
                    })}
                </div>
            )
        }

        const paddingClass =
            optionsCount <= 3 ? "p-4 sm:p-5 md:p-6" : optionsCount === 4 ? "p-3 sm:p-4 md:p-5" : "p-3 sm:p-3 md:p-4"

        const circleSize =
            optionsCount <= 3
                ? "w-8 h-8 sm:w-10 sm:h-10"
                : optionsCount === 4
                    ? "w-7 h-7 sm:w-8 sm:h-8"
                    : "w-6 h-6 sm:w-7 sm:h-7"

        const fontSize = optionsCount <= 3 ? "text-base sm:text-lg" : "text-sm sm:text-base"
        const gap = optionsCount <= 3 ? "gap-3 sm:gap-4" : "gap-2 sm:gap-3"

        return (
            <div className={`grid ${gap} ${optionsCount >= 5 ? "max-h-[50vh] overflow-y-auto pr-2" : ""}`}>
                {quiz.answers.map((option) => {
                    const isSelected = selectedAnswers.includes(option.id)
                    const isCorrect = option.is_correct
                    const showCorrect = answerState && isCorrect
                    const showIncorrect = answerState && isSelected && !isCorrect
                    const isUserCorrect = isSelected && answerState === "correct"

                    const getButtonClass = () => {
                        if (showIncorrect) return "border-red-400/60 bg-red-500/30"
                        if (isUserCorrect || showCorrect) return "border-green-400/60 bg-green-500/30"
                        if (isSelected) return "border-blue-400/60 bg-blue-500/30"
                        return "border-white/30 hover:bg-black/50 hover:border-white/40"
                    }

                    const getCircleClass = () => {
                        if (showIncorrect) return "bg-red-500 text-white"
                        if (isUserCorrect || showCorrect) return "bg-green-500 text-white"
                        if (isSelected) return "bg-blue-500 text-white"
                        return "bg-white/30 text-white"
                    }

                    return (
                        <button
                            key={option.id}
                            onClick={() => selectAnswer(quiz.id, option.id)}
                            disabled={hasSelected || isSubmitting}
                            className={`flex items-center gap-3 sm:gap-4 px-3 py-3 rounded-xl bg-black/40 backdrop-blur-lg border transition-all text-left shadow-lg ${getButtonClass()} disabled:opacity-70`}
                        >
                            <div
                                className={`${circleSize} rounded-full flex items-center justify-center font-medium text-sm sm:text-base ${getCircleClass()}`}
                            >
                                {option.letter}
                            </div>
                            <span className={`flex-1 ${fontSize} font-medium text-white`}>{option.answer_text}</span>
                            {isSubmitting && isSelected && <Loader2 size={16} className="animate-spin text-white"/>}
                            {isUserCorrect && <Check size={18} className="text-green-400"/>}
                            {showIncorrect && <X size={18} className="text-red-400"/>}
                        </button>
                    )
                })}
            </div>
        )
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
                    <div className={"flex w-full h-full items-center justify-center"}><p
                        className="text-center text-gray-500 mx-auto my-auto">
                        Ushbu kategoriya bo'yicha savollar topilmadi.
                    </p></div>
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
                                                src={quiz.user.profile_image || "https://backend.testabd.uz/media/defaultuseravatar.png"}
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

                                        <p className="text-white/70 text-xs mt-2 line-clamp-2">
                                            Kategoriya: {
                                            selectedCategory === "All" || selectedCategory === null
                                                ? "All"
                                                : categories.find(c => c.id === selectedCategory)?.title || "Noma'lum"
                                        }
                                        </p>
                                    </div>

                                    <Link
                                        to="https://t.me/testabduz"
                                        className="flex w-10 h-10 bg-black/40 rounded-full border border-gray-600"
                                    >
                                        <img src={adsIcon} alt="ads" className="flex w-full h-full"/>
                                    </Link>
                                </div>


                                {/* Modal */}
                                {modalOpen && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                                        <div className="bg-white rounded-lg shadow-lg w-80 sm:w-96 md:w-[28rem] lg:w-[32rem] max-h-[80vh] overflow-y-auto p-6">

                                            <h2 className="text-lg font-semibold mb-4">Select Category</h2>

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

                                            <div className="mt-4 flex justify-end gap-2">
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
