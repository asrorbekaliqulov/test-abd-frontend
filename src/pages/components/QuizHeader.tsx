import React from 'react';
import { ChevronRight } from 'lucide-react';
import QuizTimer from './QuizTimer';

interface QuizHeaderProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  currentQuestionIndex: number;
  totalQuestions: number;
  questionTimeLeft: number;
  totalQuizTimeLeft: number;
  questionTimeLimit: number;
  isTimedMode: boolean;
  quizTitle?: string;
}

const QuizHeader: React.FC<QuizHeaderProps> = ({
  isSidebarOpen,
  onSidebarToggle,
  currentQuestionIndex,
  totalQuestions,
  questionTimeLeft,
  totalQuizTimeLeft,
  questionTimeLimit,
  isTimedMode,
  quizTitle
}) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {!isSidebarOpen && (
            <button
              onClick={onSidebarToggle}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden lg:block"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {quizTitle || 'Live Quiz'}
            </h1>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Timers */}
        <QuizTimer
          questionTimeLeft={questionTimeLeft}
          totalQuizTimeLeft={totalQuizTimeLeft}
          questionTimeLimit={questionTimeLimit}
          isTimedMode={isTimedMode}
        />
      </div>
    </div>
  );
};

export default QuizHeader;