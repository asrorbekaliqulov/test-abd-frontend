import React from 'react';
import { UserPlus, Share2, Calendar, Award, TrendingUp } from 'lucide-react';


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




export interface TestQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}





interface ProfileHeaderProps {
    user: User;
    stats: UserStats;
    onFollow: () => void;
    onShare: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, stats, onFollow, onShare }) => {
    console.log(`ProfileHead qismidagi user: ${user.join_date}`)
    const getLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'beginner': return 'bg-green-100 text-green-800';
            case 'intermediate': return 'bg-blue-100 text-blue-800';
            case 'advanced': return 'bg-purple-100 text-purple-800';
            case 'expert': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left panel - image and name */}
                <div className="flex flex-col items-center md:items-start">
                    <img
                        src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
                        alt={`${user.first_name} ${user.last_name}`}
                        className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100 shadow-lg"
                    />
                    <div className="mt-4 text-center md:text-left">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {user.first_name} {user.last_name}
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">@{user.username}</p>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(user.level)}`}>
                            <Award className="w-4 h-4 mr-1" />
                            {user.level}
                        </div>
                    </div>
                </div>

                {/* Right panel - details */}
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <button
                            onClick={onFollow}
                            className={`flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors ${user.is_following
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                        >
                            <UserPlus className="w-5 h-5 mr-2" />
                            {user.is_following ? 'Kuzatmaslik' : 'Kuzatish'}
                        </button>

                        <button
                            onClick={onShare}
                            className="flex items-center justify-center px-6 py-3 rounded-lg font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            <Share2 className="w-5 h-5 mr-2" />
                            Share Profile
                        </button>
                    </div>

                    {user.bio && (
                        <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">{user.bio}</p>
                    )}

                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-6">
                        <Calendar className="w-5 h-5 mr-2" />
                        <span>Joined {user.join_date}</span>
                    </div>

                    <div className="flex gap-6 mb-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{user.followers_count || 0}</div>
                            <div className="text-gray-600 dark:text-gray-400">Followers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{user.following_count || 0}</div>
                            <div className="text-gray-600 dark:text-gray-400">Following</div>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 min-w-[280px]">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                        Statistics
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Total Tests</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{stats?.total_tests ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Correct Answers</span>
                            <span className="font-semibold text-green-600">{stats?.correct_answers ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Wrong Answers</span>
                            <span className="font-semibold text-red-600">{stats?.wrong_answers ?? 0}</span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Accuracy</span>
                                <span className="font-bold text-indigo-600">{(stats?.accuracy ?? 0).toFixed(1)}%</span>
                            </div>
                            <div className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${stats?.accuracy ?? 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};