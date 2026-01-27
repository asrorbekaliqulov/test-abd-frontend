"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Users, Clock, ChevronRight } from "lucide-react";
import { searchAPI } from "../utils/api";

interface User {
  id: string;
  username: string;
  avatar?: string | null;
  status?: "online" | "offline" | "away";
  lastSeen?: Date;
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  useEffect(() => {
    if (recentSearches.length > 0) {
      localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
    }
  }, [recentSearches]);

  const addToRecentSearches = (query: string) => {
    if (query.trim()) {
      setRecentSearches((prev) => {
        const filtered = prev.filter((item) => item !== query);
        return [query, ...filtered].slice(0, 5);
      });
    }
  };
  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const getColorFromString = (str: string) => {
    const colors = [
      "bg-red-500",
      "bg-green-500",
      "bg-blue-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const response = await searchAPI.searchAll(searchQuery);

      if (response?.success) {
        const apiUsers = response.data?.users?.users || [];

        const filteredUsers = apiUsers.filter((u: any) =>
          u.username?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const mappedUsers = filteredUsers.map((u: any) => ({
          id: String(u.id),
          username: u.username,
          avatar: u.profile_image || null,
        }));

        setUsers(mappedUsers);
        addToRecentSearches(searchQuery);
      }
    } catch (error) {
      console.error("Search users error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) performSearch();
  };

  const handleClearSearch = () => {
    setSearchQuery("")
    setUsers([])
    setHasSearched(false)
  }
  

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const hasSearchQuery = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 pt-20">
        <div className="mb-6">
          <div className="flex space-x-3 mb-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && performSearch()}
                placeholder="Qidirish..."
                className="w-full pl-12 pr-10 py-3 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {hasSearchQuery ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {loading ? "Qidirilmoqda..." : "Foydalanuvchilar"}
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : hasSearched && users.length > 0 ? (
              <div className="space-y-3 pb-4">
                {users.map((user, index) => (
                  <div
                    key={`user-${user.id}-${index}`}
                    onClick={() => navigate(`/profile/${user.username}`)}
                    className="flex items-center space-x-3 p-4 rounded-xl border border-gray-800 transition-all duration-300 cursor-pointer hover:border-green-500 hover:bg-gray-800/50"
                  >
                    <div className="relative">
                      {user.avatar ? (
                        <img
                          src={`https://backend.testabd.uz${user.avatar}`}
                          alt={user.username}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-gray-700 ${getColorFromString(
                            user.username
                          )}`}
                        >
                          {getInitials(user.username)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-white">
                          {user.username}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-400">@{user.username}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-600" />
                  </div>
                ))}
              </div>
            ) : hasSearched ? (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">Foydalanuvchi topilmadi</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-6">
            {recentSearches.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    Oxirgi qidiruvlar
                  </h3>
                  <button
                    onClick={handleClearRecentSearches}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Tozalash
                  </button>
                </div>
                <div className="space-y-2 pb-4">
                  {recentSearches.map((searchTerm, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(searchTerm)}
                      className="w-full text-left p-3 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-white">{searchTerm}</span>
                      </div>
                      <ChevronRight size={16} className="text-gray-600" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto mb-4 text-blue-500" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Qidiruvni boshlang
                </h3>
                <p className="text-gray-400">
                  Foydalanuvchilarni topish uchun qidiring
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
