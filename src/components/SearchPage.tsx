"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  Filter,
  X,
  TrendingUp,
  Users,
  BookOpen,
  ChevronRight,
  HelpCircle,
  Calendar,
  MessageCircle,
  Play,
} from "lucide-react"
import { useSearch, quizAPI } from "../utils/api"

interface SearchPageProps {
  theme?: string
}

interface Category {
  id: number
  title: string
  icon: string
  image?: string
  description: string
  total_questions: string
}

interface ApiQuestion {
  id: number
  question_text: string
  difficulty_percentage: number
  created_at: string
}

interface ApiTest {
  id: number
  title: string
  description: string
  correct_count: number
  difficulty_percentage: number
  created_at?: string
  questions_count?: number
  category?: string
}

interface ApiUser {
  id: number
  username: string
  first_name?: string
  last_name?: string
  profile_image?: string
  followers_count?: number
  is_verified?: boolean
}

interface ApiResponse {
  tests: ApiTest[]
  questions: ApiQuestion[]
  users: ApiUser[]
}

const SearchPage: React.FC<SearchPageProps> = ({ theme = "light" }) => {
  const navigate = useNavigate()
  const { search, loading, data, error } = useSearch()
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([
    "JavaScript basics",
    "React hooks",
    "CSS flexbox",
    "Python programming",
    "Data structures",
  ])
  const [isSearching, setIsSearching] = useState(false)

  // Filter states
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("popular")
  const [dateRange, setDateRange] = useState("all")

  const [categories, setCategories] = useState<Category[]>([])

  const trendingSearches = [
    "JavaScript ES6",
    "React Native",
    "Machine Learning",
    "Web Development",
    "Data Science",
    "Mobile Development",
  ]



  // Initialize categories (this could be fetched from an API)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await quizAPI.fetchCategories()
        setCategories(response.data)
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    fetchCategories()
  }, [])

  // Perform search when filters change
  useEffect(() => {
    if (searchQuery.trim() || activeCategory) {
      performSearch()
    }
  }, [searchQuery, activeCategory, selectedDifficulty, selectedType, sortBy, dateRange])

  const performSearch = async () => {
    setIsSearching(true)
    const searchParams: any = {}

    if (searchQuery.trim()) {
      searchParams.query = searchQuery
    }

    if (activeCategory) {
      searchParams.category = activeCategory
    }

    if (selectedType.length > 0) {
      searchParams.type = selectedType[0] // API might accept only one type
    }

    if (dateRange !== "all") {
      searchParams.period = dateRange
    }

    if (sortBy !== "popular") {
      searchParams.sort_by = sortBy
    }

    try {
      await search(searchParams)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      addToHistory(query)
    }
  }

  const addToHistory = (query: string) => {
    if (query.trim() && !searchHistory.includes(query)) {
      setSearchHistory((prev) => [query, ...prev.slice(0, 4)])
    }
  }

  const handleCategoryClick = (categoryId: number) => {
    setActiveCategory(activeCategory === categoryId ? null : categoryId)
  }

  const handleQuestionClick = (question: ApiQuestion) => {
    // Navigate to quiz page with the specific question
    navigate(`/quiz?questionId=${question.id}`)
  }

  const handleTestClick = (test: ApiTest) => {
    // Navigate to test details or start test
    navigate(`/test/${test.id}`)
  }

  const handleUserClick = (user: ApiUser) => {
    // Navigate to user profile
    navigate(`/profile/${user.username}`)
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 33) {
      return theme === "dark" ? "text-green-400 bg-green-900/30" : "text-green-600 bg-green-100"
    } else if (difficulty < 66) {
      return theme === "dark" ? "text-yellow-400 bg-yellow-900/30" : "text-yellow-600 bg-yellow-100"
    } else {
      return theme === "dark" ? "text-red-400 bg-red-900/30" : "text-red-600 bg-red-100"
    }
  }

  const getDifficultyText = (difficulty: number) => {
    if (difficulty < 33) return "Easy"
    if (difficulty < 66) return "Medium"
    return "Hard"
  }

  const renderQuestion = (question: ApiQuestion, index: number) => {
    return (
      <div
        key={`question-${question.id}-${index}`}
        onClick={() => handleQuestionClick(question)}
        className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-[1.02] animate-fade-in-up ${theme === "dark"
            ? "bg-gray-800 border-gray-700 hover:border-indigo-500 hover:bg-gray-750"
            : "bg-white border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
          }`}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <HelpCircle size={16} className="text-indigo-500 flex-shrink-0 mt-1" />
            <h3 className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"} line-clamp-2`}>
              {question.question_text}
            </h3>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty_percentage)}`}
          >
            {getDifficultyText(question.difficulty_percentage)}
          </span>
        </div>

        <div className={`flex items-center gap-4 text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-500"} mb-3`}>
          <div className="flex items-center space-x-1">
            <Calendar size={12} />
            <span>{new Date(question.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>{question.difficulty_percentage}% difficulty</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center text-blue-500 space-x-1">
              <MessageCircle size={12} />
              <span className="text-xs">Question</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Play size={12} className="text-indigo-500" />
            <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Solve</span>
          </div>
        </div>
      </div>
    )
  }

  const renderTest = (test: ApiTest, index: number) => {
    return (
      <div
        key={`test-${test.id}-${index}`}
        onClick={() => handleTestClick(test)}
        className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-[1.02] animate-fade-in-up ${theme === "dark"
            ? "bg-gray-800 border-gray-700 hover:border-indigo-500 hover:bg-gray-750"
            : "bg-white border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
          }`}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"} line-clamp-2`}>
            {test.title}
          </h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(test.difficulty_percentage)}`}
          >
            {getDifficultyText(test.difficulty_percentage)}
          </span>
        </div>
        <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-3 line-clamp-2`}>
          {test.description}
        </p>
        <div
          className={`flex items-center justify-between text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}
        >
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <BookOpen size={12} />
              <span>Test</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users size={12} />
              <span>{test.correct_count} completed</span>
            </div>
            {test.created_at && (
              <div className="flex items-center space-x-1">
                <Calendar size={12} />
                <span>{new Date(test.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Play size={12} className="text-indigo-500" />
            <ChevronRight size={16} className={theme === "dark" ? "text-gray-600" : "text-gray-400"} />
          </div>
        </div>
      </div>
    )
  }

  const renderUser = (user: ApiUser, index: number) => {
    return (
      <div
        key={`user-${user.id}-${index}`}
        onClick={() => handleUserClick(user)}
        className={`flex items-center space-x-3 p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-[1.02] animate-fade-in-up ${theme === "dark"
            ? "bg-gray-800 border-gray-700 hover:border-indigo-500 hover:bg-gray-750"
            : "bg-white border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
          }`}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className="relative">
          <img
            src={
              user.profile_image ||
              "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" ||
              "/placeholder.svg"
            }
            alt={user.username}
            className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
          />
          {user.is_verified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
            </h3>
          </div>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            @{user.username}
            {user.followers_count && ` • ${user.followers_count} followers`}
          </p>
        </div>
        <ChevronRight size={16} className={theme === "dark" ? "text-gray-600" : "text-gray-400"} />
      </div>
    )
  }

  const [categoryScrollPosition, setCategoryScrollPosition] = useState(0)

  const scrollCategories = (direction: "left" | "right") => {
    const container = document.getElementById("category-scroll-container")
    if (container) {
      const scrollAmount = 280
      const newPosition =
        direction === "left"
          ? Math.max(0, categoryScrollPosition - scrollAmount)
          : categoryScrollPosition + scrollAmount

      container.scrollTo({
        left: newPosition,
        behavior: "smooth",
      })
      setCategoryScrollPosition(newPosition)
    }
  }

  // Get search results from API data
  const getSearchResults = () => {
    if (!data) return { tests: [], questions: [], users: [], total: 0 }

    const apiData = data as ApiResponse
    return {
      tests: apiData.tests || [],
      questions: apiData.questions || [],
      users: apiData.users || [],
      total: (apiData.tests?.length || 0) + (apiData.questions?.length || 0) + (apiData.users?.length || 0),
    }
  }

  const searchResults = getSearchResults()

  return (
    <div
      className={`min-h-screen transition-all duration-300 pt-20 pb-20 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}
    >
      <style>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .rotateY-12 {
          transform: rotateY(12deg);
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Search Header */}
        <div className="flex space-x-3 mb-6">
          <div className="relative flex-1">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              size={20}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addToHistory(searchQuery)}
              placeholder="Search tests, users, questions..."
              className={`w-full pl-10 pr-10 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${theme === "dark"
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-indigo-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500"
                }`}
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"
                  } transition-colors`}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 border-2 rounded-lg transition-all duration-200 ${showFilters
                ? "border-indigo-500 text-indigo-500 bg-indigo-500/10"
                : theme === "dark"
                  ? "border-gray-700 text-gray-400 hover:border-gray-600"
                  : "border-gray-300 text-gray-500 hover:border-gray-400"
              }`}
          >
            <Filter size={20} />
          </button>
        </div>

        {/* Enhanced Filters Panel */}
        {showFilters && (
          <div
            className={`rounded-xl p-6 mb-6 border shadow-lg animate-fade-in ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                Advanced Filters
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className={`${theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"
                  } transition-colors`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Content Type Filter */}
              <div>
                <label
                  className={`block text-sm font-semibold mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                >
                  Content Type
                </label>
                <div className="space-y-2">
                  {[
                    { id: "test", name: "Tests", icon: "📝" },
                    { id: "user", name: "Users", icon: "👤" },
                    { id: "question", name: "Questions", icon: "❓" },
                  ].map((type) => (
                    <label key={type.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedType.includes(type.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedType([...selectedType, type.id])
                          } else {
                            setSelectedType(selectedType.filter((t) => t !== type.id))
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span
                        className={`flex items-center space-x-2 text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                      >
                        <span>{type.icon}</span>
                        <span>{type.name}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label
                  className={`block text-sm font-semibold mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                >
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`w-full p-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                    }`}
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="participants">Most Participants</option>
                  <option value="alphabetical">A-Z</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label
                  className={`block text-sm font-semibold mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                >
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className={`w-full p-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                    }`}
                >
                  <option value="all">All Time</option>
                  <option value="day">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedType.length > 0 || sortBy !== "popular" || dateRange !== "all") && (
              <div className={`mt-6 pt-4 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                <h4 className={`text-sm font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  Active Filters:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedType.map((type) => (
                    <span
                      key={type}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-medium flex items-center space-x-1"
                    >
                      <span>{type}</span>
                      <button onClick={() => setSelectedType(selectedType.filter((t) => t !== type))}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {sortBy !== "popular" && (
                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-medium flex items-center space-x-1">
                      <span>Sort: {sortBy}</span>
                      <button onClick={() => setSortBy("popular")}>
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {dateRange !== "all" && (
                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-medium flex items-center space-x-1">
                      <span>Period: {dateRange}</span>
                      <button onClick={() => setDateRange("all")}>
                        <X size={12} />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced 3D Category Cards with Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
              <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                Categories
              </h2>
            </div>

            {/* Navigation Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => scrollCategories("left")}
                className={`p-2 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl ${theme === "dark"
                    ? "bg-gray-800 hover:bg-indigo-600 text-gray-400 hover:text-white"
                    : "bg-white hover:bg-indigo-600 text-gray-600 hover:text-white"
                  }`}
              >
                <ChevronRight size={20} className="rotate-180" />
              </button>
              <button
                onClick={() => scrollCategories("right")}
                className={`p-2 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl ${theme === "dark"
                    ? "bg-gray-800 hover:bg-indigo-600 text-gray-400 hover:text-white"
                    : "bg-white hover:bg-indigo-600 text-gray-600 hover:text-white"
                  }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="relative">
            <div id="category-scroll-container" className="overflow-x-auto pb-4 scrollbar-hide">
              <div className="flex space-x-6 min-w-max px-2">
                {categories.map((category, index) => (
                  <div
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`group relative w-80 h-64 flex-shrink-0 cursor-pointer transform transition-all duration-500 hover:scale-105 hover:-translate-y-3 animate-fade-in-up ${activeCategory === category.id ? "scale-105 -translate-y-3" : ""
                      }`}
                    style={{
                      perspective: "1200px",
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    <div className="relative w-full h-full transform-gpu transition-all duration-500 group-hover:rotateY-12 preserve-3d">
                      {/* Card Background with 3D effect */}
                      <div
                        className={`absolute inset-0  rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-500 overflow-hidden ${activeCategory === category.id ? "ring-4 ring-white ring-opacity-50" : ""
                          }`}
                      >
                        {/* Large Background Image */}
                        <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
                          <img
                            src={category.image || "/placeholder.svg?height=200&width=200"}
                            alt={category.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

                        {/* Category Name as Background Text */}
                        {/* <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <h3 className="text-6xl font-black text-white/10 group-hover:text-white/20 transition-all duration-500 transform group-hover:scale-110 select-none">
                            {category.title.toUpperCase()}
                          </h3>
                        </div> */}
                      </div>

                      {/* Card Content */}
                      <div className="relative z-10 p-8 h-full flex flex-col justify-between text-white">
                        {/* Top Section with Icon and Count */}
                        <div className="flex justify-between items-start">
                          <div className="text-4xl transform transition-all duration-500 group-hover:scale-125 group-hover:rotate-12">
                            {category.icon}
                          </div>
                          <div className="text-right">
                            <div className="text-xs opacity-80 font-medium">{category.total_questions}</div>
                          </div>
                        </div>

                        {/* Bottom Section with Title and Description */}
                        <div>
                          <h3 className="text-2xl font-bold mb-3 transform transition-all duration-500 group-hover:scale-105">
                            {category.title}
                          </h3>
                          <p className="text-sm opacity-90 leading-relaxed font-medium">{category.description}</p>
                        </div>

                        {/* 3D Border Effect */}
                        <div className="absolute inset-0 rounded-2xl border-2 border-white/20 group-hover:border-white/40 transition-all duration-500 pointer-events-none"></div>

                        {/* Shine Effect */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                        {/* Hover Glow */}
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-white/20 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10"></div>
                      </div>

                      {/* Enhanced 3D Shadow */}
                      <div className="absolute -bottom-4 -right-4 w-full h-full bg-black/30 rounded-2xl -z-10 transform transition-all duration-500 group-hover:translate-x-2 group-hover:translate-y-2 group-hover:bg-black/40"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Search Results or Default Content */}
        {searchQuery || activeCategory ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {isSearching || loading ? "Searching..." : `Search Results`}
                {activeCategory && (
                  <span className="ml-2 text-sm font-normal text-indigo-600">
                    in {categories.find((c) => c.id === activeCategory)?.title}
                  </span>
                )}
              </h2>
              {searchResults.total > 0 && (
                <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {searchResults.total} results found
                </span>
              )}
            </div>

            {isSearching || loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className={`text-red-500 mb-2`}>Error: {error}</div>
                <button
                  onClick={() => performSearch()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : searchResults.total > 0 ? (
              <div className="space-y-6">
                {/* Questions Section */}
                {searchResults.questions.length > 0 && (
                  <div>
                    <h3 className={`text-md font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      Questions ({searchResults.questions.length})
                    </h3>
                    <div className="space-y-3">
                      {searchResults.questions.map((question, index) => renderQuestion(question, index))}
                    </div>
                  </div>
                )}

                {/* Tests Section */}
                {searchResults.tests.length > 0 && (
                  <div>
                    <h3 className={`text-md font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      Tests ({searchResults.tests.length})
                    </h3>
                    <div className="space-y-3">{searchResults.tests.map((test, index) => renderTest(test, index))}</div>
                  </div>
                )}

                {/* Users Section */}
                {searchResults.users.length > 0 && (
                  <div>
                    <h3 className={`text-md font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      Users ({searchResults.users.length})
                    </h3>
                    <div className="space-y-3">{searchResults.users.map((user, index) => renderUser(user, index))}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search size={48} className={`mx-auto mb-4 ${theme === "dark" ? "text-gray-600" : "text-gray-400"}`} />
                <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>No results found</p>
                <p className={`text-sm mt-2 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                  Try adjusting your search terms or filters
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Trending Searches */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp size={20} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
                <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  Trending
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {trendingSearches.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(item)}
                    className={`p-3 rounded-lg transition-all duration-200 text-left text-sm hover:scale-105 animate-fade-in-up ${theme === "dark"
                        ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    #{item}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SearchPage
