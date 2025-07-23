"use client"

import type React from "react"
import { X, Play, Eye, BookOpen, Clock, Award, Users } from "lucide-react"

export interface TestQuestion {
    id: string
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
    difficulty: "Easy" | "Medium" | "Hard"
}

export interface Test {
    id: string
    title: string
    description: string
    questionsCount: number
    difficulty: "Easy" | "Medium" | "Hard"
    category: string
    completedAt: string
    score: number
    maxScore: number
    questions: TestQuestion[]
}

interface TestModalProps {
    isOpen: boolean
    onClose: () => void
    test: Test | null
    onViewQuestions: () => void
    onStartTest: () => void
    theme?: string
}

export const TestModal: React.FC<TestModalProps> = ({
    isOpen,
    onClose,
    test,
    onViewQuestions,
    onStartTest,
    theme = "light",
}) => {
    if (!isOpen || !test) return null

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case "easy":
                return theme === "dark"
                    ? "bg-green-900/30 text-green-300 border-green-700"
                    : "bg-green-100 text-green-800 border-green-200"
            case "medium":
                return theme === "dark"
                    ? "bg-yellow-900/30 text-yellow-300 border-yellow-700"
                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
            case "hard":
                return theme === "dark" ? "bg-red-900/30 text-red-300 border-red-700" : "bg-red-100 text-red-800 border-red-200"
            default:
                return theme === "dark"
                    ? "bg-gray-800 text-gray-300 border-gray-600"
                    : "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const getScoreColor = (score: number, maxScore: number) => {
        const percentage = (score / maxScore) * 100
        if (percentage >= 80) return theme === "dark" ? "text-green-400" : "text-green-600"
        if (percentage >= 60) return theme === "dark" ? "text-yellow-400" : "text-yellow-600"
        return theme === "dark" ? "text-red-400" : "text-red-600"
    }

    const scorePercentage = (test.score / test.maxScore) * 100

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 animate-fade-in">
            <div
                className={`${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border animate-slide-up`}
            >
                <div
                    className={`flex items-center justify-between p-4 sm:p-6 border-b ${theme === "dark" ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900" : "border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50"}`}
                >
                    <h2
                        className={`text-xl sm:text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} line-clamp-1`}
                    >
                        {test.title}
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-2 sm:p-3 ${theme === "dark" ? "hover:bg-gray-700 text-gray-400 hover:text-white" : "hover:bg-white/50 text-gray-500 hover:text-gray-700"} rounded-full transition-all duration-200 hover:scale-110`}
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-4 sm:p-6">
                    {/* Test Info */}
                    <div className="mb-6">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                            <div
                                className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getDifficultyColor(test.difficulty)} animate-fade-in`}
                            >
                                {test.difficulty}
                            </div>
                            <span
                                className={`text-sm ${theme === "dark" ? "text-gray-300 bg-gray-800" : "text-gray-600 bg-gray-100"} px-3 py-1.5 rounded-full animate-fade-in`}
                                style={{ animationDelay: "0.1s" }}
                            >
                                {test.category}
                            </span>
                            <span
                                className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} animate-fade-in`}
                                style={{ animationDelay: "0.2s" }}
                            >
                                Completed {test.completedAt}
                            </span>
                        </div>

                        <p
                            className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"} leading-relaxed mb-6 text-sm sm:text-base animate-fade-in`}
                            style={{ animationDelay: "0.3s" }}
                        >
                            {test.description}
                        </p>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                            <div
                                className={`${theme === "dark" ? "bg-blue-900/30 border-blue-700" : "bg-blue-50 border-blue-200"} p-3 sm:p-4 rounded-xl text-center border animate-fade-in-up hover:scale-105 transition-transform duration-200`}
                                style={{ animationDelay: "0.4s" }}
                            >
                                <BookOpen
                                    className={`w-5 h-5 sm:w-6 sm:h-6 ${theme === "dark" ? "text-blue-400" : "text-blue-600"} mx-auto mb-2`}
                                />
                                <div
                                    className={`text-xl sm:text-2xl font-bold ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
                                >
                                    {test.questionsCount}
                                </div>
                                <div className={`text-xs sm:text-sm ${theme === "dark" ? "text-blue-300" : "text-blue-700"}`}>
                                    Questions
                                </div>
                            </div>

                            <div
                                className={`${theme === "dark" ? "bg-green-900/30 border-green-700" : "bg-green-50 border-green-200"} p-3 sm:p-4 rounded-xl text-center border animate-fade-in-up hover:scale-105 transition-transform duration-200`}
                                style={{ animationDelay: "0.5s" }}
                            >
                                <Award
                                    className={`w-5 h-5 sm:w-6 sm:h-6 ${theme === "dark" ? "text-green-400" : "text-green-600"} mx-auto mb-2`}
                                />
                                <div className={`text-xl sm:text-2xl font-bold ${getScoreColor(test.score, test.maxScore)}`}>
                                    {test.score}/{test.maxScore}
                                </div>
                                <div className={`text-xs sm:text-sm ${theme === "dark" ? "text-green-300" : "text-green-700"}`}>
                                    Score
                                </div>
                            </div>

                            <div
                                className={`${theme === "dark" ? "bg-purple-900/30 border-purple-700" : "bg-purple-50 border-purple-200"} p-3 sm:p-4 rounded-xl text-center border animate-fade-in-up hover:scale-105 transition-transform duration-200`}
                                style={{ animationDelay: "0.6s" }}
                            >
                                <Users
                                    className={`w-5 h-5 sm:w-6 sm:h-6 ${theme === "dark" ? "text-purple-400" : "text-purple-600"} mx-auto mb-2`}
                                />
                                <div
                                    className={`text-xl sm:text-2xl font-bold ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`}
                                >
                                    {scorePercentage.toFixed(0)}%
                                </div>
                                <div className={`text-xs sm:text-sm ${theme === "dark" ? "text-purple-300" : "text-purple-700"}`}>
                                    Accuracy
                                </div>
                            </div>

                            <div
                                className={`${theme === "dark" ? "bg-orange-900/30 border-orange-700" : "bg-orange-50 border-orange-200"} p-3 sm:p-4 rounded-xl text-center border animate-fade-in-up hover:scale-105 transition-transform duration-200`}
                                style={{ animationDelay: "0.7s" }}
                            >
                                <Clock
                                    className={`w-5 h-5 sm:w-6 sm:h-6 ${theme === "dark" ? "text-orange-400" : "text-orange-600"} mx-auto mb-2`}
                                />
                                <div
                                    className={`text-xl sm:text-2xl font-bold ${theme === "dark" ? "text-orange-400" : "text-orange-600"}`}
                                >
                                    ~{test.questionsCount * 2}
                                </div>
                                <div className={`text-xs sm:text-sm ${theme === "dark" ? "text-orange-300" : "text-orange-700"}`}>
                                    Minutes
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-6 animate-fade-in" style={{ animationDelay: "0.8s" }}>
                            <div className="flex justify-between items-center mb-2">
                                <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                    Overall Performance
                                </span>
                                <span className={`text-sm font-bold ${theme === "dark" ? "text-indigo-400" : "text-indigo-600"}`}>
                                    {scorePercentage.toFixed(1)}%
                                </span>
                            </div>
                            <div
                                className={`w-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full h-3 overflow-hidden`}
                            >
                                <div
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-1000 animate-progress"
                                    style={{ width: `${scorePercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div
                    className={`border-t p-4 sm:p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}
                >
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onViewQuestions}
                            className={`flex-1 flex items-center justify-center px-4 sm:px-6 py-3 ${theme === "dark" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-600 hover:bg-indigo-700"} text-white rounded-xl transition-all duration-200 font-medium text-sm sm:text-base hover:scale-105 animate-fade-in-up`}
                            style={{ animationDelay: "0.9s" }}
                        >
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            View Questions
                        </button>
                        <button
                            onClick={onStartTest}
                            className={`flex-1 flex items-center justify-center px-4 sm:px-6 py-3 ${theme === "dark" ? "bg-green-600 hover:bg-green-700" : "bg-green-600 hover:bg-green-700"} text-white rounded-xl transition-all duration-200 font-medium text-sm sm:text-base hover:scale-105 animate-fade-in-up`}
                            style={{ animationDelay: "1s" }}
                        >
                            <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Start Test
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes fadeInUp {
                    from { 
                        opacity: 0;
                        transform: translateY(10px);
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
                    animation: fadeIn 0.5s ease-out forwards;
                    opacity: 0;
                }
                
                .animate-slide-up {
                    animation: slideUp 0.4s ease-out forwards;
                }
                
                .animate-fade-in-up {
                    animation: fadeInUp 0.5s ease-out forwards;
                    opacity: 0;
                }
                
                .animate-progress {
                    animation: progress 1s ease-out forwards;
                }
            `}</style>
        </div>
    )
}
