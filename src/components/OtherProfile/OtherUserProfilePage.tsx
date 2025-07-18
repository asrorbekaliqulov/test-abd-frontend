import React, { useState, useEffect } from 'react';
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
import { userProfile, accountsAPI } from '../../utils/api'

export interface User {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    bio: string;
    profileImage: string;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    level: string;
    joinDate: string;
}

export interface UserStats {
    totalTests: number;
    correctAnswers: number;
    wrongAnswers: number;
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

export interface Follower {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    profileImage: string;
    isFollowing: boolean;
}

export interface TestQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}


const mockTestQuestions: TestQuestion[] = [
    {
        id: 1,
        question: 'What is the correct way to declare a variable in JavaScript?',
        options: ['var x = 5;', 'variable x = 5;', 'v x = 5;', 'declare x = 5;'],
        correctAnswer: 0,
        explanation: 'In JavaScript, variables can be declared using var, let, or const keywords. var is the traditional way.',
        difficulty: 'Easy'
    },
    {
        id: 2,
        question: 'Which method is used to add an element to the end of an array?',
        options: ['append()', 'push()', 'add()', 'insert()'],
        correctAnswer: 1,
        explanation: 'The push() method adds one or more elements to the end of an array and returns the new length.',
        difficulty: 'Easy'
    },
    {
        id: 3,
        question: 'What does the "this" keyword refer to in JavaScript?',
        options: ['The current function', 'The global object', 'The current object', 'The parent object'],
        correctAnswer: 2,
        explanation: 'The "this" keyword refers to the object that is currently executing the code.',
        difficulty: 'Medium'
    }
];

const mockTests: Test[] = [
    {
        id: 1,
        title: 'JavaScript Fundamentals',
        description: 'Test your knowledge of JavaScript basics including variables, functions, and control structures.',
        questionsCount: 25,
        difficulty: 'Medium',
        category: 'Programming',
        completedAt: '2 days ago',
        score: 22,
        maxScore: 25,
        questions: mockTestQuestions
    },
    {
        id: 2,
        title: 'React Hooks Deep Dive',
        description: 'Advanced concepts in React Hooks including useEffect, useContext, and custom hooks.',
        questionsCount: 30,
        difficulty: 'Hard',
        category: 'Frontend',
        completedAt: '1 week ago',
        score: 24,
        maxScore: 30,
        questions: mockTestQuestions
    },
    {
        id: 3,
        title: 'CSS Grid Layout',
        description: 'Master CSS Grid with practical examples and real-world scenarios.',
        questionsCount: 20,
        difficulty: 'Easy',
        category: 'CSS',
        completedAt: '2 weeks ago',
        score: 18,
        maxScore: 20,
        questions: mockTestQuestions
    }
];

const mockQuestions: Question[] = [
    {
        id: 1,
        title: 'What is the difference between let and var in JavaScript?',
        description: 'Explain the key differences between let and var declarations in JavaScript, including scope and hoisting behavior.',
        difficulty: 'Medium',
        category: 'JavaScript',
        createdAt: '3 days ago',
        likes: 45,
        answers: 12
    },
    {
        id: 2,
        title: 'How to implement a binary search algorithm?',
        description: 'Provide a step-by-step implementation of binary search algorithm with time complexity analysis.',
        difficulty: 'Hard',
        category: 'Algorithms',
        createdAt: '1 week ago',
        likes: 78,
        answers: 23
    },
    {
        id: 3,
        title: 'CSS Flexbox vs Grid: When to use which?',
        description: 'Compare CSS Flexbox and Grid layouts and explain when to use each one for different scenarios.',
        difficulty: 'Easy',
        category: 'CSS',
        createdAt: '2 weeks ago',
        likes: 32,
        answers: 8
    }
];


export const UserProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const [activeTab, setActiveTab] = useState<'tests' | 'questions'>('tests');
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);
    const [showQuestionsListModal, setShowQuestionsListModal] = useState(false);
    const [showQuestionDetailModal, setShowQuestionDetailModal] = useState(false);
    const [showTikTokTest, setShowTikTokTest] = useState(false);
    const [selectedTest, setSelectedTest] = useState<Test | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<TestQuestion | null>(null);
    const [followers, setFollowers] = useState();
    const [following, setFollowing] = useState();
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { user, stats } = await userProfile(username || "asrorbek");
                console.log(`USER DATA: ${user}`)
                console.log(`STATS INFO: ${stats}`)
                setUser(user);
                setStats(stats);
            } catch (error) {
                console.error('Profil ma’lumotlarini olishda xatolik:', error);
            }
        };

        fetchData();
    }, [username]);

    const handleFollow = async () => {
        if (!user) return; // Null check

        // Optimistik UI update
        setUser(prev => {
            if (!prev) return prev; // null bo‘lsa o‘zgarishsiz qaytar
            return {
                ...prev,
                isFollowing: !prev.isFollowing,
                followersCount: prev.isFollowing
                    ? prev.followersCount - 1
                    : prev.followersCount + 1,
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
                    isFollowing: !prev.isFollowing,
                    followersCount: prev.isFollowing
                        ? prev.followersCount - 1
                        : prev.followersCount + 1,
                };
            });
        }
    };
      

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${user?.firstName} ${user?.lastName}'s Profile`,
                text: `Check out ${user?.firstName}'s profile on our platform!`,
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
        setSelectedTest(test);
        setShowTestModal(true);
    };

    const handleViewQuestions = () => {
        setShowTestModal(false);
        setShowQuestionsListModal(true);
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

    return (
        <div className="min-h-screen bg-gray-50">
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
                            View Followers ({user?.followersCount})
                        </button>
                        <button
                            onClick={() => setShowFollowingModal(true)}
                            className="flex items-center px-6 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                            <UserCheck className="w-5 h-5 mr-2" />
                            View Following ({user?.followingCount})
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
                                Completed Tests ({mockTests.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('questions')}
                                className={`flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'questions'
                                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <HelpCircle className="w-5 h-5 mr-2" />
                                Questions Asked ({mockQuestions.length})
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'tests' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {mockTests.map((test) => (
                                    <TestCard key={test.id} test={test} onTestClick={handleTestClick} />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {mockQuestions.map((question) => (
                                    <QuestionCard key={question.id} question={question} />
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
                onFollowToggle={handleFollow}
            />

            <FollowersModal
                isOpen={showFollowingModal}
                onClose={() => setShowFollowingModal(false)}
                title="Following"
                followers={following}
                onFollowToggle={handleFollow}
            />

            <TestModal
                isOpen={showTestModal}
                onClose={() => setShowTestModal(false)}
                test={selectedTest}
                onViewQuestions={handleViewQuestions}
                onStartTest={handleStartTest}
            />

            <QuestionsListModal
                isOpen={showQuestionsListModal}
                onClose={() => setShowQuestionsListModal(false)}
                questions={selectedTest?.questions || []}
                testTitle={selectedTest?.title || ''}
                onQuestionClick={handleQuestionClick}
            />

            <QuestionDetailModal
                isOpen={showQuestionDetailModal}
                onClose={handleCloseQuestionDetail}
                question={selectedQuestion}
            />

            <TikTokStyleTest
                isOpen={showTikTokTest}
                onClose={() => setShowTikTokTest(false)}
                questions={selectedTest?.questions || []}
                testTitle={selectedTest?.title || ''}
            />
        </div>
    );
};