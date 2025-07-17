import React, { useState, useEffect } from 'react';
import {  
  Share, 
  Bookmark, 
  CheckCircle, 
  Sun,
  Moon,
  Bell,
  Plus
} from 'lucide-react';
// import { useAuth } from '../contexts/AuthContext';
import { quizAPI } from '../utils/api';


interface HomePageProps {
  theme: string;
  toggleTheme: () => void;
  onShowStories?: (index: number) => void;
}

const HomePage: React.FC<HomePageProps> = ({ theme, toggleTheme, onShowStories }) => {
  // const { user } = useAuth();
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, string>>(new Map());
  const [savedQuizzes, setSavedQuizzes] = useState<Set<number>>(new Set());
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const response = await quizAPI.getQuestions();
      setTests(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (quizId: number, option: string, correctAnswer: string) => {
    setSelectedAnswers(prev => new Map(prev.set(quizId, option)));
    
    // Show result after a short delay
    setTimeout(() => {
      if (option === correctAnswer) {
        // Success animation could be added here
        console.log('Correct answer!');
      } else {
        console.log('Incorrect answer');
      }
    }, 500);
  };

  const toggleSave = (quizId: number) => {
    setSavedQuizzes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(quizId)) {
        newSet.delete(quizId);
      } else {
        newSet.add(quizId);
      }
      return newSet;
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-600';
      case 'medium': return 'bg-yellow-100 text-yellow-600';
      case 'hard': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getOptionStatus = (quizId: number, option: string, correctAnswer: string) => {
    const selectedAnswer = selectedAnswers.get(quizId);
    if (!selectedAnswer) return '';
    
    if (option === correctAnswer) return 'correct';
    if (option === selectedAnswer && option !== correctAnswer) return 'incorrect';
    if (option === selectedAnswer) return 'selected';
    return '';
  };

  // Enhanced stories with follow status and animations
  const enhancedStories = stories.map(story => ({
    ...story,
    hasNewContent: Math.random() > 0.5, // Mock new content
    isFollowing: story.username !== 'you' && Math.random() > 0.3
  }));

  return (
    <div className="min-h-screen bg-theme-secondary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-theme-primary backdrop-blur-lg border-b border-theme-primary z-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="TestAbd" className="h-8 w-8" />
              <h1 className="text-xl font-bold text-accent-primary">TestAbd</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-theme-tertiary rounded-lg transition-theme-normal"
              >
                {theme === 'light' ? (
                  <Moon size={20} className="text-theme-secondary" />
                ) : (
                  <Sun size={20} className="text-theme-secondary" />
                )}
              </button>
              
              <button className="relative p-2 hover:bg-theme-tertiary rounded-lg transition-theme-normal">
                <Bell size={20} className="text-theme-secondary" />
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              </button>
              
              <button className="p-2 hover:bg-theme-tertiary rounded-lg transition-theme-normal">
                <Plus size={20} className="text-theme-secondary" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-20 pb-20">
        {/* Stories Section */}
        <section className="mb-6">
          <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
            {enhancedStories.map((story, index) => (
              <div 
                key={story.id} 
                className="flex flex-col items-center space-y-2 min-w-0 cursor-pointer"
                onClick={() => story.hasStory && onShowStories?.(index)}
              >
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-semibold text-theme-secondary ${
                    story.hasNewContent && story.isFollowing
                      ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-pulse'
                      : 'bg-gradient-to-br from-theme-tertiary to-border-secondary'
                  }`}>
                    {story.username.charAt(0).toUpperCase()}
                  </div>
                  {story.hasNewContent && story.isFollowing && (
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-spin"></div>
                  )}
                </div>
                <span className="text-xs text-theme-secondary text-center max-w-16 truncate">
                  {story.username}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Quiz Feed */}
        <section className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
            </div>
          ) : tests.length > 0 ? (
            tests.slice(0, 10).map((test) => (
              <article key={test.id} className="bg-theme-primary rounded-2xl p-6 shadow-theme-md border border-theme-primary">
                {/* Test Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-theme-tertiary to-border-secondary flex items-center justify-center font-semibold text-theme-secondary">
                      {test.user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-theme-primary text-sm">
                          {test.user?.username || 'Unknown'}
                        </span>
                        {test.user?.is_badged && (
                          <CheckCircle size={16} className="text-blue-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-theme-secondary">
                        <span>{test.category?.name || 'General'}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(test.calculated_difficulty || 'easy')}`}>
                    {test.calculated_difficulty || 'easy'}
                  </div>
                </div>

                {/* Test Content */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-theme-primary mb-2">
                    {test.title}
                  </h2>
                  <p className="text-theme-secondary text-sm mb-4">
                    {test.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-theme-secondary">
                    <span>{test.questions?.length || 0} questions</span>
                    <span>{test.total_attempts || 0} attempts</span>
                    <span>{Math.round(test.difficulty_percentage || 0)}% difficulty</span>
                  </div>
                </div>

                {/* Test Stats */}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-6">
                    <div className="flex items-center space-x-2 text-green-600">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <span className="font-semibold text-sm">{test.correct_attempts || 0}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-red-600">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✗</span>
                      </div>
                      <span className="font-semibold text-sm">{test.wrong_attempts || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-theme-tertiary rounded-full transition-theme-normal">
                      <Share size={18} className="text-theme-secondary" />
                    </button>
                    <button 
                      onClick={() => toggleSave(test.id)}
                      className="p-2 hover:bg-theme-tertiary rounded-full transition-theme-normal"
                    >
                      <Bookmark 
                        size={18} 
                        className={savedQuizzes.has(test.id) ? 'text-yellow-500 fill-current' : 'text-theme-secondary'} 
                      />
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            quizData.map((quiz) => (
            <article key={quiz.id} className="bg-theme-primary rounded-2xl p-6 shadow-theme-md border border-theme-primary">
              {/* Quiz Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-theme-tertiary to-border-secondary flex items-center justify-center font-semibold text-theme-secondary">
                    {quiz.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold text-theme-primary text-sm">
                        {quiz.username}
                      </span>
                      {quiz.verified && (
                        <CheckCircle size={16} className="text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-theme-secondary">
                      <span>{quiz.category}</span>
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                  {quiz.difficulty}
                </div>
              </div>

              {/* Question */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-theme-primary mb-4">
                  {quiz.question}
                </h2>

                {/* Answer Options */}
                <div className="space-y-3">
                  {quiz.options.map((option) => {
                    const status = getOptionStatus(quiz.id, option.letter, quiz.correctAnswer);
                    return (
                      <button
                        key={option.letter}
                        onClick={() => selectAnswer(quiz.id, option.letter, quiz.correctAnswer)}
                        disabled={selectedAnswers.has(quiz.id)}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg border-2 transition-theme-normal text-left ${
                          status === 'correct' 
                            ? 'bg-green-50 border-green-500 text-green-700' 
                            : status === 'incorrect'
                            ? 'bg-red-50 border-red-500 text-red-700'
                            : status === 'selected'
                            ? 'bg-accent-primary bg-opacity-10 border-accent-primary text-accent-primary'
                            : 'bg-theme-secondary border-theme-primary hover:bg-theme-tertiary hover:border-border-secondary'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                          status === 'correct'
                            ? 'bg-green-500 text-white'
                            : status === 'incorrect'
                            ? 'bg-red-500 text-white'
                            : status === 'selected'
                            ? 'bg-accent-primary text-white'
                            : 'bg-theme-tertiary text-theme-secondary'
                        }`}>
                          {option.letter}
                        </div>
                        <span className="font-medium">{option.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quiz Stats */}
              <div className="flex justify-between items-center">
                <div className="flex space-x-6">
                  <div className="flex items-center space-x-2 text-green-600">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">T</span>
                    </div>
                    <span className="font-semibold text-sm">{quiz.stats.correct}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-red-600">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">F</span>
                    </div>
                    <span className="font-semibold text-sm">{quiz.stats.incorrect}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-theme-tertiary rounded-full transition-theme-normal">
                    <Share size={18} className="text-theme-secondary" />
                  </button>
                  <button 
                    onClick={() => toggleSave(quiz.id)}
                    className="p-2 hover:bg-theme-tertiary rounded-full transition-theme-normal"
                  >
                    <Bookmark 
                      size={18} 
                      className={savedQuizzes.has(quiz.id) ? 'text-yellow-500 fill-current' : 'text-theme-secondary'} 
                    />
                  </button>
                </div>
              </div>
            </article>
          )))}
        </section>
      </main>
    </div>
  );
};

export default HomePage;