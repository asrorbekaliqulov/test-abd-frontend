"use client"
import type React from "react"
import {useState, useEffect, useCallback} from "react"
import {
    Share,
    Bookmark,
    CheckCircle,
    Sun,
    Moon,
    Loader2,
    X,
    Send,
    Check,
    ThumbsUp,
    ThumbsDown,
    Bell,
    User,
    Gift,
    MessageSquare,
    UserPlus,
    Users,
    Heart,
    Megaphone,
    Info,
} from "lucide-react"
import {quizAPI, authAPI, accountsAPI} from "../utils/api"
import AnimatedLiveProfile from './AnimatedLiveProfile';
import {Link, useNavigate} from 'react-router-dom';
import {StoriesViewer} from "./stories/StoriesViewer"
import ExpandableText from "./ExpandableText.tsx";

interface HomePageProps {
    theme: string
    toggleTheme: () => void
}

interface Quiz {
    id: number
    question_text: string
    question_type: string
    media: string | null
    answers: Array<{
        id: number
        letter: string
        answer_text: string
        is_correct: boolean
    }>
    correct_count: number
    wrong_count: number
    user_attempt_count: number
    difficulty_percentage: number
    user: {
        id: number
        username: string
        profile_image: string | null
        is_badged?: boolean
        is_premium?: boolean
    }
    created_at: string
    is_bookmarked: boolean
    category: {
        id: number
        name: string
        emoji: string
    }
}

interface Story {
    id: number
    question_text?: string
    title?: string
    description?: string
    question_type?: string
    answers?: Array<{
        id: number
        letter: string
        answer_text: string
        is_correct: boolean
    }>
    user: {
        id: number
        username: string
        profile_image: string | null
    }
    created_at: string
    type: "test" | "live_quiz"
}

interface GroupedStory {
    user: {
        id: number
        username: string
        profile_image: string | null
    }
    stories: Story[]
    latestStory: Story
}

interface Notification {
    id: number
    type: 'coin_received' | 'new_follower' | 'new_like' | 'new_comment' | 'admin_announcement' | 'promotion' | 'system_info'
    message: string
    actor?: {
        id: number
        username: string
        profile_image: string | null
    }
    content_type?: string
    object_id?: number
    created_at: string
    is_read: boolean
}

interface User {
    id: number
    first_name: string
    last_name: string
    username: string
    profile_image: string | null
    followers_count: number
    following_count: number
    is_following: boolean
    bio?: string
}


const NotificationToast: React.FC<{
    notification: Notification
    onClose: () => void
    theme: string
}> = ({notification, onClose, theme}) => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setTimeout(() => setIsVisible(true), 100)
        const timer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
        }, 5000)
        return () => clearTimeout(timer)
    }, [onClose])

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'new_follower':
                return <UserPlus size={20} className="text-blue-500"/>
            case 'coin_received':
                return <Gift size={20} className="text-yellow-500"/>
            case 'new_like':
                return <Heart size={20} className="text-red-500"/>
            case 'new_comment':
                return <MessageSquare size={20} className="text-purple-500"/>
            case 'admin_announcement':
                return <Megaphone size={20} className="text-orange-500"/>
            case 'promotion':
                return <Gift size={20} className="text-pink-500"/>
            case 'system_info':
                return <Info size={20} className="text-green-500"/>
            default:
                return <Bell size={20} className="text-gray-500"/>
        }
    }

    const getNotificationTitle = (type: string) => {
        switch (type) {
            case 'new_follower':
                return 'Yangi obunachi'
            case 'coin_received':
                return 'Coin olindi'
            case 'new_like':
                return 'Yangi like'
            case 'new_comment':
                return 'Yangi izoh'
            case 'admin_announcement':
                return 'Admin xabari'
            case 'promotion':
                return 'Aksiya'
            case 'system_info':
                return 'Tizim ma\'lumoti'
            default:
                return 'Bildirishnoma'
        }
    }

    return (
        <div
            className={`fixed top-20 right-4 z-50 transform transition-all duration-300 ease-out ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
            }`}
        >
            <div
                className={`max-w-sm rounded-2xl shadow-2xl border backdrop-blur-lg ${theme === 'dark' ? 'bg-gray-800/95 border-gray-700 text-white' : 'bg-white/95 border-gray-200 text-gray-900'
                }`}
            >
                <div className="p-4">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{getNotificationTitle(notification.type)}</p>
                            <p className="text-sm mt-1 opacity-80">{notification.message}</p>
                            {notification.actor && (
                                <div className="flex items-center space-x-1 mt-2">
                                    <User size={14} className="text-blue-500"/>
                                    <span className="text-sm font-medium">{notification.actor.username}</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setIsVisible(false)
                                setTimeout(onClose, 300)
                            }}
                            className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X size={16}/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const NotificationModal: React.FC<{
    isOpen: boolean
    onClose: () => void
    theme: string
    notifications: Notification[]
    unreadCount: number
    onNotificationClick: (notification: Notification) => void
    onMarkAsRead: (notificationId: number) => void
}> = ({
          isOpen,
          onClose,
          theme,
          notifications,
          unreadCount,
          onNotificationClick,
          onMarkAsRead,
      }) => {
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

    if (!isOpen) return null

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'new_follower':
                return <UserPlus size={20} className="text-blue-500"/>
            case 'coin_received':
                return <Gift size={20} className="text-yellow-500"/>
            case 'new_like':
                return <Heart size={20} className="text-red-500"/>
            case 'new_comment':
                return <MessageSquare size={20} className="text-purple-500"/>
            case 'admin_announcement':
                return <Megaphone size={20} className="text-orange-500"/>
            case 'promotion':
                return <Gift size={20} className="text-pink-500"/>
            case 'system_info':
                return <Info size={20} className="text-green-500"/>
            default:
                return <Bell size={20} className="text-gray-500"/>
        }
    }

    const getNotificationTypeText = (type: string) => {
        switch (type) {
            case 'new_follower':
                return 'Yangi obunachi'
            case 'coin_received':
                return 'Coin olindi'
            case 'new_like':
                return 'Yangi like'
            case 'new_comment':
                return 'Yangi izoh'
            case 'admin_announcement':
                return 'Admin xabari'
            case 'promotion':
                return 'Aksiya'
            case 'system_info':
                return 'Tizim ma\'lumoti'
            default:
                return 'Bildirishnoma'
        }
    }

    const getNotificationTypeColor = (type: string) => {
        switch (type) {
            case 'new_follower':
                return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
            case 'coin_received':
                return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300'
            case 'new_like':
                return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300'
            case 'new_comment':
                return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
            case 'admin_announcement':
                return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300'
            case 'promotion':
                return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300'
            case 'system_info':
                return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300'
            default:
                return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300'
        }
    }

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            onMarkAsRead(notification.id)
        }
        setSelectedNotification(notification)
        onNotificationClick(notification)
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

        if (diffInMinutes < 1) return 'Hozir'
        if (diffInMinutes < 60) return `${diffInMinutes} daqiqa oldin`
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} soat oldin`
        return `${Math.floor(diffInMinutes / 1440)} kun oldin`
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
            <div
                className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            />
            <div
                className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl border max-h-[80vh] overflow-hidden transform animate-slideInDown ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
            >
                <div
                    className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}
                >
                    <div className="flex items-center space-x-2">
                        <Bell size={24} className="text-blue-500"/>
                        <h2
                            className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}
                        >
                            Bildirishnomalar
                        </h2>
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  {unreadCount}
                </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                        }`}
                    >
                        <X size={20}/>
                    </button>
                </div>
                <div className="overflow-y-auto max-h-96">
                    {notifications.length === 0 ? (
                        <div
                            className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}
                        >
                            <Bell size={48} className="mx-auto mb-4 opacity-50"/>
                            <p>Hozircha bildirishnomalar yo'q</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-4 cursor-pointer transition-all duration-200 transform ${!notification.is_read
                                        ? theme === 'dark'
                                            ? 'bg-blue-900/20 hover:bg-blue-900/30'
                                            : 'bg-blue-50 hover:bg-blue-100'
                                        : theme === 'dark'
                                            ? 'hover:bg-gray-700'
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 mt-1 animate-bounce">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p
                                                    className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                    }`}
                                                >
                                                    {getNotificationTypeText(notification.type)}
                                                </p>
                                                {!notification.is_read && (
                                                    <div
                                                        className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 animate-pulse"/>
                                                )}
                                            </div>
                                            <p
                                                className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                                }`}
                                            >
                                                {notification.message}
                                            </p>
                                            {notification.actor && (
                                                <div className="flex items-center space-x-1 mt-2 animate-fadeIn">
                                                    <User size={16} className="text-blue-500"/>
                                                    <span
                                                        className="text-sm font-medium">{notification.actor.username}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between mt-2">
                          <span
                              className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}
                          >
                            {formatTime(notification.created_at)}
                          </span>
                                                <span
                                                    className={`text-xs px-2 py-1 rounded-full ${getNotificationTypeColor(notification.type)}`}
                                                >
                            {getNotificationTypeText(notification.type)}
                          </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {selectedNotification && (
                    <div
                        className={`border-t p-4 animate-slideInUp ${theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3
                                className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}
                            >
                                To'liq ma'lumot
                            </h3>
                            <button
                                onClick={() => setSelectedNotification(null)}
                                className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Yopish
                            </button>
                        </div>
                        <div
                            className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            <p className="mb-2">{selectedNotification.message}</p>
                            {selectedNotification.actor && (
                                <div
                                    className="flex items-center space-x-2 mt-3 p-2 rounded-lg bg-opacity-50 bg-gray-200 dark:bg-gray-600 animate-fadeIn">
                                    <img
                                        src={selectedNotification.actor.profile_image || '/media/defaultuseravatar.png'}
                                        alt={selectedNotification.actor.username}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <span className="font-medium">{selectedNotification.actor.username}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const UserProfilesSection: React.FC<{
    theme: string
    onFollowUser: (userId: number) => void
}> = ({theme, onFollowUser}) => {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [followingUsers, setFollowingUsers] = useState<Set<number>>(new Set())

    const fetchSuggestedUsers = async () => {
        setLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            const usersResponse = await accountsAPI.getRecomendedUsers()
            console.log(usersResponse)
            setUsers(usersResponse.data.results)
        } catch (error) {
            console.error('Error fetching suggested users:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSuggestedUsers()
    }, [])

    const handleFollowClick = async (user: User) => {
        if (followingUsers.has(user.id)) return
        setFollowingUsers(prev => new Set(prev).add(user.id))
        try {
            onFollowUser(user.id)
            setUsers(prevUsers =>
                prevUsers.map(u =>
                    u.id === user.id
                        ? {
                            ...u,
                            is_following: !u.is_following,
                            followers_count: u.is_following ? u.followers_count - 1 : u.followers_count + 1
                        }
                        : u
                )
            )
        } catch (error) {
            console.error('Error following user:', error)
        } finally {
            setFollowingUsers(prev => {
                const newSet = new Set(prev)
                newSet.delete(user.id)
                return newSet
            })
        }
    }

    if (loading) {
        return (
            <div
                className={`rounded-2xl p-6 shadow-lg border animate-pulse ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
            >
                <div className="flex items-center justify-center py-8">
                    <Loader2 size={32} className="animate-spin text-blue-500"/>
                </div>
            </div>
        )
    }

    return (
        <div
            className={`rounded-2xl p-6 shadow-lg border animate-slideInUp ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
        >
            <div className="flex items-center space-x-2 mb-6">
                <Users size={24} className="text-blue-500"/>
                <h2
                    className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                >
                    Tavsiya etilgan foydalanuvchilar
                </h2>
            </div>
            <div className="space-y-4">
                {users.map((user, index) => (
                    <div
                        key={user.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] transform animate-slideInLeft ${theme === 'dark' ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        style={{animationDelay: `${index * 100}ms`}}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <img
                                    src={user.profile_image || '/media/defaultuseravatar.png'}
                                    alt={user.username}
                                    className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <h3
                                        className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`}
                                    >
                                        {user.username}
                                    </h3>
                                </div>
                                {user.bio && (
                                    <p
                                        className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                        }`}
                                    >
                                        {user.bio}
                                    </p>
                                )}
                                <div
                                    className={`flex items-center space-x-4 mt-2 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                    }`}
                                >
                                    <span>{user.followers_count.toLocaleString()} obunachi</span>
                                    <span>{user.following_count.toLocaleString()} obuna</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleFollowClick(user)}
                            disabled={followingUsers.has(user.id)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 hover:scale-105 transform ${user.is_following
                                ? theme === 'dark'
                                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {followingUsers.has(user.id) ? (
                                <Loader2 size={16} className="animate-spin"/>
                            ) : (
                                <>
                                    <UserPlus size={16}/>
                                    <span>{user.is_following ? 'Obunani bekor qilish' : 'Obuna bo\'lish'}</span>
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
            <button
                onClick={fetchSuggestedUsers}
                className={`w-full mt-4 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 transform ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
                Yangilash
            </button>
        </div>
    )
}

const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isConnected, setIsConnected] = useState(false)
    const [socket, setSocket] = useState<WebSocket | null>(null)
    const [activeToast, setActiveToast] = useState<Notification | null>(null)
    const [userId, setUserId] = useState<number | null>(null)

    const requestNotificationPermission = useCallback(async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission()
            return permission === 'granted'
        }
        return false
    }, [])

    const playNotificationSound = useCallback(() => {
        try {
            const audio = new Audio('/notification-sound.mp3')
            audio.volume = 0.5
            audio.play().catch(console.error)
        } catch (error) {
            console.error('Error playing notification sound:', error)
        }
    }, [])

    const showBrowserNotification = useCallback((notification: Notification) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(getNotificationTitle(notification.type), {
                body: notification.message,
                icon: '/logo.jpg',
                badge: '/logo.jpg',
                tag: `notification-${notification.id}`,
            })

            browserNotification.onclick = () => {
                window.focus()
                browserNotification.close()
            }

            setTimeout(() => {
                browserNotification.close()
            }, 5000)
        }
    }, [])

    const getNotificationTitle = (type: string) => {
        switch (type) {
            case 'new_follower':
                return 'Yangi obunachi'
            case 'coin_received':
                return 'Coin olindi'
            case 'new_like':
                return 'Yangi like'
            case 'new_comment':
                return 'Yangi izoh'
            case 'admin_announcement':
                return 'Admin xabari'
            case 'promotion':
                return 'Aksiya'
            case 'system_info':
                return 'Tizim ma\'lumoti'
            default:
                return 'Bildirishnoma'
        }
    }

    const addNotification = useCallback((notification: Notification) => {
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)
        playNotificationSound()
        showBrowserNotification(notification)
        setActiveToast(notification)
    }, [playNotificationSound, showBrowserNotification])

    const connectWebSocket = useCallback(() => {
        if (!userId) {
            console.error('WebSocket ulanishi mumkin emas: userId null');
            return;
        }
        try {
            const wsUrl = `wss://backend.testabd.uz/ws/notifications/${userId}/`;
            console.log('WebSocket ulanish urinilmoqda:', wsUrl); // Debug uchun
            const newSocket = new WebSocket(wsUrl);

            newSocket.onopen = () => {
                console.log('WebSocket ulandi');
                setIsConnected(true);
            };

            newSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('WebSocket xabari qabul qilindi:', data); // Debug uchun
                    if (data.type === 'notification') {
                        const notification: Notification = {
                            id: data.notification.id,
                            type: data.notification.verb,
                            message: data.notification.message,
                            actor: data.notification.actor
                                ? {
                                    id: data.notification.actor.id,
                                    username: data.notification.actor.username,
                                    profile_image: data.notification.actor.profile_image,
                                }
                                : undefined,
                            content_type: data.notification.content_type,
                            object_id: data.notification.object_id,
                            created_at: data.notification.created_at,
                            is_read: data.notification.is_read,
                        };
                        addNotification(notification);
                    }
                } catch (error) {
                    console.error('WebSocket xabarini tahlil qilishda xato:', error);
                }
            };

            newSocket.onclose = (event) => {
                console.log('WebSocket uzildi, kod:', event.code, 'sabab:', event.reason); // Debug uchun
                setIsConnected(false);
                setTimeout(connectWebSocket, 3000); // 3 soniyadan keyin qayta urinish
            };

            newSocket.onerror = (error) => {
                console.error('WebSocket xatosi:', error); // Debug uchun
                setIsConnected(false);
            };

            setSocket(newSocket);
        } catch (error) {
            console.error('WebSocket ulanishida xato:', error);
        }
    }, [addNotification, userId]);

    const loadNotifications = useCallback(async () => {
        try {
            const response = await authAPI.fetchNotifications()
            const data = response.data
            const notifications: Notification[] = data.map((item: any) => ({
                id: item.id,
                type: item.verb,
                message: item.message,
                actor: item.actor
                    ? {
                        id: item.actor.id,
                        username: item.actor.username,
                        profile_image: item.actor.profile_image
                    }
                    : undefined,
                content_type: item.content_type,
                object_id: item.object_id,
                created_at: item.created_at,
                is_read: item.is_read
            }))
            setNotifications(notifications)
            setUnreadCount(notifications.filter(n => !n.is_read).length)
        } catch (error) {
            console.error('Error loading notifications:', error)
        }
    }, [])

    const markAsRead = useCallback(async (notificationId: number) => {
        try {
            await authAPI.markNotificationAsRead(notificationId)
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === notificationId
                        ? {...notification, is_read: true}
                        : notification
                )
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }, [])

    const markAllAsRead = useCallback(async () => {
        try {
            await authAPI.markAllNotificationsAsRead()
            setNotifications(prev =>
                prev.map(notification => ({...notification, is_read: true}))
            )
            setUnreadCount(0)
        } catch (error) {
            console.error('Error marking all notifications as read:', error)
        }
    }, [])

    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const response = await authAPI.getMe()
                setUserId(response.data.id)
            } catch (error) {
                console.error('Error fetching user ID:', error)
            }
        }
        fetchUserId()
        requestNotificationPermission()
        loadNotifications()
    }, [loadNotifications, requestNotificationPermission])

    useEffect(() => {
        if (userId) {
            connectWebSocket()
        }
        return () => {
            if (socket) {
                socket.close()
            }
        }
    }, [userId, connectWebSocket])

    return {
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        loadNotifications,
        activeToast,
        setActiveToast
    }
}

const HomePage: React.FC<HomePageProps> = ({theme, toggleTheme}) => {
    const [selectedAnswers, setSelectedAnswers] = useState<Map<number, number[]>>(new Map())
    const [answerStates, setAnswerStates] = useState<Map<number, "correct" | "incorrect">>(new Map())
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [loading, setLoading] = useState(false)
    const [nextPageUrl, setNextPageUrl] = useState<string | null>(null)
    const [submittingQuestions, setSubmittingQuestions] = useState<Set<number>>(new Set())
    const [textAnswers, setTextAnswers] = useState<Map<number, string>>(new Map())
    const [showStoriesViewer, setShowStoriesViewer] = useState(false)
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(0)
    const [stories, setStories] = useState<Story[]>([])
    const [groupedStories, setGroupedStories] = useState<GroupedStory[]>([])
    const [selectedUserStories, setSelectedUserStories] = useState<Story[]>([])
    const {notifications, unreadCount, markAsRead, activeToast, setActiveToast} = useNotifications()
    const [showNotifications, setShowNotifications] = useState(false)
    const [showUserProfiles, setShowUserProfiles] = useState(false)

    const fetchQuizzes = async (url?: string) => {
        setLoading(true)
        try {
            const response = await quizAPI.fetchQuestionsbyfollower(url)
            const data = response.data
            setQuizzes((prev) => [...prev, ...data.results])
            setNextPageUrl(data.next)
            if (data.results.length === 0 && quizzes.length === 0) {
                setShowUserProfiles(true)
            }
        } catch (error) {
            console.error("Savollarni yuklashda xatolik:", error)
            setShowUserProfiles(true)
        } finally {
            setLoading(false)
        }
    }


    const fetchStories = async () => {
        try {
            const response = await authAPI.fetchStories()
            const data = response.data
            const allStories: Story[] = []

            if (data.tests && Array.isArray(data.tests)) {
                data.tests.forEach((test: any) => {
                    if (test && test.user && test.user.id) {
                        allStories.push({
                            ...test,
                            type: "test",
                        })
                    } else {
                        console.warn("Test without valid user data:", test)
                    }
                })
            }

            // Add live quizzes to stories
            if (data.live_quiz && Array.isArray(data.live_quiz)) {
                data.live_quiz.forEach((liveQuiz: any) => {
                    console.log("Live quiz data:", liveQuiz) // Debug uchun
                    if (liveQuiz && liveQuiz.user && liveQuiz.user.id && liveQuiz.is_active) {
                        allStories.push({
                            ...liveQuiz,
                            type: "live_quiz",
                        })
                    } else {
                        console.warn("Live quiz without valid user data:", liveQuiz)
                    }
                })
            }

            allStories.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            setStories(allStories)
            const grouped = groupStoriesByUser(allStories)
            setGroupedStories(grouped)
        } catch (error) {
            console.error("Stories yuklashda xatolik:", error)
        }
    }

    const groupStoriesByUser = (stories: Story[]): GroupedStory[] => {
        const userStoriesMap = new Map<number, Story[]>()
        stories.forEach((story) => {
            if (!story || !story.user || typeof story.user.id !== "number") {
                console.warn("Invalid story structure:", story)
                return
            }
            const userId = story.user.id
            if (!userStoriesMap.has(userId)) {
                userStoriesMap.set(userId, [])
            }
            userStoriesMap.get(userId)!.push(story)
        })

        const groupedArray: GroupedStory[] = []
        userStoriesMap.forEach((userStories, userId) => {
            if (userStories.length === 0) return
            userStories.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            if (userStories[0] && userStories[0].user) {
                groupedArray.push({
                    user: userStories[0].user,
                    stories: userStories,
                    latestStory: userStories[0],
                })
            }
        })
        groupedArray.sort(
            (a, b) => new Date(b.latestStory.created_at).getTime() - new Date(a.latestStory.created_at).getTime(),
        )
        return groupedArray
    }
    const navigate = useNavigate();

    const handleLiveQuizClick = (liveQuizId: number) => {
        navigate(`/live-quiz/${liveQuizId}`);
    };

    useEffect(() => {
        fetchQuizzes()
        fetchStories()
    }, [])

    const shareQuestion = (quizId: number) => {
        const shareUrl = `${window.location.origin}/questions/${quizId}`
        if (navigator.share) {
            navigator
                .share({
                    title: "TestAbd savoli",
                    text: "Mana bir qiziqarli savol!",
                    url: shareUrl,
                })
                .then(() => {
                    console.log("Ulashildi!")
                })
                .catch((err) => {
                    console.error("Ulashishda xatolik:", err)
                })
        } else {
            navigator.clipboard
                .writeText(shareUrl)
                .then(() => {
                    alert("Havola nusxalandi: " + shareUrl)
                })
                .catch(() => {
                    console.error("Havolani nusxalab bo'lmadi.")
                })
        }
    }

    const saveQuiz = (quizId: number) => {
        quizAPI
            .bookmarkQuestion({question: quizId})
            .then((res) => {
                setQuizzes((prev) =>
                    prev.map((quiz) => (quiz.id === quizId ? {...quiz, is_bookmarked: !quiz.is_bookmarked} : quiz)),
                )
            })
            .catch((err) => {
                console.error("Bookmark toggle xatolik:", err)
            })
    }

    const handleSingleChoice = async (quizId: number, answerId: number) => {
        if (answerStates.has(quizId) || submittingQuestions.has(quizId)) return
        setSelectedAnswers((prev) => new Map(prev.set(quizId, [answerId])))
        setSubmittingQuestions((prev) => new Set(prev).add(quizId))
        try {
            const response = await quizAPI.submitAnswers({
                question: quizId,
                selected_answer_ids: [answerId],
                duration: 2,
            })
            const isCorrect = response.data.is_correct
            setAnswerStates((prev) => new Map(prev.set(quizId, isCorrect ? "correct" : "incorrect")))
            setQuizzes((prev) =>
                prev.map((quiz) =>
                    quiz.id === quizId
                        ? {
                            ...quiz,
                            correct_count: isCorrect ? quiz.correct_count + 1 : quiz.correct_count,
                            wrong_count: !isCorrect ? quiz.wrong_count + 1 : quiz.wrong_count,
                        }
                        : quiz,
                ),
            )
        } catch (error) {
            console.error("Javobni yuborishda xatolik:", error)
        } finally {
            setSubmittingQuestions((prev) => {
                const newSet = new Set(prev)
                newSet.delete(quizId)
                return newSet
            })
        }
    }

    const handleMultipleChoice = (quizId: number, answerId: number) => {
        if (answerStates.has(quizId)) return
        setSelectedAnswers((prev) => {
            const current = prev.get(quizId) || []
            const newAnswers = current.includes(answerId) ? current.filter((id) => id !== answerId) : [...current, answerId]
            const updated = new Map(prev)
            updated.set(quizId, newAnswers)
            return updated
        })
    }

    const submitMultipleChoice = async (quizId: number) => {
        const selected = selectedAnswers.get(quizId) || []
        if (selected.length === 0 || submittingQuestions.has(quizId)) return
        setSubmittingQuestions((prev) => new Set(prev).add(quizId))
        try {
            const response = await quizAPI.submitAnswers({
                question: quizId,
                selected_answer_ids: selected,
                duration: 2,
            })
            const isCorrect = response.data.is_correct
            setAnswerStates((prev) => new Map(prev.set(quizId, isCorrect ? "correct" : "incorrect")))
            setQuizzes((prev) =>
                prev.map((quiz) =>
                    quiz.id === quizId
                        ? {
                            ...quiz,
                            correct_count: isCorrect ? quiz.correct_count + 1 : quiz.correct_count,
                            wrong_count: !isCorrect ? quiz.wrong_count + 1 : quiz.wrong_count,
                        }
                        : quiz,
                ),
            )
        } catch (error) {
            console.error("Javobni yuborishda xatolik:", error)
        } finally {
            setSubmittingQuestions((prev) => {
                const newSet = new Set(prev)
                newSet.delete(quizId)
                return newSet
            })
        }
    }

    const handleTextAnswer = async (quizId: number) => {
        const textAnswer = textAnswers.get(quizId)
        if (!textAnswer?.trim() || submittingQuestions.has(quizId)) return
        setSubmittingQuestions((prev) => new Set(prev).add(quizId))
        try {
            const response = await quizAPI.submitTextAnswers({
                question: quizId,
                written_answer: textAnswer.trim(),
                duration: 2,
            })
            const isCorrect = response.data.is_correct
            setAnswerStates((prev) => new Map(prev.set(quizId, isCorrect ? "correct" : "incorrect")))
            setQuizzes((prev) =>
                prev.map((quiz) =>
                    quiz.id === quizId
                        ? {
                            ...quiz,
                            correct_count: isCorrect ? quiz.correct_count + 1 : quiz.correct_count,
                            wrong_count: !isCorrect ? quiz.wrong_count + 1 : quiz.wrong_count,
                        }
                        : quiz,
                ),
            )
        } catch (error) {
            console.error("Javobni yuborishda xatolik:", error)
        } finally {
            setSubmittingQuestions((prev) => {
                const newSet = new Set(prev)
                newSet.delete(quizId)
                return newSet
            })
        }
    }

    const getOptionStatus = (quizId: number, answerId: number, isCorrect: boolean, questionType: string) => {
        const answerState = answerStates.get(quizId)
        const selected = selectedAnswers.get(quizId) || []
        const isSelected = selected.includes(answerId)
        if (!answerState) {
            return isSelected ? "selected" : "default"
        }
        if (questionType === "multiple") {
            if (isCorrect && isSelected) return "correct-selected"
            if (!isCorrect && isSelected) return "incorrect-selected"
            if (isCorrect && !isSelected) return "correct-unselected"
            return "neutral"
        }
        if (isSelected) {
            return isCorrect ? "correct-selected" : "incorrect-selected"
        }
        if (isCorrect) {
            return "correct-unselected"
        }
        return "neutral"
    }

    const getOptionStyles = (status: string) => {
        const baseStyles =
            "w-full flex items-center justify-between space-x-3 p-4 sm:p-5 rounded-lg border-2 text-left transition-all duration-200 hover:scale-[1.02] transform"
        switch (status) {
            case "correct-selected":
                return `${baseStyles} bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-400 dark:text-green-300 animate-pulse`
            case "incorrect-selected":
                return `${baseStyles} bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-400 dark:text-red-300 animate-pulse`
            case "correct-unselected":
                return `${baseStyles} bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-400 dark:text-green-300 opacity-80`
            case "selected":
                return `${baseStyles} ${theme === "dark" ? "bg-blue-900/30 border-blue-400 text-blue-300" : "bg-blue-50 border-blue-400 text-blue-700"
                } shadow-lg`
            case "neutral":
                return `${baseStyles} ${theme === "dark" ? "bg-gray-800 border-gray-600 text-gray-400 opacity-60" : "bg-gray-50 border-gray-200 text-gray-400 opacity-60"
                }`
            default:
                return `${baseStyles} ${theme === "dark"
                    ? "bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-blue-400 text-white hover:shadow-lg"
                    : "bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-400 text-gray-900 hover:shadow-lg"
                }`
        }
    }

    const isTrueFalseQuestion = (quiz: Quiz) => {
        return (
            quiz.question_type === "true_false" ||
            (quiz.answers.length === 2 &&
                quiz.answers.some((answer) => ["true", "to'g'ri", "ha", "yes"].includes(answer.answer_text.toLowerCase())) &&
                quiz.answers.some((answer) => ["false", "noto'g'ri", "yo'q", "no"].includes(answer.answer_text.toLowerCase())))
        )
    }

    const renderQuestionContent = (quiz: Quiz) => {
        const isSubmitting = submittingQuestions.has(quiz.id)
        const answerState = answerStates.get(quiz.id)
        const isAnswered = answerState !== undefined
        const selectedForQuestion = selectedAnswers.get(quiz.id) || []

        if (quiz.question_type === "text_input") {
            return (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={textAnswers.get(quiz.id) || ""}
                            onChange={(e) => setTextAnswers((prev) => new Map(prev.set(quiz.id, e.target.value)))}
                            placeholder="Javobingizni kiriting..."
                            disabled={isAnswered}
                            className={`flex-1 px-4 py-3 text-base sm:text-lg rounded-lg border-2 transition-all duration-200 ${answerState === "correct"
                                ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                : answerState === "incorrect"
                                    ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                    : theme === "dark"
                                        ? "border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        : "border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            } disabled:opacity-60`}
                        />
                        <button
                            onClick={() => handleTextAnswer(quiz.id)}
                            disabled={!textAnswers.get(quiz.id)?.trim() || isAnswered || isSubmitting}
                            className={`px-6 py-3 text-base sm:text-lg rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 min-w-[140px] hover:scale-105 transform ${answerState === "correct"
                                ? "bg-green-500 text-white"
                                : answerState === "incorrect"
                                    ? "bg-red-500 text-white"
                                    : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                            }`}
                        >
                            {isSubmitting ? (
                                <Loader2 size={20} className="animate-spin"/>
                            ) : answerState === "correct" ? (
                                <CheckCircle size={20}/>
                            ) : answerState === "incorrect" ? (
                                <X size={20}/>
                            ) : (
                                <Send size={20}/>
                            )}
                            <span>
                {isSubmitting
                    ? "Yuborilmoqda..."
                    : answerState
                        ? answerState === "correct"
                            ? "To'g'ri"
                            : "Noto'g'ri"
                        : "Yuborish"}
              </span>
                        </button>
                    </div>
                </div>
            )
        }

        if (quiz.question_type === "multiple") {
            return (
                <div className="space-y-4">
                    <div className="grid gap-3 sm:gap-4">
                        {quiz.answers.map((option) => {
                            const status = getOptionStatus(quiz.id, option.id, option.is_correct, quiz.question_type)
                            const isSelected = selectedForQuestion.includes(option.id)
                            const checkboxClass = `
                w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 transform hover:scale-110
                ${status === "correct-selected" || status === "correct-unselected"
                                ? "bg-green-500 border-green-500 text-white"
                                : status === "incorrect-selected"
                                    ? "bg-red-500 border-red-500 text-white"
                                    : isSelected
                                        ? "bg-blue-500 border-blue-500 text-white"
                                        : theme === "dark"
                                            ? "bg-gray-700 border-gray-500"
                                            : "bg-white border-gray-300"
                            }
              `
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleMultipleChoice(quiz.id, option.id)}
                                    disabled={isAnswered}
                                    className={getOptionStyles(status)}
                                    style={{ backgroundColor: "transparent", backdropFilter: "blur(10px)" }}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={checkboxClass}>
                                            {(isSelected || status === "correct-unselected") && <Check size={16}/>}
                                        </div>
                                        <span className="flex-1 text-base sm:text-lg text-white">{option.answer_text}</span>
                                    </div>
                                    {status === "correct-selected" &&
                                        <Check size={22} className="text-green-500 animate-bounce"/>}
                                    {status === "incorrect-selected" &&
                                        <X size={22} className="text-red-500 animate-bounce"/>}
                                    {status === "correct-unselected" &&
                                        <Check size={22} className="text-green-500 animate-bounce"/>}
                                </button>
                            )
                        })}
                    </div>
                    {selectedForQuestion.length > 0 && !isAnswered && (
                        <div className="flex justify-center pt-2">
                            <button
                                onClick={() => submitMultipleChoice(quiz.id)}
                                disabled={isSubmitting}
                                className="px-8 py-4 text-base sm:text-lg bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 hover:scale-105 transform hover:shadow-lg"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin"/>
                                        <span>Yuborilmoqda...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={20}/>
                                        <span>Javobni yuborish ({selectedForQuestion.length} ta tanlangan)</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )
        }

        if (isTrueFalseQuestion(quiz)) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {quiz.answers.map((option) => {
                        const status = getOptionStatus(quiz.id, option.id, option.is_correct, quiz.question_type)
                        const isSelected = selectedForQuestion.includes(option.id)
                        const isTrue = ["true", "to'g'ri", "ha", "yes"].includes(option.answer_text.toLowerCase())
                        const buttonClass = `flex flex-col items-center justify-center gap-3 p-6 sm:p-8 rounded-xl border-2 text-center transition-all duration-200 min-h-[120px] hover:scale-105 transform ${status === "correct-selected" || status === "correct-unselected"
                            ? "bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-400 dark:text-green-300 shadow-lg"
                            : status === "incorrect-selected"
                                ? "bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-400 dark:text-red-300 shadow-lg"
                                : status === "neutral"
                                    ? theme === "dark"
                                        ? "bg-gray-800 border-gray-600 text-gray-500 opacity-60"
                                        : "bg-gray-50 border-gray-200 text-gray-400 opacity-60"
                                    : theme === "dark"
                                        ? "bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-blue-400 text-white hover:shadow-lg"
                                        : "bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-400 text-gray-900 hover:shadow-lg"
                        } disabled:cursor-not-allowed`
                        return (
                            <button
                                key={option.id}
                                onClick={() => handleSingleChoice(quiz.id, option.id)}
                                disabled={isAnswered || isSubmitting}
                                className={buttonClass}
                                style={{ backgroundColor: "transparent", backdropFilter: "blur(10px)" }}
                            >
                                {isTrue ? (
                                    <ThumbsUp size={32} className="text-green-500"/>
                                ) : (
                                    <ThumbsDown size={32} className="text-red-500"/>
                                )}
                                <span className="text-lg sm:text-xl font-semibold text-white">{option.answer_text}</span>
                                {isSubmitting && isSelected &&
                                    <Loader2 size={20} className="animate-spin text-blue-500"/>}
                                {status === "correct-selected" &&
                                    <Check size={24} className="text-green-500 animate-bounce"/>}
                                {status === "incorrect-selected" &&
                                    <X size={24} className="text-red-500 animate-bounce"/>}
                                {status === "correct-unselected" &&
                                    <Check size={24} className="text-green-500 animate-bounce"/>}
                            </button>
                        )
                    })}
                </div>
            )
        }

        return (
            <div className="grid gap-3 sm:gap-4">
                {quiz.answers.map((option) => {
                    const status = getOptionStatus(quiz.id, option.id, option.is_correct, quiz.question_type)
                    const isSelected = selectedForQuestion.includes(option.id)
                    const letterClass = `w-10 h-10 rounded-full flex items-center justify-center text-base font-bold transition-all duration-200 transform hover:scale-110 ${status === "correct-selected" || status === "correct-unselected"
                        ? "bg-green-500 text-white"
                        : status === "incorrect-selected"
                            ? "bg-red-500 text-white"
                            : status === "neutral"
                                ? theme === "dark"
                                    ? "bg-gray-600 text-gray-400"
                                    : "bg-gray-200 text-gray-400"
                                : theme === "dark"
                                    ? "bg-gray-600 text-gray-200"
                                    : "bg-gray-200 text-gray-600"
                    }`
                    return (
                        <button
                            key={option.id}
                            onClick={() => handleSingleChoice(quiz.id, option.id)}
                            disabled={isAnswered || isSubmitting}
                            className={getOptionStyles(status)}
                            style={{background: "transparent", color: "white", backdropFilter: "blur(50px)"}}
                        >
                            <div className="flex items-center space-x-3">
                                <div className={letterClass}>{option.letter}</div>
                                <span className="flex-1 text-base sm:text-lg">{option.answer_text}</span>
                            </div>
                            {isSubmitting && isSelected && <Loader2 size={20} className="animate-spin text-blue-500"/>}
                            {status === "correct-selected" &&
                                <Check size={22} className="text-green-500 animate-bounce"/>}
                            {status === "incorrect-selected" && <X size={22} className="text-red-500 animate-bounce"/>}
                            {status === "correct-unselected" &&
                                <Check size={22} className="text-green-500 animate-bounce"/>}
                        </button>
                    )
                })}
            </div>
        )
    }

    const handleStoryQuestionAnswer = async (questionId: number, answerIds: number[], textAnswer?: string) => {
        try {
            if (textAnswer) {
                await quizAPI.submitTextAnswers({
                    question: questionId,
                    written_answer: textAnswer,
                    duration: 2,
                })
            } else {
                await quizAPI.submitAnswers({
                    question: questionId,
                    selected_answer_ids: answerIds,
                    duration: 2,
                })
            }
        } catch (error) {
            console.error("Story question answer error:", error)
        }
    }

    const handleStoryClick = (groupedStory: GroupedStory) => {
        setSelectedUserStories(groupedStory.stories)
        setSelectedStoryIndex(0)
        setShowStoriesViewer(true)
    }

    const handleNotificationClick = (notification: Notification) => {
        if (notification.type === 'new_follower' && notification.actor) {
            window.location.href = `/profile/${notification.actor.username}`
        } else if (notification.content_type && notification.object_id) {
            if (notification.type === 'new_like' || notification.type === 'new_comment') {
                window.location.href = `/questions/${notification.object_id}`
            }
        }
    }

    const handleFollowUser = async (userId: number) => {
        try {
            console.log('Following user:', userId)
        } catch (error) {
            console.error('Error following user:', error)
        }
    }


    const handleCreateLiveQuiz = () => {
        window.location.href = '/create-live-quiz'
    }

    const getRandomLetter = () => {
        const letters = ['A', 'B', 'C', 'D']
        return letters[Math.floor(Math.random() * letters.length)]
    }

    const [floatingLetters, setFloatingLetters] = useState<
        Array<{ id: number; letter: string; x: number; y: number; opacity: number }>
    >([])

    useEffect(() => {
        const interval = setInterval(() => {
            setFloatingLetters((prev) => {
                const newLetters = [...prev]
                if (Math.random() > 0.7 && newLetters.length < 5) {
                    newLetters.push({
                        id: Date.now(),
                        letter: getRandomLetter(),
                        x: Math.random() * 60,
                        y: Math.random() * 60,
                        opacity: 1,
                    })
                }
                return newLetters.map((letter) => ({
                    ...letter,
                    y: letter.y - 0.5,
                    opacity: letter.opacity - 0.02,
                })).filter((letter) => letter.opacity > 0 && letter.y > -10)
            })
        }, 500)
        return () => clearInterval(interval)
    }, [])


    return (
        <div
            className={`min-h-screen transition-all duration-300 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
            }`}
        >
            <header
                className={`fixed top-0 left-0 right-0 backdrop-blur-lg border-b z-50 transition-all duration-300 ${theme === "dark" ? "bg-gray-800/80 border-gray-700" : "bg-white/80 border-gray-200"
                }`}
            >
                <div className="max-w-2xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <img src="/logo.jpg" alt="TestAbd" className="h-8 w-8 rounded-full"/>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Link to={"/leader-board"} title={"Leaderboard"} className={`px-2 py-1 font-semibold rounded-sm transition-all duration-200 hover:scale-110 transform text-xs border-2 border-blue-400 ${theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"
                            }`}>Meroschi</Link>
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 transform ${theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"
                                }`}
                            >
                                {theme === "dark" ? <Sun size={20}/> : <Moon size={20}/>}
                            </button>
                            <button
                                onClick={() => setShowNotifications(true)}
                                className={`relative p-2 rounded-lg transition-all duration-200 hover:scale-110 transform ${theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"
                                }`}
                            >
                                <Bell size={20}/>
                                {unreadCount > 0 && (
                                    <span
                                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            {activeToast && (
                <NotificationToast
                    notification={activeToast}
                    onClose={() => setActiveToast(null)}
                    theme={theme}
                />
            )}
            <section className="max-w-2xl mx-auto px-4 sm:px-6 pt-20 pb-4">
                <div className="flex space-x-4 pb-2">
                    <div className="flex-shrink-0">
                        <button
                            onClick={handleCreateLiveQuiz}
                            className="flex flex-col items-center space-y-2 hover:scale-105 transform transition-all duration-200"
                        >
                            <div
                                className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-200 hover:border-blue-500 ${theme === "dark" ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-gray-100"
                                }`}
                            >
                                <img
                                    src="/live-quiz.png"
                                    alt="Jonli viktorina"
                                    className="w-15 h-15 object-contain"
                                />
                            </div>
                            <span className="text-xs text-center max-w-[70px] truncate">Jonli</span>
                        </button>
                    </div>
                    {groupedStories.map((groupedStory, index) => (
                        <div key={`user-${groupedStory.user.id}`} className="flex-shrink-0">
                            {groupedStory.latestStory.type === "live_quiz" ? (
                                <button
                                    onClick={() => handleLiveQuizClick(groupedStory.latestStory.id)}
                                    className="flex flex-col items-center space-y-2 hover:scale-105 transform transition-all duration-200"
                                    style={{animationDelay: `${index * 100}ms`}}
                                >
                                    <div className="relative animate-slideInDown">
                                        <AnimatedLiveProfile
                                            profileImage={`https://backend.testabd.uz${groupedStory.user.profile_image || "/media/defaultuseravatar.png"}`}
                                            username={groupedStory.user.username}
                                            size={64}
                                        />
                                        {groupedStory.stories.length > 1 && (
                                            <div
                                                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce">
                                                {groupedStory.stories.length}
                                            </div>
                                        )}
                                    </div>
                                    <span
                                        className="text-xs text-center max-w-[70px] truncate">{groupedStory.user.username}</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleStoryClick(groupedStory)}
                                    className="flex flex-col items-center space-y-2 hover:scale-105 transform transition-all duration-200"
                                    style={{animationDelay: `${index * 100}ms`}}
                                >
                                    <div className="relative animate-slideInDown">
                                        <div
                                            className={`w-16 h-16 rounded-full p-0.5 ${groupedStory.latestStory.type === "test"
                                                ? "bg-gradient-to-tr from-blue-400 to-purple-600"
                                                : "bg-gradient-to-tr from-green-400 to-blue-500"
                                            }`}
                                        >
                                            <div
                                                className={`w-full h-full rounded-full overflow-hidden border-2 ${theme === "dark" ? "border-gray-800" : "border-white"}`}
                                            >
                                                <img
                                                    src={`https://backend.testabd.uz${groupedStory.user.profile_image || "/media/defaultuseravatar.png"}`}
                                                    alt={groupedStory.user.username}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        {groupedStory.stories.length > 1 && (
                                            <div
                                                className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce">
                                                {groupedStory.stories.length}
                                            </div>
                                        )}
                                    </div>
                                    <span
                                        className="text-xs text-center max-w-[70px] truncate">{groupedStory.user.username}</span>
                                    <div
                                        className={`text-xs px-2 py-0.5 rounded-full ${groupedStory.latestStory.type === "test"
                                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                                            : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300"
                                        }`}
                                    >
                                        {groupedStory.latestStory.type === "test" ? "Test" : "Savol"}
                                    </div>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </section>
            {showStoriesViewer && (
                <StoriesViewer
                    stories={selectedUserStories}
                    initialIndex={selectedStoryIndex}
                    onClose={() => setShowStoriesViewer(false)}
                    theme={theme}
                    onQuestionAnswer={handleStoryQuestionAnswer}
                />
            )}
            <main className="max-w-2xl mx-auto px-4 sm:px-6 pb-24">
                {showUserProfiles && (
                    <section className="mb-8">
                        <UserProfilesSection
                            theme={theme}
                            onFollowUser={handleFollowUser}
                        />
                    </section>
                )}
                <section className="space-y-6">
                    {quizzes.map((quiz, index) => (
                        <article
                            key={`quiz-${quiz.id}-${index}`}
                            className={`rounded-2xl bg-gradient-to-b from-black/30 via-black/50 to-black/70 shadow-lg border transition-all duration-200 hover:scale-[1.02] transform animate-slideInUp ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                            }`}
                            style={{
                                backgroundImage: `url(${quiz.round_image || "/placeholder.svg?height=800&width=400"})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                backgroundRepeat: "no-repeat",
                                animationDelay: `${index * 100}ms`,
                            }}
                        >
                            <div className={"flex flex-col w-full h-full p-4 sm:p-6 rounded-2xl"} style={{backgroundColor: "rgba(0,0,0,0.65)"}}>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-6">
                                    <div className="flex items-center space-x-3">
                                        <a href={`/profile/${quiz.user?.username}`}>
                                            <div
                                                className="flex items-center space-x-3 hover:scale-105 transform transition-all duration-200">
                                                <div
                                                    className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ring-1 ring-white`}
                                                >
                                                    {quiz.user.profile_image ? (
                                                        <img
                                                            src={quiz.user.profile_image || "/media/defaultuseravatar.png"}
                                                            alt="avatar"
                                                            className="object-cover w-full h-full"
                                                        />
                                                    ) : (
                                                        <span className="text-lg font-bold text-gray-600">
                            {quiz.user.username.charAt(0).toUpperCase()}
                          </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-1">
                          <span
                              className={`font-semibold text-sm text-white`}
                          >
                            {quiz.user.username}
                          </span>
                                                        {quiz.user.is_badged && <CheckCircle size={16}
                                                                                             className="text-blue-500 animate-pulse"/>}
                                                    </div>
                                                    <div
                                                        className={`text-xs text-gray-200`}
                                                    >
                                                        {new Date(quiz.created_at).toLocaleDateString("uz-UZ")}
                                                    </div>
                                                </div>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <h2
                                        className={`text-lg sm:text-xl font-semibold mb-6 leading-relaxed text-white`}
                                    >
                                        {quiz.question_text}
                                    </h2>
                                    {renderQuestionContent(quiz)}
                                </div>
                                <div
                                    className={`flex flex-row justify-between sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 border-t mb-2 ${theme === "dark" ? "border-gray-700" : "border-gray-200"
                                    }`}
                                >
                                    <div className="flex space-x-6 w-auto">
                                        <div className="flex items-center space-x-2 text-green-600">
                                            <div
                                                className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                                                <span className="text-white text-sm font-bold">✓</span>
                                            </div>
                                            <span className="font-semibold text-base">{quiz.correct_count}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-red-600">
                                            <div
                                                className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                                                <span className="text-white text-sm font-bold">✗</span>
                                            </div>
                                            <span className="font-semibold text-base">{quiz.wrong_count}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end space-x-3 w-auto">
                                        <button
                                            className={`p-3 rounded-full transition-all bg-transparent backdrop-blur border border-white duration-200 hover:scale-110 transform `}
                                            onClick={() => shareQuestion(quiz.id)}
                                        >
                                            <Share size={20} className={"text-white"}/>
                                        </button>
                                        <button
                                            onClick={() => saveQuiz(quiz.id)}
                                            className={`p-3 rounded-full transition-all border border-white backdrop-blur duration-200 hover:scale-110 transform`}
                                        >
                                            <Bookmark
                                                size={20}
                                                className={
                                                    quiz.is_bookmarked
                                                        ? "text-yellow-500 fill-current animate-bounce"
                                                        : theme === "dark"
                                                            ? "text-white"
                                                            : "text-white"
                                                }
                                            />
                                        </button>
                                    </div>
                                </div>
                                <div className={"flex flex-col items-start justify-center gap-1"}>
                                    <span className={"text-white"}>{quiz.category?.name}</span>
                                    <span
                                        className={`text-sm ${theme === "dark" ? "text-white" : "text-white"}`}>{quiz.test_title}</span>
                                    {quiz.test_description && (
                                        <ExpandableText text={`${quiz.test_description}`}/>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
                {nextPageUrl && (
                    <div className="text-center mt-8 mb-8">
                        <button
                            onClick={() => fetchQuizzes(nextPageUrl)}
                            disabled={loading}
                            className={`px-8 py-4 text-base sm:text-lg font-semibold rounded-full transition-all duration-200 disabled:opacity-50 hover:scale-105 transform hover:shadow-lg ${theme === "dark" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
                            }`}
                        >
                            {loading ? (
                                <div className="flex items-center space-x-2">
                                    <Loader2 size={20} className="animate-spin"/>
                                    <span>Yuklanmoqda...</span>
                                </div>
                            ) : (
                                "Ko'proq yuklash"
                            )}
                        </button>
                    </div>
                )}
            </main>
            <NotificationModal
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                theme={theme}
                notifications={notifications}
                unreadCount={unreadCount}
                onNotificationClick={handleNotificationClick}
                onMarkAsRead={markAsRead}
            />
        </div>
    )
}

export default HomePage