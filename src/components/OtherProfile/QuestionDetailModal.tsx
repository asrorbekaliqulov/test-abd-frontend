"use client"

import type React from "react"
import { useState } from "react"
import { X, CheckCircle, XCircle, Lightbulb, Send } from "lucide-react"

export interface TestQuestion {
    id: string
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
    difficulty: "Easy" | "Medium" | "Hard"
}

interface QuestionDetailModalProps {
    isOpen: boolean
    onClose: () => void
    question: TestQuestion | null
    theme?: string
}

export const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
    isOpen,
    onClose,
    question,
    theme = "light",
}) => {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
    const [showResult, setShowResult] = useState(false)

    if (!isOpen || !question) return null

    const handleAnswerSelect = (answerIndex: number) => {
        if (showResult) return
        setSelectedAnswer(answerIndex)
    }

    const handleSubmit = () => {
        if (selectedAnswer !== null) {
            setShowResult(true)
        }
    }

    const handleClose = () => {
        setSelectedAnswer(null)
        setShowResult(false)
        onClose()
    }

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

    const isCorrect = selectedAnswer === question.correctAnswer

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 animate-fade-in">
            <div
                className={`${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border animate-slide-up`}
            >
                <div
                    className={`flex items-center justify-between p-4 sm:p-6 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
                >
                    <div className="flex items-center space-x-3">
                        <h2 className={`text-lg sm:text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            Question Details
                        </h2>
                        <div
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getDifficultyColor(question.difficulty)} animate-fade-in`}
                        >
                            {question.difficulty}
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className={`p-2 sm:p-3 ${theme === "dark" ? "hover:bg-gray-700 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"} rounded-full transition-all duration-200 hover:scale-110`}
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-4 sm:p-6">
                    <div className="mb-6">
                        <h3
                            className={`text-lg sm:text-xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"} mb-4 sm:mb-6 leading-relaxed animate-fade-in`}
                        >
                            {question.question}
                        </h3>

                        <div className="space-y-3 sm:space-y-4">
                            {question.options.map((option, index) => {
                                let buttonClass = `w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] animate-fade-in-up `

                                if (showResult) {
                                    if (index === question.correctAnswer) {
                                        buttonClass +=
                                            theme === "dark"
                                                ? "border-green-500 bg-green-900/30 text-green-300"
                                                : "border-green-500 bg-green-50 text-green-800"
                                    } else if (index === selectedAnswer && selectedAnswer !== question.correctAnswer) {
                                        buttonClass +=
                                            theme === "dark"
                                                ? "border-red-500 bg-red-900/30 text-red-300"
                                                : "border-red-500 bg-red-50 text-red-800"
                                    } else {
                                        buttonClass +=
                                            theme === "dark"
                                                ? "border-gray-600 bg-gray-800 text-gray-400"
                                                : "border-gray-200 bg-gray-50 text-gray-600"
                                    }
                                } else {
                                    if (selectedAnswer === index) {
                                        buttonClass +=
                                            theme === "dark"
                                                ? "border-indigo-500 bg-indigo-900/30 text-indigo-300"
                                                : "border-indigo-500 bg-indigo-50 text-indigo-800"
                                    } else {
                                        buttonClass +=
                                            theme === "dark"
                                                ? "border-gray-600 hover:border-indigo-400 hover:bg-indigo-900/20 text-gray-300 hover:text-indigo-300"
                                                : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700"
                                    }
                                }

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleAnswerSelect(index)}
                                        className={buttonClass}
                                        disabled={showResult}
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <span className="font-bold mr-3 text-lg sm:text-xl">{String.fromCharCode(65 + index)}.</span>
                                                <span className="text-sm sm:text-base">{option}</span>
                                            </div>
                                            {showResult && index === question.correctAnswer && (
                                                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 animate-bounce" />
                                            )}
                                            {showResult && index === selectedAnswer && selectedAnswer !== question.correctAnswer && (
                                                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 animate-pulse" />
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {showResult && (
                        <div
                            className={`p-4 sm:p-6 rounded-xl mb-4 sm:mb-6 border animate-slide-up ${isCorrect
                                    ? theme === "dark"
                                        ? "bg-green-900/30 border-green-700"
                                        : "bg-green-50 border-green-200"
                                    : theme === "dark"
                                        ? "bg-red-900/30 border-red-700"
                                        : "bg-red-50 border-red-200"
                                }`}
                        >
                            <div className="flex items-center mb-3">
                                {isCorrect ? (
                                    <CheckCircle
                                        className={`w-6 h-6 sm:w-8 sm:h-8 ${theme === "dark" ? "text-green-400" : "text-green-600"} mr-3 animate-bounce`}
                                    />
                                ) : (
                                    <XCircle
                                        className={`w-6 h-6 sm:w-8 sm:h-8 ${theme === "dark" ? "text-red-400" : "text-red-600"} mr-3 animate-pulse`}
                                    />
                                )}
                                <span
                                    className={`font-bold text-lg sm:text-xl ${isCorrect
                                            ? theme === "dark"
                                                ? "text-green-300"
                                                : "text-green-800"
                                            : theme === "dark"
                                                ? "text-red-300"
                                                : "text-red-800"
                                        }`}
                                >
                                    {isCorrect ? "Correct!" : "Incorrect"}
                                </span>
                            </div>
                            {!isCorrect && (
                                <p className={`${theme === "dark" ? "text-red-300" : "text-red-700"} mb-2 text-sm sm:text-base`}>
                                    The correct answer is:{" "}
                                    <strong>
                                        {String.fromCharCode(65 + question.correctAnswer)}. {question.options[question.correctAnswer]}
                                    </strong>
                                </p>
                            )}
                        </div>
                    )}

                    {question.explanation && showResult && (
                        <div
                            className={`${theme === "dark" ? "bg-blue-900/30 border-blue-700" : "bg-blue-50 border-blue-200"} border rounded-xl p-4 sm:p-6 animate-fade-in`}
                        >
                            <div className="flex items-center mb-3">
                                <Lightbulb
                                    className={`w-5 h-5 sm:w-6 sm:h-6 ${theme === "dark" ? "text-blue-400" : "text-blue-600"} mr-2`}
                                />
                                <span
                                    className={`font-semibold ${theme === "dark" ? "text-blue-300" : "text-blue-800"} text-sm sm:text-base`}
                                >
                                    Explanation
                                </span>
                            </div>
                            <p
                                className={`${theme === "dark" ? "text-blue-200" : "text-blue-700"} leading-relaxed text-sm sm:text-base`}
                            >
                                {question.explanation}
                            </p>
                        </div>
                    )}
                </div>

                {!showResult && (
                    <div
                        className={`border-t p-4 sm:p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}
                    >
                        <button
                            onClick={handleSubmit}
                            disabled={selectedAnswer === null}
                            className={`w-full py-3 sm:py-4 px-6 rounded-xl transition-all duration-200 font-medium text-sm sm:text-base flex items-center justify-center space-x-2 hover:scale-105 ${selectedAnswer !== null
                                    ? theme === "dark"
                                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    : theme === "dark"
                                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                        >
                            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Submit Answer</span>
                        </button>
                    </div>
                )}
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
            `}</style>
        </div>
    )
}
