import React, { useState } from 'react';
import { X, ChevronUp, ChevronDown, CheckCircle, XCircle, RotateCcw, Home } from 'lucide-react';

export interface TestQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface TikTokStyleTestProps {
    isOpen: boolean;
    onClose: () => void;
    questions: TestQuestion[];
    testTitle: string;
}

export const TikTokStyleTest: React.FC<TikTokStyleTestProps> = ({
    isOpen,
    onClose,
    questions,
    testTitle
}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>(new Array(questions.length).fill(false));

    if (!isOpen || questions.length === 0) return null;

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const isFirstQuestion = currentQuestionIndex === 0;

    const handleAnswerSelect = (answerIndex: number) => {
        if (showResult) return;
        setSelectedAnswer(answerIndex);
    };

    const handleSubmit = () => {
        if (selectedAnswer === null) return;

        setShowResult(true);

        if (selectedAnswer === currentQuestion.correctAnswer) {
            setScore(prev => prev + 1);
        }

        const newAnsweredQuestions = [...answeredQuestions];
        newAnsweredQuestions[currentQuestionIndex] = true;
        setAnsweredQuestions(newAnsweredQuestions);
    };

    const handleNext = () => {
        if (isLastQuestion) {
            // Test completed
            return;
        }

        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
    };

    const handlePrevious = () => {
        if (isFirstQuestion) return;

        setCurrentQuestionIndex(prev => prev - 1);
        setSelectedAnswer(null);
        setShowResult(false);
    };

    const handleRestart = () => {
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setScore(0);
        setAnsweredQuestions(new Array(questions.length).fill(false));
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return 'bg-green-500';
            case 'medium': return 'bg-yellow-500';
            case 'hard': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black text-white">
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex-1 mx-4">
                    <div className="text-center">
                        <h2 className="text-lg font-semibold truncate">{testTitle}</h2>
                        <p className="text-sm text-gray-300">
                            {currentQuestionIndex + 1} of {questions.length}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{score}/{questions.length}</span>
                    <button
                        onClick={handleRestart}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-800">
                <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
                {/* Navigation Buttons */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 flex flex-col space-y-4">
                    <button
                        onClick={handlePrevious}
                        disabled={isFirstQuestion}
                        className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronUp className="w-6 h-6" />
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={!showResult || isLastQuestion}
                        className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronDown className="w-6 h-6" />
                    </button>
                </div>

                {/* Question Content */}
                <div className="flex-1 flex flex-col justify-center p-6 text-white">
                    <div className="max-w-2xl mx-auto w-full">
                        {/* Difficulty Badge */}
                        <div className="flex justify-center mb-6">
                            <div className={`px-4 py-2 rounded-full text-white font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
                                {currentQuestion.difficulty}
                            </div>
                        </div>

                        {/* Question */}
                        <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 leading-relaxed">
                            {currentQuestion.question}
                        </h3>

                        {/* Options */}
                        <div className="space-y-4 mb-8">
                            {currentQuestion.options.map((option, index) => {
                                let buttonClass = "w-full p-4 rounded-xl border-2 transition-all text-left ";

                                if (showResult) {
                                    if (index === currentQuestion.correctAnswer) {
                                        buttonClass += "border-green-400 bg-green-500 bg-opacity-20 text-green-300";
                                    } else if (index === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer) {
                                        buttonClass += "border-red-400 bg-red-500 bg-opacity-20 text-red-300";
                                    } else {
                                        buttonClass += "border-gray-600 bg-gray-800 bg-opacity-50 text-gray-400";
                                    }
                                } else {
                                    if (selectedAnswer === index) {
                                        buttonClass += "border-white bg-white bg-opacity-20 text-white";
                                    } else {
                                        buttonClass += "border-gray-600 bg-black bg-opacity-30 text-white hover:border-white hover:bg-opacity-40";
                                    }
                                }

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleAnswerSelect(index)}
                                        className={buttonClass}
                                        disabled={showResult}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <span className="font-bold mr-3 text-xl">
                                                    {String.fromCharCode(65 + index)}.
                                                </span>
                                                <span className="text-lg">{option}</span>
                                            </div>
                                            {showResult && index === currentQuestion.correctAnswer && (
                                                <CheckCircle className="w-6 h-6 text-green-400" />
                                            )}
                                            {showResult && index === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer && (
                                                <XCircle className="w-6 h-6 text-red-400" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Result */}
                        {showResult && (
                            <div className={`p-4 rounded-xl mb-6 ${isCorrect ? 'bg-green-500 bg-opacity-20 border border-green-400' : 'bg-red-500 bg-opacity-20 border border-red-400'}`}>
                                <div className="flex items-center justify-center mb-2">
                                    {isCorrect ? (
                                        <CheckCircle className="w-8 h-8 text-green-400 mr-2" />
                                    ) : (
                                        <XCircle className="w-8 h-8 text-red-400 mr-2" />
                                    )}
                                    <span className={`font-bold text-xl ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                                        {isCorrect ? 'Correct!' : 'Incorrect'}
                                    </span>
                                </div>

                                {currentQuestion.explanation && (
                                    <p className="text-center text-gray-200 leading-relaxed">
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
                                className="w-full py-4 px-6 bg-white text-black rounded-xl hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-bold text-lg"
                            >
                                Submit Answer
                            </button>
                        ) : isLastQuestion ? (
                            <div className="text-center">
                                <div className="mb-4">
                                    <h3 className="text-2xl font-bold mb-2">Test Completed!</h3>
                                    <p className="text-xl">Final Score: {score}/{questions.length}</p>
                                    <p className="text-lg text-gray-300">
                                        {((score / questions.length) * 100).toFixed(1)}% Accuracy
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 px-6 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors font-bold text-lg flex items-center justify-center"
                                >
                                    <Home className="w-6 h-6 mr-2" />
                                    Back to Profile
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="w-full py-4 px-6 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors font-bold text-lg"
                            >
                                Next Question
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};