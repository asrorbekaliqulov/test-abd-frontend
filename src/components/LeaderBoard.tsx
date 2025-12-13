"use client";

import React, {useEffect, useMemo, useState, useRef, useCallback} from "react";
import api from "../utils/api";
import {ArrowLeft, Search} from "lucide-react";
import {useNavigate} from "react-router-dom";
import rank1Img from "./assets/images/rank1.png";
import rank2Img from "./assets/images/rank2.png";
import rank3Img from "./assets/images/rank3.png";
import defaultUserAvatar from "../components/assets/images/defaultuseravatar.png";

interface LeaderboardUser {
    id: number;
    username: string;
    profile_image?: string;
    coins: number;
    is_following?: boolean;
    is_self?: boolean; // backend flag for current user
}

const useDebounce = (value: string, delay = 250) => {
    const [debounced, setDebounced] = useState(value);
    React.useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value]);
    return debounced;
};

const Leaderboard: React.FC = () => {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [currentUserId, setCurrentUserId] = useState<number>(0);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const debouncedSearch = useDebounce(search);
    const navigate = useNavigate();

    const loadUsers = async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            const res = await api.get(`/accounts/leaderboard/?page=${page}`);
            const list: LeaderboardUser[] = res.data.results || [];

            // Remove duplicates by ID
            const existingIds = new Set(users.map(u => u.id));
            const newUsers = list.filter(u => !existingIds.has(u.id));

            const combined = [...users, ...newUsers];

            // Sort globally by coins
            combined.sort((a, b) => b.coins - a.coins);

            setUsers(combined);
            setPage(prev => prev + 1);
            setHasMore(res.data.next !== null);

            // Set current user
            if (!currentUserId) {
                const me = combined.find(u => u.is_self);
                if (me) setCurrentUserId(me.id);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filtered = useMemo(() => {
        return users.filter(u =>
            u.username.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [debouncedSearch, users]);

    const toggleFollow = async (user: LeaderboardUser) => {
        if (user.id === currentUserId) return;

        setUsers(prev =>
            prev.map(u => u.id === user.id ? {...u, is_following: !u.is_following} : u)
        );

        try {
            await api.post(`/accounts/followers/${user.id}/toggle/`, {});
        } catch (err) {
            console.error(err);
            // revert on error
            setUsers(prev =>
                prev.map(u => u.id === user.id ? {...u, is_following: user.is_following} : u)
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

    return (
        <div className="p-3 sm:p-4 bg-[#111827] min-h-screen">

            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 w-full justify-between py-3">
                <button
                    onClick={() => navigate("/")}
                    className="border border-gray-600 p-1 sm:p-2 rounded-lg"
                >
                    <ArrowLeft className="text-white"/>
                </button>
                {/* Search */}
                <div
                    className="w-[85%] border bg-[#1f2937] border-gray-700 flex flex-row items-center justify-center px-3 gap-1 rounded-lg">
                    <Search className="text-gray-400 sm:top-2.5" size={18}/>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full p-2 sm:p-2.5 bg-transparent outline-none text-white"
                    />
                </div>
                <h1 className="text-white text-2xl sm:text-3xl font-bold">Meroschi</h1>
            </div>

            {/* Top 3 */}
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
                            className={`flex flex-col items-center cursor-pointer py-6 ${idx === 0 ? "scale-110 md:scale-125" : ""} ${orderClass}`}
                            title={user.username}
                        >
                            {/* Avatar / Rank Image */}
                            <div className={`
                                rounded-full shadow-xl
                                flex items-center justify-center overflow-hidden
                                ${sizeClass}
                            `}>
                                <img src={rankImg} alt={`Rank ${idx + 1}`} loading={"lazy"} decoding={"async"} draggable={false} className="w-full h-full object-cover" />
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

                            {/* Coins */}
                            <span className={`text-gray-200 font-bold text-xs`}>
                              🪙{user.coins}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Other Users */}
            {filtered.slice(3).map((u, index) => {
                const isLast = index === filtered.slice(3).length - 1;
                return (
                    <div
                        key={u.id}
                        ref={isLast ? lastUserRef : null}
                        title={u.username}
                        className="flex flex-row items-center cursor-pointer justify-between bg-[#1f2937] p-3 sm:p-4 rounded-xl border border-gray-700 mb-2 hover:bg-[#263143] transition"
                    >
                        {/* Left: Rank + Avatar + Username */}
                        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto mb-2 sm:mb-0">
                <span
                    className="text-gray-400 text-base sm:text-2xl font-bold w-7 sm:w-8 flex justify-center"
                >
                    {index + 4}
                </span>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <img
                                    src={u.profile_image || defaultUserAvatar}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = defaultUserAvatar;
                                    }}
                                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border border-gray-600 object-cover"
                                    alt={u.username}
                                />
                                <span className="text-white text-xs sm:text-sm md:text-base font-medium">{u.username}</span>
                                <span className="text-yellow-400 text-xs sm:text-sm md:text-base font-semibold">🪙 {u.coins}</span>
                            </div>
                        </div>

                        {/* Right: Follow Button */}
                        {u.id !== currentUserId && (
                            <button
                                onClick={() => toggleFollow(u)}
                                className={`
                        px-2 sm:px-3 md:px-4 py-1 rounded-md font-medium text-xs sm:text-sm md:text-base transition
                        ${u.is_following ? "bg-gray-500 text-gray-200 hover:bg-gray-600" : "bg-blue-500 text-white hover:bg-blue-600"}
                    `}
                            >
                                {u.is_following ? "Unfollow" : "Follow"}
                            </button>
                        )}
                    </div>
                );
            })}

            {loading && <p className="text-center text-gray-400 mt-4">Loading...</p>}
            {filtered.length === 0 && !loading &&
                <p className="text-center text-gray-400 mt-10 text-sm sm:text-base">User topilmadi.</p>}
        </div>
    );
};

export default Leaderboard;
