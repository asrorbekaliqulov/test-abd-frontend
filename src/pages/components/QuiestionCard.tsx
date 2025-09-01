import React from 'react';
import { Question } from '../../types/quiz';

interface QuestionCardProps {
  question: Question;
  selectedAnswers: number[];
  onAnswerSelect: (answerId: number) => void;
  isAnswered: boolean;
  isTimedMode: boolean;
  timeLeft: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedAnswers,
  onAnswerSelect,
  isAnswered,
  isTimedMode,
  timeLeft
}) => {
  const isMultipleChoice = question.question_type === 'multiple';
  const isTextQuestion = question.question_type === 'text';

  const handleAnswerClick = (answerId: number) => {
    if (isAnswered || timeLeft === 0) return;
    onAnswerSelect(answerId);
  };

  const isSelected = (answerId: number) => selectedAnswers.includes(answerId);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      {/* Question Text */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 leading-relaxed">
          {question.text}
        </h2>
        {isMultipleChoice && (
          <p className="text-sm text-gray-500 mt-2">
            Select all correct answers
          </p>
        )}
      </div>

      {/* Answer Options */}
      {!isTextQuestion ? (
        <div className="grid gap-4">
          {question.options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => handleAnswerClick(option.id)}
              disabled={isAnswered || timeLeft === 0}
              className={`
                p-5 text-left rounded-xl border-2 transition-all duration-200 font-medium group
                ${isSelected(option.id)
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md'
                  : isAnswered || timeLeft === 0
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md cursor-pointer'
                }
              `}
            >
              <div className="flex items-center space-x-4">
                <div className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-200
                  ${isSelected(option.id)
                    ? 'border-indigo-500 bg-indigo-500 text-white'
                    : 'border-gray-300 text-gray-500 group-hover:border-indigo-400'
                  }
                `}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="flex-1">{option.text}</span>
                {isMultipleChoice && isSelected(option.id) && (
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Text Answer Input */
        <div className="space-y-4">
          <textarea
            placeholder="Type your answer here..."
            disabled={isAnswered || timeLeft === 0}
            className={`
              w-full p-4 border-2 rounded-xl resize-none h-32 transition-all duration-200
              ${isAnswered || timeLeft === 0
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
              }
            `}
          />
        </div>
      )}

      {/* Answer Status */}
      {isAnswered && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-green-700 font-medium">
              Answer submitted! Waiting for other participants...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;