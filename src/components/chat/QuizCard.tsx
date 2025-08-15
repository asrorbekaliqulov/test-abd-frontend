import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useChat } from '../../contexts/ChatContext';
import { Quiz, QuizQuestion } from '../../types/chat';
import { apiRequest } from '../../lib/queryClient';
import { Brain, Clock, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';

interface QuizCardProps {
  quiz: Quiz;
  messageId: string;
  onSubmitAnswer: (answers: Record<string, any>) => void;
}

export default function QuizCard({ quiz, messageId, onSubmitAnswer }: QuizCardProps) {
  const { currentUser, currentRoom } = useChat();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(45); // 45 seconds per question
  const [isSubmitted, setIsSubmitted] = useState(false);
  const queryClient = useQueryClient();

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleSubmitAnswer();
    }
  }, [timeLeft, isSubmitted]);

  // Submit quiz attempt mutation
  const submitAttemptMutation = useMutation({
    mutationFn: async (attemptData: any) => {
      const response = await apiRequest('POST', '/api/quiz-attempts', attemptData);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      queryClient.invalidateQueries({
        queryKey: ['/api/chatrooms', currentRoom?.id, 'messages']
      });
    }
  });

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitAnswer = () => {
    if (!currentUser || isSubmitted) return;

    const finalAnswers = {
      ...answers,
      [currentQuestion.id]: answers[currentQuestion.id] || null
    };

    if (isLastQuestion) {
      // Submit complete quiz
      submitAttemptMutation.mutate({
        quizId: quiz.id,
        userId: currentUser.id,
        messageId,
        answers: finalAnswers
      });
      onSubmitAnswer(finalAnswers);
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(45);
    }
  };

  const renderQuestionInput = () => {
    const currentAnswer = answers[currentQuestion.id];

    switch (currentQuestion.type) {
      case 'single':
        return (
          <RadioGroup
            value={currentAnswer?.toString() || ''}
            onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value))}
            className="space-y-3"
          >
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label 
                  htmlFor={`option-${index}`}
                  className="flex-1 p-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-lg transition-colors border border-white/20 cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'multiple':
        return (
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`option-${index}`}
                  checked={currentAnswer?.includes(index) || false}
                  onCheckedChange={(checked) => {
                    const newAnswer = currentAnswer ? [...currentAnswer] : [];
                    if (checked) {
                      newAnswer.push(index);
                    } else {
                      const pos = newAnswer.indexOf(index);
                      if (pos > -1) newAnswer.splice(pos, 1);
                    }
                    handleAnswerChange(currentQuestion.id, newAnswer);
                  }}
                />
                <Label 
                  htmlFor={`option-${index}`}
                  className="flex-1 p-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-lg transition-colors border border-white/20 cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <Input
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            placeholder="Type your answer..."
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/60"
          />
        );

      default:
        return null;
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-xl max-w-md">
        <div className="flex items-center space-x-2 mb-3">
          <Brain className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-green-800 dark:text-green-200">Quiz Submitted!</span>
        </div>
        <p className="text-sm text-green-700 dark:text-green-300">
          Your answers have been submitted. Results will be available soon.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white p-6 rounded-xl shadow-lg max-w-md mb-3 transform hover:scale-[1.02] transition-transform">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5" />
          <span className="font-semibold">{quiz.isLive ? 'Live Quiz' : 'Quiz'}</span>
        </div>
        <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
          Question {currentQuestionIndex + 1}/{quiz.questions.length}
        </div>
      </div>
      
      <h3 className="text-lg font-bold mb-4">{currentQuestion.question}</h3>
      
      <div className="mb-4">
        {renderQuestionInput()}
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} left</span>
          </span>
          <span className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>8/12 answered</span>
          </span>
        </div>
        <Button
          onClick={handleSubmitAnswer}
          disabled={!answers[currentQuestion.id] || submitAttemptMutation.isPending}
          className="bg-white text-purple-600 hover:bg-gray-100 font-medium"
        >
          {isLastQuestion ? 'Submit Quiz' : 'Next Question'}
        </Button>
      </div>
    </div>
  );
}
