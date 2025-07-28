"use client"

import type React from "react"
import { Clock, Users, Bookmark, Share, Play, Trophy, Target } from "lucide-react"

interface Category {
    id: number
    title: string
    slug: string
    description: string
    emoji: string
    image?: string
}

interface Test {
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
}

interface TestCardProps {
    test: Test
    theme: string
    onStartTest: (testId: number) => void
    onBookmark: (testId: number) => void
    onShare: (testId: number) => void
}

export const TestCard: React.FC<TestCardProps> = ({ test, theme, onStartTest, onBookmark, onShare }) => {
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

    const getSuccessRate = () => {
        const total = test.correct_count + test.wrong_count
        return total > 0 ? Math.round((test.correct_count / total) * 100) : 0
    }

    return (
        <div
            className={`rounded-3xl overflow-hidden shadow-lg border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl transform-gpu ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}
        >
            {/* Thumbnail */}
            {test.thumbnail && (
                <div className="relative h-56 overflow-hidden">
                    <img
                        src={test.thumbnail || "/placeholder.svg"}
                        alt={test.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 left-4">
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(test.difficulty_percentage)}`}
                        >
                            {getDifficultyLabel(test.difficulty_percentage)}
                        </span>
                    </div>
                    <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm">
                            {test.category.emoji} {test.category.title}
                        </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center space-x-2">
                            <div
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getSuccessRate() > 70
                                        ? "bg-green-500/80"
                                        : getSuccessRate() > 50
                                            ? "bg-yellow-500/80"
                                            : "bg-red-500/80"
                                    } text-white backdrop-blur-sm`}
                            >
                                {getSuccessRate()}% muvaffaqiyat
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center space-x-3 mb-4">
                    <img
                        src={test.user.profile_image || "/media/defaultuseravatar.png"}
                        alt={test.user.username}
                        className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            <a href={`/profile/${test.user.username}`} className="font-semibold text-sm hover:underline">
                            <p className={`font-semibold text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                @{test.user.username}
                            </p>
                            </a>
                        </div>
                        <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {new Date(test.created_at).toLocaleDateString("uz-UZ")}
                        </p>
                    </div>
                </div>

                {/* Title and Description */}
                <h3 className={`text-xl font-bold mb-3 line-clamp-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {test.title}
                </h3>
                <p className={`text-sm mb-4 line-clamp-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    {test.description}
                </p>

                {/* Enhanced Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className={`p-3 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                        <div className="flex items-center space-x-2 mb-1">
                            <Trophy size={16} className="text-blue-500" />
                            <span className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                Savollar
                            </span>
                        </div>
                        <p className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {test.total_questions}
                        </p>
                    </div>

                    <div className={`p-3 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                        <div className="flex items-center space-x-2 mb-1">
                            <Clock size={16} className="text-orange-500" />
                            <span className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                Vaqt
                            </span>
                        </div>
                        <p className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {Math.round(test.average_time / 60)}d
                        </p>
                    </div>

                    <div className={`p-3 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                        <div className="flex items-center space-x-2 mb-1">
                            <Users size={16} className="text-green-500" />
                            <span className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                Ishtirokchilar
                            </span>
                        </div>
                        <p className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {test.total_attempts > 999 ? `${Math.round(test.total_attempts / 1000)}k` : test.total_attempts}
                        </p>
                    </div>

                    <div className={`p-3 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                        <div className="flex items-center space-x-2 mb-1">
                            <Target size={16} className="text-purple-500" />
                            <span className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                O'rtacha ball
                            </span>
                        </div>
                        <p className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {Math.round(test.average_score)}%
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                    <button
                        onClick={() => onStartTest(test.id)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <Play size={18} />
                        <span>Boshlash</span>
                    </button>
                    <button
                        onClick={() => onBookmark(test.id)}
                        className={`p-3 rounded-xl border-2 transition-all duration-300 ${test.is_bookmarked
                                ? "bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-300"
                                : theme === "dark"
                                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                    >
                        <Bookmark size={18} className={test.is_bookmarked ? "fill-current" : ""} />
                    </button>
                    <button
                        onClick={() => onShare(test.id)}
                        className={`p-3 rounded-xl border-2 transition-all duration-300 ${theme === "dark"
                                ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                    >
                        <Share size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
