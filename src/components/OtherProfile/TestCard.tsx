import React from 'react';
// import { Test } from '../types/user';
import {HelpCircle, Clock4} from 'lucide-react';

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

export const TestCard: React.FC<TestCardProps> = ({test, onTestClick}) => {
    const getDifficultyColor = (difficulty_percentage: number) => {
        if (difficulty_percentage < 33) return 'bg-green-100 text-green-800';
        if (difficulty_percentage < 66) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    }


    return (
        <div
            onClick={() => onTestClick(test)}
            className="rounded-lg shadow-md hover:shadow-lg transition-shadow p-3 cursor-pointer hover:border-indigo-300 flex flex-col justify-between"
            style={{backgroundColor: 'rgba(0, 0, 0, 0.2)'}}
        >
            <div className={"flex flex-col items-start gap-1 mb-4"}>
                <div className="flex justify-between items-start w-full">
                    <h3 className="text-lg font-semibold text-gray-300 line-clamp-2">{test.title}</h3>
                    <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(test.difficulty_percentage)}`}>
                        {test.difficulty_percentage.toFixed(2)}%
                    </div>
                </div>
                <p className="text-gray-600 line-clamp-2">{test.description}</p>
            </div>

            <div className="flex items-start flex-col gap-2 text-sm text-gray-500">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{test.category?.title ?? <span className={"text-red-900"}>Kategoriya yo'q</span>}</span>
                </div>
                <div className="flex flex-row items-center border border-gray-700 px-2 py-0.5 rounded-full w-full">
                    <HelpCircle className="w-4 h-4 mr-1"/>
                    {test.total_questions} questions
                </div>
                <div className="flex flex-row items-center border border-gray-700 px-2 py-0.5 rounded-full w-full">
                    <Clock4 className="w-4 h-4 mr-1"/>
                    {test.created_at.slice(0, 10)}
                </div>
            </div>
        </div>
    );
};