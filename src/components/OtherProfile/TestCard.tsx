import React from 'react';
// import { Test } from '../types/user';
import { HelpCircle, Calendar } from 'lucide-react';

export interface Test {
    id: string;
    title: string;
    description: string;
    questionsCount: number;
    difficulty_percentage: number;
    category: {
        id: string;
        title: string;
    };
    created_at: string;
    score: number;
    total_questions: number;
    questions: TestQuestion[];
}

export interface TestQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty_percentage: number;
}

interface TestCardProps {
    test: Test;
    onTestClick: (test: Test) => void;
}

export const TestCard: React.FC<TestCardProps> = ({ test, onTestClick }) => {
    const getDifficultyColor = (difficulty_percentage: number) => {
        if (difficulty_percentage < 33) return 'bg-green-100 text-green-800';
        if (difficulty_percentage < 66) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    }



    return (
        <div
            onClick={() => onTestClick(test)}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100 cursor-pointer hover:border-indigo-300"
        >
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{test.title}</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(test.difficulty_percentage)}`}>
                    {test.difficulty_percentage.toFixed(2)}%
                </div>
            </div>

            <p className="text-gray-600 mb-4 line-clamp-2">{test.description}</p>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                    <HelpCircle className="w-4 h-4 mr-1" />
                    {test.total_questions} questions
                </div>
                <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {test.created_at.slice(0, 10)}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{test.category?.title ?? "Kategoriya yo‘q"}</span>
                {/* <div className="flex items-center">
                    <Award className="w-4 h-4 mr-1 text-indigo-600" />
                    <span className={`font-bold ${getScoreColor(test.score, test.maxScore)}`}>
                        {test.score}/{test.maxScore}
                    </span>
                </div> */}
            </div>
        </div>
    );
};