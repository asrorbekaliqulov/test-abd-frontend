import React from 'react';
import { X, Play, Eye, BookOpen, Clock, Award, Users } from 'lucide-react';

export interface TestQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface Test {
    id: string;
    title: string;
    description: string;
    questionsCount: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    completedAt: string;
    score: number;
    maxScore: number;
    questions: TestQuestion[];
}

interface TestModalProps {
    isOpen: boolean;
    onClose: () => void;
    test: Test | null;
    onViewQuestions: () => void;
    onStartTest: () => void;
}

export const TestModal: React.FC<TestModalProps> = ({
    isOpen,
    onClose,
    test,
    onViewQuestions,
    onStartTest
}) => {
    if (!isOpen || !test) return null;

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'hard': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getScoreColor = (score: number, maxScore: number) => {
        const percentage = (score / maxScore) * 100;
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const scorePercentage = (test.score / test.maxScore) * 100;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
                    <h2 className="text-2xl font-bold text-gray-900">{test.title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
                    {/* Test Info */}
                    <div className="mb-6">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(test.difficulty)}`}>
                                {test.difficulty}
                            </div>
                            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                {test.category}
                            </span>
                            <span className="text-sm text-gray-600">
                                Completed {test.completedAt}
                            </span>
                        </div>

                        <p className="text-gray-700 leading-relaxed mb-6">{test.description}</p>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg text-center">
                                <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-blue-600">{test.questionsCount}</div>
                                <div className="text-sm text-blue-700">Questions</div>
                            </div>

                            <div className="bg-green-50 p-4 rounded-lg text-center">
                                <Award className="w-6 h-6 text-green-600 mx-auto mb-2" />
                                <div className={`text-2xl font-bold ${getScoreColor(test.score, test.maxScore)}`}>
                                    {test.score}/{test.maxScore}
                                </div>
                                <div className="text-sm text-green-700">Score</div>
                            </div>

                            <div className="bg-purple-50 p-4 rounded-lg text-center">
                                <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-purple-600">{scorePercentage.toFixed(0)}%</div>
                                <div className="text-sm text-purple-700">Accuracy</div>
                            </div>

                            <div className="bg-orange-50 p-4 rounded-lg text-center">
                                <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-orange-600">~{test.questionsCount * 2}</div>
                                <div className="text-sm text-orange-700">Minutes</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">Overall Performance</span>
                                <span className="text-sm font-bold text-indigo-600">{scorePercentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${scorePercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t p-6 bg-gray-50">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onViewQuestions}
                            className="flex-1 flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            <Eye className="w-5 h-5 mr-2" />
                            View Questions
                        </button>
                        <button
                            onClick={onStartTest}
                            className="flex-1 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                            <Play className="w-5 h-5 mr-2" />
                            Start Test
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};