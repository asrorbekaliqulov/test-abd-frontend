"use client"
import { useNavigate } from "react-router-dom"
import type React from "react"
import { UserPlus, Share2, Calendar, Award, TrendingUp, ArrowLeft } from "lucide-react"

export interface User {
    id: number
    username: string
    first_name: string
    last_name: string
    bio: string
    profile_image: string
    followers_count: number
    following_count: number
    is_following: boolean
    level: string
    join_date: string
}

export interface UserStats {
    total_tests: number
    correct_answers: number
    wrong_answers: number
    accuracy: number
}

interface ProfileHeaderProps {
    user: User
    stats: UserStats
    onFollow: () => void
    onShare: () => void
    theme?: string
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, stats, onFollow, onShare, theme = "light" }) => {
    const getLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case "beginner":
                return theme === "dark"
                    ? "bg-green-900/30 text-green-300 border-green-700"
                    : "bg-green-100 text-green-800 border-green-200"
            case "intermediate":
                return theme === "dark"
                    ? "bg-blue-900/30 text-blue-300 border-blue-700"
                    : "bg-blue-100 text-blue-800 border-blue-200"
            case "advanced":
                return theme === "dark"
                    ? "bg-purple-900/30 text-purple-300 border-purple-700"
                    : "bg-purple-100 text-purple-800 border-purple-200"
            case "expert":
                return theme === "dark"
                    ? "bg-orange-900/30 text-orange-300 border-orange-700"
                    : "bg-orange-100 text-orange-800 border-orange-200"
            default:
                return theme === "dark"
                    ? "bg-gray-800 text-gray-300 border-gray-600"
                    : "bg-gray-100 text-gray-800 border-gray-200"
        }
    }
    const navigate = useNavigate()

    return (
        <div
            className={`${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8 border animate-fade-in`}
        >
            <button
                onClick={() => navigate("/")}
                className={`p-2 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"
                    }`}
            >
                <ArrowLeft size={24} />
            </button>
            <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                {/* Left panel - image and name */}
                <div className="flex flex-col items-center lg:items-start animate-fade-in-up">
                    <div className="relative group">
                        <img
                            src={
                                user.profile_image ||
                                "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
                            }
                            alt={`${user.first_name} ${user.last_name}`}
                            className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full object-cover border-4 border-indigo-200 shadow-xl transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="mt-4 text-center lg:text-left">
                        <h1
                            className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} animate-fade-in`}
                            style={{ animationDelay: "0.2s" }}
                        >
                            {user.first_name} {user.last_name}
                        </h1>
                        <p
                            className={`text-lg sm:text-xl ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-3 animate-fade-in`}
                            style={{ animationDelay: "0.3s" }}
                        >
                            @{user.username}
                        </p>
                        <div
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getLevelColor(user.level)} animate-fade-in`}
                            style={{ animationDelay: "0.4s" }}
                        >
                            <Award className="w-4 h-4 mr-1" />
                            {user.level}
                        </div>
                    </div>
                </div>

                {/* Right panel - details */}
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
                        <button
                            onClick={onFollow}
                            className={`flex items-center justify-center px-4 sm:px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 animate-fade-in-up ${user.is_following
                                    ? theme === "dark"
                                        ? "bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl"
                                }`}
                            style={{ animationDelay: "0.5s" }}
                        >
                            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            {user.is_following ? "Kuzatmaslik" : "Kuzatish"}
                        </button>

                        <button
                            onClick={onShare}
                            className={`flex items-center justify-center px-4 sm:px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 animate-fade-in-up ${theme === "dark"
                                    ? "bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                                }`}
                            style={{ animationDelay: "0.6s" }}
                        >
                            <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Share Profile
                        </button>
                    </div>

                    {user.bio && (
                        <p
                            className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"} mb-6 leading-relaxed text-sm sm:text-base animate-fade-in`}
                            style={{ animationDelay: "0.7s" }}
                        >
                            {user.bio}
                        </p>
                    )}

                    <div
                        className={`flex items-center ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-6 animate-fade-in`}
                        style={{ animationDelay: "0.8s" }}
                    >
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        <span className="text-sm sm:text-base">Joined {user.join_date}</span>
                    </div>

                    <div className="flex gap-6 sm:gap-8 mb-6">
                        <div className="text-center animate-fade-in-up" style={{ animationDelay: "0.9s" }}>
                            <div
                                className={`text-xl sm:text-2xl lg:text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                            >
                                {user.followers_count || 0}
                            </div>
                            <div className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} text-sm sm:text-base`}>
                                Followers
                            </div>
                        </div>
                        <div className="text-center animate-fade-in-up" style={{ animationDelay: "1s" }}>
                            <div
                                className={`text-xl sm:text-2xl lg:text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                            >
                                {user.following_count || 0}
                            </div>
                            <div className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} text-sm sm:text-base`}>
                                Following
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div
                    className={`${theme === "dark" ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700" : "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200"} rounded-2xl p-4 sm:p-6 min-w-[280px] border animate-fade-in-up`}
                    style={{ animationDelay: "1.1s" }}
                >
                    <h3
                        className={`text-base sm:text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"} mb-4 flex items-center`}
                    >
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600" />
                        Statistics
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: "1.2s" }}>
                            <span className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"} text-sm sm:text-base`}>
                                Total Tests
                            </span>
                            <span
                                className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"} text-sm sm:text-base`}
                            >
                                {stats?.total_tests ?? 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: "1.3s" }}>
                            <span className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"} text-sm sm:text-base`}>
                                Correct Answers
                            </span>
                            <span
                                className={`font-semibold ${theme === "dark" ? "text-green-400" : "text-green-600"} text-sm sm:text-base`}
                            >
                                {stats?.correct_answers ?? 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: "1.4s" }}>
                            <span className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"} text-sm sm:text-base`}>
                                Wrong Answers
                            </span>
                            <span
                                className={`font-semibold ${theme === "dark" ? "text-red-400" : "text-red-600"} text-sm sm:text-base`}
                            >
                                {stats?.wrong_answers ?? 0}
                            </span>
                        </div>
                        <div
                            className={`border-t pt-4 animate-fade-in ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}
                            style={{ animationDelay: "1.5s" }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"} text-sm sm:text-base`}>
                                    Accuracy
                                </span>
                                <span
                                    className={`font-bold ${theme === "dark" ? "text-indigo-400" : "text-indigo-600"} text-sm sm:text-base`}
                                >
                                    {(stats?.accuracy ?? 0).toFixed(1)}%
                                </span>
                            </div>
                            <div
                                className={`mt-2 ${theme === "dark" ? "bg-gray-600" : "bg-gray-200"} rounded-full h-2 overflow-hidden`}
                            >
                                <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-1000 animate-progress"
                                    style={{ width: `${stats?.accuracy ?? 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes fadeInUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes progress {
                    from { width: 0%; }
                    to { width: var(--progress-width); }
                }
                
                .animate-fade-in {
                    animation: fadeIn 0.6s ease-out forwards;
                    opacity: 0;
                }
                
                .animate-fade-in-up {
                    animation: fadeInUp 0.6s ease-out forwards;
                    opacity: 0;
                }
                
                .animate-progress {
                    animation: progress 1.5s ease-out forwards;
                }
            `}</style>
        </div>
    )
}
