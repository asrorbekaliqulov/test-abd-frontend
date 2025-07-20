import React, { useState, useEffect } from 'react';
import {
  Share,
  Bookmark,
  CheckCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { quizAPI, authAPI } from '../utils/api';
import { StoryRing } from '../ui/storybock';
import StoriesViewer from './stories/StoriesViewer';



interface HomePageProps {
  theme: string;
  toggleTheme: () => void;
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
  user_attempt_count: number;
  difficulty_percentage: number;
  user: {
    id: number;
    username: string;
    profile_image: string | null;
    is_badged?: boolean;
    is_premium?: boolean;
  };
  created_at: string;
  is_bookmarked: boolean;
}

interface Story {
  id: number;
  username: string;
  hasStory: boolean;
  user_profile_image: string;
  test_id?: number;
  question_id?: number;
  status: 'solved' | 'unsolved';
}


const HomePage: React.FC<HomePageProps> = ({ theme, toggleTheme }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, number>>(new Map());
  const [showViewer, setShowViewer] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);


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
  const handleAnswer = (quizId: number, answerId: number, duration: number) => {
    quizAPI
      .submitAnswers({ question_id: quizId, selected_answer_id: answerId, duration })
      .then((res) => {
        const isCorrect = res.data.is_correct;

        setSelectedAnswers(prev => new Map(prev.set(quizId, answerId)));

        // Javobdan keyin T/F sonini yangilash
        setQuizzes(prev =>
          prev.map(quiz =>
            quiz.id === quizId
              ? {
                ...quiz,
                correct_count: isCorrect ? quiz.correct_count + 1 : quiz.correct_count,
                wrong_count: !isCorrect ? quiz.wrong_count + 1 : quiz.wrong_count,
              }
              : quiz
          )
        );
      })
      .catch((err) => {
        console.error("Javobni yuborishda xatolik:", err);
      });
  };

  const shareQuestion = (quizId: number) => {
    const shareUrl = `${window.location.origin}/questions/${quizId}`;

    if (navigator.share) {
      // 📱 Agar browser Web Share API'ni qo‘llasa (mobil telefonlarda)
      navigator.share({
        title: 'TestAbd savoli',
        text: 'Mana bir qiziqarli savol!',
        url: shareUrl,
      }).then(() => {
        console.log("Ulashildi!");
      }).catch((err) => {
        console.error("Ulashishda xatolik:", err);
      });
    } else {
      // 💻 Kompyuter brauzerlarida linkni nusxalash
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert("Havola nusxalandi: " + shareUrl);
      }).catch(() => {
        console.error("Havolani nusxalab bo‘lmadi.");
      });
    }
  };
  
  
  const saveQuiz = (quizId: number) => {
    quizAPI.bookmarkTest({ question: quizId }) // yoki test: quizId agar TestBookmark bo‘lsa
      .then((res) => {
        setQuizzes(prev =>
          prev.map(quiz =>
            quiz.id === quizId
              ? { ...quiz, is_bookmarked: !quiz.is_bookmarked }
              : quiz
          )
        );
      })
      .catch((err) => {
        console.error("Bookmark toggle xatolik:", err);
      });
  };
  
  
  const getOptionStatus = (quizId: number, answer_id: number, isCorrect: boolean) => {
    const selected = selectedAnswers.get(quizId);
    if (!selected) return '';
    if (isCorrect && selected === answer_id) return 'correct';
    if (selected === answer_id && !isCorrect) return 'incorrect';
    if (selected === answer_id) return 'selected';
    return '';
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 33) return 'bg-green-100 text-green-600';
    if (difficulty < 66) return 'bg-yellow-100 text-yellow-600';
    return 'bg-red-100 text-red-600';
  };

  const [stories, setStories] = useState<Story[]>([]);
  // console.log("  Stories:", stories);



  useEffect(() => {
    authAPI.fetchStories().then(response => {
      const testStories = response.data.tests.map((test: any) => ({
        id: test.user.id,
        username: test.user.username,
        user_profile_image: test.user.profile_image,
        test_id: test.id,
        hasStory: true, // barcha testlar story sifatida
      }));
      const questionStories = response.data.questions.map((question: any) => ({
        id: question.user.id,
        username: question.user.username,
        user_profile_image: question.user.profile_image,
        question_id: question.id,
        hasStory: true, // barcha savollar story sifatida
      }));

      setStories([...testStories, ...questionStories].filter(story => story.hasStory));
    });
  }, []);

  const handleStoryClick = (index: number) => {
    setViewerIndex(index);
    setShowViewer(true);
  };

  

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-theme-normal">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-[var(--bg-primary)] backdrop-blur-lg border-b border-[var(--border-primary)] z-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="TestAbd" className="h-8 w-8" />
              <h1 className="text-xl font-bold text-[var(--accent-primary)]">TestAbd</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-theme-normal"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-20 pb-20">
        {/* Stories */}
        <div className="px-4 py-4">
          {stories.map((story, index) => (
            <div
              key={`${story.status}-${story.id}-${story.test_id || story.question_id || index}`}
              onClick={() => handleStoryClick(index)}
            >
              <StoryRing
                username={story.username}
                avatar={`https://testabd.uz${story.user_profile_image}`}
                hasNewStory={true}
              />
            </div>
          ))}

          {showViewer && (
            <StoriesViewer
              stories={stories}
              initialIndex={viewerIndex}
              onClose={() => setShowViewer(false)}
              theme={theme}
            />
          )}
        </div>

        {/* Quizzes */}
        {loading ? (
          <p className="text-center text-[var(--text-secondary)]">Yuklanmoqda...</p>
        ) : (
          <section className="space-y-6">
            {quizzes.map((quiz, index) => (
              <article
                key={`quiz-${quiz.id}-${index}`}
                className="bg-[var(--bg-primary)] rounded-2xl p-6 shadow-theme-md border border-[var(--border-primary)]"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <a href={`profile/${quiz.user.username}`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      {quiz.user.profile_image ? (
                        <img src={quiz.user.profile_image} alt="avatar" className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-lg font-bold">{quiz.user.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-sm">{quiz.user.username}</span>
                        {quiz.user.is_badged && <CheckCircle size={16} className="text-blue-500" />}
                      </div>
                    </div>
                  </div></a>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                      quiz.difficulty_percentage
                    )}`}
                  >
                    {quiz.difficulty_percentage.toFixed(2)}%
                  </div>
                </div>

                {/* Question */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4">{quiz.question_text}</h2>
                  <div className="space-y-3">
                    {quiz.answers.map(option => {
                      const status = getOptionStatus(quiz.id, option.id, option.is_correct);
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleAnswer(quiz.id, option.id, 2)}
                          disabled={selectedAnswers.has(quiz.id)}
                          className={`w-full flex items-center space-x-3 p-3 rounded-lg border-2 text-left transition-theme-normal ${status === 'correct'
                              ? 'bg-green-50 border-green-500 text-green-700'
                              : status === 'incorrect'
                                ? 'bg-red-50 border-red-500 text-red-700'
                                : status === 'selected'
                                  ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                  : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]'
                            }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${status === 'correct'
                                ? 'bg-green-500 text-white'
                                : status === 'incorrect'
                                  ? 'bg-red-500 text-white'
                                  : status === 'selected'
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                              }`}
                          >
                            <span className="text-xs font-bold">{option.letter}</span>
                          </div>
                          <span>{option.answer_text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-6">
                    <div className="flex items-center space-x-2 text-green-600">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">T</span>
                      </div>
                      <span className="font-semibold text-sm">{quiz.correct_count}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-red-600">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">F</span>
                      </div>
                      <span className="font-semibold text-sm">{quiz.wrong_count}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full" onClick={() => shareQuestion(quiz.id)}>
                      <Share size={18} />
                    </button>
                    <button
                      onClick={() => saveQuiz(quiz.id)}
                      className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full"
                    >
                      <Bookmark
                        size={18}
                        className={
                          quiz.is_bookmarked
                            ? 'text-yellow-500 fill-current'
                            : 'text-[var(--text-secondary)]'
                        }
                      />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
        {nextPageUrl && (
          <div className="text-center mt-6">
            <button
              onClick={() => fetchQuizzes(nextPageUrl)}
              disabled={loading}
              className="px-6 py-2 bg-[var(--accent-primary)] text-white font-semibold rounded-full hover:bg-opacity-80 transition"
            >
              {loading ? 'Yuklanmoqda...' : 'Ko‘proq yuklash'}
            </button>
          </div>
        )}

      </main>
    </div>
  );
};

export default HomePage;
