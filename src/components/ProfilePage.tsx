import { useState, useEffect, SetStateAction } from 'react';
import './ProfilePage.css';
import { 
    Settings,
    Shield, 
    Crown, 
    Calendar,
    UserPlus,
    Cog,
    UserMinus,
    User,
    X,
    Zap,
  } from 'lucide-react';
import {
  Edit, Target, DollarSign, Globe, LogOut
} from 'lucide-react';
  import { quizAPI, authAPI, accountsAPI } from '../utils/api';

// types.ts yoki ProfilePage.tsx ichida yuqoriga yozing

export interface Country {
    id: number;
    name: string;
    code: string;
}
export interface Region {
    id: number;
    name: string;
    country_id: number;
}
export interface District {
    id: number;
    name: string;
    region_id: number;
}
export interface Settlement {
    id: number;
    name: string;
    district_id: number;
}

export interface UserType {
    id: number;
    username: string;
    profile_image: string | null;
    // tests_count?: number;
    // level?: string;
    following?: boolean; // foydalanuvchi men bilan o'zaro follow qilganmi?
}

interface UserData {
    id: number;
    last_login: string;
    is_superuser: boolean;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    is_staff: boolean;
    date_joined: string;
    profile_image: string;
    bio: string;
    phone_number: string;
    created_at: string;
    is_active: boolean;
    role: string;
    is_premium: boolean;
    is_badged: boolean;
    join_date: string;
    level: string;
    tests_solved: number;
    correct_count: number;
    wrong_count: number;
    average_time: number;
    country: number;
    region: number;
    district: number;
    settlement: number;
    streak_day: number;
    streak_days: number;

    weekly_test_count: {
      Dush: number;
      Sesh: number;
      Chor: number;
      Pay: number;
      Jum: number;
      Shan: number;
      Yak: number;
      };
    groups: number[];
    user_permissions: number[];
    categories_of_interest: number[];

}

interface UserFollowData {
    followers: UserType[];
    following: UserType[];
}

interface UserSettings {
    country: string;
    region: string;
    city: string;
    district: string;
    language: string;
    theme: string;
    notifications: {
        push: boolean;
        email: boolean;
        sound: boolean;
    };
    privacy: {
        publicProfile: boolean;
        showOnlineStatus: boolean;
    };
    monetization: boolean;
}

interface MyTests {
    id: number;
    title: string;
    description: string;
    total_questions: number;
    completions: number;
    rating: number;
    status: 'published' | 'draft';
    category: {
        id: number;
        title: string;
        slug: string;
        emoji: string;
    };
}
export interface RecentQuestion {
  id: number;
  question: string;
  test_title: string;
  type: string;
  difficulty: string;
  category: null; // API da hozircha yo‘q
  answers: number;
  correctRate: number;
}




interface QuestionCardProps {
  question: RecentQuestion;
}

interface StatCardProps {
  icon: string;
  number: string | number;
  label: string;
  change?: {
    type: 'positive' | 'negative';
  };
  type?: 'primary' | 'success' | 'danger' | 'warning'; // optional class variation
}

interface TestCardProps {
  test: MyTests;
}


const ProfilePage = () => {
  const [mestats, setMestats] = useState<UserData | null>(null);
  const [myTests, setMyTests] = useState<MyTests[]>([]);
  const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    country: '',
    region: '',
    city: '',
    district: '',
    language: 'uz',
    theme: 'light',
    notifications: {
      push: true,
      email: true,
      sound: true,
    },
    privacy: {
      publicProfile: true,
      showOnlineStatus: true,
    },
    monetization: false,
  });
  const [follow, setFollow] = useState<UserFollowData | null>(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // const [loadingFollowData, setLoadingFollowData] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // PROFILE MALUMOTLARINI OLISH
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getMe();
        setMestats(res.data);
      } catch (err) {
        console.error("Profil ma'lumotlarini olishda xatolik:", err);
      }
    };
    fetchProfile();
  }, []);
  
  // MY TESTS OLISH
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await quizAPI.fetchMyTest();
        setMyTests(res.data);
      } catch (err) {
        console.error("MyTests olishda xatolik:", err);
      }
    };
    fetchTests();
  }, []);
  

  // FOLLOW DATA OLISH
  // useEffect(() => {
  //   if ((showFollowers || showFollowing) && mestats?.id) {
  //     setLoadingFollowData(true);
  //     accountsAPI.getUserFollowData(mestats.id)
  //       .then((res) => {
  //         setFollow({
  //           followers: res.data.followers,
  //           following: res.data.following,
  //         });
  //       })
  //       .catch(console.error)
  //       .finally(() => setLoadingFollowData(false));
  //   }
  // }, [showFollowers, showFollowing, mestats?.id]);
  
  const activityData: number[] = Object.values(mestats?.weekly_test_count || {}) as number[];


  const handleFollow = (userId: number) => {
    accountsAPI.toggleFollow(userId).then(() => {
      if (mestats?.id) {
        accountsAPI.getUserFollowData(mestats.id)
          .then((res) => {
            setFollow({
              followers: res.data.followers,
              following: res.data.following,
            });
          });
      }
    });
  };
  
  useEffect(() => {
    const maxValue = Math.max(...activityData);

    const chartBars = document.querySelectorAll<HTMLElement>('.chart-bar');
    chartBars.forEach((bar, index) => {
      const barValue = activityData[index] || 0;
      const heightPercent = maxValue ? (barValue / maxValue) * 100 : 0;

      setTimeout(() => {
        bar.style.height = `${heightPercent}%`;
      }, index * 100);
    });
  }, [activityData]);
  
  const convertToRecentQuestion = (q: any): RecentQuestion => ({
    id: q.id,
    question: q.question_text,
    type: q.question_type,
    test_title: q.test_title || 'No Test',
    difficulty:
      q.difficulty_percentage < 33
        ? 'Oson'
        : q.difficulty_percentage < 66
          ? "O'rtacha"
          : 'Qiyin',
    category: null, // backendda yo‘q, agar bo‘lsa q.category.name ishlatiladi
    answers: q.answers?.length || 0,
    correctRate:
      q.correct_count + q.wrong_count > 0
        ? Math.round((q.correct_count / (q.correct_count + q.wrong_count)) * 100)
        : 0,
  });
  
  useEffect(() => {
    const fetchRecentQuestions = async () => {
      try {
        const res = await quizAPI.fetchRecentQuestions();
        const converted = res.data.map(convertToRecentQuestion);
        setRecentQuestions(converted);
      } catch (err) {
        console.error("So'nggi savollarni olishda xatolik:", err);
      }
    };
    fetchRecentQuestions();
  }, []);
  

//   const formatDuration = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
//   };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

    // useEffect(() => {
    //     const fetchStats = async () => {
    //         try {
    //             const res = await quizAPI.fetchStatistics();
    //             setStats(res.data);
    //         } catch (err) {
    //             console.error("Statistikani olishda xatolik:", err);
    //         }
    //     };
    //     fetchStats();
    // }, []);
  

//   const getDifficultyColor = (difficulty: string) => {
//     switch (difficulty) {
//       case 'easy': return 'bg-green-100 text-green-600 border-green-200';
//       case 'medium': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
//       case 'hard': return 'bg-red-100 text-red-600 border-red-200';
//       default: return 'bg-gray-100 text-gray-600 border-gray-200';
//     }
//   };

//   const getScoreColor = (score: number) => {
//     if (score >= 90) return 'text-green-500';
//     if (score >= 70) return 'text-yellow-500';
//     return 'text-red-500';
//   };

  const getLevelBadge = (level: string) => {
    const badges = {
      beginner: { icon: '🔰', color: 'bg-green-100 text-green-800' },
      intermediate: { icon: '⭐', color: 'bg-blue-100 text-blue-800' },
      advanced: { icon: '🏆', color: 'bg-purple-100 text-purple-800' },
      expert: { icon: '👑', color: 'bg-yellow-100 text-yellow-800' }
    };
    return badges[level as keyof typeof badges] || badges.beginner;
  };

  const handleTabSwitch = (tabId: SetStateAction<string>) => {
    setActiveTab(tabId);
  };

  const handleSaveProfile = async () => {
    if (!mestats) return;
    setIsLoading(true);
    try {
      await authAPI.updateProfile({
        first_name: mestats.first_name,
        last_name: mestats.last_name,
        username: mestats.username,
        bio: mestats.bio,
      });
      alert('Profil muvaffaqiyatli saqlandi!');
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Profile update failed.');
    }
    setIsLoading(false);
  };

  const handleSettingChange = (
    category: keyof UserSettings,
    key: string,
    value: string | boolean
  ) => {
    setSettings(prev => {
      const current = prev[category];

      // Agar ichki obyekt bo‘lsa (e.g., notifications, privacy)
      if (typeof current === 'object' && current !== null) {
        return {
          ...prev,
          [category]: {
            ...current,
            [key]: value,
          },
        };
      }

      // Oddiy string/boolean qiymatlar uchun
      return {
        ...prev,
        [category]: value,
      };
    });
  };
  

  const StatCard: React.FC<StatCardProps> = ({ icon, number, label, change, type = 'primary' }) => (
    <div className={`stat-card ${type}`}>
      <div className="stat-icon">
        <i className={icon}></i>
      </div>
      <div className="stat-content">
        <div className="stat-number">{number}</div>
        <div className="stat-label">{label}</div>
        {change && (
          <div className={`stat-change ${change.type}`}>
            <i className={`fas fa-arrow-${change.type === 'positive' ? 'up' : 'down'}`}></i>
            {/* <span>{change.text}</span> */}
          </div>
        )}
      </div>
    </div>
  );
  
  const handleLogout = () => {
    // Implement logout logic here or remove this function if not needed
    authAPI.logout().then(() => {
      window.location.href = '/login';
    });
  };

  const TestCard: React.FC<TestCardProps> = ({ test }) => (
    <div className="test-card" data-status={test.status}>
      <div className="test-header">
        <div className="test-category">{test.category?.emoji} {test.category?.title}</div>
        <div className={`test-status ${test.status}`}>{test.status}</div>
      </div>
      <h3 className="test-title">{test.title}</h3>
      <p className="test-description">{test.description}</p>
      <div className="test-stats">
        <div className="stat">
          <i className="fas fa-question-circle"></i>
          <span>{test.total_questions} savollar</span>
        </div>
        {/* <div className="stat">
          <i className="fas fa-users"></i>
          <span>{test.completions} completions</span>
        </div> */}
        {test.rating > 0 && (
          <div className="stat">
            <i className="fas fa-star"></i>
            <span>{test.rating}</span>
          </div>
        )}
      </div>
      <div className="test-actions">
        <button className="btn btn-outline btn-sm">
          <i className="fas fa-edit"></i>
          Tahrirlash
        </button>
        <button className="btn btn-primary btn-sm">
          <i className="fas fa-eye"></i>
          Ko'rish
        </button>
      </div>
    </div>
  );

  const QuestionCard: React.FC<QuestionCardProps> = ({ question: { type, difficulty, question, test_title, answers, correctRate } }) => (
    <div className="question-card">
      <div className="question-header">
        <div className="question-type">{type}</div>
        <div className={`question-difficulty ${difficulty.toLowerCase()}`}>
          {difficulty}
        </div>
      </div>
      <h4 className="question-title">{question}</h4>

      {/* ✅ only show category.name */}
      <div className="question-category">{test_title}</div>

      <div className="question-stats">
        <div className="stat">
          <i className="fas fa-users"></i>
          <span>{answers} varinatlar</span>
        </div>
        <div className="stat">
          <i className="fas fa-check-circle"></i>
          <span>{correctRate}% to'g'ri </span>
        </div>
      </div>
      <div className="question-actions">
        <button className="btn btn-outline btn-sm">
          <i className="fas fa-edit"></i>
          Tahrirlash
        </button>
        <button className="btn btn-primary btn-sm">
          <i className="fas fa-chart-bar"></i>
          Analitika
        </button>
      </div>
    </div>
  );
  
  
  const accuracy = mestats && (mestats.correct_count + mestats.wrong_count > 0)
    ? ((mestats.correct_count / (mestats.correct_count + mestats.wrong_count)) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="profile-page" data-theme={settings.theme}>
      {/* Background Elements */}
      <div className="bg-elements">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
      </div>

      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="balance-section"></div>
            
            <div className="logo">
              <div className="logo-icon">
                <img src="/logo.png" alt="TestABd logo" />
              </div>
              <span className="logo-text">TestAbd</span>
            </div>
            
            <div className="settings-section">
              <button 
                className="settings-btn" 
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="container">
          
          {/* Profile Section */}
          <div className="bg-theme-primary rounded-2xl p-8 mb-8 border border-theme-primary shadow-theme-md">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Profile Image */}
            <div className="relative">
              <img
                  src={mestats?.profile_image || "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover shadow-theme-lg border-4 border-theme-secondary"
              />
              {mestats?.is_badged && (
                <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-2 rounded-full shadow-theme-md">
                  <Shield size={16} />
                </div>
              )}
              {mestats?.is_premium && (
                <div className="absolute top-0 right-0 bg-yellow-500 text-white p-2 rounded-full shadow-theme-md">
                  <Crown size={16} />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-theme-primary mb-2">
                {mestats?.first_name} {mestats?.last_name}
              </h1>
              <p className="text-theme-secondary mb-4">@{mestats?.username}</p>

              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mb-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getLevelBadge(mestats?.level || "beginner").color}`}>
                    {getLevelBadge(mestats?.level || "beginner").icon} {mestats?.level}
                </div>
                <div className="flex items-center text-theme-secondary text-sm">
                  <Calendar size={16} className="mr-1" />
                  Qoʻshildi {formatDate(mestats?.join_date || "private")}
                </div>
                <div className="flex items-center text-orange-500 text-sm">
                  <Zap size={16} className="mr-1" />
                    {mestats?.streak_day || 0} kunlik chiziq
                </div>
              </div>

              <p className="text-theme-secondary mb-6 max-w-2xl">
                {mestats?.bio || ""}
              </p>

              {/* Social Stats
              <div className="flex justify-center md:justify-start space-x-6">
                
                
              </div> */}
            </div>
          </div>
        </div>

          {/* Enhanced Statistics Section */}
          <section className="enhanced-stats-section">
            <h2 className="section-title">Natijalar Paneli</h2>
            
            <div className="main-stats-grid">
              <StatCard
                icon="fas fa-trophy"
                number={mestats?.tests_solved || 5}
                label="Testlar tugallandi"
                change={{ type: 'positive' }}
                type="primary"
              />
              <StatCard
                icon="fas fa-bullseye"
                number={accuracy}
                label="Aniqlik darajasi"
                change={{ type: 'positive'}}
                type="success"
              />
              {/* <StatCard
                icon="fas fa-clock"
                number={mestats?.average_time || 0}
                label="Oʻrtacha javob vaqti"
                change={{ type: 'negative'}}
                type="danger"
              /> */}
              <StatCard
                icon="fas fa-fire"
                number={mestats?.streak_days || 0}
                label="Kunlik chiziq"
                change={{ type: 'positive'}}
                type="warning"
              />
            </div>

            {/* Detailed Statistics */}
            <div className="detailed-stats">

              <div className="stats-row">
                <div className="stat-item">
                  <div className="stat-header">
                    <i className="fas fa-question-circle"></i>
                    <span>Savollarga javob berildi</span>
                  </div>
                  <div className="stat-value">{Number(mestats?.correct_count) + Number(mestats?.wrong_count)}</div>
                  <div className="stat-breakdown">
                    <div className="breakdown-item correct">
                      <span className="breakdown-label">To'g'ri</span>
                      <span className="breakdown-value">{mestats?.correct_count}</span>
                    </div>
                    <div className="breakdown-item wrong">
                      <span className="breakdown-label">Xato</span>
                      <span className="breakdown-value">{mestats?.wrong_count}</span>
                    </div>
                  </div>
                </div>

                <div className="stat-item">
                  <div className="stat-header">
                    <i className="fas fa-users"></i>
                    <span>Ijtimoiy statistika</span>
                  </div>
                  <div className="social-stats">
                    <button
                      onClick={() => setShowFollowers(true)}
                      className="text-center hover:bg-theme-tertiary p-2 rounded-lg transition-theme-normal"
                    >
                      <div className="text-2xl font-bold text-accent-primary">{follow?.followers?.length || 0}</div>
                      <div className="text-sm text-theme-secondary">Obunachilar</div>
                    </button>
                    <button
                        onClick={() => setShowFollowing(true)}
                        className="text-center hover:bg-theme-tertiary p-2 rounded-lg transition-theme-normal"
                        >
                                          <div className="text-2xl font-bold text-accent-primary">{follow?.following?.length || 0}</div>
                        <div className="text-sm text-theme-secondary">Kuzatish</div>
                    </button>
                  </div>
                </div>

                {/* <div className="stat-item">
                  <div className="stat-header">
                    <i className="fas fa-star"></i>
                    <span>Achievements</span>
                  </div>
                  <div className="achievements-grid">
                    <div className="achievement-badge earned">
                      <i className="fas fa-medal"></i>
                      <span>First Test</span>
                    </div>
                    <div className="achievement-badge earned">
                      <i className="fas fa-crown"></i>
                      <span>100 Tests</span>
                    </div>
                    <div className="achievement-badge">
                      <i className="fas fa-gem"></i>
                      <span>Perfect Week</span>
                    </div>
                    <div className="achievement-badge">
                      <i className="fas fa-rocket"></i>
                      <span>Speed Master</span>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>

            {/* Activity Chart */}
            <div className="activity-section">
              <h3>Activity Overview</h3>
              <div className="activity-chart">
                <div className="chart-header">
                  <span>Sinovlar oxirgi 7 kun ichida yakunlandi</span>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <div className="legend-color primary"></div>
                      <span>Testlar</span>
                    </div>
                  </div>
                </div>
                <div className="chart-bars">
                  {activityData.map((value, index) => (
                    <div 
                      key={index}
                      className="chart-bar" 
                      data-value={value}
                      style={{ height: '0%' }}
                    ></div>
                  ))}
                </div>
                <div className="chart-labels">
                    {['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'].map(day => (
                      <span key={day}>{day}</span>
                    ))}
                </div>
              </div>
            </div>
          </section>

          {/* My Tests Section */}
          <section className="my-tests-section">
            <div className="section-header">
              <h2 className="section-title">Mening bloklarim</h2>
              <div className="test-filters">
                <button className="filter-btn active hover">Barchasi</button>
                <button className="filter-btn hover">Chop etilgan</button>
                <button className="filter-btn hover">Qoralama</button>
              </div>
            </div>
            <div className="tests-grid">
              {myTests.map(test => (
                <TestCard key={test.id} test={test} />
              ))}
            </div>
          </section>

          {/* Questions Overview Section */}
          <section className="questions-section">
            <h2 className="section-title">So'ngi savollar</h2>
            <div className="questions-grid">
              {recentQuestions.length > 0 ? (
                recentQuestions.map((question, index) => (
                  <QuestionCard key={`q-${question.id}-${index}`} question={{ type: question.type, correctRate: question.correctRate, question: question.question, test_title: question.test_title, answers: question.answers, difficulty: question.difficulty }} />
                ))
              ) : (
                  <p className="text-sm text-gray-500">Oxirgi savollar topilmadi.</p>
              )}
            </div>
          </section>

        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-primary rounded-2xl shadow-theme-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex border-b border-theme-primary">
              <div className="w-1/4 bg-theme-secondary p-6 space-y-2">
                {[
                  { id: 'profile', label: 'Edit profile', icon: Edit },
                  { id: 'premium', label: 'Premium', icon: Crown },
                  { id: 'ads', label: 'Advertisement', icon: Target },
                  { id: 'monetization', label: 'Monetization', icon: DollarSign },
                  { id: 'preferences', label: 'Language', icon: Globe },
                  { id: 'logout', label: 'Logout', icon: LogOut }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-theme-normal ${activeTab === item.id
                      ? 'bg-accent-primary text-white'
                      : 'text-theme-secondary hover:bg-theme-tertiary'
                      }`}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-theme-primary">Settings</h2>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-theme-tertiary rounded-lg transition-theme-normal"
                  >
                    <X size={24} className="text-theme-secondary" />
                  </button>
                </div>
                {/* Tab contents here */}
              </div>
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
          <div className="modal-overlay active">
            <div className="modal-content">
              <div className="modal-header">
                <button
                  className="close-btn"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {/* Settings Sidebar */}
              <div className="settings-sidebar">
                <div className="settings-header">
                  <h2 className="settings-title">Settings</h2>
                  <p className="settings-subtitle">Manage your account and preferences</p>
                </div>

                <nav className="settings-nav">
                  {[
                    { id: 'profile', icon: User, text: 'Profile' },
                    // { id: 'premium', icon: 'fas fa-crown', text: 'Premium', disabled: true },
                    // { id: 'ads', icon: 'fas fa-ad', text: 'Ads', disabled: true },
                    // { id: 'monetization', icon: 'fas fa-dollar-sign', text: 'Monetization' },
                    { id: 'preferences', icon: Cog, text: 'Afzalliklar' },
                    { id: 'logout', icon: LogOut, text: 'Chiqish' }
                  ].map(item => (
                    <div
                      key={item.id}
                      className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                      onClick={() => handleTabSwitch(item.id)}
                    >
                      <div className="nav-icon">
                        {item.icon ? <item.icon size={20} /> : null}
                        {/* <i className={item.icon}></i> */}
                      </div>
                      <span className="nav-text">{item.text}</span>
                      {/* {item.disabled && <span className="coming-soon">Coming Soon</span>} */}
                    </div>
                  ))}
                </nav>
              </div>

              {/* Settings Content */}
              <div className="settings-content">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="tab-content active">
                    <div className="content-header">
                      <h3 className="content-title">Profile Settings</h3>
                      <p className="content-description">Update your personal information and profile picture</p>
                    </div>

                    <div className="form-section">
                      <h4 className="section-title">
                        <div className="section-icon">
                          <i className="fas fa-camera"></i>
                        </div>
                        Profile Picture
                      </h4>

                      <div className="profile-picture-section">
                        <div className="current-avatar">
                          <img src={`${mestats?.profile_image || "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"}`} alt="Current Avatar" />
                        </div>
                        <div className="avatar-info">
                          <h5 className="avatar-title">Change Profile Picture</h5>
                          <p className="avatar-description">Upload a new profile picture. Recommended size: 400x400px</p>
                          <div className="file-upload">
                            <input type="file" accept="image/*" />
                            <button className="upload-btn">
                              <i className="fas fa-upload"></i>
                              Upload New Photo
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h4 className="section-title">
                        <div className="section-icon">
                          <i className="fas fa-info-circle"></i>
                        </div>
                        Personal Information
                      </h4>

                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          value={mestats?.first_name + ' ' + mestats?.last_name}
                          onChange={(e) => mestats ? ({ ...mestats, first_name: e.target.value.split(' ')[0], last_name: e.target.value.split(' ')[1] }) : null}
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="form-group">
                        <label>Username</label>
                        <input
                          type="text"
                          value={mestats?.username}
                          onChange={(e) => mestats ? ({ ...mestats, username: e.target.value }) : null}
                          placeholder="Choose a unique username"
                        />
                      </div>

                      <div className="form-group">
                        <label>Bio</label>
                        <textarea placeholder="Tell us about yourself..." rows={4} value={mestats?.bio} onChange={(e) => mestats ? ({ ...mestats, bio: e.target.value }) : null}></textarea>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                      <button className="btn btn-primary" onClick={handleSaveProfile}>
                        <i className="fas fa-save"></i>
                        Save Changes
                      </button>
                      <button className="btn btn-outline">
                        <i className="fas fa-undo"></i>
                        Reset
                      </button>
                    </div>
                  </div>
                )}

                {/* Monetization Tab */}
                {activeTab === 'monetization' && (
                  <div className="tab-content active">
                    <div className="content-header">
                      <h3 className="content-title">Monetization Dashboard</h3>
                      <p className="content-description">Earn money by creating quality content and engaging with the community</p>
                    </div>

                    <div className="monetization-section">
                      <div className="monetization-toggle">
                        <h4>Enable Monetization</h4>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={settings.monetization}
                            disabled
                            onChange={(e) => handleSettingChange('monetization', '', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <span className="disabled-note">Currently disabled - requirements not met</span>
                      </div>

                      <div className="monetization-info">
                        <h4>Monetization Requirements</h4>
                        <p>To enable monetization, you must meet the following requirements:</p>
                        <ul>
                          <li>✓ Have at least 10 published tests</li>
                          <li>✓ Maintain a 4.0+ average rating</li>
                          <li>✗ Have 1000+ total test completions (Current: 156)</li>
                          <li>✓ Account verified and in good standing</li>
                        </ul>
                      </div>

                      <div className="earnings-stats">
                        <div className="earning-item">
                          <div className="earning-number">$0.00</div>
                          <div className="earning-label">Total Earnings</div>
                        </div>
                        <div className="earning-item">
                          <div className="earning-number">$0.00</div>
                          <div className="earning-label">This Month</div>
                        </div>
                      </div>

                      <button className="btn btn-success" disabled>
                        <i className="fas fa-money-bill-wave"></i>
                        Withdraw Earnings (Disabled)
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Logout Tab */}
              {activeTab === 'logout' && (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 max-w-md w-full text-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      Rostdan ham dasturdan chiqmoqchimisiz?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Agar "Ha" tugmasini bossangiz, siz tizimdan chiqarilasiz.
                    </p>

                    <div className="flex justify-center gap-4">
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-5 rounded-md"
                        onClick={async () => {
                          try {
                            await authAPI.logout();
                            if (typeof window !== 'undefined') {
                              window.location.href = '/logout';
                            }
                          } catch (error) {
                            console.error('Logout failed:', error);
                          }
                        }}
                      >
                        Ha, chiqaman
                      </button>

                      <button
                        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-5 rounded-md"
                        onClick={() => {
                          window.location.href = '/';
                        }}
                      >
                        Yo‘q, qolaman
                      </button>
                    </div>
                  </div>
                </div>
              )}


                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="tab-content active">
                    <div className="content-header">
                      <h3 className="content-title">Preferences</h3>
                      <p className="content-description">Customize your experience and app settings</p>
                    </div>

                    {/* Location Settings */}
                    <div className="form-section">
                      <h4 className="section-title">
                        <div className="section-icon">
                          <i className="fas fa-map-marker-alt"></i>
                        </div>
                        Location Settings
                      </h4>

                      <div className="form-group">
                        <label>Country</label>
                        <select
                          value={settings.country}
                          onChange={(e) => handleSettingChange('country', '', e.target.value)}
                        >
                          <option value="uz">Uzbekistan</option>
                          <option value="us">United States</option>
                          <option value="ru">Russia</option>
                          <option value="kz">Kazakhstan</option>
                          <option value="kg">Kyrgyzstan</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Region/State</label>
                        <select
                          value={settings.region}
                          onChange={(e) => handleSettingChange('region', '', e.target.value)}
                        >
                          <option value="tashkent">Tashkent</option>
                          <option value="samarkand">Samarkand</option>
                          <option value="bukhara">Bukhara</option>
                          <option value="fergana">Fergana</option>
                          <option value="andijan">Andijan</option>
                          <option value="namangan">Namangan</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>City</label>
                        <select
                          value={settings.city}
                          onChange={(e) => handleSettingChange('city', '', e.target.value)}
                        >
                          <option value="tashkent-city">Tashkent City</option>
                          <option value="chirchiq">Chirchiq</option>
                          <option value="angren">Angren</option>
                          <option value="bekabad">Bekabad</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>District/Village</label>
                        <input
                          type="text"
                          value={settings.district}
                          onChange={(e) => handleSettingChange('district', '', e.target.value)}
                          placeholder="Enter your district or village"
                        />
                      </div>
                    </div>

                    {/* Language & Appearance */}
                    <div className="form-section">
                      <h4 className="section-title">
                        <div className="section-icon">
                          <i className="fas fa-palette"></i>
                        </div>
                        Appearance & Language
                      </h4>

                      <div className="form-group">
                        <label>Language</label>
                        <div className="language-selector">
                          {[
                            { code: 'uz', flag: '🇺🇿', name: "O'zbek" },
                            { code: 'en', flag: '🇺🇸', name: 'English' },
                            { code: 'ru', flag: '🇷🇺', name: 'Русский' }
                          ].map(lang => (
                            <button
                              key={lang.code}
                              className={`language-btn ${settings.language === lang.code ? 'active' : ''}`}
                              onClick={() => handleSettingChange('language', '', lang.code)}
                            >
                              <div className="flag-icon">{lang.flag}</div>
                              <span>{lang.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Theme</label>
                        <div className="theme-selector">
                          {[
                            { code: 'light', icon: 'fas fa-sun', name: 'Light' },
                            { code: 'dark', icon: 'fas fa-moon', name: 'Dark' },
                            { code: 'auto', icon: 'fas fa-adjust', name: 'Auto' }
                          ].map(theme => (
                            <button
                              key={theme.code}
                              className={`theme-btn ${settings.theme === theme.code ? 'active' : ''}`}
                              onClick={() => handleSettingChange('theme', '', theme.code)}
                            >
                              <i className={theme.icon}></i>
                              <span>{theme.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Notifications
            <div className="form-section">
              <h4 className="section-title">
                <div className="section-icon">
                  <i className="fas fa-bell"></i>
                </div>
                Notifications
              </h4>
              
              {[
                { key: 'push', title: 'Push Notifications', desc: 'Receive notifications about new tests and updates' },
                { key: 'email', title: 'Email Notifications', desc: 'Get weekly summaries and important updates via email' },
                { key: 'sound', title: 'Sound Effects', desc: 'Play sounds for interactions and notifications' }
              ].map(notif => (
                <div key={notif.key} className="notification-item">
                  <div className="notification-info">
                    <h5>{notif.title}</h5>
                    <p>{notif.desc}</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.notifications[notif.key]}
                      onChange={(e) => handleSettingChange('notifications', notif.key, e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              ))}
            </div> */}

                    {/* Privacy */}
                    {/* <div className="form-section">
              <h4 className="section-title">
                <div className="section-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                Privacy & Security
              </h4>
              
              {[
                { key: 'publicProfile', title: 'Public Profile', desc: 'Allow others to view your profile and statistics' },
                { key: 'showOnlineStatus', title: 'Show Online Status', desc: 'Display when you\'re online to other users' }
              ].map(privacy => (
                <div key={privacy.key} className="notification-item">
                  <div className="notification-info">
                    <h5>{privacy.title}</h5>
                    <p>{privacy.desc}</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.privacy[privacy.key]}
                      onChange={(e) => handleSettingChange('privacy', privacy.key, e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              ))}
            </div> */}

                    <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline">
                        <i className="fas fa-undo"></i>
                        Reset
                      </button>
                      <button className="btn btn-primary">
                        <i className="fas fa-save"></i>
                        Save Preferences
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }



      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay active">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <p className="loading-text">Processing...</p>
        </div>
      )}

      {/* Followers Modal */}
            {showFollowers && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-theme-primary rounded-2xl shadow-theme-xl max-w-md w-full max-h-[80vh] overflow-hidden">
                  <div className="flex justify-between items-center p-6 border-b border-theme-primary">
              <h3 className="text-xl font-bold text-theme-primary">Followers ({Array.isArray(follow?.followers) && follow.followers.length || 0})</h3>
                    <button
                      onClick={() => setShowFollowers(false)}
                      className="p-2 hover:bg-theme-tertiary rounded-lg transition-theme-normal"
                    >
                      <X size={20} className="text-theme-secondary" />
                    </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <div className="space-y-4">
                {follow?.followers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-4 p-3 bg-theme-secondary rounded-lg">
                          <img
                            src={user.profile_image || 'https://media.istockphoto.com/id/1300845620/vector/user-icon-flat-isolated-on-white-background-user-symbol-vector-illustration.jpg?s=612x612&w=0&k=20&c=yBeyba0hUkh14_jgv1OKqIH0CCSWU_4ckRkAoy2p73o='}
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          {/* <div className="flex-1">
                            <h4 className="font-semibold text-theme-primary">@{user.username}</h4>
                            <div className="flex items-center space-x-2 text-sm text-theme-secondary">
                              <span>{user.tests_count} tests</span>
                              <span>•</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getLevelBadge(user.level).color}`}>
                                {user.level}
                              </span>
                            </div>
                          </div> */}
                          <button
                            onClick={() => accountsAPI.toggleFollow(user.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-theme-normal ${
                              user.following
                                ? 'bg-theme-tertiary text-theme-primary hover:bg-red-100 hover:text-red-600'
                                : 'bg-accent-primary text-white hover:bg-accent-secondary'
                            }`}
                          >
                            {user.following ? (
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
                          <h3 className="text-xl font-bold text-theme-primary">Following ({Array.isArray(follow?.following) && follow.following.length || 0})</h3>
                    <button
                      onClick={() => setShowFollowing(false)}
                      className="p-2 hover:bg-theme-tertiary rounded-lg transition-theme-normal"
                    >
                      <X size={20} className="text-theme-secondary" />
                    </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <div className="space-y-4">
                      {follow?.following.map((user) => (
                        <div key={user.id} className="flex items-center space-x-4 p-3 bg-theme-secondary rounded-lg">
                          <img
                            src={user.profile_image || 'https://media.istockphoto.com/id/1300845620/vector/user-icon-flat-isolated-on-white-background-user-symbol-vector-illustration.jpg?s=612x612&w=0&k=20&c=yBeyba0hUkh14_jgv1OKqIH0CCSWU_4ckRkAoy2p73o='}
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-theme-primary">{user.username}</h4>
                            {/* <div className="flex items-center space-x-2 text-sm text-theme-secondary">
                              <span>{user.tests_count} tests</span>
                              <span>•</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getLevelBadge(user.level).color}`}>
                                {user.level}
                              </span>
                            </div> */}
                          </div>
                          <button
                            onClick={() => handleFollow(user.id)}
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

export default ProfilePage;


