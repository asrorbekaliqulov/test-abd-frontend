import React from 'react';
import {BookOpen, Clock4} from 'lucide-react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

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

export const QuestionCard: React.FC<QuestionCardProps> = ({question, onQuestionClick}) => {
    const getDifficultyColor = (difficulty_percentage: number) => {
        if (difficulty_percentage < 33) return 'bg-green-100 text-green-800';
        if (difficulty_percentage < 66) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };


    return (
        <div
            onClick={() => onQuestionClick(question)}
            className={`rounded-lg shadow-md hover:shadow-lg transition-shadow p-3`}
            style={{background: 'rgba(0, 0, 0, 0.2'}}
        >
            <div className="flex flex-col gap-1 mb-6">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-300 line-clamp-2">{question.question_text}</h3>
                    <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty_percentage)}`}>
                        {question.difficulty_percentage.toFixed(2)}%
                    </div>
                </div>
                <div className="flex items-center text-gray-400">
                    <BookOpen className="w-4 h-4 mr-1"/>
                    {question.test_title}
                </div>
            </div>

            <p className="text-gray-600 mb-4 line-clamp-3">{question.description}</p>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex items-center text-red-500 bg-red-200 px-2 py-[1.2px] rounded-full">
                        <CancelOutlinedIcon className="mr-1" style={{ fontSize: '18px' }}/>
                        <span className="text-sm">{question.correct_count}</span>
                    </div>
                    <div className="flex items-center text-green-800 bg-green-200 px-2 py-[1.2px] rounded-full">
                        <CheckCircleOutlineIcon className="mr-1" style={{ fontSize: '18px' }}/>
                        <span className="text-sm">{question.wrong_count}</span>
                    </div>
                </div>
            </div>
            <div
                className="flex items-center gap-4 text-sm text-gray-500 mt-2 border border-gray-700 p-1 rounded-full pl-3">
                <div className="flex items-center">
                    <Clock4 className="w-4 h-4 mr-1"/>
                    {question.created_at.slice(0, 10)}
                </div>
            </div>
        </div>
    );
};