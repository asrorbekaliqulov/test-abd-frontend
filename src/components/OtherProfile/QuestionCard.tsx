import React from 'react';
// import { Question } from '../types/user';
import { Heart, MessageCircle, Calendar, Tag } from 'lucide-react';

export interface Question {
    id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    createdAt: string;
    likes: number;
    answers: number;
}



interface QuestionCardProps {
    question: Question;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'hard': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{question.title}</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                    {question.difficulty}
                </div>
            </div>

            <p className="text-gray-600 mb-4 line-clamp-3">{question.description}</p>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                    <Tag className="w-4 h-4 mr-1" />
                    {question.category}
                </div>
                <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {question.createdAt}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center text-red-500">
                        <Heart className="w-4 h-4 mr-1" />
                        <span className="text-sm">{question.likes}</span>
                    </div>
                    <div className="flex items-center text-blue-500">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        <span className="text-sm">{question.answers}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};