import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Lightbulb } from 'lucide-react';

export interface TestQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface QuestionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    question: TestQuestion | null;
}

export const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
    isOpen,
    onClose,
    question
}) => {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);

    if (!isOpen || !question) return null;

    const handleAnswerSelect = (answerIndex: number) => {
        if (showResult) return;
        setSelectedAnswer(answerIndex);
    };

    const handleSubmit = () => {
        if (selectedAnswer !== null) {
            setShowResult(true);
        }
    };

    const handleClose = () => {
        setSelectedAnswer(null);
        setShowResult(false);
        onClose();
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'hard': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const isCorrect = selectedAnswer === question.correctAnswer;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center space-x-3">
                        <h2 className="text-xl font-bold text-gray-900">Question Details</h2>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 leading-relaxed">
                            {question.question}
                        </h3>

                        <div className="space-y-3">
                            {question.options.map((option, index) => {
                                let buttonClass = "w-full text-left p-4 rounded-lg border-2 transition-all ";

                                if (showResult) {
                                    if (index === question.correctAnswer) {
                                        buttonClass += "border-green-500 bg-green-50 text-green-800";
                                    } else if (index === selectedAnswer && selectedAnswer !== question.correctAnswer) {
                                        buttonClass += "border-red-500 bg-red-50 text-red-800";
                                    } else {
                                        buttonClass += "border-gray-200 bg-gray-50 text-gray-600";
                                    }
                                } else {
                                    if (selectedAnswer === index) {
                                        buttonClass += "border-indigo-500 bg-indigo-50 text-indigo-800";
                                    } else {
                                        buttonClass += "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50";
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
                                                <span className="font-bold mr-3 text-lg">
                                                    {String.fromCharCode(65 + index)}.
                                                </span>
                                                <span className="text-base">{option}</span>
                                            </div>
                                            {showResult && index === question.correctAnswer && (
                                                <CheckCircle className="w-6 h-6 text-green-600" />
                                            )}
                                            {showResult && index === selectedAnswer && selectedAnswer !== question.correctAnswer && (
                                                <XCircle className="w-6 h-6 text-red-600" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {showResult && (
                        <div className={`p-4 rounded-lg mb-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="flex items-center mb-2">
                                {isCorrect ? (
                                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-red-600 mr-2" />
                                )}
                                <span className={`font-bold text-lg ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                                    {isCorrect ? 'Correct!' : 'Incorrect'}
                                </span>
                            </div>
                            {!isCorrect && (
                                <p className="text-red-700 mb-2">
                                    The correct answer is: <strong>{String.fromCharCode(65 + question.correctAnswer)}. {question.options[question.correctAnswer]}</strong>
                                </p>
                            )}
                        </div>
                    )}

                    {question.explanation && showResult && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
                                <span className="font-semibold text-blue-800">Explanation</span>
                            </div>
                            <p className="text-blue-700 leading-relaxed">{question.explanation}</p>
                        </div>
                    )}
                </div>

                {!showResult && (
                    <div className="border-t p-6 bg-gray-50">
                        <button
                            onClick={handleSubmit}
                            disabled={selectedAnswer === null}
                            className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            Submit Answer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};