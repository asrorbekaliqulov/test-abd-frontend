"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
    ArrowLeft,
    Play,
    Bookmark,
    Share,
    Clock,
    Users,
    Star,
    Trophy,
    ChevronRight,
    Loader2,
    Target,
    TrendingUp,
    Award,
} from "lucide-react"
import { quizAPI } from "../utils/api"

interface TestDetailPageProps {
    theme: string
}

interface Category {
    id: number
    title: string
    slug: string
    description: string
    emoji: string
    image?: string
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
    question_type: "single" | "multiple" | "true_false" | "text_input"
    order_index: number
    media: string | null
    correct_answer_text?: string
    answer_language?: string
    created_at: string
    updated_at: string
    difficulty_percentage: number
    answers: Answer[]
    user: {
        id: number
        username: string
        profile_image: string | null
        is_badged: boolean
        is_premium?: boolean
    }
}

interface TestDetail {
    id: number
    title: string
    description: string
    category: Category
    visibility: "public" | "private" | "unlisted"
    created_at: string
    total_questions: number
    total_attempts: number
    average_score: number
    average_time: number
    wrong_count: number
    correct_count: number
    difficulty_percentage: number
    user: {
        id: number
        username: string
        profile_image: string | null
        is_badged?: boolean
        is_premium?: boolean
    }
    is_bookmarked: boolean
    thumbnail?: string
    questions: Question[]
}

const TestDetailPage: React.FC<TestDetailPageProps> = ({ theme }) => {
    const { testId } = useParams<{ testId: string }>()
    const navigate = useNavigate()
    const [test, setTest] = useState<TestDetail | null>(null)
    const [relatedTests, setRelatedTests] = useState<TestDetail[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (testId) {
            fetchTestDetail()
            fetchRelatedTests()
        }
    }, [testId])

    const fetchTestDetail = async () => {
        if (!testId) return

        setLoading(true)
        try {
            const response = await quizAPI.fetchTestById(Number.parseInt(testId))

            // Mock questions data since API might not include them
    

            setTest({
                ...response.data,
            })
        } catch (error) {
            console.error("Test detaillarini yuklashda xatolik:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchRelatedTests = async () => {
        try {
            const response = await quizAPI.fetchPublicTests()
            setRelatedTests(response.data.results?.slice(0, 3) || [])
        } catch (error) {
            console.error("O'xshash testlarni yuklashda xatolik:", error)
        }
    }

    const handleStartTest = () => {
        if (test) {
            navigate(`/quiz?testId=${test.id}`)
        }
    }

    const handleBookmark = async () => {
        if (!test) return

        try {
            await quizAPI.bookmarkTest({ test: test.id })
            setTest((prev) => (prev ? { ...prev, is_bookmarked: !prev.is_bookmarked } : null))
        } catch (error) {
            console.error("Bookmark xatolik:", error)
        }
    }

    const handleShare = () => {
        if (!test) return

        const shareUrl = `${window.location.origin}/tests/${test.id}`
        if (navigator.share) {
            navigator.share({
                title: test.title,
                text: test.description,
                url: shareUrl,
            })
        } else {
            navigator.clipboard.writeText(shareUrl)
        }
    }

    const handleQuestionClick = (questionId: number) => {
        navigate(`/questions/${questionId}`)
    }

    const getDifficultyColor = (difficulty: number) => {
        if (difficulty < 33) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
        if (difficulty < 66) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    }

    const getDifficultyLabel = (difficulty: number) => {
        if (difficulty < 33) return "Oson"
        if (difficulty < 66) return "O'rta"
        return "Qiyin"
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

    const getSuccessRate = (test: TestDetail) => {
        const total = test.correct_count + test.wrong_count
        return total > 0 ? Math.round((test.correct_count / total) * 100) : 0
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

    if (!test) {
        return (
            <div
                className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
                    }`}
            >
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Test topilmadi</h2>
                    <button
                        onClick={() => navigate("/tests")}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Testlarga qaytish
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
            {/* Header */}
            <header
                className={`sticky top-0 z-50 backdrop-blur-lg border-b ${theme === "dark" ? "bg-gray-800/80 border-gray-700" : "bg-white/80 border-gray-200"
                    }`}
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center h-16">
                        <button
                            onClick={() => navigate(-1)}
                            className={`p-2 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"
                                }`}
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="ml-4 text-xl font-bold text-blue-600">Test Detallari</h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Test Info Section */}
                <div className={`rounded-3xl overflow-hidden shadow-xl mb-8 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
                    {test.thumbnail && (
                        <div className="relative h-80 overflow-hidden">
                            <img src={test.thumbnail || "/placeholder.svg"} alt={test.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <span
                                        className={`px-4 py-2 rounded-full text-sm font-medium ${getDifficultyColor(test.difficulty_percentage)}`}
                                    >
                                        {getDifficultyLabel(test.difficulty_percentage)}
                                    </span>
                                    <span className="px-4 py-2 rounded-full text-sm font-medium bg-blue-500/80 text-white backdrop-blur-sm">
                                        {test.category.emoji} {test.category.title}
                                    </span>
                                    <span className="px-4 py-2 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm">
                                        {test.visibility === "public" ? "Ommaviy" : "Shaxsiy"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-8">
                        <h1 className={`text-4xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {test.title}
                        </h1>

                        <p className={`text-xl leading-relaxed mb-8 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                            {test.description}
                        </p>

                        {/* Author and Date */}
                        <div className="flex items-center space-x-4 mb-8">
                            <img
                                src={test.user.profile_image || "https://backend.testabd.uz/media/defaultuseravatar.png"}
                                alt={test.user.username}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/30 cursor-pointer hover:scale-110 transition-transform object-cover shadow-lg"
                                loading="lazy"
                                decoding={"async"}
                            />
                            <div>
                                <a href={`/profile/${test.user.username}`} className="text-blue-500">
                                <div className="flex items-center space-x-2">
                                    <p className={`font-bold text-lg ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                        @{test.user.username}
                                    </p>
                                    {/* {test.user.is_badged && (
                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs">✓</span>
                                        </div>
                                    )}
                                    {test.user.is_premium && (
                                        <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs">★</span>
                                        </div>
                                    )} */}
                                </div>
                                </a>
                                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                    {new Date(test.created_at).toLocaleDateString("uz-UZ", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Enhanced Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                            <div className={`p-6 rounded-2xl text-center ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                                <div className="flex items-center justify-center mb-3">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                        <Trophy size={24} className="text-blue-600" />
                                    </div>
                                </div>
                                <p className={`text-3xl font-bold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                    {test.total_questions}
                                </p>
                                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Savollar</p>
                            </div>

                            <div className={`p-6 rounded-2xl text-center ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                                <div className="flex items-center justify-center mb-3">
                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                        <Users size={24} className="text-green-600" />
                                    </div>
                                </div>
                                <p className={`text-3xl font-bold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                    {test.participant_count || 0}
                                </p>
                                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Ishtirokchilar</p>
                            </div>

                            <div className={`p-6 rounded-2xl text-center ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                                <div className="flex items-center justify-center mb-3">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                        <Award size={24} className="text-purple-600" />
                                    </div>
                                </div>
                                <p className={`text-3xl font-bold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                    {test.average_question_difficulty}%
                                </p>
                                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>O'rtacha ball</p>
                            </div>

                            <div className={`p-6 rounded-2xl text-center ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                                <div className="flex items-center justify-center mb-3">
                                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                                        <Clock size={24} className="text-orange-600" />
                                    </div>
                                </div>
                                <p className={`text-3xl font-bold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                    {Math.round(test.average_time / 60) || '∞'}
                                </p>
                                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Daqiqa</p>
                            </div>
                        </div>

                        {/* Success Rate */}
                        {/* <div className={`p-6 rounded-2xl mb-8 ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                    Muvaffaqiyat darajasi
                                </h3>
                                <span
                                    className={`text-2xl font-bold ${getSuccessRate(test) > 70 ? "text-green-500" : getSuccessRate(test) > 50 ? "text-yellow-500" : "text-red-500"}`}
                                >
                                    {getSuccessRate(test)}%
                                </span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                                    <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                        To'g'ri: {test.correct_count}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                                    <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                        Noto'g'ri: {test.wrong_count}
                                    </span>
                                </div>
                            </div>
                        </div> */}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleStartTest}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <Play size={24} />
                                <span className="text-lg">Testni Boshlash</span>
                            </button>

                            <button
                                onClick={handleBookmark}
                                className={`px-8 py-4 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center space-x-3 ${test.is_bookmarked
                                        ? "bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-300"
                                        : theme === "dark"
                                            ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                <Bookmark size={20} className={test.is_bookmarked ? "fill-current" : ""} />
                                <span>{test.is_bookmarked ? "Saqlangan" : "Saqlash"}</span>
                            </button>

                            <button
                                onClick={handleShare}
                                className={`px-8 py-4 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center space-x-3 ${theme === "dark"
                                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                <Share size={20} />
                                <span>Ulashish</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Questions Section */}
                <div className="mb-12">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className={`p-4 rounded-2xl ${theme === "dark" ? "bg-blue-900/30" : "bg-blue-100"}`}>
                            <Target size={28} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                Test Savollari
                            </h2>
                            <p className={`text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                {test.questions.length} ta savol mavjud
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-8">
                        {test.questions.map((question, index) => (
                            <div
                                key={question.id}
                                onClick={() => handleQuestionClick(question.id)}
                                className={`group cursor-pointer rounded-3xl p-8 border-2 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl transform-gpu ${theme === "dark"
                                        ? "bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600"
                                        : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                    } 
                animate-fade-in-up`}
                                style={{
                                    animationDelay: `${index * 150}ms`,
                                    transform: "perspective(1000px) rotateX(0deg)",
                                    transformStyle: "preserve-3d",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "perspective(1000px) rotateX(-3deg) translateY(-8px)"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "perspective(1000px) rotateX(0deg) translateY(0px)"
                                }}
                            >
                                {/* Question Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-3">
                                           
                                            <div
                                                className={`w-12 h-12 rounded-2xl overflow-hidden ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                                                    }`}
                                            >
                                                {question.user.profile_image ? (
                                                    <img
                                                        src={question.user.profile_image || "/media/defaultuseravatar.png"}
                                                        alt="avatar"
                                                        className="object-cover w-full h-full"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-bold text-gray-600 flex items-center justify-center h-full">
                                                        {question.user.username.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <a href={`/profile/${question.user.username}`}>
                                            <div className="flex items-center space-x-2">
                                                <p className={`text-lg font-bold ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                                    {question.user.username}
                                                </p>
                                                {question.user.is_badged && (
                                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-xs">✓</span>
                                                    </div>
                                                )}
                                                {question.user.is_premium && (
                                                    <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-xs">★</span>
                                                    </div>
                                                )}
                                            </div>
                                            </a>
                                            <p className={`text-sm ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                                                {new Date(question.created_at).toLocaleDateString("uz-UZ")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <span
                                            className={`px-4 py-2 rounded-xl text-sm font-medium ${getQuestionTypeColor(question.question_type)}`}
                                        >
                                            {getQuestionTypeLabel(question.question_type)}
                                        </span>
                                        <span
                                            className={`px-4 py-2 rounded-xl text-sm font-medium ${getDifficultyColor(question.difficulty_percentage)}`}
                                        >
                                            {Math.round(question.difficulty_percentage)}%
                                        </span>
                                        <ChevronRight
                                            size={24}
                                            className={`transition-transform group-hover:translate-x-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                                }`}
                                        />
                                    </div>
                                </div>

                                {/* Question Text */}
                                <h3
                                    className={`text-2xl font-bold mb-6 line-clamp-3 ${theme === "dark" ? "text-white" : "text-gray-900"
                                        }`}
                                >
                                    {question.question_text}
                                </h3>

                                {/* Question Preview */}
                                {question.question_type !== "text_input" && question.answers.length > 0 && (
                                    <div className="mb-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {question.answers.slice(0, 4).map((answer) => (
                                                <div
                                                    key={answer.id}
                                                    className={`p-4 rounded-xl border transition-all `}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <span
                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold `}
                                                        >
                                                            {answer.letter}
                                                        </span>
                                                        <span className="text-sm font-medium line-clamp-1">{answer.answer_text}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Text Input Preview */}
                                {question.question_type === "text_input" && question.correct_answer_text && (
                                    <div className="mb-6">
                                        <div
                                            className={`p-4 rounded-xl border ${theme === "dark" ? "bg-green-900/20 border-green-600" : "bg-green-50 border-green-300"
                                                }`}
                                        >
                                            <p className={`text-sm font-medium ${theme === "dark" ? "text-green-300" : "text-green-700"}`}>
                                                Javob qo'lda kiritilishi kerak
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Question Stats */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-6">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">✓</span>
                                            </div>
                                            <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                                To'g'ri javoblar <span className="text-green-500 font-bold">{question.correct_count}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">✗</span>
                                            </div>
                                            <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                                Noto'g'ri javoblar <span className="text-red-500 font-bold">{question.wrong_count}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <TrendingUp size={16} className="text-blue-500" />
                                        <span
                                            className={`text-sm font-medium ${question.difficulty_percentage < 33
                                                    ? "text-green-500"
                                                    : question.difficulty_percentage < 66
                                                        ? "text-yellow-500"
                                                        : "text-red-500"
                                                }`}
                                        >
                                            {Math.round(question.difficulty_percentage)}% qiyinlik
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Related Tests */}
                {relatedTests.length > 0 && (
                    <div>
                        <div className="flex items-center space-x-3 mb-8">
                            <div className={`p-4 rounded-2xl ${theme === "dark" ? "bg-purple-900/30" : "bg-purple-100"}`}>
                                <Star size={28} className="text-purple-600" />
                            </div>
                            <div>
                                <h2 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                    O'xshash Testlar
                                </h2>
                                <p className={`text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                    Sizga yoqishi mumkin bo'lgan testlar
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {relatedTests.map((relatedTest, index) => (
                                <div
                                    key={relatedTest.id}
                                    onClick={() => navigate(`/tests/${relatedTest.id}`)}
                                    className={`cursor-pointer rounded-3xl overflow-hidden shadow-lg border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl transform-gpu ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                                        } animate-fade-in-up`}
                                    style={{
                                        animationDelay: `${index * 200}ms`,
                                    }}
                                >
                                    {relatedTest.thumbnail && (
                                        <div className="relative h-48 overflow-hidden">
                                            <img
                                                src={relatedTest.thumbnail || "/placeholder.svg"}
                                                alt={relatedTest.title}
                                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <div className="absolute top-4 left-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(relatedTest.difficulty_percentage)}`}
                                                >
                                                    {getDifficultyLabel(relatedTest.difficulty_percentage)}
                                                </span>
                                            </div>
                                            <div className="absolute top-4 right-4">
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                                                    {relatedTest.category.emoji} {relatedTest.category.title}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-6">
                                        <h3
                                            className={`font-bold text-xl mb-3 line-clamp-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                        >
                                            {relatedTest.title}
                                        </h3>
                                        <p className={`text-sm mb-4 line-clamp-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                            {relatedTest.description}
                                        </p>

                                        <div className="flex items-center justify-between text-sm mb-4">
                                            <div className="flex items-center space-x-4">
                                                <span className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
                                                    {relatedTest.total_questions} savol
                                                </span>
                                                <span className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>•</span>
                                                <span className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
                                                    {Math.round(relatedTest.average_time / 60)} daqiqa
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Star size={14} className="text-yellow-500 fill-current" />
                                                <span className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                                                    {Math.round(relatedTest.average_score)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={relatedTest.user.profile_image || "/media/defaultuseravatar.png"}
                                                alt={relatedTest.user.username}
                                                className="w-6 h-6 rounded-full"
                                            />
                                            <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                                @{relatedTest.user.username}
                                            </span>
                                            <span className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                                                {relatedTest.total_attempts} ishtirokchi
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: perspective(1000px) rotateX(10deg) translateY(30px);
          }
          to {
            opacity: 1;
            transform: perspective(1000px) rotateX(0deg) translateY(0px);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
        </div>
    )
}

export default TestDetailPage
