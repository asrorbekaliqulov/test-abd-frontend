"use client"

import type React from "react"
import { X, HelpCircle, CheckCircle, AlertCircle } from "lucide-react"

export interface TestQuestion {
    id: string
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
    difficulty: "Easy" | "Medium" | "Hard"
}

interface QuestionsListModalProps {
    isOpen: boolean
    onClose: () => void
    questions: TestQuestion[]
    testTitle: string
    onQuestionClick: (question: TestQuestion) => void
    theme?: string
}

export const QuestionsListModal: React.FC<QuestionsListModalProps> = ({
    isOpen,
    onClose,
    questions,
    testTitle,
    onQuestionClick,
    theme = "light",
}) => {
    if (!isOpen) return null

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

    const getDifficultyIcon = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case "easy":
                return <CheckCircle className="w-4 h-4" />
            case "medium":
                return <AlertCircle className="w-4 h-4" />
            case "hard":
                return <HelpCircle className="w-4 h-4" />
            default:
                return <HelpCircle className="w-4 h-4" />
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 animate-fade-in">
            <div
                className={`${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border animate-slide-up`}
            >
                <div
                    className={`flex items-center justify-between p-4 sm:p-6 border-b ${theme === "dark" ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900" : "border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50"}`}
                >
                    <div>
                        <h2 className={`text-xl sm:text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            Test Questions
                        </h2>
                        <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mt-1 text-sm sm:text-base`}>
                            {testTitle}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 sm:p-3 ${theme === "dark" ? "hover:bg-gray-700 text-gray-400 hover:text-white" : "hover:bg-white/50 text-gray-500 hover:text-gray-700"} rounded-full transition-all duration-200 hover:scale-110`}
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-4 sm:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {questions.map((question, index) => (
                            <div
                                key={question.id}
                                onClick={() => onQuestionClick(question)}
                                className={`${theme === "dark" ? "bg-gray-800 border-gray-700 hover:border-indigo-500 hover:bg-gray-750" : "bg-white border-gray-200 hover:border-indigo-300 hover:bg-gray-50"} border rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group transform hover:scale-[1.02] animate-fade-in-up`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="flex items-start justify-between mb-3 sm:mb-4">
                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                        <span
                                            className={`${theme === "dark" ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-100 text-indigo-800"} text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-lg`}
                                        >
                                            Q{index + 1}
                                        </span>
                                        <div
                                            className={`flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(question.difficulty)}`}
                                        >
                                            {getDifficultyIcon(question.difficulty)}
                                            <span className="ml-1">{question.difficulty}</span>
                                        </div>
                                    </div>
                                </div>

                                <h3
                                    className={`font-semibold ${theme === "dark" ? "text-white group-hover:text-indigo-300" : "text-gray-900 group-hover:text-indigo-600"} mb-3 sm:mb-4 line-clamp-2 transition-colors text-sm sm:text-base lg:text-lg leading-relaxed`}
                                >
                                    {question.question}
                                </h3>

                                <div className="space-y-2">
                                    {question.options.map((option, optionIndex) => (
                                        <div
                                            key={optionIndex}
                                            className={`text-xs sm:text-sm p-2 sm:p-3 rounded-lg border transition-all duration-200 ${optionIndex === question.correctAnswer
                                                    ? theme === "dark"
                                                        ? "bg-green-900/30 border-green-700 text-green-300"
                                                        : "bg-green-50 border-green-200 text-green-800"
                                                    : theme === "dark"
                                                        ? "bg-gray-700 border-gray-600 text-gray-300"
                                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                                }`}
                                        >
                                            <span className="font-medium mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                                            {option}
                                        </div>
                                    ))}
                                </div>

                                {question.explanation && (
                                    <div
                                        className={`mt-3 sm:mt-4 p-3 sm:p-4 ${theme === "dark" ? "bg-blue-900/30 border-blue-700 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-800"} border rounded-lg text-xs sm:text-sm animate-fade-in`}
                                    >
                                        <strong>Explanation:</strong> {question.explanation}
                                    </div>
                                )}
                            </div>
                        ))}
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
                
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out forwards;
                }
                
                .animate-slide-up {
                    animation: slideUp 0.4s ease-out forwards;
                }
                
                .animate-fade-in-up {
                    animation: fadeInUp 0.5s ease-out forwards;
                    opacity: 0;
                }
            `}</style>
        </div>
    )
}
