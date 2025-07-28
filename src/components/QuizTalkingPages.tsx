"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { quizAPI } from "../utils/api"
import {
    CheckCircle,
    ArrowLeft,
    Loader2,
    X,
    Check,
    Send,
    ThumbsUp,
    ThumbsDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Trophy,
    Target,
} from "lucide-react"

interface QuizTakingPageProps {
    theme: string
}

interface Answer {
    id: number
    letter: string
    answer_text: string
    is_correct: boolean
}

interface Question {
    id: number
    question_text: string
    question_type: string
    media: string | null
    answers: Answer[]
    order_index: number
    correct_answer_text?: string
}

interface Test {
    id: number
    title: string
    description: string
    category: {
        id: number
        title: string
        emoji: string
    }
    user: {
        id: number
        username: string
        profile_image: string | null
        is_badged: boolean
        is_premium?: boolean
    }
    total_questions: number
    difficulty_percentage: number
    average_time: number
    questions: Question[]
    created_at: string
}

interface QuizSession {
    currentQuestionIndex: number
    answers: { [questionId: number]: any }
    startTime: number
    timeSpent: number
    isCompleted: boolean
    score: number
}

interface Notification {
    id: string
    type: "success" | "error" | "info"
    title: string
    message: string
    show: boolean
}

const QuizTakingPage: React.FC<QuizTakingPageProps> = ({ theme }) => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const testId = searchParams.get("testId")

    const [test, setTest] = useState<Test | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [notification, setNotification] = useState<Notification | null>(null)

    // Quiz session state
    const [session, setSession] = useState<QuizSession>({
        currentQuestionIndex: 0,
        answers: {},
        startTime: Date.now(),
        timeSpent: 0,
        isCompleted: false,
        score: 0,
    })

    // Current question state
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
    const [textAnswer, setTextAnswer] = useState("")
    const [trueFalseSelection, setTrueFalseSelection] = useState<"true" | "false" | null>(null)
    const [isAnswered, setIsAnswered] = useState(false)

    useEffect(() => {
        if (testId) {
            fetchTest()
        }
    }, [testId])

    useEffect(() => {
        // Timer for tracking time spent
        const timer = setInterval(() => {
            if (!session.isCompleted) {
                setSession((prev) => ({
                    ...prev,
                    timeSpent: Date.now() - prev.startTime,
                }))
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [session.isCompleted])

    const fetchTest = async () => {
        if (!testId) return

        setLoading(true)
        try {
            const response = await quizAPI.fetchTestById(Number.parseInt(testId))
            setTest(response.data)

            // Initialize session
            setSession((prev) => ({
                ...prev,
                startTime: Date.now(),
            }))
        } catch (error) {
            console.error("Testni yuklashda xatolik:", error)
            showNotification("error", "Xatolik", "Testni yuklashda muammo bo'ldi")
        } finally {
            setLoading(false)
        }
    }

    const showNotification = (type: "success" | "error" | "info", title: string, message: string) => {
        const notificationId = Date.now().toString()
        setNotification({
            id: notificationId,
            type,
            title,
            message,
            show: true,
        })

        setTimeout(() => {
            setNotification((prev) => (prev ? { ...prev, show: false } : null))
        }, 4000)

        setTimeout(() => {
            setNotification(null)
        }, 4500)
    }

    const getCurrentQuestion = (): Question | null => {
        if (!test || !test.questions) return null
        return test.questions[session.currentQuestionIndex] || null
    }

    const handleSingleChoice = async (answerId: number) => {
        const currentQuestion = getCurrentQuestion()
        if (!currentQuestion || isAnswered || submitting) return

        setSubmitting(true)
        setSelectedAnswers([answerId])

        try {
            const response = await quizAPI.submitAnswers({
                question: currentQuestion.id,
                selected_answer_ids: [answerId],
                duration: Math.floor((Date.now() - session.startTime) / 1000),
            })

            const isCorrect = response.data.is_correct
            setIsAnswered(true)

            // Save answer to session
            setSession((prev) => ({
                ...prev,
                answers: {
                    ...prev.answers,
                    [currentQuestion.id]: {
                        type: "single",
                        answer_ids: [answerId],
                        is_correct: isCorrect,
                    },
                },
            }))

            if (isCorrect) {
                showNotification("success", "To'g'ri! 🎉", "Ajoyib, davom eting!")
            } else {
                showNotification("error", "Noto'g'ri 😔", "Keyingi savolda omad!")
            }
        } catch (error) {
            console.error("Javob yuborishda xatolik:", error)
            showNotification("error", "Xatolik", "Javobni yuborishda muammo bo'ldi")
        } finally {
            setSubmitting(false)
        }
    }

    const handleMultipleChoice = (answerId: number) => {
        if (isAnswered) return
        setSelectedAnswers((prev) => (prev.includes(answerId) ? prev.filter((id) => id !== answerId) : [...prev, answerId]))
    }

    const submitMultipleChoice = async () => {
        const currentQuestion = getCurrentQuestion()
        if (!currentQuestion || selectedAnswers.length === 0 || submitting) return

        setSubmitting(true)

        try {
            const response = await quizAPI.submitAnswers({
                question: currentQuestion.id,
                selected_answer_ids: selectedAnswers,
                duration: Math.floor((Date.now() - session.startTime) / 1000),
            })

            const isCorrect = response.data.is_correct
            setIsAnswered(true)

            setSession((prev) => ({
                ...prev,
                answers: {
                    ...prev.answers,
                    [currentQuestion.id]: {
                        type: "multiple",
                        answer_ids: selectedAnswers,
                        is_correct: isCorrect,
                    },
                },
            }))

            if (isCorrect) {
                showNotification("success", "Mukammal! 🌟", "Barcha to'g'ri javoblar!")
            } else {
                showNotification("error", "Yaqin bo'ldingiz 💪", "Ba'zi javoblar noto'g'ri")
            }
        } catch (error) {
            console.error("Javob yuborishda xatolik:", error)
            showNotification("error", "Xatolik", "Javobni yuborishda muammo bo'ldi")
        } finally {
            setSubmitting(false)
        }
    }

    const handleTextAnswer = async () => {
        const currentQuestion = getCurrentQuestion()
        if (!currentQuestion || !textAnswer.trim() || submitting) return

        setSubmitting(true)

        try {
            const response = await quizAPI.submitTextAnswers({
                question: currentQuestion.id,
                written_answer: textAnswer.trim(),
                duration: Math.floor((Date.now() - session.startTime) / 1000),
            })

            const isCorrect = response.data.is_correct
            setIsAnswered(true)

            setSession((prev) => ({
                ...prev,
                answers: {
                    ...prev.answers,
                    [currentQuestion.id]: {
                        type: "text",
                        answer: textAnswer.trim(),
                        is_correct: isCorrect,
                    },
                },
            }))

            if (isCorrect) {
                showNotification("success", "Mukammal! ✨", "Yozma javobingiz to'g'ri!")
            } else {
                showNotification("error", "Yaxshi harakat 📝", "Javobingiz noto'g'ri")
            }
        } catch (error) {
            console.error("Javob yuborishda xatolik:", error)
            showNotification("error", "Xatolik", "Javobni yuborishda muammo bo'ldi")
        } finally {
            setSubmitting(false)
        }
    }

    const handleTrueFalseAnswer = async (answer: "true" | "false") => {
        const currentQuestion = getCurrentQuestion()
        if (!currentQuestion || submitting || isAnswered) return

        setSubmitting(true)
        setTrueFalseSelection(answer)

        try {
            const response = await quizAPI.submitTextAnswers({
                question: currentQuestion.id,
                written_answer: answer === "true" ? "to'g'ri" : "xato",
                duration: Math.floor((Date.now() - session.startTime) / 1000),
            })

            const isCorrect = response.data.is_correct
            setIsAnswered(true)

            setSession((prev) => ({
                ...prev,
                answers: {
                    ...prev.answers,
                    [currentQuestion.id]: {
                        type: "true_false",
                        answer: answer,
                        is_correct: isCorrect,
                    },
                },
            }))

            if (isCorrect) {
                showNotification("success", "To'g'ri! 🎯", "Ajoyib!")
            } else {
                showNotification("error", "Noto'g'ri 🤔", "Keyingi safar diqqat bilan!")
            }
        } catch (error) {
            console.error("Javob yuborishda xatolik:", error)
            showNotification("error", "Xatolik", "Javobni yuborishda muammo bo'ldi")
        } finally {
            setSubmitting(false)
        }
    }

    const nextQuestion = () => {
        if (!test || session.currentQuestionIndex >= test.questions.length - 1) {
            completeQuiz()
            return
        }

        setSession((prev) => ({
            ...prev,
            currentQuestionIndex: prev.currentQuestionIndex + 1,
        }))

        // Reset current question state
        setSelectedAnswers([])
        setTextAnswer("")
        setTrueFalseSelection(null)
        setIsAnswered(false)
    }

    const previousQuestion = () => {
        if (session.currentQuestionIndex <= 0) return

        setSession((prev) => ({
            ...prev,
            currentQuestionIndex: prev.currentQuestionIndex - 1,
        }))

        // Reset current question state
        setSelectedAnswers([])
        setTextAnswer("")
        setTrueFalseSelection(null)
        setIsAnswered(false)
    }

    const completeQuiz = () => {
        const correctAnswers = Object.values(session.answers).filter((answer) => answer.is_correct).length
        const totalQuestions = test?.questions.length || 0
        const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

        setSession((prev) => ({
            ...prev,
            isCompleted: true,
            score,
        }))

        showNotification("success", "Test yakunlandi! 🏆", `Sizning natijangiz: ${score}%`)
    }

    const formatTime = (milliseconds: number) => {
        const seconds = Math.floor(milliseconds / 1000)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
    }

    const getQuestionTypeLabel = (type: string) => {
        switch (type) {
            case "single":
                return "Bir javobli"
            case "multiple":
                return "Ko'p javobli"
            case "true_false":
                return "To'g'ri/Noto'g'ri"
            case "text_input":
                return "Yozma javob"
            default:
                return "Savol"
        }
    }

    const getQuestionTypeColor = (type: string) => {
        switch (type) {
            case "single":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            case "multiple":
                return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
            case "true_false":
                return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
            case "text_input":
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
        }
    }

    const renderQuestionContent = () => {
        const currentQuestion = getCurrentQuestion()
        if (!currentQuestion) return null

        if (currentQuestion.question_type === "text_input") {
            return (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={textAnswer}
                            onChange={(e) => setTextAnswer(e.target.value)}
                            placeholder="Javobingizni kiriting..."
                            disabled={isAnswered}
                            className={`flex-1 px-4 py-3 text-base sm:text-lg rounded-lg border-2 transition-all duration-200 ${theme === "dark"
                                    ? "border-gray-600 bg-gray-700 text-white focus:border-blue-500"
                                    : "border-gray-300 bg-white text-gray-900 focus:border-blue-500"
                                } disabled:opacity-60`}
                        />
                        <button
                            onClick={handleTextAnswer}
                            disabled={!textAnswer.trim() || isAnswered || submitting}
                            className="px-6 py-3 text-base sm:text-lg rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 min-w-[140px]"
                        >
                            {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            <span>{submitting ? "Yuborilmoqda..." : "Yuborish"}</span>
                        </button>
                    </div>
                </div>
            )
        }

        if (currentQuestion.question_type === "multiple") {
            return (
                <div className="space-y-4">
                    <div className="grid gap-3 sm:gap-4">
                        {currentQuestion.answers.map((option) => {
                            const isSelected = selectedAnswers.includes(option.id)

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleMultipleChoice(option.id)}
                                    disabled={isAnswered}
                                    className={`w-full flex items-center justify-between space-x-3 p-4 sm:p-5 rounded-lg border-2 text-left transition-all duration-200 ${isSelected
                                            ? theme === "dark"
                                                ? "bg-blue-900/30 border-blue-400 text-blue-300"
                                                : "bg-blue-50 border-blue-400 text-blue-700"
                                            : theme === "dark"
                                                ? "bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-blue-400 text-white"
                                                : "bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-400 text-gray-900"
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors duration-200 ${isSelected
                                                    ? "bg-blue-500 border-blue-500 text-white"
                                                    : theme === "dark"
                                                        ? "bg-gray-700 border-gray-500"
                                                        : "bg-white border-gray-300"
                                                }`}
                                        >
                                            {isSelected && <Check size={16} />}
                                        </div>
                                        <span className="flex-1 text-base sm:text-lg">{option.answer_text}</span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {selectedAnswers.length > 0 && !isAnswered && (
                        <div className="flex justify-center pt-2">
                            <button
                                onClick={submitMultipleChoice}
                                disabled={submitting}
                                className="px-8 py-4 text-base sm:text-lg bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>Yuborilmoqda...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        <span>Javobni yuborish ({selectedAnswers.length} ta tanlangan)</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )
        }

        if (currentQuestion.question_type === "true_false") {
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                            Quyidagi javoblardan birini tanlang:
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <button
                            onClick={() => handleTrueFalseAnswer("true")}
                            disabled={isAnswered || submitting}
                            className={`flex-1 flex flex-col items-center justify-center gap-4 p-6 sm:p-8 rounded-xl border-2 text-center transition-all duration-200 min-h-[140px] font-semibold text-lg bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 dark:bg-green-900/20 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/30 disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            <ThumbsUp size={40} className="text-green-500" />
                            <span className="text-xl font-bold">To'g'ri</span>
                            {submitting && trueFalseSelection === "true" && (
                                <Loader2 size={24} className="animate-spin text-blue-500" />
                            )}
                        </button>

                        <button
                            onClick={() => handleTrueFalseAnswer("false")}
                            disabled={isAnswered || submitting}
                            className={`flex-1 flex flex-col items-center justify-center gap-4 p-6 sm:p-8 rounded-xl border-2 text-center transition-all duration-200 min-h-[140px] font-semibold text-lg bg-red-50 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400 dark:bg-red-900/20 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/30 disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            <ThumbsDown size={40} className="text-red-500" />
                            <span className="text-xl font-bold">Xato</span>
                            {submitting && trueFalseSelection === "false" && (
                                <Loader2 size={24} className="animate-spin text-blue-500" />
                            )}
                        </button>
                    </div>
                </div>
            )
        }

        // Single choice questions
        return (
            <div className="grid gap-3 sm:gap-4">
                {currentQuestion.answers.map((option) => {
                    const isSelected = selectedAnswers.includes(option.id)

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleSingleChoice(option.id)}
                            disabled={isAnswered || submitting}
                            className={`w-full flex items-center justify-between space-x-3 p-4 sm:p-5 rounded-lg border-2 text-left transition-all duration-200 ${isSelected
                                    ? theme === "dark"
                                        ? "bg-blue-900/30 border-blue-400 text-blue-300"
                                        : "bg-blue-50 border-blue-400 text-blue-700"
                                    : theme === "dark"
                                        ? "bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-blue-400 text-white"
                                        : "bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-400 text-gray-900"
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold transition-all duration-200 ${theme === "dark" ? "bg-gray-600 text-gray-200" : "bg-gray-200 text-gray-600"
                                        }`}
                                >
                                    {option.letter}
                                </div>
                                <span className="flex-1 text-base sm:text-lg">{option.answer_text}</span>
                            </div>
                            {submitting && isSelected && <Loader2 size={20} className="animate-spin text-blue-500" />}
                        </button>
                    )
                })}
            </div>
        )
    }

    if (loading) {
        return (
            <div
                className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}
            >
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-blue-500 mx-auto mb-4" />
                    <p className={`text-lg ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Test yuklanmoqda...</p>
                </div>
            </div>
        )
    }

    if (!test) {
        return (
            <div
                className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}
            >
                <div className="text-center">
                    <p className="text-xl mb-4">Test topilmadi</p>
                    <button
                        onClick={() => navigate("/tests")}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Testlar sahifasiga qaytish
                    </button>
                </div>
            </div>
        )
    }

    if (session.isCompleted) {
        const correctAnswers = Object.values(session.answers).filter((answer) => answer.is_correct).length
        const totalQuestions = test.questions.length

        return (
            <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
                <div className="max-w-2xl mx-auto px-4 py-8">
                    <div
                        className={`rounded-2xl p-8 shadow-lg border text-center ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                    >
                        <Trophy size={64} className="text-yellow-500 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold mb-4">Test yakunlandi!</h1>
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-center items-center space-x-8">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-500">{correctAnswers}</div>
                                    <div className="text-sm text-gray-500">To'g'ri javoblar</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-red-500">{totalQuestions - correctAnswers}</div>
                                    <div className="text-sm text-gray-500">Noto'g'ri javoblar</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-500">{session.score}%</div>
                                    <div className="text-sm text-gray-500">Natija</div>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center space-x-2 text-gray-500">
                                    <Clock size={16} />
                                    <span>Vaqt: {formatTime(session.timeSpent)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate("/tests")}
                                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Testlar sahifasiga qaytish
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className={`px-6 py-3 rounded-lg transition-colors ${theme === "dark"
                                        ? "bg-gray-700 text-white hover:bg-gray-600"
                                        : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                                    }`}
                            >
                                Testni qayta boshlash
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const currentQuestion = getCurrentQuestion()
    const progress = 12
     {/* test.questions.length > 0 ? ((session.currentQuestionIndex + 1) / test.questions.length) * 100 : 0 */}
    return (
        <div
            className={`min-h-screen transition-all duration-300 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}
        >
            {/* Notification */}
            {notification && (
                <div
                    className={`fixed top-4 left-4 right-4 z-50 transform transition-all duration-500 ${notification.show ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
                >
                    <div
                        className={`max-w-md mx-auto p-4 rounded-lg shadow-lg border-l-4 ${notification.type === "success"
                                ? "bg-green-50 border-green-500 dark:bg-green-900/30"
                                : notification.type === "error"
                                    ? "bg-red-50 border-red-500 dark:bg-red-900/30"
                                    : "bg-blue-50 border-blue-500 dark:bg-blue-900/30"
                            }`}
                    >
                        <div className="flex items-start space-x-3">
                            <div
                                className={`flex-shrink-0 ${notification.type === "success"
                                        ? "text-green-500"
                                        : notification.type === "error"
                                            ? "text-red-500"
                                            : "text-blue-500"
                                    }`}
                            >
                                {notification.type === "success" ? (
                                    <CheckCircle size={20} />
                                ) : notification.type === "error" ? (
                                    <X size={20} />
                                ) : (
                                    <Target size={20} />
                                )}
                            </div>
                            <div className="flex-1">
                                <h4
                                    className={`font-semibold ${notification.type === "success"
                                            ? "text-green-800 dark:text-green-300"
                                            : notification.type === "error"
                                                ? "text-red-800 dark:text-red-300"
                                                : "text-blue-800 dark:text-blue-300"
                                        }`}
                                >
                                    {notification.title}
                                </h4>
                                <p
                                    className={`text-sm mt-1 ${notification.type === "success"
                                            ? "text-green-700 dark:text-green-400"
                                            : notification.type === "error"
                                                ? "text-red-700 dark:text-red-400"
                                                : "text-blue-700 dark:text-blue-400"
                                        }`}
                                >
                                    {notification.message}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header
                className={`fixed top-0 left-0 right-0 backdrop-blur-lg border-b z-40 ${theme === "dark" ? "bg-gray-800/80 border-gray-700" : "bg-white/80 border-gray-200"}`}
            >
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate("/tests")}
                                className={`p-2 rounded-lg transition-all duration-200 ${theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"}`}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="font-bold text-lg">{test.title}</h1>
                                <p className="text-sm text-gray-500">
                                    {test.category.emoji} {test.category.title}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="text-center">
                                <div className="text-sm font-medium">
                                    {session.currentQuestionIndex + 1}/{test.total_questions}
                                </div>
                                <div className="text-xs text-gray-500">Savol</div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-medium flex items-center space-x-1">
                                    <Clock size={14} />
                                    <span>{formatTime(session.timeSpent)}</span>
                                </div>
                                <div className="text-xs text-gray-500">Vaqt</div>
                            </div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1 bg-gray-200 dark:bg-gray-700">
                        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-24">
                {currentQuestion && (
                    <div
                        className={`rounded-2xl p-6 sm:p-8 shadow-lg border transition-all duration-200 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                    >
                        {/* Question Type Badge */}
                        <div className="mb-6">
                            <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(currentQuestion.question_type)}`}
                            >
                                {getQuestionTypeLabel(currentQuestion.question_type)}
                            </span>
                        </div>

                        {/* Question */}
                        <div className="mb-8">
                            <h2
                                className={`text-xl sm:text-2xl font-semibold mb-8 leading-relaxed ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                            >
                                {currentQuestion.question_text}
                            </h2>
                            {renderQuestionContent()}
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={previousQuestion}
                                disabled={session.currentQuestionIndex === 0}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${session.currentQuestionIndex === 0
                                        ? "opacity-50 cursor-not-allowed"
                                        : theme === "dark"
                                            ? "hover:bg-gray-700 text-gray-300"
                                            : "hover:bg-gray-100 text-gray-600"
                                    }`}
                            >
                                <ChevronLeft size={20} />
                                <span>Oldingi</span>
                            </button>

                            <div className="text-center">
                                <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                    {session.currentQuestionIndex + 1} / {test.questions.length}
                                </div>
                            </div>

                            <button
                                onClick={nextQuestion}
                                disabled={!isAnswered}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${!isAnswered ? "opacity-50 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"
                                    }`}
                            >
                                <span>{session.currentQuestionIndex === test.questions.length - 1 ? "Yakunlash" : "Keyingi"}</span>
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default QuizTakingPage
