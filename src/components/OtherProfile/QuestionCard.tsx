import React from 'react';
// import { Question } from '../types/user';
import { Check, MessageCircle, Calendar, BookOpen, X } from 'lucide-react';

export interface Question {
    id: number;
    question_text: string;
    description: string;
    difficulty_percentage: number;
    test_title: string;
    created_at: string;
    correct_count: number;
    wrong_count: number;
}



interface QuestionCardProps {
    question: Question;
    onQuestionClick: (question: Question) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, onQuestionClick }) => {
    const getDifficultyColor = (difficulty_percentage: number) => {
        if (difficulty_percentage < 33) return 'bg-green-100 text-green-800';
        if (difficulty_percentage < 66) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };


    return (
        <div 
            onClick={() => onQuestionClick(question)}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100"
        >
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{question.question_text}</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty_percentage)}`}>
                    {question.difficulty_percentage.toFixed(2)}%
                </div>
            </div>

            <p className="text-gray-600 mb-4 line-clamp-3">{question.description}</p>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {question.test_title}
                </div>
                <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {question.created_at.slice(0, 10)}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center text-red-500">
                        <X className="w-4 h-4 mr-1" />
                        <span className="text-sm">{question.correct_count}</span>
                    </div>
                    <div className="flex items-center text-green-800">
                        <Check className="w-4 h-4 mr-1" />
                        <span className="text-sm">{question.wrong_count}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};