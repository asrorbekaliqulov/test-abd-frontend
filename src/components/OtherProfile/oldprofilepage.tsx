import React, { useState } from 'react';
import { 
  Settings, 
  Coins, 
  Shield, 
  Crown, 
  Calendar,
  Trophy,
  UserPlus,
  UserMinus,
  ChevronRight,
  X,
  Award,
  Zap,
  CheckCircle,
  TrendingUp,
  BookOpen,
} from 'lucide-react';

interface ProfilePageProps {
  onShowSettings: () => void;
}

// Mock user data
const mockUser = {
  id: 1,
  username: "john_doe",
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  profile_image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
  bio: "Test enthusiast and problem solver. Love challenging myself with complex problems and helping others learn.",
  phone_number: "+998901234567",
  is_premium: true,
  is_badged: true,
  level: "advanced",
  tests_solved: 156,
  correct_count: 1340,
  wrong_count: 220,
  average_time: 45.8,
  join_date: "2024-01-15",
  followers_count: 342,
  following_count: 89,
  testcoin_balance: 1250,
  total_score: 89.5,
  streak_days: 15
};

// Mock test history
const mockTestHistory = [
  {
    id: 1,
    title: "Advanced JavaScript Concepts",
    category: "Programming",
    difficulty: "hard",
    score: 92,
    total_questions: 25,
    correct_answers: 23,
    duration: 1800, // seconds
    completed_at: "2024-02-15T10:30:00Z",
    questions: [
      { id: 1, text: "What is closure in JavaScript?" },
      { id: 2, text: "Explain event delegation" },
      { id: 3, text: "What are JavaScript promises?" },
      { id: 4, text: "How does async/await work?" },
      { id: 5, text: "What is the difference between let and var?" }
    ]
  },
  {
    id: 2,
    title: "React Hooks Mastery",
    category: "Frontend",
    difficulty: "medium",
    score: 88,
    total_questions: 20,
    correct_answers: 18,
    duration: 1200,
    completed_at: "2024-02-10T14:20:00Z",
    questions: [
      { id: 6, text: "When to use useEffect hook?" },
      { id: 7, text: "What is useState hook?" },
      { id: 8, text: "How to optimize React components?" },
      { id: 9, text: "What is useCallback hook?" }
    ]
  },
  {
    id: 3,
    title: "CSS Grid & Flexbox",
    category: "CSS",
    difficulty: "easy",
    score: 95,
    total_questions: 15,
    correct_answers: 14,
    duration: 900,
    completed_at: "2024-02-05T16:45:00Z",
    questions: [
      { id: 10, text: "How to center elements with flexbox?" },
      { id: 11, text: "What is CSS Grid?" },
      { id: 12, text: "Difference between grid and flexbox?" }
    ]
  },
  {
    id: 4,
    title: "Node.js Fundamentals",
    category: "Backend",
    difficulty: "medium",
    score: 85,
    total_questions: 18,
    correct_answers: 15,
    duration: 1350,
    completed_at: "2024-01-28T11:15:00Z",
    questions: [
      { id: 13, text: "What is Node.js event loop?" },
      { id: 14, text: "How to handle async operations?" },
      { id: 15, text: "What are Node.js modules?" }
    ]
  }
];

// Mock followers/following data
const mockFollowers = [
  {
    id: 1,
    username: "alice_dev",
    profile_image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150",
    is_following: false,
    tests_count: 45,
    level: "intermediate"
  },
  {
    id: 2,
    username: "bob_coder",
    profile_image: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150",
    is_following: true,
    tests_count: 78,
    level: "advanced"
  },
  {
    id: 3,
    username: "charlie_quiz",
    profile_image: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150",
    is_following: false,
    tests_count: 23,
    level: "beginner"
  }
];

const mockFollowing = [
  {
    id: 4,
    username: "diana_expert",
    profile_image: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150",
    is_following: true,
    tests_count: 156,
    level: "expert"
  },
  {
    id: 5,
    username: "eve_master",
    profile_image: "https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150",
    is_following: true,
    tests_count: 89,
    level: "advanced"
  }
];

// Mock achievements
const mockAchievements = [
  {
    id: 1,
    title: "First Steps",
    description: "Complete your first test",
    icon: "🎯",
    earned: true,
    earned_date: "2024-01-15"
  },
  {
    id: 2,
    title: "Perfect Score",
    description: "Get 100% on any test",
    icon: "🏆",
    earned: true,
    earned_date: "2024-01-20"
  },
  {
    id: 3,
    title: "Speed Demon",
    description: "Complete a test in under 5 minutes",
    icon: "⚡",
    earned: true,
    earned_date: "2024-01-25"
  },
  {
    id: 4,
    title: "Consistent Learner",
    description: "Complete tests for 7 days straight",
    icon: "📚",
    earned: true,
    earned_date: "2024-02-01"
  },
  {
    id: 5,
    title: "Century Club",
    description: "Complete 100 tests",
    icon: "💯",
    earned: true,
    earned_date: "2024-02-10"
  },
  {
    id: 6,
    title: "Master Mind",
    description: "Achieve 95% average accuracy",
    icon: "🧠",
    earned: false,
    earned_date: null
  }
];

export const ProfilePage: React.FC<ProfilePageProps> = ({ onShowSettings }) => {
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState(mockFollowers);
  const [following, setFollowing] = useState(mockFollowing);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-600 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getLevelBadge = (level: string) => {
    const badges = {
      beginner: { icon: '🔰', color: 'bg-green-100 text-green-800' },
      intermediate: { icon: '⭐', color: 'bg-blue-100 text-blue-800' },
      advanced: { icon: '🏆', color: 'bg-purple-100 text-purple-800' },
      expert: { icon: '👑', color: 'bg-yellow-100 text-yellow-800' }
    };
    return badges[level as keyof typeof badges] || badges.beginner;
  };

  const handleFollow = (userId: number, isFollowing: boolean) => {
    if (showFollowers) {
      setFollowers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_following: !isFollowing } : user
      ));
    } else {
      setFollowing(prev => prev.filter(user => user.id !== userId));
    }
  };

  const handleTestClick = (test: any) => {
    setSelectedTest(test);
  };

  const handleQuestionClick = (testId: number) => {
    // Navigate to quiz page with specific test
    setSelectedTest(null);
  };

  return (
    <div className="min-h-screen bg-theme-secondary pt-20 pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-theme-primary shadow-theme-sm z-40 border-b border-theme-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-4">
            {/* TestCoin Balance */}
            <div className="flex items-center space-x-2 bg-theme-secondary px-4 py-2 rounded-full border border-theme-primary">
              <Coins className="text-yellow-500" size={20} />
              <span className="font-semibold text-theme-primary">
                {mockUser.testcoin_balance.toLocaleString()}
              </span>
            </div>

            {/* Settings */}
            <button
              onClick={onShowSettings}
              className="p-2 hover:bg-theme-tertiary rounded-lg transition-theme-normal"
            >
              <Settings className="text-theme-secondary" size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile Header */}
        <div className="bg-theme-primary rounded-2xl p-8 mb-8 border border-theme-primary shadow-theme-md">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Profile Image */}
            <div className="relative">
              <img
                src={mockUser.profile_image}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover shadow-theme-lg border-4 border-theme-secondary"
              />
              {mockUser.is_badged && (
                <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-2 rounded-full shadow-theme-md">
                  <Shield size={16} />
                </div>
              )}
              {mockUser.is_premium && (
                <div className="absolute top-0 right-0 bg-yellow-500 text-white p-2 rounded-full shadow-theme-md">
                  <Crown size={16} />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-theme-primary mb-2">
                {mockUser.first_name} {mockUser.last_name}
              </h1>
              <p className="text-theme-secondary mb-4">@{mockUser.username}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getLevelBadge(mockUser.level).color}`}>
                  {getLevelBadge(mockUser.level).icon} {mockUser.level}
                </div>
                <div className="flex items-center text-theme-secondary text-sm">
                  <Calendar size={16} className="mr-1" />
                  Joined {formatDate(mockUser.join_date)}
                </div>
                <div className="flex items-center text-orange-500 text-sm">
                  <Zap size={16} className="mr-1" />
                  {mockUser.streak_days} day streak
                </div>
              </div>

              <p className="text-theme-secondary mb-6 max-w-2xl">
                {mockUser.bio}
              </p>

              {/* Social Stats */}
              <div className="flex justify-center md:justify-start space-x-6">
                <button
                  onClick={() => setShowFollowers(true)}
                  className="text-center hover:bg-theme-tertiary p-2 rounded-lg transition-theme-normal"
                >
                  <div className="text-2xl font-bold text-accent-primary">{mockUser.followers_count}</div>
                  <div className="text-sm text-theme-secondary">Followers</div>
                </button>
                <button
                  onClick={() => setShowFollowing(true)}
                  className="text-center hover:bg-theme-tertiary p-2 rounded-lg transition-theme-normal"
                >
                  <div className="text-2xl font-bold text-accent-primary">{mockUser.following_count}</div>
                  <div className="text-sm text-theme-secondary">Following</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-theme-primary p-6 rounded-xl border border-theme-primary shadow-theme-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen size={24} className="text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-theme-primary">{mockUser.tests_solved}</div>
                <div className="text-sm text-theme-secondary">Tests Taken</div>
              </div>
            </div>
          </div>

          <div className="bg-theme-primary p-6 rounded-xl border border-theme-primary shadow-theme-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-theme-primary">{mockUser.correct_count}</div>
                <div className="text-sm text-theme-secondary">Correct Answers</div>
              </div>
            </div>
          </div>

          <div className="bg-theme-primary p-6 rounded-xl border border-theme-primary shadow-theme-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <X size={24} className="text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-theme-primary">{mockUser.wrong_count}</div>
                <div className="text-sm text-theme-secondary">Wrong Answers</div>
              </div>
            </div>
          </div>

          <div className="bg-theme-primary p-6 rounded-xl border border-theme-primary shadow-theme-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={24} className="text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-theme-primary">{mockUser.total_score}%</div>
                <div className="text-sm text-theme-secondary">Avg Score</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Test History */}
          <div className="lg:col-span-2">
            <div className="bg-theme-primary rounded-2xl p-6 border border-theme-primary shadow-theme-md">
              <h2 className="text-2xl font-bold text-theme-primary mb-6 flex items-center">
                <Trophy className="mr-3 text-accent-primary" size={28} />
                Test History
              </h2>
              
              <div className="space-y-4">
                {mockTestHistory.map((test) => (
                  <div
                    key={test.id}
                    onClick={() => handleTestClick(test)}
                    className="p-4 bg-theme-secondary rounded-xl border border-theme-primary hover:bg-theme-tertiary transition-theme-normal cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-theme-primary group-hover:text-accent-primary transition-theme-normal">
                          {test.title}
                        </h3>
                        <p className="text-sm text-theme-secondary">{test.category}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(test.difficulty)}`}>
                          {test.difficulty}
                        </div>
                        <ChevronRight size={16} className="text-theme-secondary group-hover:text-accent-primary transition-theme-normal" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-theme-secondary">Score:</span>
                        <span className={`ml-1 font-semibold ${getScoreColor(test.score)}`}>
                          {test.score}%
                        </span>
                      </div>
                      <div>
                        <span className="text-theme-secondary">Questions:</span>
                        <span className="ml-1 font-semibold text-theme-primary">
                          {test.correct_answers}/{test.total_questions}
                        </span>
                      </div>
                      <div>
                        <span className="text-theme-secondary">Duration:</span>
                        <span className="ml-1 font-semibold text-theme-primary">
                          {formatDuration(test.duration)}
                        </span>
                      </div>
                      <div>
                        <span className="text-theme-secondary">Date:</span>
                        <span className="ml-1 font-semibold text-theme-primary">
                          {formatDate(test.completed_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="lg:col-span-1">
            <div className="bg-theme-primary rounded-2xl p-6 border border-theme-primary shadow-theme-md">
              <h2 className="text-2xl font-bold text-theme-primary mb-6 flex items-center">
                <Award className="mr-3 text-accent-primary" size={28} />
                Achievements
              </h2>
              
              <div className="space-y-3">
                {mockAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-xl border transition-theme-normal ${
                      achievement.earned
                        ? 'bg-theme-secondary border-theme-primary'
                        : 'bg-theme-tertiary border-theme-secondary opacity-60'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${achievement.earned ? 'text-theme-primary' : 'text-theme-secondary'}`}>
                          {achievement.title}
                        </h3>
                        <p className="text-sm text-theme-secondary mb-2">
                          {achievement.description}
                        </p>
                        {achievement.earned && achievement.earned_date && (
                          <p className="text-xs text-accent-primary">
                            Earned {formatDate(achievement.earned_date)}
                          </p>
                        )}
                      </div>
                      {achievement.earned && (
                        <CheckCircle size={20} className="text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Test Details Modal */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-primary rounded-2xl shadow-theme-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-theme-primary">
              <h3 className="text-xl font-bold text-theme-primary">{selectedTest.title}</h3>
              <button
                onClick={() => setSelectedTest(null)}
                className="p-2 hover:bg-theme-tertiary rounded-lg transition-theme-normal"
              >
                <X size={20} className="text-theme-secondary" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-theme-secondary rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(selectedTest.score)}`}>
                    {selectedTest.score}%
                  </div>
                  <div className="text-sm text-theme-secondary">Final Score</div>
                </div>
                <div className="text-center p-4 bg-theme-secondary rounded-lg">
                  <div className="text-2xl font-bold text-theme-primary">
                    {selectedTest.correct_answers}/{selectedTest.total_questions}
                  </div>
                  <div className="text-sm text-theme-secondary">Correct Answers</div>
                </div>
              </div>

              <h4 className="text-lg font-semibold text-theme-primary mb-4">Questions</h4>
              <div className="grid grid-cols-1 gap-3">
                {selectedTest.questions.map((question: any, index: number) => (
                  <div
                    key={question.id}
                    onClick={() => handleQuestionClick(selectedTest.id)}
                    className="p-4 bg-theme-secondary rounded-lg border border-theme-primary hover:bg-theme-tertiary transition-theme-normal cursor-pointer group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-accent-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-theme-primary group-hover:text-accent-primary transition-theme-normal">
                          {question.text}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-theme-secondary group-hover:text-accent-primary transition-theme-normal" />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleQuestionClick(selectedTest.id)}
                className="w-full mt-6 bg-accent-primary text-white py-3 rounded-lg hover:bg-accent-secondary transition-theme-normal font-medium"
              >
                Retake This Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Followers Modal */}
      {showFollowers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-primary rounded-2xl shadow-theme-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-theme-primary">
              <h3 className="text-xl font-bold text-theme-primary">Followers ({mockUser.followers_count})</h3>
              <button
                onClick={() => setShowFollowers(false)}
                className="p-2 hover:bg-theme-tertiary rounded-lg transition-theme-normal"
              >
                <X size={20} className="text-theme-secondary" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {followers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-4 p-3 bg-theme-secondary rounded-lg">
                    <img
                      src={user.profile_image}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-theme-primary">{user.username}</h4>
                      <div className="flex items-center space-x-2 text-sm text-theme-secondary">
                        <span>{user.tests_count} tests</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getLevelBadge(user.level).color}`}>
                          {user.level}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFollow(user.id, user.is_following)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-theme-normal ${
                        user.is_following
                          ? 'bg-theme-tertiary text-theme-primary hover:bg-red-100 hover:text-red-600'
                          : 'bg-accent-primary text-white hover:bg-accent-secondary'
                      }`}
                    >
                      {user.is_following ? (
                        <div className="flex items-center space-x-1">
                          <UserMinus size={16} />
                          <span>Unfollow</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <UserPlus size={16} />
                          <span>Follow</span>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-primary rounded-2xl shadow-theme-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-theme-primary">
              <h3 className="text-xl font-bold text-theme-primary">Following ({mockUser.following_count})</h3>
              <button
                onClick={() => setShowFollowing(false)}
                className="p-2 hover:bg-theme-tertiary rounded-lg transition-theme-normal"
              >
                <X size={20} className="text-theme-secondary" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {following.map((user) => (
                  <div key={user.id} className="flex items-center space-x-4 p-3 bg-theme-secondary rounded-lg">
                    <img
                      src={user.profile_image}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-theme-primary">{user.username}</h4>
                      <div className="flex items-center space-x-2 text-sm text-theme-secondary">
                        <span>{user.tests_count} tests</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getLevelBadge(user.level).color}`}>
                          {user.level}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFollow(user.id, user.is_following)}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-theme-tertiary text-theme-primary hover:bg-red-100 hover:text-red-600 transition-theme-normal"
                    >
                      <div className="flex items-center space-x-1">
                        <UserMinus size={16} />
                        <span>Unfollow</span>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};