import React, { useState, useEffect, useRef } from 'react';
import { Share, Bookmark } from 'lucide-react';
import { quizAPI } from '../utils/api'

interface QuizPageProps {
  theme: string;
}

interface Quiz {
  id: number;
  question_text: string;
  question_type: string;
  media: string | null;
  answers: Array<{
    id: number;
    letter: string;
    answer_text: string;
    is_correct: boolean;
  }>;
  correct_count: number;
  wrong_count: number;
  difficulty_percentage: number;
  user: {
    id: number;
    username: string;
    profile_image: string | null;
    is_badged?: boolean;
    is_premium?: boolean;
  };
  created_at: string;
  round_image: string | null;
}

const QuizPage: React.FC<QuizPageProps> = ({}) => {
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [userInteractions, setUserInteractions] = useState({
    follows: new Set<string>(),
    saves: new Set<number>(),
    selectedAnswers: new Map<number, number>()
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nextPageUrl, setNextPageUrl] = useState<string | undefined>(undefined);
  const [quizData, setQuizzes] = useState<Quiz[]>([]);



  const fetchQuizzes = async (url?: string) => {
    setLoading(true);
    try {
      const response = await quizAPI.fetchQuestions(url);
      const data = response.data;

      setQuizzes(prev => [...prev, ...data.results]);
      setNextPageUrl(data.next);
    } catch (error) {
      console.error('Savollarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchQuizzes();
  }, []);
  
  


  const handleScroll = () => {
    if (!containerRef.current || !hasMore) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    

    // Scroll oxiriga 300px qolganda yuklash
    if (scrollTop + clientHeight >= scrollHeight - 300) {
      fetchQuizzes(nextPageUrl);
    }

    // Hozirgi indexni aniqlash (hozirgidek)
    const newIndex = Math.round(scrollTop / clientHeight);
    if (newIndex !== currentQuizIndex && newIndex >= 0 && newIndex < quizData.length) {
      setCurrentQuizIndex(newIndex);
    }
  };
  

  const selectAnswer = async (quizId: number, answerId: number, duration: number) => {
    const alreadySelected = userInteractions.selectedAnswers.has(quizId);
    if (alreadySelected) return; // ✅ Bir marta bosilgandan keyin bloklash

    try {
      const res = await quizAPI.submitAnswers({
        question_id: quizId,
        selected_answer_id: answerId,
        duration: duration,
      });

      setUserInteractions(prev => ({
        ...prev,
        selectedAnswers: new Map(prev.selectedAnswers).set(quizId, answerId),
      }));
    } catch (err) {
      console.error('Yechim jo‘natishda xato:', err);
    }
  };
  
  


  const handleFollow = (username: string) => {
    setUserInteractions(prev => {
      const newFollows = new Set(prev.follows);
      if (newFollows.has(username)) {
        newFollows.delete(username);
      } else {
        newFollows.add(username);
      }
      return { ...prev, follows: newFollows };
    });
  };

  const handleSave = (quizId: number) => {
    setUserInteractions(prev => {
      const newSaves = new Set(prev.saves);
      if (newSaves.has(quizId)) {
        newSaves.delete(quizId);
      } else {
        newSaves.add(quizId);
      }
      return { ...prev, saves: newSaves };
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentQuizIndex, page, hasMore]);
  

  return (
    <div className="fixed inset-0 bg-theme-secondary">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute w-20 h-20 bg-accent-primary bg-opacity-10 rounded-full top-10 left-10 animate-pulse"></div>
        <div className="absolute w-32 h-32 bg-accent-secondary bg-opacity-10 rounded-full top-20 right-15 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute w-16 h-16 bg-accent-primary bg-opacity-10 rounded-full bottom-30 left-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute w-24 h-24 bg-accent-secondary bg-opacity-10 rounded-full bottom-10 right-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main Quiz Container */}
      <div 
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative z-10"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {quizData?.map((quiz) => {
          const selectedAnswer = userInteractions.selectedAnswers.get(quiz.id);
          const isFollowing = userInteractions.follows.has(quiz.user.username);
          const isSaved = userInteractions.saves.has(quiz.id);
          console.log(quiz.round_image)

          return (
            <div key={quiz.id} className="h-screen snap-start flex justify-center items-center relative">
              <div 
                className="relative w-full max-w-sm h-full bg-cover bg-center bg-no-repeat rounded-2xl overflow-hidden shadow-2xl"
                style={{ backgroundImage: `url(${quiz.round_image})` }}
              >
                {/* Visit Ad Button */}
                <button className="absolute top-12 right-5 bg-black bg-opacity-30 backdrop-blur-md border border-white border-opacity-25 rounded-xl px-3 py-2 text-xs font-semibold text-white z-20 hover:bg-opacity-40 transition-all">
                  👁️ Visit Ad
                </button>

                {/* Background Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 via-black/30 to-black/70 z-1"></div>

                {/* Question Container */}
                <div className="absolute top-32 left-5 right-5 bg-black bg-opacity-20 backdrop-blur-md border border-white border-opacity-25 rounded-2xl p-6 text-center z-5">
                  <div className="text-xl font-bold mb-4 text-white bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Savol
                  </div>
                  <div className="text-base leading-relaxed text-white text-opacity-95">
                    {quiz.question_text}
                  </div>
                </div>

               {/* Options Container */}
                <div className="absolute top-80 left-5 right-20 flex flex-col gap-3 z-5">
                  {quiz.answers.map((option) => {
                    const selectedAnswer = userInteractions.selectedAnswers.get(quiz.id);
                    const isSelected = selectedAnswer === option.id;
                    const hasSelected = selectedAnswer !== undefined;

                    const isCorrect = hasSelected && option.is_correct;
                    const isUserCorrect = isSelected && option.is_correct;
                    const isUserWrong = isSelected && !option.is_correct;

                    const getButtonClass = () => {
                      if (isUserCorrect) return 'bg-green-500 bg-opacity-20 border-green-400';
                      if (isUserWrong) return 'bg-red-500 bg-opacity-20 border-red-400';
                      if (isCorrect) return 'bg-green-500 bg-opacity-10 border-green-300'; // ✅
                      if (isSelected) return 'bg-blue-500 bg-opacity-20 border-blue-400';
                      return 'bg-black bg-opacity-20 border-white border-opacity-25 hover:bg-opacity-30';
                    };
                    

                    const getCircleClass = () => {
                      if (isUserCorrect) return 'bg-green-500 text-white';
                      if (isUserWrong) return 'bg-red-500 text-white';
                      if (isCorrect) return 'bg-green-500 text-white'; // ✅
                      if (isSelected) return 'bg-blue-500 text-white';
                      return 'bg-white bg-opacity-20 text-white';
                    };
                    

                    return (
                      <button
                        key={option.id}
                        onClick={() => selectAnswer(quiz.id, option.id, 0)}
                        disabled={hasSelected}
                        className={`flex items-center gap-4 p-4 rounded-xl backdrop-blur-md border transition-all text-left ${getButtonClass()}`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${getCircleClass()}`}>
                          {option.letter}
                        </div>
                        <span className="flex-1 font-medium text-white">
                          {option.answer_text}
                        </span>
                      </button>
                    );
                  })}
                </div>



                {/* Sidebar */}
                <div className="absolute right-4 bottom-32 flex flex-col gap-6 z-10">
                  {/* Profile Section */}
                  <div className="relative flex flex-col items-center">
                    <img
                      src={quiz.user.profile_image || 'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg'}
                      alt="Profile"
                      className="w-12 h-12 rounded-full border-3 border-white cursor-pointer hover:scale-110 transition-transform object-cover shadow-md"
                    />
                    <button
                      onClick={() => handleFollow(quiz.user.username)}
                      className={`absolute -bottom-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold transition-all ${
                        isFollowing ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      {isFollowing ? '✓' : '+'}
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      className={`w-12 h-12 rounded-full backdrop-blur-md border border-white border-opacity-25 flex items-center justify-center transition-all `}
                    >
                      <div className="flex items-center space-x-2 text-green-600">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">T</span>
                        </div>
                    </div>
                    </button>
                    <span className="text-xs font-semibold text-white text-center">{quiz.correct_count}</span>
                    {/* <span className="text-xs font-semibold text-white text-center">
                      {quiz.likes + (isLiked ? 1 : 0)}
                    </span> */}
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <button className="w-12 h-12 rounded-full bg-black bg-opacity-20 backdrop-blur-md border border-white border-opacity-25 flex items-center justify-center text-white hover:bg-opacity-30 transition-all">
                    <div className="flex items-center space-x-2 text-red-600">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">F</span>
                        </div>
                    </div>
                    </button>
                    <span className="text-xs font-semibold text-white text-center">
                      {quiz.wrong_count}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <button 
                      onClick={() => setShowShareMenu(true)}
                      className="w-12 h-12 rounded-full bg-black bg-opacity-20 backdrop-blur-md border border-white border-opacity-25 flex items-center justify-center text-white hover:bg-opacity-30 transition-all"
                    >
                      <Share size={20} />
                    </button>
                  </div>

                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleSave(quiz.id)}
                      className={`w-12 h-12 rounded-full backdrop-blur-md border border-white border-opacity-25 flex items-center justify-center transition-all ${
                        isSaved ? 'bg-yellow-500 bg-opacity-20 text-yellow-400' : 'bg-black bg-opacity-20 text-white hover:bg-opacity-30'
                      }`}
                    >
                      <Bookmark size={20} className={isSaved ? 'fill-current' : ''} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Menu */}
      {showShareMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50"
            onClick={() => setShowShareMenu(false)}
          ></div>
          <div className="fixed bottom-0 left-0 right-0 bg-theme-primary border-t border-theme-primary rounded-t-2xl p-6 z-50 animate-slideIn">
            <h3 className="text-xl font-bold text-theme-primary text-center mb-6">Ulashish</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { name: 'WhatsApp', color: 'bg-green-500', icon: '📱' },
                { name: 'Telegram', color: 'bg-blue-500', icon: '✈️' },
                { name: 'Instagram', color: 'bg-pink-500', icon: '📷' },
                { name: 'Facebook', color: 'bg-blue-600', icon: '👥' },
                { name: 'Copy Link', color: 'bg-gray-500', icon: '🔗' },
                { name: 'Download', color: 'bg-green-600', icon: '⬇️' },
                { name: 'Report', color: 'bg-red-500', icon: '🚩' },
                { name: 'Close', color: 'bg-gray-600', icon: '✕' }
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => setShowShareMenu(false)}
                  className="flex flex-col items-center gap-2 p-3 bg-theme-secondary rounded-xl hover:bg-theme-tertiary transition-theme-normal"
                >
                  <div className={`w-10 h-10 ${item.color} rounded-full flex items-center justify-center text-white text-lg`}>
                    {item.icon}
                  </div>
                  <span className="text-xs text-theme-secondary text-center font-medium">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QuizPage;