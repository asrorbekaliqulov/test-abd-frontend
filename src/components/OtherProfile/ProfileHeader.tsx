"use client"
import { useNavigate } from "react-router-dom"
import React, { useEffect, useState } from "react"
import { UserPlus, Share2, Award, ArrowLeft } from "lucide-react"
import { FollowersModal } from "../components/FollowerModal.tsx"
import { accountsAPI } from "../../utils/api.ts"
import testIcon from "../assets/images/test.png"
import correctIcon from "../assets/images/correct.png"
import wrongIcon from "../assets/images/wrong.png"
import accuracyIcon from "../assets/images/accuracy.png"

export interface User {
    id: number
    username: string
    first_name: string
    last_name: string
    bio: string
    profile_image: string
    followers_count: number
    following_count: number
    is_following: boolean
    level: string
    join_date: string
}

export interface UserStats {
    total_tests: number
    correct_answers: number
    wrong_answers: number
    accuracy: number
}

interface FollowUser {
    id: number
    username: string
    first_name: string
    last_name: string
    profile_image: string | null
    is_following: boolean
}

interface ProfileHeaderProps {
    user: User
    stats: UserStats
    onFollow: () => void
    onShare: () => void
    theme?: string
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
                                                                user: initialUser,
                                                                stats,
                                                                onFollow,
                                                                onShare,
                                                                theme = "light"
                                                            }) => {
    const [user, setUser] = useState<User>(initialUser)
    const [showFollowersModal, setShowFollowersModal] = useState(false)
    const [showFollowingModal, setShowFollowingModal] = useState(false)
    const [followers, setFollowers] = useState<FollowUser[]>([])
    const [following, setFollowing] = useState<FollowUser[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        setUser(initialUser)
    }, [initialUser])

    useEffect(() => {
        const fetchFollowers = async () => {
            if (!user?.id) return

            setIsLoading(true)
            try {
                const followersData = await accountsAPI.getUserFollowData(user.id)
                // API strukturasi bo'yicha to'g'rilang
                setFollowers(followersData.followers || followersData.data?.followers || [])
                setFollowing(followersData.following || followersData.data?.following || [])
            } catch (error) {
                console.error('Failed to fetch followers:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchFollowers()
    }, [user?.id])

    const handleFollowToggle = (userId: number, newStatus: boolean) => {
        // Followers modalidagi holatni yangilash
        setFollowers(prev => prev.map(follower =>
            follower.id === userId
                ? { ...follower, is_following: newStatus }
                : follower
        ))

        // Following modalidagi holatni yangilash
        setFollowing(prev => prev.map(followingUser =>
            followingUser.id === userId
                ? { ...followingUser, is_following: newStatus }
                : followingUser
        ))

        // Followerlar sonini yangilash
        const followerChange = newStatus ? 1 : -1
        setUser(prev => ({
            ...prev,
            followers_count: Math.max(0, prev.followers_count + followerChange)
        }))
    }

    const handleMainFollow = async () => {
        // Optimistic update
        const wasFollowing = user.is_following
        setUser(prev => ({
            ...prev,
            is_following: !prev.is_following
        }))

        try {
            await accountsAPI.toggleFollow(user.id)
            // Agar parent component callback bergan bo'lsa
            onFollow?.()
        } catch (error) {
            console.error('Follow toggle failed:', error)
            // Xato bo'lsa, oldingi holatga qaytarish
            setUser(prev => ({
                ...prev,
                is_following: wasFollowing
            }))
        }
    }

    const getLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case "beginner":
                return theme === "dark"
                    ? "bg-green-900/30 text-green-300 border-green-700"
                    : "bg-green-100 text-green-800 border-green-200"
            case "intermediate":
                return theme === "dark"
                    ? "bg-blue-900/30 text-blue-300 border-blue-700"
                    : "bg-blue-100 text-blue-800 border-blue-200"
            case "advanced":
                return theme === "dark"
                    ? "bg-purple-900/30 text-purple-300 border-purple-700"
                    : "bg-purple-100 text-purple-800 border-purple-200"
            case "expert":
                return theme === "dark"
                    ? "bg-orange-900/30 text-orange-300 border-orange-700"
                    : "bg-orange-100 text-orange-800 border-orange-200"
            default:
                return theme === "dark"
                    ? "bg-gray-800 text-gray-300 border-gray-600"
                    : "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const navigate = useNavigate()

    return (
        <div className="bg-transparent px-5 py-4 animate-fade-in">
            <div className="flex flex-row gap-2 items-center justify-start mb-4">
                <button
                    onClick={() => navigate("/")}
                    className="p-2 rounded-lg transition-colors text-white hover:bg-white/10"
                >
                    <ArrowLeft size={24} />
                </button>
                <p
                    className="text-lg sm:text-2xl font-semibold text-white animate-fade-in"
                    style={{ animationDelay: "0.3s" }}
                >
                    {user.username}
                </p>
            </div>

            <div className="flex flex-col">
                {/* Left panel - image and name */}
                <div className="flex flex-col items-start animate-fade-in-up w-full">
                    <div className="flex flex-row w-full items-center justify-between pr-16 md:pr-52 my-4">
                        <div className="relative group">
                            <img
                                src={
                                    user.profile_image ||
                                    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
                                }
                                alt={`${user.first_name} ${user.last_name}`}
                                className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full object-cover border-4 border-indigo-200 shadow-xl transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>

                        <div className="flex w-auto">
                            <div className="flex items-center justify-between w-full mx-auto">
                                <div className="text-center animate-fade-in-up" style={{ animationDelay: "1s" }}>
                                    <div className="bg-transparent py-4">
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setShowFollowersModal(true)}
                                                disabled={isLoading}
                                                className="flex flex-col items-center px-2 py-3 bg-transparent text-white text-2xl md:text-4xl transition-colors hover:bg-white/5 rounded-lg"
                                            >
                                                {user.followers_count}
                                                <span className="text-xs md:text-lg font-light">Followers</span>
                                            </button>

                                            <button
                                                onClick={() => setShowFollowingModal(true)}
                                                disabled={isLoading}
                                                className="flex flex-col items-center px-2 py-3 bg-transparent text-white text-2xl md:text-4xl transition-colors hover:bg-white/5 rounded-lg"
                                            >
                                                {user.following_count}
                                                <span className="text-xs md:text-lg font-light">Following</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="my-4 flex flex-row gap-2 items-center justify-between w-full">
                        <h1
                            className="text-lg md:text-3xl font-bold text-white animate-fade-in"
                            style={{ animationDelay: "0.2s" }}
                        >
                            {user.first_name} {user.last_name}
                        </h1>

                        <div
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getLevelColor(user.level)} animate-fade-in`}
                            style={{ animationDelay: "0.4s" }}
                        >
                            <Award className="w-4 h-4 mr-1" />
                            {user.level}
                        </div>
                    </div>

                    {user.bio && (
                        <p
                            className="text-white mb-4 leading-relaxed text-sm sm:text-base animate-fade-in"
                            style={{ animationDelay: "0.7s" }}
                        >
                            {user.bio}
                        </p>
                    )}

                    <div className="flex flex-row gap-3 sm:gap-4 my-4 w-full items-center justify-evenly">
                        <button
                            onClick={handleMainFollow}
                            className={`flex items-center justify-center w-[80%] py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 animate-fade-in-up text-white border border-gray-300 hover:border-gray-100 ${
                                user.is_following ? "bg-gray-800/50" : "bg-indigo-600/50"
                            }`}
                            style={{ animationDelay: "0.5s" }}
                        >
                            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            {user.is_following ? "Kuzatmaslik" : "Kuzatish"}
                        </button>

                        <button
                            onClick={onShare}
                            className="flex items-center justify-center py-3 rounded-full w-14 h-14 font-medium transition-all duration-200 hover:scale-105 animate-fade-in-up text-white border border-gray-300 hover:border-gray-100 bg-gray-800/50"
                            style={{ animationDelay: "0.6s" }}
                        >
                            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div
                className="bg-transparent rounded-2xl animate-fade-in-up my-5"
                style={{ animationDelay: "1.1s" }}
            >
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center">
                    Quiz Performance
                </h3>

                <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex flex-row items-center justify-between w-full gap-3">
                        <div
                            className="flex items-center flex-col justify-evenly w-1/2 h-[140px] md:h-[200px] rounded-lg animate-fade-in bg-black/20"
                            style={{ animationDelay: "1.2s" }}
                        >
                            <div className="flex flex-row items-center justify-between w-[80%] md:w-[90%]">
                                <img src={testIcon} alt="Total Tests" className="flex w-12 h-12 md:w-20 md:h-20" />
                                <span className="font-semibold text-white text-xl md:text-4xl">
                                    {stats?.total_tests ?? 0}
                                </span>
                            </div>
                            <span className="text-gray-400 text-sm sm:text-base w-[80%] md:w-[90%] text-start">
                                Total Tests
                            </span>
                        </div>

                        <div
                            className="flex items-center flex-col justify-evenly w-1/2 h-[140px] md:h-[200px] rounded-lg animate-fade-in bg-black/20"
                            style={{ animationDelay: "1.2s" }}
                        >
                            <div className="flex flex-row items-center justify-between w-[80%] md:w-[90%]">
                                <img src={correctIcon} alt="Correct Answers" className="flex w-12 h-12 md:w-20 md:h-20" />
                                <span className="font-semibold text-white text-xl md:text-4xl">
                                    {stats?.correct_answers ?? 0}
                                </span>
                            </div>
                            <span className="text-gray-400 text-sm sm:text-base w-[80%] md:w-[90%] text-start">
                                Correct Answers
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-row items-center justify-between w-full gap-3">
                        <div
                            className="flex items-center flex-col justify-evenly w-1/2 h-[140px] md:h-[200px] rounded-lg animate-fade-in bg-black/20"
                            style={{ animationDelay: "1.2s" }}
                        >
                            <div className="flex flex-row items-center justify-between w-[80%] md:w-[90%]">
                                <img src={wrongIcon} alt="Wrong Answers" className="flex w-12 h-12 md:w-20 md:h-20" />
                                <span className="font-semibold text-white text-xl md:text-4xl">
                                    {stats?.wrong_answers ?? 0}
                                </span>
                            </div>
                            <span className="text-gray-400 text-sm sm:text-base w-[80%] md:w-[90%] text-start">
                                Wrong Answers
                            </span>
                        </div>

                        <div
                            className="flex items-center flex-col justify-evenly w-1/2 h-[140px] md:h-[200px] rounded-lg animate-fade-in bg-black/20"
                            style={{ animationDelay: "1.2s" }}
                        >
                            <div className="flex flex-row items-center justify-between w-[80%] md:w-[90%]">
                                <img src={accuracyIcon} alt="Accuracy" className="flex w-12 h-12 md:w-20 md:h-20" />
                                <span className="font-semibold text-white text-xl md:text-4xl">
                                    {(stats?.accuracy ?? 0).toFixed(1)}%
                                </span>
                            </div>
                            <div className="text-gray-400 text-sm sm:text-base w-[80%] md:w-[90%] text-start">
                                Accuracy
                                <div className="h-1 md:h-2 w-full bg-gray-700 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(stats?.accuracy ?? 0, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes fadeInUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fade-in {
                    animation: fadeIn 0.6s ease-out forwards;
                    opacity: 0;
                }
                
                .animate-fade-in-up {
                    animation: fadeInUp 0.6s ease-out forwards;
                    opacity: 0;
                }
            `}</style>

            <FollowersModal
                isOpen={showFollowersModal}
                onClose={() => setShowFollowersModal(false)}
                title="Followers"
                followers={followers}
                onFollowToggle={handleFollowToggle}
            />

            <FollowersModal
                isOpen={showFollowingModal}
                onClose={() => setShowFollowingModal(false)}
                title="Following"
                followers={following}
                onFollowToggle={handleFollowToggle}
            />
        </div>
    )
}