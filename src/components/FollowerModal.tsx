import React from 'react';
import { X, UserPlus, UserCheck } from 'lucide-react';

export interface Follower {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    profileImage: string;
    isFollowing: boolean;
}

interface FollowersModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    followers: Follower[];
    onFollowToggle: (userId: string) => void;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
    isOpen,
    onClose,
    title,
    followers,
    onFollowToggle
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[60vh]">
                    {followers.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>No {title.toLowerCase()} yet</p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-3">
                            {followers.map((follower) => (
                                <div key={follower.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={follower.profileImage}
                                            alt={`${follower.firstName} ${follower.lastName}`}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div>
                                            <h3 className="font-medium text-gray-900">
                                                {follower.firstName} {follower.lastName}
                                            </h3>
                                            <p className="text-sm text-gray-600">@{follower.username}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onFollowToggle(follower.id)}
                                        className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${follower.isFollowing
                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            }`}
                                    >
                                        {follower.isFollowing ? (
                                            <>
                                                <UserCheck className="w-4 h-4 mr-1" />
                                                Following
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-4 h-4 mr-1" />
                                                Follow
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};