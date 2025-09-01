import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { liveQuizAPI } from '../utils/api';
import QuizSidebar from './components/QuizSidebar';
import QuizHeader from './components/QuizHeader';
import QuestionCard from './components/QuiestionCard';
import QuizResults from './components/QuizResults';
import { LiveQuiz, QuizAnswer } from '../types/quiz';

const RealTimeQuizPage: React.FC = () => {
  const [liveQuiz, setLiveQuiz] = useState<LiveQuiz | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(0);
  const [totalQuizTimeLeft, setTotalQuizTimeLeft] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const quizTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // WebSocket connection
  const { isConnected, sendMessage, lastMessage } = useWebSocket(
    liveQuiz ? `ws://backend.testabd.uz/ws/quiz/${liveQuiz.id}/` : null
  );

  // Load quiz data on component mount
  useEffect(() => {
    loadQuizData();
    loadCurrentUser();
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage]);

  // Question timer
  useEffect(() => {
    if (liveQuiz?.mode === 'timed' && questionTimeLeft > 0 && !isAnswered) {
      questionTimerRef.current = setInterval(() => {
        setQuestionTimeLeft(prev => {
          if (prev <= 1) {
            handleQuestionTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
    };
  }, [questionTimeLeft, liveQuiz?.mode, isAnswered]);

  // Total quiz timer
  useEffect(() => {
    if (totalQuizTimeLeft > 0 && liveQuiz?.is_active) {
      quizTimerRef.current = setInterval(() => {
        setTotalQuizTimeLeft(prev => {
          if (prev <= 1) {
            handleQuizEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (quizTimerRef.current) {
        clearInterval(quizTimerRef.current);
      }
    };
  }, [totalQuizTimeLeft, liveQuiz?.is_active]);

  // Touch handlers for mobile sidebar
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeDistance = touchEndX.current - touchStartX.current;
    const minSwipeDistance = 50;

    if (swipeDistance > minSwipeDistance && !isSidebarOpen) {
      setIsSidebarOpen(true);
    } else if (swipeDistance < -minSwipeDistance && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  const loadQuizData = async () => {
    try {
      setLoading(true);
      // Replace with actual quiz ID from URL params or props
      const quizId = 1; // This should come from route params
      const response = await liveQuizAPI.getLiveQuiz(quizId);
      const quizData = response.data;
      
      setLiveQuiz(quizData);
      
      // Set initial timers
      if (quizData.questions.length > 0) {
        const currentQuestion = quizData.questions[quizData.current_question_index];
        setQuestionTimeLeft(currentQuestion.time_limit || quizData.time_per_question || 30);
      }
      
      // Calculate total quiz time remaining
      if (quizData.end_time) {
        const endTime = new Date(quizData.end_time).getTime();
        const now = new Date().getTime();
        const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
        setTotalQuizTimeLeft(timeLeft);
      }
      
    } catch (error) {
      console.error('Error loading quiz data:', error);
      setError('Failed to load quiz data');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      // This should get current user from your auth context or API
      // For now, using a placeholder
      setCurrentUser({ id: 1, username: 'Current User' });
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'quiz_update':
        setLiveQuiz(data.quiz);
        break;
      case 'question_change':
        setSelectedAnswers([]);
        setIsAnswered(false);
        setQuestionTimeLeft(data.timeLimit);
        break;
      case 'participant_answer':
        updateParticipantAnswer(data.userId, data.isAnswered);
        break;
      case 'quiz_ended':
        handleQuizEnd();
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const updateParticipantAnswer = (userId: number, answered: boolean) => {
    setLiveQuiz(prev => {
      if (!prev) return null;
      
      const updatedParticipants = prev.participants.map(p => 
        p.user.id === userId 
          ? { ...p, is_answered: answered }
          : p
      );
      
      return { ...prev, participants: updatedParticipants };
    });
  };

  const handleAnswerSelect = async (answerId: number) => {
    if (!liveQuiz || !currentUser || isAnswered) return;
    
    const currentQuestion = liveQuiz.questions[liveQuiz.current_question_index];
    const isMultipleChoice = currentQuestion.question_type === 'multiple';
    
    let newSelectedAnswers: number[];
    
    if (isMultipleChoice) {
      // Toggle answer for multiple choice
      newSelectedAnswers = selectedAnswers.includes(answerId)
        ? selectedAnswers.filter(id => id !== answerId)
        : [...selectedAnswers, answerId];
    } else {
      // Single choice
      newSelectedAnswers = [answerId];
      setIsAnswered(true);
      
      // Submit answer immediately for single choice
      await submitAnswer([answerId]);
    }
    
    setSelectedAnswers(newSelectedAnswers);
  };

  const submitAnswer = async (answers: number[]) => {
    if (!liveQuiz || !currentUser) return;
    
    try {
      const answerData: QuizAnswer = {
        question_id: liveQuiz.questions[liveQuiz.current_question_index].id,
        selected_answer_ids: answers,
        duration: (liveQuiz.questions[liveQuiz.current_question_index].time_limit || 30) - questionTimeLeft
      };
      
      await liveQuizAPI.submitLiveQuizAnswer(liveQuiz.id, answerData);
      
      // Send via WebSocket
      sendMessage({
        type: 'submit_answer',
        quiz_id: liveQuiz.id,
        question_id: answerData.question_id,
        selected_answer_ids: answers,
        user_id: currentUser.id
      });
      
      // Update local state
      updateParticipantAnswer(currentUser.id, true);
      
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleQuestionTimeUp = () => {
    if (liveQuiz?.mode === 'timed') {
      goToNextQuestion();
    }
  };

  const goToNextQuestion = () => {
    if (!liveQuiz) return;
    
    if (liveQuiz.current_question_index < liveQuiz.questions.length - 1) {
      const nextIndex = liveQuiz.current_question_index + 1;
      const nextQuestion = liveQuiz.questions[nextIndex];
      
      setLiveQuiz(prev => prev ? {
        ...prev,
        current_question_index: nextIndex,
        participants: prev.participants.map(p => ({ ...p, is_answered: false }))
      } : null);
      
      setSelectedAnswers([]);
      setIsAnswered(false);
      setQuestionTimeLeft(nextQuestion.time_limit || liveQuiz.time_per_question || 30);
      
      // Send next question via WebSocket
      sendMessage({
        type: 'next_question',
        quiz_id: liveQuiz.id,
        question_index: nextIndex
      });
    } else {
      handleQuizEnd();
    }
  };

  const handleQuizEnd = () => {
    setLiveQuiz(prev => prev ? { ...prev, is_active: false } : null);
  };

  const handleSubmitMultipleChoice = async () => {
    if (selectedAnswers.length === 0) return;
    setIsAnswered(true);
    await submitAnswer(selectedAnswers);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Quiz...</h2>
          <p className="text-gray-600">Please wait while we prepare your quiz</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Quiz</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadQuizData}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!liveQuiz) {
    return null;
  }

  const currentQuestion = liveQuiz.questions[liveQuiz.current_question_index];
  const isLastQuestion = liveQuiz.current_question_index === liveQuiz.questions.length - 1;
  const isMultipleChoice = currentQuestion?.question_type === 'multiple';

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sidebar */}
      <QuizSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpen={() => setIsSidebarOpen(true)}
        participants={liveQuiz.participants}
        isConnected={isConnected}
        currentUserId={currentUser?.id}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <QuizHeader
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          currentQuestionIndex={liveQuiz.current_question_index}
          totalQuestions={liveQuiz.questions.length}
          questionTimeLeft={questionTimeLeft}
          totalQuizTimeLeft={totalQuizTimeLeft}
          questionTimeLimit={currentQuestion?.time_limit || liveQuiz.time_per_question || 30}
          isTimedMode={liveQuiz.mode === 'timed'}
          quizTitle={liveQuiz.test.title}
        />

        {/* Quiz Content */}
        <div className="flex-1 p-6">
          {liveQuiz.is_active ? (
            <div className="max-w-4xl mx-auto">
              {/* Question Card */}
              <QuestionCard
                question={currentQuestion}
                selectedAnswers={selectedAnswers}
                onAnswerSelect={handleAnswerSelect}
                isAnswered={isAnswered}
                isTimedMode={liveQuiz.mode === 'timed'}
                timeLeft={questionTimeLeft}
              />

              {/* Submit Button for Multiple Choice */}
              {isMultipleChoice && selectedAnswers.length > 0 && !isAnswered && (
                <div className="text-center mt-6">
                  <button
                    onClick={handleSubmitMultipleChoice}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Submit Answer{selectedAnswers.length > 1 ? 's' : ''}
                  </button>
                </div>
              )}

              {/* Next Question Button (Free Mode Only) */}
              {liveQuiz.mode === 'free' && isAnswered && (
                <div className="text-center mt-6">
                  <button
                    onClick={goToNextQuestion}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Quiz Results */
            <QuizResults
              participants={liveQuiz.participants}
              currentUserId={currentUser?.id}
              onRestart={() => window.location.reload()}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeQuizPage;