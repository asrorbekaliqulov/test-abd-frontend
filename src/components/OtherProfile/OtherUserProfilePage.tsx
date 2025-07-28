import React, { useState, useEffect } from 'react';
import { href, Navigate, useNavigate } from 'react-router-dom';
import { ProfileHeader } from './ProfileHeader';
import { TestCard } from './TestCard';
import { QuestionCard } from './QuestionCard';
import { FollowersModal } from '../FollowerModal';
import { TestModal } from './TestModal';
import { QuestionsListModal } from './QuestionsListModal';
import { QuestionDetailModal } from './QuestionDetailModal';
import { TikTokStyleTest } from './TikTokStyleTest';
import { BookOpen, HelpCircle, Users, UserCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import ProfilePage from '../ProfilePage';
import BottomNavigation from '../BottomNavigation';
import { userProfile, accountsAPI, quizAPI } from '../../utils/api'
import { useAuth } from '../../contexts/AuthContext';

export interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    bio: string;
    profile_image: string;
    followers_count: number;
    following_count: number;
    is_following: boolean;
    level: string;
    join_date: string;
}

export interface UserStats {
    total_tests: number;
    correct_answers: number;
    wrong_answers: number;
    accuracy: number;
}

export interface Test {
    id: number;
    title: string;
    description: string;
    questionsCount: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    completedAt: string;
    score: number;
    maxScore: number;
    questions: TestQuestion[];
}

export interface Question {
    id: number;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    createdAt: string;
    likes: number;
    answers: number;
}

interface FollowUser {
    id: number;
    username: string;
    profile_image: string | null;
}


  

export interface TestQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}





export const OtherUserProfilePage: React.FC = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const { username } = useParams();
    const { user } = useAuth();
    const handlePageChange = (page: string) => {
        if (currentPage === 'quiz' && page === 'quiz') {
            setCurrentPage('create');
        } else if (currentPage === 'create' && page === 'quiz') {
            setCurrentPage('quiz');
        } else {
            setCurrentPage(page);
        }
      };

    // Username yo‘q bo‘lsa - redirect
    if (!username) return <Navigate to="/" />;

    // Bu useEffect faqat bir marta yoki user/username o‘zgarsa ishlaydi
    useEffect(() => {
        if (user && username === user.username) {
            setCurrentPage('profile');
        }
    }, [user, username]);

    // O‘z profiling bo‘lsa to‘g‘ridan-to‘g‘ri ProfilePage
    if (user && username === user.username) {
        return <ProfilePage />;
    }

    return (
        <>
            <UserProfilePage />
            <BottomNavigation currentPage={currentPage} onPageChange={handlePageChange} />
        </>
    );
};

export const UserProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { username } = useParams<{ username: string }>();
    const [tests, setTests] = useState<Test | null>(null);
    const [questions, setQuestions] = useState<TestQuestion[]>([]);
    const [activeTab, setActiveTab] = useState<'tests' | 'questions'>('tests');
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);
    const [showQuestionsListModal, setShowQuestionsListModal] = useState(false);
    const [showQuestionDetailModal, setShowQuestionDetailModal] = useState(false);
    const [showTikTokTest, setShowTikTokTest] = useState(false);
    const [selectedTest, setSelectedTest] = useState<Test | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<TestQuestion | null>(null);
    const [followers, setFollowers] = useState<FollowUser[]>([]);
    const [following, setFollowing] = useState<FollowUser[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { user, stats } = await userProfile(username || "asrorbek");
                setUser(user);
                setStats(stats);
            } catch (error) {
                console.error('Profil ma’lumotlarini olishda xatolik:', error);
            } finally {
                setLoading(false); // har holda loading false bo‘lsin
            }
        };

        fetchData();
    }, [username]);
    
    useEffect(() => {
        const fetchTests = async () => {
            if (!user) return; // Null check to prevent error
            try {
                const response = await quizAPI.fetchTestByUser(user.id);
                setTests(response.data.results || response.data);
            } catch (error) {
                console.error('Failed to fetch tests:', error);
            }
        };

        fetchTests();
    }, [user]);

    useEffect(() => {
        const fetchQuestions = async () => {
            if (!user) return; // Null check to prevent error
            try {
                const response = await quizAPI.fetchQuestionsByUser(user.id);
                setQuestions(response.data.results || response.data);
            } catch (error) {
                console.error('Failed to fetch questions:', error);
            }
        };

        fetchQuestions();
    }, [user]);

    const handleFollow = async () => {
        if (!user) return; // Null check

        // Optimistik UI update
        setUser(prev => {
            if (!prev) return prev; // null bo‘lsa o‘zgarishsiz qaytar
            return {
                ...prev,
                is_following: !prev.is_following,
                followers_count: prev.is_following
                    ? prev.followers_count - 1
                    : prev.followers_count + 1,
            };
        });

        try {
            await accountsAPI.toggleFollow(user.id);
        } catch (error) {
            console.error('Follow toggle failed:', error);

            // Xatolik bo‘lsa revert
            setUser(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    is_following: !prev.is_following,
                    followers_count: prev.is_following
                        ? prev.followers_count - 1
                        : prev.followers_count + 1,
                };
            });
        }
    };
      
    useEffect(() => {
        const fetchFollowers = async () => {
            if (!user) return; // Null check to prevent error
            try {
                const followersData = await accountsAPI.getUserFollowData(user.id);
                setFollowers(followersData.data.followers);
                setFollowing(followersData.data.following);
            } catch (error) {
                console.error('Failed to fetch followers:', error);
            }
        };


        fetchFollowers();
    }, [user]);
      


    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${user?.first_name} ${user?.last_name}'s Profile`,
                text: `Check out ${user?.first_name}'s profile on our platform!`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Profile link copied to clipboard!');
        }
    };

    // const handleFollowToggle = (userId: string) => {
    //     setFollowers(prev => prev.map(follower =>
    //         follower.id === userId
    //             ? { ...follower, isFollowing: !follower.isFollowing }
    //             : follower
    //     ));
    //     setFollowing(prev => prev.map(user =>
    //         user.id === userId
    //             ? { ...user, isFollowing: !user.isFollowing }
    //             : user
    //     ));
    // };

    const handleTestClick = (test: Test) => {
        navigate(`/tests/${test.id}`);
    };

    const handleViewQuestions = (question: Question) => {
        navigate(`/questions/${question.id}`);
    };

    const handleStartTest = () => {
        setShowTestModal(false);
        setShowTikTokTest(true);
    };

    const handleQuestionClick = (question: TestQuestion) => {
        setSelectedQuestion(question);
        setShowQuestionsListModal(false);
        setShowQuestionDetailModal(true);
    };

    const handleCloseQuestionDetail = () => {
        setShowQuestionDetailModal(false);
        setShowQuestionsListModal(true);
    };
    if (loading || !user || !stats) {
        return <div className="text-center py-10 text-gray-600">Loading profile...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 ">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <ProfileHeader
                    user={user}
                    stats={stats}
                    onFollow={handleFollow}
                    onShare={handleShare}
                />

                {/* Followers/Following Section */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowFollowersModal(true)}
                            className="flex items-center px-6 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                            <Users className="w-5 h-5 mr-2" />
                            View Followers ({user?.followers_count})
                        </button>
                        <button
                            onClick={() => setShowFollowingModal(true)}
                            className="flex items-center px-6 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                            <UserCheck className="w-5 h-5 mr-2" />
                            View Following ({user?.following_count})
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-lg mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            <button
                                onClick={() => setActiveTab('tests')}
                                className={`flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'tests'
                                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <BookOpen className="w-5 h-5 mr-2" />
                                Bloklar ({tests?.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('questions')}
                                className={`flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'questions'
                                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <HelpCircle className="w-5 h-5 mr-2" />
                                Savollar ({questions?.length})
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'tests' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(tests || []).map((test) => (
                                    <TestCard key={test.id} test={test} onTestClick={handleTestClick} />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(questions || []).map((question) => (
                                    <QuestionCard key={question.id} question={question} onQuestionClick={handleViewQuestions} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <FollowersModal
                isOpen={showFollowersModal}
                onClose={() => setShowFollowersModal(false)}
                title="Followers"
                followers={followers}
            />

            <FollowersModal
                isOpen={showFollowingModal}
                onClose={() => setShowFollowingModal(false)}
                title="Following"
                followers={following}
            />

        </div>
    );
};