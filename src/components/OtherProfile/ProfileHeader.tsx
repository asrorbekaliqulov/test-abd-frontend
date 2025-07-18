import React from 'react';
import { UserPlus, Share2, Calendar, Award, TrendingUp } from 'lucide-react';


export interface User {
    id: string;
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
    console.log(user)
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
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Image and Basic Info */}
                <div className="flex flex-col items-center md:items-start">
                    <img
                        src={"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100 shadow-lg"
                    />
                    <div className="mt-4 text-center md:text-left">
                        <h1 className="text-3xl font-bold text-gray-900">
                            {user.firstName} {user.lastName}
                        </h1>
                        <p className="text-xl text-gray-600 mb-2">@{user.username}</p>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(user.level)}`}>
                            <Award className="w-4 h-4 mr-1" />
                            {user.level}
                        </div>
                    </div>
                </div>

                {/* Profile Details and Actions */}
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <button
                            onClick={onFollow}
                            className={`flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors ${user.isFollowing
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                        >
                            <UserPlus className="w-5 h-5 mr-2" />
                            {user.isFollowing ? 'Following' : 'Follow'}
                        </button>
                        <button
                            onClick={onShare}
                            className="flex items-center justify-center px-6 py-3 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                            <Share2 className="w-5 h-5 mr-2" />
                            Share Profile
                        </button>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                        <p className="text-gray-700 mb-6 leading-relaxed">{user.bio}</p>
                    )}

                    {/* Join Date */}
                    <div className="flex items-center text-gray-600 mb-6">
                        <Calendar className="w-5 h-5 mr-2" />
                        <span>Joined {user.joinDate}</span>
                    </div>

                    {/* Followers/Following */}
                    <div className="flex gap-6 mb-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{user.followersCount}</div>
                            <div className="text-gray-600">Followers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{user.followingCount}</div>
                            <div className="text-gray-600">Following</div>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 min-w-[280px]">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                        Statistics
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Total Tests</span>
                            <span className="font-semibold text-gray-900">{stats.totalTests}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Correct Answers</span>
                            <span className="font-semibold text-green-600">{stats.correctAnswers}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Wrong Answers</span>
                            <span className="font-semibold text-red-600">{stats.wrongAnswers}</span>
                        </div>
                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Accuracy</span>
                                <span className="font-bold text-indigo-600">{stats.accuracy}%</span>
                            </div>
                            <div className="mt-2 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${stats.accuracy}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};