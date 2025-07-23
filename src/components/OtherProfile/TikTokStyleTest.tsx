"use client"

import type React from "react"
import { useState } from "react"
import {
    X,
    ChevronUp,
    ChevronDown,
    CheckCircle,
    XCircle,
    RotateCcw,
    Home,
    Send,
    ThumbsUp,
    ThumbsDown,
} from "lucide-react"

export interface TestQuestion {
    id: string
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
    difficulty: "Easy" | "Medium" | "Hard"
}

interface TikTokStyleTestProps {
    isOpen: boolean
    onClose: () => void
    questions: TestQuestion[]
    testTitle: string
    theme?: string
}

export const TikTokStyleTest: React.FC<TikTokStyleTestProps> = ({
    isOpen,
    onClose,
    questions,
    testTitle,
    theme = "dark",
}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
    const [showResult, setShowResult] = useState(false)
    const [score, setScore] = useState(0)
    const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>(new Array(questions.length).fill(false))
    const [animateIn, setAnimateIn] = useState(true)

    if (!isOpen || questions.length === 0) return null

    const currentQuestion = questions[currentQuestionIndex]
    const isLastQuestion = currentQuestionIndex === questions.length - 1
    const isFirstQuestion = currentQuestionIndex === 0

    // Determine if this is a true/false question
    const isTrueFalse =
        currentQuestion.options.length === 2 &&
        (currentQuestion.options[0].toLowerCase().includes("true") ||
            currentQuestion.options[0].toLowerCase().includes("to'g'ri") ||
            currentQuestion.options[0].toLowerCase().includes("ha")) &&
        (currentQuestion.options[1].toLowerCase().includes("false") ||
            currentQuestion.options[1].toLowerCase().includes("noto'g'ri") ||
            currentQuestion.options[1].toLowerCase().includes("yo'q"))

    const handleAnswerSelect = (answerIndex: number) => {
        if (showResult) return
        setSelectedAnswer(answerIndex)
    }

    const handleSubmit = () => {
        if (selectedAnswer === null) return

        setShowResult(true)

        if (selectedAnswer === currentQuestion.correctAnswer) {
            setScore((prev) => prev + 1)
        }

        const newAnsweredQuestions = [...answeredQuestions]
        newAnsweredQuestions[currentQuestionIndex] = true
        setAnsweredQuestions(newAnsweredQuestions)
    }

    const handleNext = () => {
        if (isLastQuestion) {
            return
        }

        setAnimateIn(false)
        setTimeout(() => {
            setCurrentQuestionIndex((prev) => prev + 1)
            setSelectedAnswer(null)
            setShowResult(false)
            setAnimateIn(true)
        }, 200)
    }

    const handlePrevious = () => {
        if (isFirstQuestion) return

        setAnimateIn(false)
        setTimeout(() => {
            setCurrentQuestionIndex((prev) => prev - 1)
            setSelectedAnswer(null)
            setShowResult(false)
            setAnimateIn(true)
        }, 200)
    }

    const handleRestart = () => {
        setCurrentQuestionIndex(0)
        setSelectedAnswer(null)
        setShowResult(false)
        setScore(0)
        setAnsweredQuestions(new Array(questions.length).fill(false))
        setAnimateIn(true)
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case "easy":
                return "bg-green-500"
            case "medium":
                return "bg-yellow-500"
            case "hard":
                return "bg-red-500"
            default:
                return "bg-gray-500"
        }
    }

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100

    const renderQuestionContent = () => {
        const optionsCount = currentQuestion.options.length

        if (isTrueFalse) {
            return (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 animate-fade-in">
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = selectedAnswer === index
                        const isCorrectAnswer = index === currentQuestion.correctAnswer
                        const isUserCorrect = isSelected && isCorrectAnswer
                        const isUserWrong = isSelected && !isCorrectAnswer
                        const showCorrect = showResult && isCorrectAnswer

                        const getButtonClass = () => {
                            if (isUserCorrect) return "bg-green-500/20 border-green-400/50"
                            if (isUserWrong) return "bg-red-500/20 border-red-400/50"
                            if (showCorrect) return "bg-green-500/10 border-green-300/30"
                            if (isSelected) return "bg-blue-500/20 border-blue-400/50"
                            return "bg-black/20 border-white/20 hover:bg-black/30"
                        }

                        const isTrue =
                            option.toLowerCase().includes("true") ||
                            option.toLowerCase().includes("to'g'ri") ||
                            option.toLowerCase().includes("ha")

                        return (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(index)}
                                disabled={showResult}
                                className={`flex flex-col items-center justify-center gap-2 py-4 px-3 sm:py-5 sm:px-4 md:py-6 md:px-5 lg:py-8 lg:px-6 rounded-xl backdrop-blur-md border transition-all animate-fade-in-up ${getButtonClass()} disabled:opacity-70`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {isTrue ? (
                                    <ThumbsUp size={24} className="text-white sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                                ) : (
                                    <ThumbsDown size={24} className="text-white sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                                )}
                                <span className="text-sm sm:text-base md:text-lg lg:text-xl font-medium text-white text-center">
                                    {option}
                                </span>
                                {isUserCorrect && <CheckCircle size={20} className="text-green-400 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
                                {isUserWrong && <XCircle size={20} className="text-red-400 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
                            </button>
                        )
                    })}
                </div>
            )
        }

        // For regular multiple choice questions
        const paddingClass =
            optionsCount <= 3
                ? "p-3 sm:p-4 md:p-5 lg:p-6"
                : optionsCount === 4
                    ? "p-3 sm:p-3.5 md:p-4 lg:p-5"
                    : "p-2 sm:p-3 md:p-3.5 lg:p-4"
        const circleSize =
            optionsCount <= 3
                ? "w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12"
                : optionsCount === 4
                    ? "w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10"
                    : "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9"
        const fontSize =
            optionsCount <= 3 ? "text-sm sm:text-base md:text-lg lg:text-xl" : "text-xs sm:text-sm md:text-base lg:text-lg"
        const gap = optionsCount <= 3 ? "gap-3 sm:gap-4 md:gap-5" : "gap-2 sm:gap-3 md:gap-4"

        return (
            <div className={`grid ${gap} ${optionsCount >= 5 ? "max-h-[50vh] overflow-y-auto pr-2" : ""} animate-fade-in`}>
                {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index
                    const isCorrectAnswer = index === currentQuestion.correctAnswer
                    const isUserCorrect = isSelected && isCorrectAnswer
                    const isUserWrong = isSelected && !isCorrectAnswer
                    const showCorrect = showResult && isCorrectAnswer

                    const getButtonClass = () => {
                        if (isUserCorrect) return "bg-green-500/20 border-green-400/50"
                        if (isUserWrong) return "bg-red-500/20 border-red-400/50"
                        if (showCorrect) return "bg-green-500/10 border-green-300/30"
                        if (isSelected) return "bg-blue-500/20 border-blue-400/50"
                        return "bg-black/20 border-white/20 hover:bg-black/30"
                    }

                    const getCircleClass = () => {
                        if (isUserCorrect) return "bg-green-500 text-white"
                        if (isUserWrong) return "bg-red-500 text-white"
                        if (showCorrect) return "bg-green-500 text-white"
                        if (isSelected) return "bg-blue-500 text-white"
                        return "bg-white/20 text-white"
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => handleAnswerSelect(index)}
                            disabled={showResult}
                            className={`flex items-center gap-3 sm:gap-4 ${paddingClass} rounded-xl backdrop-blur-md border transition-all text-left animate-fade-in-up ${getButtonClass()} disabled:opacity-70`}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div
                                className={`${circleSize} rounded-full flex items-center justify-center font-medium text-sm sm:text-base md:text-lg ${getCircleClass()}`}
                            >
                                {String.fromCharCode(65 + index)}
                            </div>
                            <span className={`flex-1 ${fontSize} font-medium text-white`}>{option}</span>
                            {isUserCorrect && <CheckCircle size={18} className="text-green-400 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
                            {isUserWrong && <XCircle size={18} className="text-red-400 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
                        </button>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
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
                
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out forwards;
                }
                
                .animate-fade-in-up {
                    animation: fadeInUp 0.5s ease-out forwards;
                    opacity: 0;
                }
                
                .animate-slide-in {
                    animation: slideIn 0.3s ease-out forwards;
                }
                
                .animate-pulse-custom {
                    animation: pulse 2s infinite;
                }
            `}</style>

            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 lg:p-6 bg-black text-white">
                <button onClick={onClose} className="p-2 sm:p-3 hover:bg-gray-800 rounded-full transition-colors">
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <div className="flex-1 mx-4">
                    <div className="text-center">
                        <h2 className="text-base sm:text-lg md:text-xl font-semibold truncate">{testTitle}</h2>
                        <p className="text-xs sm:text-sm text-gray-300">
                            {currentQuestionIndex + 1} of {questions.length}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                        {score}/{questions.length}
                    </span>
                    <button onClick={handleRestart} className="p-2 sm:p-3 hover:bg-gray-800 rounded-full transition-colors">
                        <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-800">
                <div className="h-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
                    style={{
                        backgroundImage: `url(/placeholder.svg?height=800&width=400)`,
                    }}
                />

                {/* Background Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70"></div>

                {/* Navigation Buttons */}
                <div className="absolute right-3 sm:right-4 md:right-6 top-1/2 transform -translate-y-1/2 z-10 flex flex-col space-y-3 sm:space-y-4">
                    <button
                        onClick={handlePrevious}
                        disabled={isFirstQuestion}
                        className="p-2 sm:p-3 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-md"
                    >
                        <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={!showResult || isLastQuestion}
                        className="p-2 sm:p-3 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-md"
                    >
                        <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* Question Content */}
                <div
                    className={`flex-1 flex flex-col justify-center p-4 sm:p-6 md:p-8 text-white relative z-5 ${animateIn ? "animate-fade-in" : ""}`}
                >
                    <div className="max-w-3xl mx-auto w-full">
                        {/* Difficulty Badge */}
                        <div className="flex justify-center mb-4 sm:mb-6">
                            <div
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-white font-medium text-sm sm:text-base ${getDifficultyColor(currentQuestion.difficulty)} animate-pulse-custom`}
                            >
                                {currentQuestion.difficulty}
                            </div>
                        </div>

                        {/* Question */}
                        <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
                            <div className="text-base sm:text-lg md:text-xl font-bold mb-2 text-white bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                Savol
                            </div>
                            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-relaxed">
                                {currentQuestion.question}
                            </h3>
                        </div>

                        {/* Options */}
                        <div className="mb-6 sm:mb-8">{renderQuestionContent()}</div>

                        {/* Result */}
                        {showResult && (
                            <div
                                className={`p-4 sm:p-6 rounded-xl mb-4 sm:mb-6 backdrop-blur-md border animate-slide-in ${isCorrect ? "bg-green-500/20 border-green-400/50" : "bg-red-500/20 border-red-400/50"
                                    }`}
                            >
                                <div className="flex items-center justify-center mb-3">
                                    {isCorrect ? (
                                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mr-2 animate-bounce" />
                                    ) : (
                                        <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 mr-2 animate-pulse" />
                                    )}
                                    <span
                                        className={`font-bold text-lg sm:text-xl md:text-2xl ${isCorrect ? "text-green-300" : "text-red-300"
                                            }`}
                                    >
                                        {isCorrect ? "Correct!" : "Incorrect"}
                                    </span>
                                </div>

                                {currentQuestion.explanation && (
                                    <p className="text-center text-gray-200 leading-relaxed text-sm sm:text-base">
                                        {currentQuestion.explanation}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Action Button */}
                        {!showResult ? (
                            <button
                                onClick={handleSubmit}
                                disabled={selectedAnswer === null}
                                className="w-full py-3 sm:py-4 px-6 bg-white text-black rounded-xl hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-bold text-base sm:text-lg md:text-xl flex items-center justify-center space-x-2"
                            >
                                <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                                <span>Submit Answer</span>
                            </button>
                        ) : isLastQuestion ? (
                            <div className="text-center">
                                <div className="mb-4 sm:mb-6">
                                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">Test Completed!</h3>
                                    <p className="text-lg sm:text-xl md:text-2xl">
                                        Final Score: {score}/{questions.length}
                                    </p>
                                    <p className="text-base sm:text-lg text-gray-300">
                                        {((score / questions.length) * 100).toFixed(1)}% Accuracy
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 sm:py-4 px-6 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors font-bold text-base sm:text-lg md:text-xl flex items-center justify-center space-x-2"
                                >
                                    <Home className="w-5 h-5 sm:w-6 sm:h-6" />
                                    <span>Back to Profile</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="w-full py-3 sm:py-4 px-6 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors font-bold text-base sm:text-lg md:text-xl"
                            >
                                Next Question
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
