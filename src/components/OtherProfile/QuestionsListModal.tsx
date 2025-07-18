import React from 'react';
import { X, HelpCircle, CheckCircle, AlertCircle } from 'lucide-react';

export interface TestQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface QuestionsListModalProps {
    isOpen: boolean;
    onClose: () => void;
    questions: TestQuestion[];
    testTitle: string;
    onQuestionClick: (question: TestQuestion) => void;
}

export const QuestionsListModal: React.FC<QuestionsListModalProps> = ({
    isOpen,
    onClose,
    questions,
    testTitle,
    onQuestionClick
}) => {
    if (!isOpen) return null;

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'hard': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getDifficultyIcon = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return <CheckCircle className="w-4 h-4" />;
            case 'medium': return <AlertCircle className="w-4 h-4" />;
            case 'hard': return <HelpCircle className="w-4 h-4" />;
            default: return <HelpCircle className="w-4 h-4" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Test Questions</h2>
                        <p className="text-gray-600 mt-1">{testTitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {questions.map((question, index) => (
                            <div
                                key={question.id}
                                onClick={() => onQuestionClick(question)}
                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                        <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-2 py-1 rounded">
                                            Q{index + 1}
                                        </span>
                                        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                                            {getDifficultyIcon(question.difficulty)}
                                            <span className="ml-1">{question.difficulty}</span>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="font-medium text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                    {question.question}
                                </h3>

                                <div className="space-y-2">
                                    {question.options.map((option, optionIndex) => (
                                        <div
                                            key={optionIndex}
                                            className={`text-sm p-2 rounded border ${optionIndex === question.correctAnswer
                                                    ? 'bg-green-50 border-green-200 text-green-800'
                                                    : 'bg-gray-50 border-gray-200 text-gray-700'
                                                }`}
                                        >
                                            <span className="font-medium mr-2">
                                                {String.fromCharCode(65 + optionIndex)}.
                                            </span>
                                            {option}
                                        </div>
                                    ))}
                                </div>

                                {question.explanation && (
                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                                        <strong>Explanation:</strong> {question.explanation}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};