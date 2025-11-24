"use client"

import type React from "react"
import {Clock, Users, Bookmark, Share, Play, Trophy, Target} from "lucide-react"

/* --------------------------- Types --------------------------- */

interface Category {
    id?: number
    title?: string
    slug?: string
    description?: string
    emoji?: string
    name?: string
    icon?: string
    image?: string | null
}

interface Test {
    id: number
    title: string
    description: string
    category?: Category | string | null
    visibility: "public" | "private" | "unlisted"
    created_at: string
    total_questions: number
    total_attempts: number
    average_score: number | null
    average_time: number | null
    wrong_count: number
    correct_count: number
    difficulty_percentage: number
    user: {
        id: number
        username: string
        profile_image: string | null
        is_badged?: boolean
        is_premium?: boolean
    } | null
    is_bookmarked: boolean
    thumbnail?: string | null
}

interface TestCardProps {
    test: Test | null | undefined
    theme?: string
    onStartTest?: (testId: number) => void
    onBookmark?: (testId: number) => void
    onShare?: (testId: number) => void
}

/* --------------------------- Component --------------------------- */

export const TestCard: React.FC<TestCardProps> = ({
                                                      test,
                                                      theme = "light",
                                                      onStartTest = () => {
                                                      },
                                                      onBookmark = () => {
                                                      },
                                                      onShare = () => {
                                                      },
                                                  }) => {

    /* ---------------------- Global Guard ---------------------- */

    if (!test || typeof test !== "object") {
        return (
            <div className="p-4 rounded-xl bg-red-100 text-red-700 text-center">
                Test ma'lumotlari yuklanmadi
            </div>
        )
    }

    /* ---------------------- Category Safe Normalize ---------------------- */

    const normalizeCategory = (raw: any): Category => {
        if (!raw) return {emoji: "❓", title: "Kategoriya yo‘q", slug: "unknown"}

        if (typeof raw === "string")
            return {emoji: "❓", title: raw, slug: raw.toLowerCase().replace(/\s+/g, "-")}

        return {
            emoji: raw.emoji || raw.icon || "❓",
            title: raw.title || raw.name || "Kategoriya yo‘q",
            slug: raw.slug || raw.title || "unknown",
            description: raw.description || "",
            image: raw.image || null,
        }
    }

    const category = normalizeCategory(test.category)
    const avgScore = test.average_score ?? 0
    const avgTime = test.average_time ?? 0

    /* ---------------------- Helpers ---------------------- */

    const getDifficultyColor = (d: number) => {
        if (d < 33) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
        if (d < 66) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    }

    const getDifficultyLabel = (d: number) => {
        if (d < 33) return "Oson"
        if (d < 66) return "O‘rta"
        return "Qiyin"
    }

    const getSuccessRate = () => {
        const total = (test.correct_count ?? 0) + (test.wrong_count ?? 0)
        return total > 0 ? Math.round((test.correct_count / total) * 100) : 0
    }

    /* ---------------------- Component ---------------------- */
    console.log("TEST:", test);

    return (
        <div
            className={`rounded-3xl overflow-hidden shadow-lg border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
        >
            {/* Thumbnail */}
            <div className="relative h-56 overflow-hidden">
                {test.thumbnail ? (
                    <img
                        src={test.thumbnail}
                        alt={test?.title || "Test"}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-4xl opacity-60">{category.emoji}</span>
                    </div>
                )}

                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>

                {/* Difficulty */}
                <div className="absolute top-4 left-4">
                    <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                            test.difficulty_percentage ?? 0
                        )}`}
                    >
                        {getDifficultyLabel(test.difficulty_percentage ?? 0)}
                    </span>
                </div>

                {/* Category */}
                <div className="absolute top-4 right-4">
                    <span
                        className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm">
                        {category.emoji} {category.title}
                    </span>
                </div>

                {/* Success Rate */}
                <div className="absolute bottom-4 left-4 right-4">
                    <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                            getSuccessRate() > 70
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

            {/* Content */}
            <div className="p-6">

                {/* User */}
                <div className="flex items-center space-x-3 mb-4">
                    <img
                        src={test.user?.profile_image || "/media/defaultuseravatar.png"}
                        alt={test.user?.username || "user"}
                        className="w-8 h-8 rounded-full"
                    />

                    <div className="flex-1">
                        <a href={`/profile/${test.user?.username || ""}`}>
                            <p className={`font-semibold text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                @{test.user?.username || "unknown"}
                            </p>
                        </a>
                        <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {test.created_at ? new Date(test.created_at).toLocaleDateString("uz-UZ") : ""}
                        </p>
                    </div>
                </div>

                {/* Title */}
                <h3
                    className={`text-xl font-bold mb-3 line-clamp-2 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                >
                    {test.title || "No title"}
                </h3>

                {/* Description */}
                <p className={`text-sm mb-4 line-clamp-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    {test.description || "No description"}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">

                    {/* Questions */}
                    <div className={`p-3 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                        <div className="flex items-center space-x-2 mb-1">
                            <Trophy size={16} className="text-blue-500"/>
                            <span
                                className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                            >
                                Savollar
                            </span>
                        </div>
                        <p className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {test.total_questions ?? 0}
                        </p>
                    </div>

                    {/* Time */}
                    <div className={`p-3 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                        <div className="flex items-center space-x-2 mb-1">
                            <Clock size={16} className="text-orange-500"/>
                            <span
                                className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                            >
                                Vaqt
                            </span>
                        </div>
                        <p className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {Math.round((avgTime ?? 0) / 60)}d
                        </p>
                    </div>

                    {/* Attempts */}
                    <div className={`p-3 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                        <div className="flex items-center space-x-2 mb-1">
                            <Users size={16} className="text-green-500"/>
                            <span
                                className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                            >
                                Ishtirokchilar
                            </span>
                        </div>
                        <p className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {test.total_attempts
                                ? test.total_attempts > 999
                                    ? `${Math.round(test.total_attempts / 1000)}k`
                                    : test.total_attempts
                                : 0}
                        </p>
                    </div>

                    {/* Score */}
                    <div className={`p-3 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                        <div className="flex items-center space-x-2 mb-1">
                            <Target size={16} className="text-purple-500"/>
                            <span
                                className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                            >
                                O‘rtacha ball
                            </span>
                        </div>
                        <p className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {Math.round(avgScore ?? 0)}%
                        </p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex space-x-3">
                    <button
                        onClick={() => test.id && onStartTest(test.id)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-4 rounded-xl"
                    >
                        <Play size={18} className="inline"/> Boshlash
                    </button>

                    <button
                        onClick={() => test.id && onBookmark(test.id)}
                        className={`p-3 rounded-xl border-2 ${
                            test.is_bookmarked
                                ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                                : "border-gray-300 text-gray-700"
                        }`}
                    >
                        <Bookmark size={18}/>
                    </button>

                    <button
                        onClick={() => test.id && onShare(test.id)}
                        className={`p-3 rounded-xl border-2 ${
                            theme === "dark" ? "border-gray-600 text-gray-300" : "border-gray-300 text-gray-700"
                        }`}
                    >
                        <Share size={18}/>
                    </button>
                </div>
            </div>
        </div>
    )
}
