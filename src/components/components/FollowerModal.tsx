import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, UserCheck } from 'lucide-react';
import { accountsAPI } from '../../utils/api.ts';

interface FollowUser {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    is_following: boolean;
    profile_image: string | null;
}

interface FollowersModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    followers: FollowUser[];
    onFollowToggle?: (userId: number, newStatus: boolean) => void;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
                                                                  isOpen,
                                                                  onClose,
                                                                  title,
                                                                  followers,
                                                                  onFollowToggle
                                                              }) => {
    const [localFollowers, setLocalFollowers] = useState<FollowUser[]>(followers);
    const [loadingIds, setLoadingIds] = useState<number[]>([]);
    const contentRef = useRef<HTMLDivElement>(null);

    // Agar followers prop o'zgarsa, localFollowers ni yangilash
    useEffect(() => {
        setLocalFollowers(followers);
    }, [followers]);

    // Modal ochilganda body ga scroll ni block qilish
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Modal ochilganda content ga scroll tepasiga
    useEffect(() => {
        if (isOpen && contentRef.current) {
            setTimeout(() => {
                contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFollow = async (user_id: number) => {
        // Optimistic update - UI ni darhol yangilash
        const currentFollower = localFollowers.find(f => f.id === user_id);
        if (!currentFollower) return;

        const newStatus = !currentFollower.is_following;

        // Local state ni yangilash
        setLocalFollowers(prev => prev.map(f =>
            f.id === user_id ? { ...f, is_following: newStatus } : f
        ));

        setLoadingIds(prev => [...prev, user_id]);

        try {
            // API ga so'rov
            await accountsAPI.toggleFollow(user_id);

            // Parent component ga yangilangan holatni jo'natish
            if (onFollowToggle) {
                onFollowToggle(user_id, newStatus);
            }

        } catch (error: any) {
            console.error('Follow toggle failed:', error);

            // Xato bo'lsa, oldingi holatga qaytarish
            setLocalFollowers(prev => prev.map(f =>
                f.id === user_id ? { ...f, is_following: !newStatus } : f
            ));

            // Xatoni ko'rsatish
            const errorMessage = error.response?.data?.message || error.message || "Amalni bajarishda xatolik yuz berdi";
            alert(errorMessage);
        } finally {
            setLoadingIds(prev => prev.filter(id => id !== user_id));
        }
    };

    const getFollowButtonText = (isFollowing: boolean, isLoading: boolean) => {
        if (isLoading) return "Yuklanmoqda...";
        return isFollowing ? "Kuzatilmoqda" : "Kuzatish";
    };

    const getFollowButtonIcon = (isFollowing: boolean, isLoading: boolean) => {
        if (isLoading) {
            return (
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-current border-t-transparent mr-2" />
            );
        }
        return isFollowing ? (
            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        ) : (
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        );
    };

    const getFollowButtonClass = (isFollowing: boolean, isLoading: boolean) => {
        const baseClasses = "flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all duration-200 active:scale-95 min-w-[100px] sm:min-w-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900";

        if (isLoading) {
            return `${baseClasses} bg-gray-800 text-gray-400 cursor-not-allowed`;
        }

        if (isFollowing) {
            return `${baseClasses} bg-gray-800/50 text-gray-300 hover:bg-gray-700 border border-gray-700`;
        }

        return `${baseClasses} bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-blue-500/20`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md max-h-[90vh] sm:max-h-[85vh] rounded-xl overflow-hidden z-10 transform transition-all duration-300 scale-100">
                <div className="bg-gradient-to-b from-gray-900 to-gray-900 backdrop-blur-xl border border-gray-700/50 shadow-2xl rounded-xl h-full flex flex-col">
                    {/* Header */}
                    <div className="flex-shrink-0">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700/50">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white truncate">
                                {title} <span className="text-gray-400 text-sm sm:text-base ml-1">({localFollowers.length})</span>
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-800/50 rounded-full transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 hover:text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Content - Scrollable area */}
                    <div
                        ref={contentRef}
                        className="flex-1 overflow-y-auto px-2 sm:px-3"
                        style={{
                            maxHeight: 'calc(90vh - 160px)',
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#4B5563 #1F2937'
                        }}
                    >
                        <div className="py-2 sm:py-3">
                            {localFollowers.length === 0 ? (
                                <div className="p-8 sm:p-12 text-center">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                                        <UserPlus className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
                                    </div>
                                    <p className="text-gray-300 text-base sm:text-lg font-medium">
                                        Hech kim yo'q
                                    </p>
                                    <p className="text-gray-500 text-sm sm:text-base mt-2">
                                        {title === 'Followers'
                                            ? 'Bu foydalanuvchining kuzatuvchilari hali mavjud emas'
                                            : 'Bu foydalanuvchi hali hech kimni kuzatmayapti'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 sm:space-y-3 pb-1">
                                    {localFollowers.map((follower, index) => {
                                        const isLoading = loadingIds.includes(follower.id);
                                        const isLast = index === localFollowers.length - 1;

                                        return (
                                            <div
                                                key={follower.id}
                                                className={`flex items-center justify-between p-3 sm:p-4 hover:bg-gray-800/30 rounded-xl transition-all duration-200 group ${
                                                    isLast ? 'mb-5' : ''
                                                }`}
                                            >
                                                {/* User Info */}
                                                <div className="flex items-center min-w-0 flex-1">
                                                    <div className="relative flex-shrink-0">
                                                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-gray-700 group-hover:border-gray-600 transition-colors">
                                                            <img
                                                                src={follower.profile_image || 'https://backend.testabd.uz/media/defaultuseravatar.png'}
                                                                alt={`${follower.first_name} ${follower.last_name}`}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'https://backend.testabd.uz/media/defaultuseravatar.png';
                                                                }}
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                        {follower.is_following && !isLoading && (
                                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                                                                <UserCheck className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                                                        <h3 className="font-medium text-white text-sm sm:text-base md:text-lg truncate">
                                                            {follower.first_name || follower.username} {follower.last_name || ''}
                                                        </h3>
                                                        <p className="text-gray-400 text-xs sm:text-sm md:text-base truncate">
                                                            @{follower.username}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Follow Button - Faqat "Following" modalida ko'rsatish */}
                                                {title === 'Following' && (
                                                    <div className="flex-shrink-0 ml-2 sm:ml-3">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleFollow(follower.id);
                                                            }}
                                                            disabled={isLoading}
                                                            className={getFollowButtonClass(follower.is_following, isLoading)}
                                                        >
                                                            {getFollowButtonIcon(follower.is_following, isLoading)}
                                                            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                                                                {getFollowButtonText(follower.is_following, isLoading)}
                                                            </span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex-shrink-0 border-t border-gray-700/50 mt-auto">
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-xs sm:text-sm md:text-base">
                                    Jami: <span className="text-white font-medium">{localFollowers.length}</span> kishi
                                </span>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm sm:text-base font-medium text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Yopish
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};