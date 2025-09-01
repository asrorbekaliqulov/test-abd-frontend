import React from 'react';
import { Clock, Timer } from 'lucide-react';

interface QuizTimerProps {
  questionTimeLeft: number;
  totalQuizTimeLeft: number;
  questionTimeLimit: number;
  isTimedMode: boolean;
}

const QuizTimer: React.FC<QuizTimerProps> = ({
  questionTimeLeft,
  totalQuizTimeLeft,
  questionTimeLimit,
  isTimedMode
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = (timeLeft: number, timeLimit: number) => {
    const percentage = (timeLeft / timeLimit) * 100;
    if (percentage > 60) return 'from-green-500 to-green-600';
    if (percentage > 30) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className="flex items-center space-x-6">
      {/* Question Timer */}
      {isTimedMode && (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Timer className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-600">Question</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-mono font-bold text-lg text-orange-600">
              {questionTimeLeft}s
            </span>
            <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
              <div 
                className={`h-1 rounded-full transition-all duration-1000 bg-gradient-to-r ${getProgressColor(questionTimeLeft, questionTimeLimit)}`}
                style={{ 
                  width: `${(questionTimeLeft / questionTimeLimit) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Total Quiz Timer */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium text-gray-600">Total</span>
        </div>
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-200">
          <span className="font-mono font-bold text-lg">
            {formatTime(totalQuizTimeLeft)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuizTimer;