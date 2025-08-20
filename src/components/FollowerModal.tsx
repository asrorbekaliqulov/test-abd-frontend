import React from 'react';
import { X, UserPlus, UserCheck } from 'lucide-react';
import { accountsAPI } from '../utils/api';

export interface Follower {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    profileImage: string;
    isFollowing: boolean;
}

interface FollowUser {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    is_following: boolean;
    profile_image: string | null;
}

// interface FollowDataResponse {
//     followers: FollowUser[];
//     following: FollowUser[];
//   }


interface FollowersModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    followers: FollowUser[];
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
    isOpen,
    onClose,
    title,
    followers
}) => {
    if (!isOpen) return null;

    // const onFollowToggle = (follower_id: number) => {
    //     accountsAPI.toggleFollow(follower_id)
    //         .then(response => {
    //             // Optionally, you can update the followers state here
    //         })
    //         .catch(error => {
    //             console.error('Error toggling follow:', error);
    //         });
    // }

        const handleFollow = async (user_id: number) => {
    
            try {
                await accountsAPI.toggleFollow(user_id);
            } catch (error) {
                console.error('Follow toggle failed:', error);
            }
        };

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
                                            src={`${follower.profile_image || 'http://backend.testabd.uz/media/defaultuseravatar.png'}`}
                                            alt={`${follower.first_name} ${follower.last_name}`}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div>
                                            <h3 className="font-medium text-gray-900">
                                                {follower.first_name} {follower.last_name}
                                            </h3>
                                            <p className="text-sm text-gray-600">@{follower.username}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleFollow.bind(null, follower.id)}
                                        className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${follower.is_following
                                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            }}`}
                                    >
                                        <UserPlus className="w-5 h-5 mr-2" />
                                        {follower.is_following ? 'Kuzatmaslik' : 'Kuzatish'}
                                    </button>
                                    {/* <button
                                        onClick={() => handleFollow(follower.id)}
                                        className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${follower.is_following
                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            }`}
                                    >
                                        {follower.is_following ? (
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
                                    </button> */}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};