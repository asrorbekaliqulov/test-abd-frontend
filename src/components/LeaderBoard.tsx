import React, { useEffect, useState } from "react";
import api, { tokenManager } from "../utils/api";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LeaderboardUser {
    id: number;
    page: number;
    username: string;
    profile_image?: string;
    coins: number;
    created_tests: number;
    yesterday_rank?: number;
    today_rank?: number;
    is_following?: boolean;
}

const Leaderboard: React.FC = () => {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const navigate = useNavigate();

    const loadLeaderboard = async (page: number = 1) => {
        setLoading(true);
        setError(null);
        try {
            const token = tokenManager.getAccessToken();
            const response = await api.get(`/accounts/leaderboard/?page=${page}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            const results: LeaderboardUser[] = response.data.results || [];
            setLeaderboardData(results.sort((a, b) => b.created_tests - a.created_tests));
            setCurrentPage(page);

            const count = response.data.count || results.length;
            const pageSize = results.length || 10;
            setTotalPages(Math.ceil(count / pageSize));

        } catch (err: any) {
            console.error("Leaderboard error:", err);
            setError(err.response?.data?.detail || err.message || "Leaderboard yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeaderboard(currentPage);
    }, []);

    const toggleFollow = async (user: LeaderboardUser) => {
        try {
            const token = tokenManager.getAccessToken();
            if (!token) return;
            const res = await api.post(
                `/accounts/followers/${user.id}/toggle/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setLeaderboardData((prev) =>
                prev.map((u) =>
                    u.id === user.id ? { ...u, is_following: res.data.is_following } : u
                )
            );
        } catch (err) {
            console.error("Follow toggle error:", err);
        }
    };

    const getMedal = (rank: number) => {
        switch (rank) {
            case 1: return "🥇";
            case 2: return "🥈";
            case 3: return "🥉";
            default: return rank;
        }
    };

    const getRankChange = (today?: number, yesterday?: number) => {
        if (today === undefined || yesterday === undefined) return "–";
        if (today < yesterday)
            return <span className="flex items-center justify-center text-green-400"><TrendingUp /></span>;
        if (today > yesterday)
            return <span className="flex items-center justify-center text-red-400"><TrendingDown /></span>;
        return <span className="flex items-center justify-center text-gray-400">–</span>;
    };

    if (loading) return <div className="text-white text-center py-10">Loading leaderboard...</div>;
    if (error) return <div className="text-red-500 text-center py-10">{error}</div>;

    return (
        <div className="max-w-full mx-auto p-4 bg-[#111827] shadow-lg">
            <div className="flex flex-row items-center justify-between mb-6">
                <button
                    onClick={() => navigate("/")}
                    title={"Back"}
                    className="border border-gray-600 p-2 rounded-lg"
                >
                    <ArrowLeft style={{ color: "white" }} />
                </button>
                <h2 className="text-3xl font-bold text-center text-white">Meroschi</h2>
            </div>

            {leaderboardData.length === 0 ? (
                <div className="text-gray-400 text-center">Hozircha leaderboardda ma'lumot yo'q.</div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-[700px] w-full text-left border-collapse">
                            <thead className="bg-[#111827] text-gray-300">
                            <tr className="border border-gray-600">
                                <th className="py-3 px-4">Rank</th>
                                <th className="py-3 px-4">User</th>
                                <th className="py-3 px-4 text-center">Coins</th>
                                <th className="py-3 px-4 text-center">Created Tests</th>
                                <th className="py-3 px-4 text-center">Yesterday Rank</th>
                                <th className="py-3 px-4 text-center">Change</th>
                                <th className="py-3 px-4 text-center"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {leaderboardData.map((user, index) => (
                                <tr
                                    key={user.id}
                                    className="even:bg-[#111827] odd:bg-[#111827] hover:bg-[#222929] transition-colors border border-gray-600"
                                >
                                    <td className="py-3 px-4 text-yellow-300 font-bold">{getMedal(index + 1 + (currentPage - 1) * 10)}</td>
                                    <td className="py-3 px-4 flex items-center gap-3 text-white">
                                        {user.profile_image && (
                                            <img
                                                src={user.profile_image}
                                                alt={user.username}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        )}
                                        <span>{user.username}</span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-200 text-center">{user.coins}</td>
                                    <td className="py-3 px-4 text-gray-200 text-center">{user.created_tests}</td>
                                    <td className="py-3 px-4 text-gray-200 text-center">{user.yesterday_rank ?? "-"}</td>
                                    <td className="py-3 px-4 text-center">{getRankChange(user.today_rank, user.yesterday_rank)}</td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => toggleFollow(user)}
                                            className={`px-3 py-1 w-auto text-center rounded-md font-medium transition-colors ${
                                                user.is_following
                                                    ? "bg-gray-500 text-gray-100 hover:bg-gray-600"
                                                    : "bg-blue-500 text-white hover:bg-blue-600"
                                            }`}
                                        >
                                            {user.is_following ? "Unfollow" : "Follow"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex justify-center gap-4 mt-4">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => loadLeaderboard(currentPage - 1)}
                            className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-white flex items-center">Page {currentPage} / {totalPages}</span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => loadLeaderboard(currentPage + 1)}
                            className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Leaderboard;
