"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { accountsAPI, LeaderboardUser as LeaderboardUserType, APIResponse } from "../utils/api"; // API import
import { ArrowLeft, Search, RefreshCw, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import rank1Img from "./assets/images/rank1.png";
import rank2Img from "./assets/images/rank2.png";
import rank3Img from "./assets/images/rank3.png";
import defaultUserAvatar from "../components/assets/images/defaultuseravatar.png";

// Interface - API bilan bir xil bo'lishi kerak
interface LeaderboardUser {
    id: number;
    username: string;
    profile_image?: string;
    coins: number;
    is_following?: boolean;
    is_self?: boolean;
    views?: number;
    online?: boolean;
    last_seen?: string;
}

const useDebounce = (value: string, delay = 250) => {
    const [debounced, setDebounced] = useState(value);
    React.useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
};

const Leaderboard: React.FC = () => {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [currentUserId, setCurrentUserId] = useState<number>(0);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCoins: 0,
        avgCoins: 0,
        activeUsers: 0,
    });

    const debouncedSearch = useDebounce(search);
    const navigate = useNavigate();
    const refreshIntervalRef = useRef<NodeJS.Timeout>();

    // API orqali leaderboard ma'lumotlarini olish
    const fetchLeaderboardData = async (pageNum: number = 1): Promise<APIResponse<any>> => {
        try {
            const response = await accountsAPI.getLeaderboard();
            return response;
        } catch (error) {
            console.error("Leaderboard ma'lumotlarini olishda xatolik:", error);
            return {
                success: false,
                error: "Ma'lumotlarni olishda xatolik",
            };
        }
    };

    // Follow/Unfollow funksiyasi
    const toggleFollowUser = async (userId: number): Promise<APIResponse<any>> => {
        try {
            const response = await accountsAPI.toggleFollow(userId);
            return response;
        } catch (error) {
            console.error("Follow/unfollow xatosi:", error);
            return {
                success: false,
                error: "Follow amalini bajarishda xatolik",
            };
        }
    };

    // Yangilash funksiyasi
    const refreshLeaderboard = async (silent = false) => {
        if (!silent) {
            setRefreshing(true);
        }

        try {
            // Faqat 1-sahifani yangilash
            const res = await fetchLeaderboardData(1);

            if (res.success && res.data) {
                const newUsers: LeaderboardUser[] = res.data.results || res.data || [];

                // Stats hisoblash
                const totalCoins = newUsers.reduce((sum, user) => sum + user.coins, 0);
                const avgCoins = newUsers.length > 0 ? Math.round(totalCoins / newUsers.length) : 0;

                setUsers(newUsers);
                setPage(2); // Keyingi sahifa 2 bo'ladi
                setHasMore(!!res.data.next);

                setStats({
                    totalUsers: newUsers.length,
                    totalCoins,
                    avgCoins,
                    activeUsers: Math.floor(newUsers.length * 0.3),
                });
                setLastUpdated(new Date());
            } else {
                console.error("Leaderboard yangilashda xatolik:", res.error);
            }
        } catch (err) {
            console.error("Error refreshing leaderboard:", err);
        } finally {
            if (!silent) {
                setRefreshing(false);
            }
        }
    };

    // Dastlabki yuklash va keyingi sahifalar
    const loadUsers = async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            const res = await fetchLeaderboardData(page);

            if (res.success && res.data) {
                const list: LeaderboardUser[] = res.data.results || res.data || [];

                // Remove duplicates by ID
                const existingIds = new Set(users.map(u => u.id));
                const newUsers = list.filter(u => !existingIds.has(u.id));

                const combined = [...users, ...newUsers];

                // Sort globally by coins
                combined.sort((a, b) => b.coins - a.coins);

                setUsers(combined);
                setPage(prev => prev + 1);
                setHasMore(!!res.data.next);

                // Set current user
                if (!currentUserId) {
                    const me = combined.find(u => u.is_self);
                    if (me) setCurrentUserId(me.id);
                }

                // Stats hisoblash
                const totalCoins = combined.reduce((sum, user) => sum + user.coins, 0);
                const avgCoins = combined.length > 0 ? Math.round(totalCoins / combined.length) : 0;

                setStats({
                    totalUsers: combined.length,
                    totalCoins,
                    avgCoins,
                    activeUsers: Math.floor(combined.length * 0.3),
                });
            }
        } catch (err) {
            console.error("Leaderboard yuklashda xatolik:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
        const interval = setInterval(() => refreshLeaderboard(true), 30000);
        refreshIntervalRef.current = interval;

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, []);

    // Manual refresh
    const handleManualRefresh = async () => {
        await refreshLeaderboard();
    };

    const filtered = useMemo(() => {
        const uniqueUsers = Array.from(new Map(users.map(user => [user.id, user])).values());
        return uniqueUsers.filter(u =>
            u.username.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [debouncedSearch, users]);

    const toggleFollow = async (user: LeaderboardUser) => {
        if (user.id === currentUserId) return;

        // Optimistic update
        const originalState = user.is_following;
        setUsers(prev =>
            prev.map(u => u.id === user.id ? { ...u, is_following: !u.is_following } : u)
        );

        try {
            const response = await toggleFollowUser(user.id);
            if (!response.success) {
                // revert on error
                setUsers(prev =>
                    prev.map(u => u.id === user.id ? { ...u, is_following: originalState } : u)
                );
            }
        } catch (err) {
            console.error("Follow/unfollow xatosi:", err);
            // revert on error
            setUsers(prev =>
                prev.map(u => u.id === user.id ? { ...u, is_following: originalState } : u)
            );
        }
    };

    // Infinite scroll observer
    const observer = useRef<IntersectionObserver>();
    const lastUserRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadUsers();
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    const top3Users = filtered.slice(0, 3);

    // Format time
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Format last seen
    const formatLastSeen = (lastSeen?: string) => {
        if (!lastSeen) return "Noma'lum";
        const date = new Date(lastSeen);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Hozir";
        if (diffMins < 60) return `${diffMins} min oldin`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} soat oldin`;
        return `${Math.floor(diffMins / 1440)} kun oldin`;
    };

    return (
        <div className="p-3 sm:p-4 bg-[#111827] min-h-screen">

            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 w-full justify-between py-3">
                <button
                    onClick={() => navigate("/")}
                    className="border border-gray-600 p-1 sm:p-2 rounded-lg hover:bg-gray-800 transition"
                >
                    <ArrowLeft className="text-white" />
                </button>

                {/* Search */}
                <div className="w-[85%] border bg-[#1f2937] border-gray-700 flex flex-row items-center justify-center px-3 gap-1 rounded-lg">
                    <Search className="text-gray-400 sm:top-2.5" size={18} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full p-2 sm:p-2.5 bg-transparent outline-none text-white placeholder-gray-500"
                    />
                </div>

                {/* Refresh Button */}
                <button
                    onClick={handleManualRefresh}
                    disabled={refreshing}
                    className="border border-gray-600 p-1 sm:p-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                    title="Yangilash"
                >
                    <RefreshCw className={`text-white ${refreshing ? 'animate-spin' : ''}`} size={18} />
                </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                <div className="bg-[#1f2937] p-3 rounded-lg border border-gray-700">
                    <div className="text-gray-400 text-xs">Jami Userlar</div>
                    <div className="text-white text-lg font-bold">{stats.totalUsers}</div>
                </div>
                <div className="bg-[#1f2937] p-3 rounded-lg border border-gray-700">
                    <div className="text-gray-400 text-xs">Aktiv Userlar</div>
                    <div className="text-green-400 text-lg font-bold">{stats.activeUsers}</div>
                </div>
                <div className="bg-[#1f2937] p-3 rounded-lg border border-gray-700">
                    <div className="text-gray-400 text-xs">Umumiy Coinlar</div>
                    <div className="text-yellow-400 text-lg font-bold">{stats.totalCoins}</div>
                </div>
                <div className="bg-[#1f2937] p-3 rounded-lg border border-gray-700">
                    <div className="text-gray-400 text-xs">O'rtacha Coin</div>
                    <div className="text-blue-400 text-lg font-bold">{stats.avgCoins}</div>
                </div>
            </div>

            {/* Last Updated */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-white text-2xl sm:text-3xl font-bold">Meroschi</h1>
                <div className="text-gray-400 text-sm">
                    Yangilandi: {formatTime(lastUpdated)}
                </div>
            </div>

            {/* Top 3 */}
            {top3Users.length > 0 && (
                <div className="w-full flex flex-row items-end justify-center gap-4 sm:gap-6 md:gap-10 py-6">
                    {top3Users.map((user, idx) => {
                        let orderClass = "";
                        if (idx === 0) orderClass = "order-2";
                        else if (idx === 1) orderClass = "order-1";
                        else if (idx === 2) orderClass = "order-3";

                        let rankImg = "";
                        if (idx === 0) rankImg = rank1Img;
                        else if (idx === 1) rankImg = rank2Img;
                        else if (idx === 2) rankImg = rank3Img;

                        const sizeClass = idx === 0
                            ? "w-24 h-24 sm:w-40 sm:h-40 md:w-32 md:h-32"
                            : "w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28";
                        const textSizeClass = idx === 0
                            ? "text-lg sm:text-xl md:text-2xl"
                            : "text-md sm:text-lg md:text-xl";

                        return (
                            <div
                                key={user.id}
                                className={`flex flex-col items-center cursor-pointer py-6 relative ${idx === 0 ? "scale-110 md:scale-125" : ""} ${orderClass}`}
                                title={user.username}
                            >
                                {/* Avatar / Rank Image */}
                                <div className={`
                  rounded-full shadow-xl
                  flex items-center justify-center overflow-hidden
                  ${sizeClass}
                `}>
                                    <img
                                        src={rankImg}
                                        alt={`Rank ${idx + 1}`}
                                        loading="lazy"
                                        decoding="async"
                                        draggable={false}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Username */}
                                <div className={`
                  w-20 sm:w-24 md:w-32 text-center mt-1 sm:mt-2 md:mt-3
                  py-1 rounded-xl font-semibold shadow-md
                  ${textSizeClass} text-white
                `}
                                     style={{ fontFamily: "Z003, sans-serif" }}>
                                    {user.username}
                                </div>

                                {/* Coins & Stats */}
                                <div className="flex flex-col items-center mt-1">
                  <span className="text-yellow-400 font-bold text-xs">
                    🪙{user.coins}
                  </span>
                                    {user.views !== undefined && (
                                        <span className="text-blue-400 text-xs">
                      👁 {user.views}
                    </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Other Users */}
            {filtered.slice(3).map((u, index) => {
                const isLast = index === filtered.slice(3).length - 1;
                const rank = index + 4;

                // Rank ranglari
                const getRankColor = (rank: number) => {
                    if (rank <= 10) return "text-yellow-500";
                    if (rank <= 50) return "text-blue-400";
                    if (rank <= 100) return "text-green-400";
                    return "text-gray-400";
                };

                return (
                    <div
                        key={u.id}
                        ref={isLast ? lastUserRef : null}
                        title={u.username}
                        className="flex flex-row items-center cursor-pointer justify-between bg-[#1f2937] p-3 sm:p-4 rounded-xl border border-gray-700 mb-2 hover:bg-[#263143] transition group"
                    >
                        {/* Left: Rank + Avatar + Username */}
                        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto mb-2 sm:mb-0">
                            <div className="flex items-center gap-2">
                                {/* Rank Number */}
                                <span className={`text-base sm:text-2xl font-bold w-7 sm:w-8 flex justify-center ${getRankColor(rank)}`}>
                  {rank}
                </span>

                                {/* Avatar */}
                                <div className="relative">
                                    <img
                                        src={u.profile_image || defaultUserAvatar}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = defaultUserAvatar;
                                        }}
                                        className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 object-cover border-gray-600`}
                                        alt={u.username}
                                    />
                                </div>

                                {/* Username & Info */}
                                <div className="flex flex-col">
                  <span className="text-white text-xs sm:text-sm md:text-base font-medium flex items-center gap-1">
                    {u.username}
                      {u.is_self && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Siz</span>
                      )}
                  </span>

                                    {/* Stats Row */}
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <span className="text-yellow-400 font-semibold">🪙 {u.coins}</span>
                                        {u.views !== undefined && (
                                            <span className="text-blue-400">👁 {u.views}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Follow Button */}
                        {u.id !== currentUserId && (
                            <button
                                onClick={() => toggleFollow(u)}
                                className={`
                  px-2 sm:px-3 md:px-4 py-1 rounded-md font-medium text-xs sm:text-sm md:text-base transition
                  ${u.is_following
                                    ? "bg-gray-500 text-gray-200 hover:bg-gray-600"
                                    : "bg-blue-500 text-white hover:bg-blue-600"
                                }
                  opacity-0 group-hover:opacity-100 transition-opacity
                `}
                            >
                                {u.is_following ? "Unfollow" : "Follow"}
                            </button>
                        )}
                    </div>
                );
            })}

            {/* Loading & Status */}
            {loading && (
                <div className="flex justify-center items-center mt-4">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400 ml-2">Yuklanmoqda...</span>
                </div>
            )}

            {refreshing && (
                <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <RefreshCw className="animate-spin" size={16} />
                    <span>Yangilanmoqda...</span>
                </div>
            )}

            {filtered.length === 0 && !loading && (
                <div className="text-center text-gray-400 mt-10 text-sm sm:text-base">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <p>User topilmadi.</p>
                    <p className="text-xs mt-2">Iltimos, qidiruvni o'zgartiring yoki keyinroq urinib ko'ring.</p>
                </div>
            )}

            {/* Auto-refresh Info */}
            <div className="text-center text-gray-500 text-xs mt-6">
                Leaderboard har 30 soniyada avtomatik yangilanadi
            </div>
        </div>
    );
};

export default Leaderboard;