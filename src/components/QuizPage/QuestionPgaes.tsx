"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { quizAPI } from "../../utils/api.ts"
import { Bookmark, CheckCircle, Share, ArrowLeft, Loader2, X, Check, Send, ThumbsUp, ThumbsDown } from "lucide-react"

interface QuestionPagesProps {
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
    correct_count: number
    wrong_count: number
    difficulty_percentage: number
    user_attempt_count: number
    is_bookmarked?: boolean
    user: {
        id: number
        username: string
        profile_image: string | null
        is_badged: boolean
        is_premium?: boolean
    }
    created_at: string
}

interface Notification {
    id: string
    type: "success" | "error"
    title: string
    message: string
    show: boolean
}

const QuestionPage: React.FC<QuestionPagesProps> = ({ theme }) => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [question, setQuestion] = useState<Question | null>(null)
    const [similarQuestions, setSimilarQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
    const [textAnswer, setTextAnswer] = useState("")
    const [trueFalseSelection, setTrueFalseSelection] = useState<"true" | "false" | null>(null)
    const [answerState, setAnswerState] = useState<"correct" | "incorrect" | null>(null)
    const [isAnswered, setIsAnswered] = useState(false)
    const [notification, setNotification] = useState<Notification | null>(null)

    useEffect(() => {
        if (id) {
            fetchQuestion()
            fetchSimilarQuestions()
        }
    }, [id])

    const fetchQuestion = async () => {
        if (!id) return

        setLoading(true)
        try {
            const response = await quizAPI.fetchQuestionById(id)
            setQuestion(response.data)
        } catch (error) {
            console.error("Savolni yuklashda xatolik:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchSimilarQuestions = async () => {
        try {
            const response = await quizAPI.fetchQuestions()
            setSimilarQuestions(response.data.results || [])
        } catch (error) {
            console.error("O'xshash savollarni yuklashda xatolik:", error)
        }
    }

    const showNotification = (type: "success" | "error", title: string, message: string) => {
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

    const handleSingleChoice = async (answerId: number) => {
        if (!question || isAnswered || submitting) return

        setSubmitting(true)
        setSelectedAnswers([answerId])

        try {
            const response = await quizAPI.submitAnswers({
                question: question.id,
                selected_answer_ids: [answerId],
                duration: 2,
            })

            const isCorrect = response.data.is_correct
            setAnswerState(isCorrect ? "correct" : "incorrect")
            setIsAnswered(true)

            // Show notification
            if (isCorrect) {
                showNotification("success", "To'g'ri javob! 🎉", "Siz to'g'ri javob berdingiz. Davom eting!")
            } else {
                showNotification("error", "Noto'g'ri javob 😔", "Bu safar noto'g'ri. Keyingi savolda omad tilaymiz!")
            }

            setQuestion((prev) =>
                prev
                    ? {
                        ...prev,
                        correct_count: isCorrect ? prev.correct_count + 1 : prev.correct_count,
                        wrong_count: !isCorrect ? prev.wrong_count + 1 : prev.wrong_count,
                    }
                    : null,
            )
        } catch (error) {
            console.error("Javob yuborishda xatolik:", error)
            showNotification("error", "Xatolik yuz berdi", "Javobni yuborishda muammo bo'ldi. Qayta urinib ko'ring.")
        } finally {
            setSubmitting(false)
        }
    }

    const handleMultipleChoice = (answerId: number) => {
        if (isAnswered) return

        setSelectedAnswers((prev) => (prev.includes(answerId) ? prev.filter((id) => id !== answerId) : [...prev, answerId]))
    }

    const submitMultipleChoice = async () => {
        if (!question || selectedAnswers.length === 0 || submitting) return

        setSubmitting(true)

        try {
            const response = await quizAPI.submitAnswers({
                question: question.id,
                selected_answer_ids: selectedAnswers,
                duration: 2,
            })

            const isCorrect = response.data.is_correct
            setAnswerState(isCorrect ? "correct" : "incorrect")
            setIsAnswered(true)

            // Show notification
            if (isCorrect) {
                showNotification("success", "Ajoyib! 🌟", "Barcha to'g'ri javoblarni tanladingiz!")
            } else {
                showNotification("error", "Yaqin bo'ldingiz 💪", "Ba'zi javoblar noto'g'ri. Keyingi safar muvaffaqiyat!")
            }

            setQuestion((prev) =>
                prev
                    ? {
                        ...prev,
                        correct_count: isCorrect ? prev.correct_count + 1 : prev.correct_count,
                        wrong_count: !isCorrect ? prev.wrong_count + 1 : prev.wrong_count,
                    }
                    : null,
            )
        } catch (error) {
            console.error("Javob yuborishda xatolik:", error)
            showNotification("error", "Xatolik yuz berdi", "Javobni yuborishda muammo bo'ldi. Qayta urinib ko'ring.")
        } finally {
            setSubmitting(false)
        }
    }

    const handleTextAnswer = async () => {
        if (!question || !textAnswer.trim() || submitting) return

        setSubmitting(true)

        try {
            const response = await quizAPI.submitTextAnswers({
                question: question.id,
                written_answer: textAnswer.trim(),
                duration: 2,
            })

            const isCorrect = response.data.is_correct
            setAnswerState(isCorrect ? "correct" : "incorrect")
            setIsAnswered(true)

            // Show notification
            if (isCorrect) {
                showNotification("success", "Mukammal! ✨", "Sizning yozma javobingiz to'g'ri!")
            } else {
                showNotification("error", "Yaxshi harakat 📝", "Javobingiz noto'g'ri, lekin harakat qilganingiz uchun rahmat!")
            }

            setQuestion((prev) =>
                prev
                    ? {
                        ...prev,
                        correct_count: isCorrect ? prev.correct_count + 1 : prev.correct_count,
                        wrong_count: !isCorrect ? prev.wrong_count + 1 : prev.wrong_count,
                    }
                    : null,
            )
        } catch (error) {
            console.error("Javob yuborishda xatolik:", error)
            showNotification("error", "Xatolik yuz berdi", "Javobni yuborishda muammo bo'ldi. Qayta urinib ko'ring.")
        } finally {
            setSubmitting(false)
        }
    }

    const handleTrueFalseAnswer = async (answerId: number) => {
        if (!question || submitting || isAnswered) return

        setSubmitting(true)
        setTrueFalseSelection(answerId === question.answers[0].id ? "true" : "false")

        try {
            const response = await quizAPI.submitAnswers({
                question: question.id,
                selected_answer_ids: [answerId],
                duration: 2,
            })

            const isCorrect = response.data.is_correct
            setAnswerState(isCorrect ? "correct" : "incorrect")
            setIsAnswered(true)

            // Show notification
            if (isCorrect) {
                showNotification("success", "To'g'ri! 🎯", "Siz to'g'ri/noto'g'ri savolga to'g'ri javob berdingiz!")
            } else {
                showNotification("error", "Noto'g'ri 🤔", "Bu safar noto'g'ri. Keyingi savolda diqqat bilan o'ylang!")
            }

            setQuestion((prev) =>
                prev
                    ? {
                        ...prev,
                        correct_count: isCorrect ? prev.correct_count + 1 : prev.correct_count,
                        wrong_count: !isCorrect ? prev.wrong_count + 1 : prev.wrong_count,
                    }
                    : null,
            )
        } catch (error) {
            console.error("Javob yuborishda xatolik:", error)
            showNotification("error", "Xatolik yuz berdi", "Javobni yuborishda muammo bo'ldi. Qayta urinib ko'ring.")
        } finally {
            setSubmitting(false)
        }
    }

    const handleBookmarkToggle = async () => {
        if (!question) return

        try {
            await quizAPI.bookmarkQuestion({ question: question.id })
            setQuestion((prev) =>
                prev
                    ? {
                        ...prev,
                        is_bookmarked: !prev.is_bookmarked,
                    }
                    : null,
            )
        } catch (error) {
            console.error("Bookmark toggle xatolik:", error)
        }
    }

    const shareQuestion = () => {
        if (!question) return

        const url = `${window.location.origin}/questions/${question.id}`
        if (navigator.share) {
            navigator.share({
                title: "TestAbd savoli",
                text: "Mana qiziqarli savol!",
                url,
            })
        } else {
            navigator.clipboard.writeText(url)
            alert("Havola nusxalandi: " + url)
        }
    }

    const getQuestionTypeLabel = (type: string) => {
        switch (type) {
            case "single":
                return "Bir javobli savol"
            case "multiple":
                return "Ko'p javobli savol"
            case "true_false":
                return "To'g'ri/Noto'g'ri savol"
            case "text_input":
                return "Yozma javob savoli"
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

    const getDifficultyColor = (difficulty: number) => {
        if (difficulty < 33) return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        if (difficulty < 66) return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
        return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
    }

    const getOptionStatus = (answerId: number, isCorrect: boolean) => {
        const isSelected = selectedAnswers.includes(answerId)

        if (!answerState) {
            return isSelected ? "selected" : "default"
        }

        if (question?.question_type === "multiple") {
            if (isCorrect && isSelected) return "correct-selected"
            if (!isCorrect && isSelected) return "incorrect-selected"
            if (isCorrect && !isSelected) return "correct-unselected"
            return "neutral"
        }

        if (isSelected) {
            return isCorrect ? "correct-selected" : "incorrect-selected"
        }

        if (isCorrect) {
            return "correct-unselected"
        }

        return "neutral"
    }

    const getOptionStyles = (status: string) => {
        const baseStyles =
            "w-full flex items-center justify-between space-x-3 p-4 sm:p-5 rounded-lg border-2 text-left transition-all duration-200"

        switch (status) {
            case "correct-selected":
                return `${baseStyles} bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-400 dark:text-green-300`
            case "incorrect-selected":
                return `${baseStyles} bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-400 dark:text-red-300`
            case "correct-unselected":
                return `${baseStyles} bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-400 dark:text-green-300 opacity-80`
            case "selected":
                return `${baseStyles} ${theme === "dark" ? "bg-blue-900/30 border-blue-400 text-blue-300" : "bg-blue-50 border-blue-400 text-blue-700"
                    }`
            case "neutral":
                return `${baseStyles} ${theme === "dark"
                        ? "bg-gray-800 border-gray-600 text-gray-400 opacity-60"
                        : "bg-gray-50 border-gray-200 text-gray-400 opacity-60"
                    }`
            default:
                return `${baseStyles} ${theme === "dark"
                        ? "bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-blue-400 text-white"
                        : "bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-400 text-gray-900"
                    }`
        }
    }

    const isTrueFalseQuestion = (question: Question) => {
        return question.question_type === "true_false"
    }

    const getTrueFalseButtonStyle = (buttonType: "true" | "false", isSelected: boolean) => {
        const baseStyle =
            "flex-1 flex flex-col items-center justify-center gap-4 p-6 sm:p-8 rounded-xl border-2 text-center transition-all duration-200 min-h-[140px] font-semibold text-lg"

        if (isAnswered) {
            if (isSelected) {
                return `${baseStyle} ${answerState === "correct"
                        ? "bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-400 dark:text-green-300"
                        : "bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-400 dark:text-red-300"
                    }`
            } else {
                return `${baseStyle} ${theme === "dark"
                        ? "bg-gray-800 border-gray-600 text-gray-500 opacity-60"
                        : "bg-gray-50 border-gray-200 text-gray-400 opacity-60"
                    }`
            }
        }

        if (submitting && isSelected) {
            return `${baseStyle} ${theme === "dark" ? "bg-blue-900/30 border-blue-400 text-blue-300" : "bg-blue-50 border-blue-400 text-blue-700"
                }`
        }

        return `${baseStyle} ${buttonType === "true"
                ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 dark:bg-green-900/20 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/30"
                : "bg-red-50 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400 dark:bg-red-900/20 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/30"
            } disabled:cursor-not-allowed disabled:opacity-50`
    }

    const renderQuestionContent = () => {
        if (!question) return null

        if (question.question_type === "text_input") {
            return (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={textAnswer}
                            onChange={(e) => setTextAnswer(e.target.value)}
                            placeholder="Javobingizni kiriting..."
                            disabled={isAnswered}
                            className={`flex-1 px-4 py-3 text-base sm:text-lg rounded-lg border-2 transition-all duration-200 ${answerState === "correct"
                                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                    : answerState === "incorrect"
                                        ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                        : theme === "dark"
                                            ? "border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                            : "border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                } disabled:opacity-60`}
                        />
                        <button
                            onClick={handleTextAnswer}
                            disabled={!textAnswer.trim() || isAnswered || submitting}
                            className={`px-6 py-3 text-base sm:text-lg rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 min-w-[140px] ${answerState === "correct"
                                    ? "bg-green-500 text-white"
                                    : answerState === "incorrect"
                                        ? "bg-red-500 text-white"
                                        : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                }`}
                        >
                            {submitting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : answerState === "correct" ? (
                                <CheckCircle size={20} />
                            ) : answerState === "incorrect" ? (
                                <X size={20} />
                            ) : (
                                <Send size={20} />
                            )}
                            <span>
                                {submitting
                                    ? "Yuborilmoqda..."
                                    : answerState
                                        ? answerState === "correct"
                                            ? "To'g'ri"
                                            : "Noto'g'ri"
                                        : "Yuborish"}
                            </span>
                        </button>
                    </div>
                </div>
            )
        }

        if (question.question_type === "multiple") {
            return (
                <div className="space-y-4">
                    <div className="grid gap-3 sm:gap-4">
                        {question.answers.map((option) => {
                            const status = getOptionStatus(option.id, option.is_correct)
                            const isSelected = selectedAnswers.includes(option.id)

                            const checkboxClass = `
                w-6 h-6 rounded border-2 flex items-center justify-center transition-colors duration-200
                ${status === "correct-selected" || status === "correct-unselected"
                                    ? "bg-green-500 border-green-500 text-white"
                                    : status === "incorrect-selected"
                                        ? "bg-red-500 border-red-500 text-white"
                                        : isSelected
                                            ? "bg-blue-500 border-blue-500 text-white"
                                            : theme === "dark"
                                                ? "bg-gray-700 border-gray-500"
                                                : "bg-white border-gray-300"
                                }
              `

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleMultipleChoice(option.id)}
                                    disabled={isAnswered}
                                    className={getOptionStyles(status)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={checkboxClass}>
                                            {(isSelected || status === "correct-unselected") && <Check size={16} />}
                                        </div>
                                        <span className="flex-1 text-base sm:text-lg">{option.answer_text}</span>
                                    </div>

                                    {status === "correct-selected" && <Check size={22} className="text-green-500" />}
                                    {status === "incorrect-selected" && <X size={22} className="text-red-500" />}
                                    {status === "correct-unselected" && <Check size={22} className="text-green-500" />}
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

        // For true/false questions - two buttons: "To'g'ri" and "Xato"
        if (isTrueFalseQuestion(question)) {
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                            Quyidagi javoblardan birini tanlang:
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {/* To'g'ri button */}
                        <button
                            onClick={() => handleTrueFalseAnswer(question.answers[0].id)}
                            disabled={isAnswered || submitting}
                            className={getTrueFalseButtonStyle("true", trueFalseSelection === "true")}
                        >
                            <ThumbsUp size={40} className="text-green-500" />
                            <span className="text-xl font-bold">To'g'ri</span>
                            {submitting && trueFalseSelection === "true" && (
                                <Loader2 size={24} className="animate-spin text-blue-500" />
                            )}
                            {isAnswered && trueFalseSelection === "true" && answerState === "correct" && (
                                <Check size={28} className="text-green-500" />
                            )}
                            {isAnswered && trueFalseSelection === "true" && answerState === "incorrect" && (
                                <X size={28} className="text-red-500" />
                            )}
                        </button>

                        {/* Xato button */}
                        <button
                            onClick={() => handleTrueFalseAnswer(question.answers[1].id)}
                            disabled={isAnswered || submitting}
                            className={getTrueFalseButtonStyle("false", trueFalseSelection === "false")}
                        >
                            <ThumbsDown size={40} className="text-red-500" />
                            <span className="text-xl font-bold">Xato</span>
                            {submitting && trueFalseSelection === "false" && (
                                <Loader2 size={24} className="animate-spin text-blue-500" />
                            )}
                            {isAnswered && trueFalseSelection === "false" && answerState === "correct" && (
                                <Check size={28} className="text-green-500" />
                            )}
                            {isAnswered && trueFalseSelection === "false" && answerState === "incorrect" && (
                                <X size={28} className="text-red-500" />
                            )}
                        </button>
                    </div>
                </div>
            )
        }

        // For single choice questions
        return (
            <div className="grid gap-3 sm:gap-4">
                {question.answers.map((option) => {
                    const status = getOptionStatus(option.id, option.is_correct)
                    const isSelected = selectedAnswers.includes(option.id)

                    const letterClass = `w-10 h-10 rounded-full flex items-center justify-center text-base font-bold transition-all duration-200 ${status === "correct-selected" || status === "correct-unselected"
                            ? "bg-green-500 text-white"
                            : status === "incorrect-selected"
                                ? "bg-red-500 text-white"
                                : status === "neutral"
                                    ? theme === "dark"
                                        ? "bg-gray-600 text-gray-400"
                                        : "bg-gray-200 text-gray-400"
                                    : theme === "dark"
                                        ? "bg-gray-600 text-gray-200"
                                        : "bg-gray-200 text-gray-600"
                        }`

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleSingleChoice(option.id)}
                            disabled={isAnswered || submitting}
                            className={getOptionStyles(status)}
                        >
                            <div className="flex items-center space-x-3">
                                <div className={letterClass}>{option.letter}</div>
                                <span className="flex-1 text-base sm:text-lg">{option.answer_text}</span>
                            </div>
                            {submitting && isSelected && <Loader2 size={20} className="animate-spin text-blue-500" />}
                            {status === "correct-selected" && <Check size={22} className="text-green-500" />}
                            {status === "incorrect-selected" && <X size={22} className="text-red-500" />}
                            {status === "correct-unselected" && <Check size={22} className="text-green-500" />}
                        </button>
                    )
                })}
            </div>
        )
    }

    const renderSimilarQuestions = () => {
        if (similarQuestions.length === 0) return null

        return (
            <div className="mt-8">
                <h3 className={`text-xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    O'xshash savollar
                </h3>
                <div className="space-y-4">
                    {similarQuestions.map((similarQuestion) => (
                        <div
                            key={similarQuestion.id}
                            onClick={() => navigate(`/questions/${similarQuestion.id}`)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${theme === "dark"
                                    ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
                                    : "bg-white border-gray-200 hover:bg-gray-50"
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <div
                                        className={`w-8 h-8 rounded-full overflow-hidden ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}
                                    >
                                        {similarQuestion.user.profile_image ? (
                                            <img
                                                src={similarQuestion.user.profile_image || "/media/defaultuseravatar.png"}
                                                alt="avatar"
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <span className="text-sm font-bold text-gray-600 flex items-center justify-center h-full">
                                                {similarQuestion.user.username.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                        {similarQuestion.user.username}
                                    </span>
                                    {similarQuestion.user.is_badged && <CheckCircle size={14} className="text-blue-500" />}
                                </div>
                                <span
                                    className={`text-xs px-2 py-1 rounded-full ${getQuestionTypeColor(similarQuestion.question_type)}`}
                                >
                                    {getQuestionTypeLabel(similarQuestion.question_type)}
                                </span>
                            </div>

                            <p className={`text-sm mb-3 line-clamp-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                {similarQuestion.question_text}
                            </p>

                            <div className="flex justify-between items-center text-xs">
                                <div className="flex space-x-4">
                                    <span className="text-green-600">✓ {similarQuestion.correct_count}</span>
                                    <span className="text-red-600">✗ {similarQuestion.wrong_count}</span>
                                </div>
                                <span className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                    {similarQuestion.difficulty_percentage.toFixed(0)}% qiyinlik
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div
                className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}
            >
                <Loader2 size={40} className="animate-spin text-blue-500" />
            </div>
        )
    }

    if (!question) {
        return (
            <div
                className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
                    }`}
            >
                <div className="text-center">
                    <p className="text-xl mb-4">Savol topilmadi</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Orqaga qaytish
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div
            className={`min-h-screen transition-all duration-300 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
                }`}
        >
            {/* Notification */}
            {notification && (
                <div
                    className={`fixed top-4 left-4 right-4 z-50 transform transition-all duration-500 ${notification.show ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
                        }`}
                >
                    <div
                        className={`max-w-md mx-auto p-4 rounded-lg shadow-lg border-l-4 ${notification.type === "success"
                                ? "bg-green-50 border-green-500 dark:bg-green-900/30"
                                : "bg-red-50 border-red-500 dark:bg-red-900/30"
                            }`}
                    >
                        <div className="flex items-start space-x-3">
                            <div className={`flex-shrink-0 ${notification.type === "success" ? "text-green-500" : "text-red-500"}`}>
                                {notification.type === "success" ? <CheckCircle size={20} /> : <X size={20} />}
                            </div>
                            <div className="flex-1">
                                <h4
                                    className={`font-semibold ${notification.type === "success" ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}`}
                                >
                                    {notification.title}
                                </h4>
                                <p
                                    className={`text-sm mt-1 ${notification.type === "success" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
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
                className={`fixed top-0 left-0 right-0 backdrop-blur-lg border-b z-40 ${theme === "dark" ? "bg-gray-800/80 border-gray-700" : "bg-white/80 border-gray-200"
                    }`}
            >
                <div className="max-w-2xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center h-16">
                        <button
                            onClick={() => navigate(-1)}
                            className={`p-2 rounded-lg transition-all duration-200 ${theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"
                                }`}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center space-x-2 ml-4">
                            <img src="/logo.jpg" alt="TestAbd" className="h-8 w-8 rounded-full" />
                            <h1 className="text-xl font-bold text-blue-600">TestAbd</h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-20 pb-24">
                <article
                    className={`rounded-2xl p-4 sm:p-6 shadow-lg border transition-all duration-200 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                        }`}
                >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-3">
                                <div
                                    className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                                        }`}
                                >
                                    {question.user.profile_image ? (
                                        <img
                                            src={question.user.profile_image || "/media/defaultuseravatar.png"}
                                            alt="avatar"
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <span className="text-lg font-bold text-gray-600">
                                            {question.user.username.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center space-x-1">
                                        <span className={`font-semibold text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                            {question.user.username}
                                        </span>
                                        {question.user.is_badged && <CheckCircle size={16} className="text-blue-500" />}
                                        {question.user.is_premium && (
                                            <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
                                                PRO
                                            </span>
                                        )}
                                    </div>
                                    <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                        {new Date(question.created_at).toLocaleDateString("uz-UZ")}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3">
                            <div
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty_percentage)}`}
                            >
                                {question.difficulty_percentage.toFixed(1)}% qiyinlik
                            </div>
                        </div>
                    </div>

                    {/* Question Type Badge */}
                    <div className="mb-4">
                        <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(question.question_type)}`}
                        >
                            {getQuestionTypeLabel(question.question_type)}
                        </span>
                    </div>

                    {/* Question */}
                    <div className="mb-6">
                        <h2
                            className={`text-lg sm:text-xl font-semibold mb-6 leading-relaxed ${theme === "dark" ? "text-white" : "text-gray-900"
                                }`}
                        >
                            {question.question_text}
                        </h2>
                        {renderQuestionContent()}
                    </div>

                    {/* Footer */}
                    <div
                        className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 border-t mb-2 ${theme === "dark" ? "border-gray-700" : "border-gray-200"
                            }`}
                    >
                        <div className="flex space-x-6">
                            <div className="flex items-center space-x-2 text-green-600">
                                <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">✓</span>
                                </div>
                                <span className="font-semibold text-base">{question.correct_count}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-red-600">
                                <div className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">✗</span>
                                </div>
                                <span className="font-semibold text-base">{question.wrong_count}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-end space-x-3">
                            <button
                                className={`p-3 rounded-full transition-all duration-200 ${theme === "dark" ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                                    }`}
                                onClick={shareQuestion}
                            >
                                <Share size={20} />
                            </button>
                            <button
                                onClick={handleBookmarkToggle}
                                className={`p-3 rounded-full transition-all duration-200 ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                                    }`}
                            >
                                <Bookmark
                                    size={20}
                                    className={
                                        question.is_bookmarked
                                            ? "text-yellow-500 fill-current"
                                            : theme === "dark"
                                                ? "text-gray-400"
                                                : "text-gray-600"
                                    }
                                />
                            </button>
                        </div>
                    </div>
                </article>

                {/* Similar Questions */}
                {renderSimilarQuestions()}
            </main>
        </div>
    )
}

export default QuestionPage
