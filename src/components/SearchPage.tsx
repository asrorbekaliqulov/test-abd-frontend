"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
    Search,
    Filter,
    X,
    Users,
    BookOpen,
    ChevronRight,
    HelpCircle,
    Play,
    Sparkles,
    Clock,
    Hash,
    ChevronLeft,
} from "lucide-react"
import { quizAPI, searchAPI } from "../utils/api" // ✅ useSearch o'rniga searchAPI

interface SearchPageProps {}

interface Category {
    id: number
    title: string
    icon: string
    description: string
    total_questions: string
}

interface ApiQuestion {
    id: number
    question_text: string
    difficulty_percentage: number
    created_at: string
    user?: {
        username: string
        profile_image?: string
    }
    category?: {
        name: string
        emoji: string
    }
}

interface ApiTest {
    id: number
    title: string
    description: string
    correct_count: number
    difficulty_percentage: number
    created_at?: string
    questions_count?: number
    category_name?: string
    user?: {
        username: string
        profile_image?: string
    }
}

interface ApiUser {
    id: number
    username: string
    first_name?: string
    last_name?: string
    profile_image?: string
    followers_count?: number
    is_verified?: boolean
    is_premium?: boolean
}

interface SearchResults {
    tests: ApiTest[]
    questions: ApiQuestion[]
    users: ApiUser[]
    total: number
}

const SearchPage: React.FC<SearchPageProps> = () => {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")
    const [showFilters, setShowFilters] = useState(false)
    const [activeCategory, setActiveCategory] = useState<number | null>(null)
    const [recentSearches, setRecentSearches] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [searchResults, setSearchResults] = useState<SearchResults>({
        tests: [],
        questions: [],
        users: [],
        total: 0
    })

    const [categories, setCategories] = useState<Category[]>([])
    const [selectedType, setSelectedType] = useState<string[]>([])
    const [sortBy, setSortBy] = useState("popular")
    const [dateRange, setDateRange] = useState("all")

    const categoriesContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await quizAPI.fetchCategories()
                setCategories(response.data || [])
            } catch (error) {
                console.error("Error fetching categories:", error)
            }
        }

        fetchCategories()
    }, [])

    useEffect(() => {
        const savedSearches = localStorage.getItem('recentSearches')
        if (savedSearches) {
            setRecentSearches(JSON.parse(savedSearches))
        }
    }, [])

    useEffect(() => {
        if (recentSearches.length > 0) {
            localStorage.setItem('recentSearches', JSON.stringify(recentSearches))
        }
    }, [recentSearches])

    useEffect(() => {
        if (searchQuery.trim() || activeCategory) {
            performSearch()
        }
    }, [searchQuery, activeCategory, selectedType, sortBy, dateRange])

    const performSearch = async () => {
        const searchParams: any = {}

        if (searchQuery.trim()) {
            searchParams.query = searchQuery
        }

        if (activeCategory) {
            searchParams.category = activeCategory
        }

        if (selectedType.length > 0) {
            searchParams.type = selectedType[0]
        }

        if (dateRange !== "all") {
            searchParams.period = dateRange
        }

        if (sortBy !== "popular") {
            searchParams.sort_by = sortBy
        }

        setLoading(true)
        try {
            let result;

            // Agar faqat kategoriya tanlangan bo'lsa
            if (activeCategory && !searchQuery.trim()) {
                result = await quizAPI.fetchQuizzesByCategory(activeCategory, 1, 20)
                if (result.success) {
                    setSearchResults({
                        tests: result.data?.results || result.data || [],
                        questions: [],
                        users: [],
                        total: result.data?.results?.length || result.data?.length || 0
                    })
                }
            }
            // Agar search query bo'lsa
            else if (searchQuery.trim()) {
                // Search API dan foydalanish
                if (searchAPI) {
                    result = await searchAPI.searchAll(searchQuery)
                    if (result.success) {
                        setSearchResults({
                            tests: result.data?.quizzes || result.data?.tests || [],
                            questions: result.data?.quizzes || result.data?.questions || [],
                            users: result.data?.users || [],
                            total: (result.data?.users?.length || 0) +
                                (result.data?.quizzes?.length || result.data?.tests?.length || 0)
                        })
                    }
                } else {
                    // Agar searchAPI mavjud bo'lmasa, quizAPI orqali qidirish
                    result = await quizAPI.fetchQuizzesWithFilters({ search: searchQuery })
                    if (result.success) {
                        setSearchResults({
                            tests: result.data?.results || result.data || [],
                            questions: result.data?.results || result.data || [],
                            users: [],
                            total: result.data?.results?.length || result.data?.length || 0
                        })
                    }
                }
            }
        } catch (error) {
            console.error("Search error:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        if (query.trim()) {
            addToRecentSearches(query)
        }
    }

    const addToRecentSearches = (query: string) => {
        if (query.trim()) {
            setRecentSearches(prev => {
                const filtered = prev.filter(item => item !== query)
                return [query, ...filtered].slice(0, 5)
            })
        }
    }

    const handleCategoryClick = (categoryId: number) => {
        setActiveCategory(activeCategory === categoryId ? null : categoryId)
    }

    const getDifficultyColor = (difficulty: number) => {
        if (difficulty < 33) {
            return "text-green-400 bg-green-900/30"
        } else if (difficulty < 66) {
            return "text-yellow-400 bg-yellow-900/30"
        } else {
            return "text-red-400 bg-red-900/30"
        }
    }

    const getDifficultyText = (difficulty: number) => {
        if (difficulty < 33) return "Oson"
        if (difficulty < 66) return "O'rtacha"
        return "Qiyin"
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - date.getTime())
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return "Bugun"
        if (diffDays === 1) return "Kecha"
        if (diffDays < 7) return `${diffDays} kun oldin`
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta oldin`
        return `${Math.floor(diffDays / 30)} oy oldin`
    }

    const handleClearSearch = () => {
        setSearchQuery("")
        setActiveCategory(null)
        setSelectedType([])
        setSortBy("popular")
        setDateRange("all")
        setSearchResults({ tests: [], questions: [], users: [], total: 0 })
    }

    const handleClearRecentSearches = () => {
        setRecentSearches([])
        localStorage.removeItem('recentSearches')
    }

    const scrollCategories = (direction: "left" | "right") => {
        if (categoriesContainerRef.current) {
            const scrollAmount = 300
            const currentScroll = categoriesContainerRef.current.scrollLeft
            const newScroll = direction === "left"
                ? currentScroll - scrollAmount
                : currentScroll + scrollAmount

            categoriesContainerRef.current.scrollTo({
                left: newScroll,
                behavior: "smooth"
            })
        }
    }

    const hasSearchQuery = searchQuery.trim() || activeCategory

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 pt-20">
                <div className="mb-6">
                    <div className="flex space-x-3 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
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
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-3 border rounded-lg transition-all duration-200 ${showFilters
                                ? "border-blue-500 text-blue-500 bg-blue-500/10"
                                : "border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white"
                            }`}
                        >
                            <Filter size={20} />
                        </button>
                    </div>

                    {categories.length > 0 && !hasSearchQuery && (
                        <div className="relative mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    <Sparkles size={16} className="text-blue-500" />
                                    Kategoriyalar
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => scrollCategories("left")}
                                        className="p-1.5 rounded-full bg-gray-900 hover:bg-gray-800 transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => scrollCategories("right")}
                                        className="p-1.5 rounded-full bg-gray-900 hover:bg-gray-800 transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                            <div
                                ref={categoriesContainerRef}
                                className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                            >
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => handleCategoryClick(category.id)}
                                        className={`flex-shrink-0 p-4 rounded-xl border transition-all duration-200 ${activeCategory === category.id
                                            ? "border-blue-500 bg-blue-500/10"
                                            : "border-gray-800 bg-gray-900 hover:border-gray-700"
                                        }`}
                                    >
                                        <div className="flex flex-col items-center text-center gap-2">
                                            <div className="text-2xl">{category.icon}</div>
                                            <h4 className="font-medium text-white">{category.title}</h4>
                                            <span className="text-xs text-blue-400">
                                                {category.total_questions} ta savol
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {showFilters && (
                    <div className="rounded-xl p-6 mb-6 border border-gray-800 bg-gray-900">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-white">
                                Filtrlash
                            </h3>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold mb-3 text-white">
                                    Kontent Turi
                                </label>
                                <div className="space-y-2">
                                    {[
                                        { id: "test", name: "Blok", icon: "📝" },
                                        { id: "user", name: "Foydalanuvchilar", icon: "👤" },
                                        { id: "question", name: "Savollar", icon: "❓" },
                                    ].map((type) => (
                                        <label key={type.id}
                                               className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-800">
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
                                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="flex items-center space-x-2 text-sm text-gray-300">
                                                <span>{type.icon}</span>
                                                <span>{type.name}</span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-3 text-white">
                                    Saralash turi
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="popular">Eng mashhur</option>
                                    <option value="newest">Eng yangi</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-3 text-white">
                                    Davr oralig'i
                                </label>
                                <select
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Barcha vaqt</option>
                                    <option value="day">Bugun</option>
                                    <option value="week">Bu hafta</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {hasSearchQuery ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">
                                {loading ? "Qidirilmoqda..." : "Qidiruv natijalari"}
                            </h2>

                            {searchResults.total > 0 && (
                                <span className="text-sm text-gray-400">
                                    {searchResults.total} natija
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : searchResults.total > 0 ? (
                            <div className="space-y-6 pb-4">
                                {searchResults.questions.length > 0 && (
                                    <div>
                                        <h3 className="text-md font-semibold mb-4 text-white">
                                            Savollar ({searchResults.questions.length})
                                        </h3>
                                        <div className="space-y-3">
                                            {searchResults.questions.map((question, index) => (
                                                <div
                                                    key={`question-${question.id}-${index}`}
                                                    onClick={() => navigate(`/questions/${question.id}`)}
                                                    className="p-4 rounded-xl border border-gray-800 transition-all duration-300 cursor-pointer hover:border-blue-500 hover:bg-gray-800/50"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center space-x-2 flex-1">
                                                            <HelpCircle size={16} className="text-blue-500 flex-shrink-0 mt-1" />
                                                            <h3 className="font-semibold text-white line-clamp-2">
                                                                {question.question_text}
                                                            </h3>
                                                        </div>
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty_percentage)}`}
                                                        >
                                                            {getDifficultyText(question.difficulty_percentage)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                                                        <div className="flex items-center space-x-2">
                                                            <Clock size={12} />
                                                            <span>{formatDate(question.created_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {searchResults.tests.length > 0 && (
                                    <div>
                                        <h3 className="text-md font-semibold mb-4 text-white">
                                            Bloklar ({searchResults.tests.length})
                                        </h3>
                                        <div className="space-y-3">
                                            {searchResults.tests.map((test, index) => (
                                                <div
                                                    key={`test-${test.id}-${index}`}
                                                    onClick={() => navigate(`/tests/${test.id}`)}
                                                    className="p-4 rounded-xl border border-gray-800 transition-all duration-300 cursor-pointer hover:border-purple-500 hover:bg-gray-800/50"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-white line-clamp-2 mb-1">
                                                                {test.title}
                                                            </h3>
                                                            {test.category_name && (
                                                                <div className="flex items-center gap-1 mb-2">
                                                                    <Hash size={12} className="text-gray-400" />
                                                                    <span className="text-xs text-gray-400">{test.category_name}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(test.difficulty_percentage)}`}
                                                        >
                                                            {getDifficultyText(test.difficulty_percentage)}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                                                        {test.description}
                                                    </p>

                                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="flex items-center space-x-1">
                                                                <BookOpen size={12} />
                                                                <span>{test.questions_count || 0} ta savol</span>
                                                            </div>
                                                            <div className="flex items-center space-x-1">
                                                                <Users size={12} />
                                                                <span>{test.correct_count || 0} ta ishtirok</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Play size={12} className="text-purple-500" />
                                                            <ChevronRight size={16} className="text-gray-600" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {searchResults.users.length > 0 && (
                                    <div>
                                        <h3 className="text-md font-semibold mb-4 text-white">
                                            Foydalanuvchilar ({searchResults.users.length})
                                        </h3>
                                        <div className="space-y-3">
                                            {searchResults.users.map((user, index) => (
                                                <div
                                                    key={`user-${user.id}-${index}`}
                                                    onClick={() => navigate(`/profile/${user.username}`)}
                                                    className="flex items-center space-x-3 p-4 rounded-xl border border-gray-800 transition-all duration-300 cursor-pointer hover:border-green-500 hover:bg-gray-800/50"
                                                >
                                                    <div className="relative">
                                                        <img
                                                            src={user.profile_image ? `https://backend.testabd.uz${user.profile_image}` : "/media/defaultuseravatar.png"}
                                                            alt={user.username}
                                                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                                                        />
                                                        {user.is_verified && (
                                                            <div
                                                                className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                                                                <span className="text-white text-xs">✓</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <h3 className="font-semibold text-white">
                                                                {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                                                            </h3>
                                                        </div>
                                                        <p className="text-sm text-gray-400">
                                                            @{user.username}
                                                        </p>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-600" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Search size={48} className="mx-auto mb-4 text-gray-600" />
                                <p className="text-gray-400">Natijalar topilmadi</p>
                            </div>
                        )}
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
                                <Sparkles size={48} className="mx-auto mb-4 text-blue-500" />
                                <h3 className="text-xl font-semibold text-white mb-2">Qidiruvni boshlang</h3>
                                <p className="text-gray-400">
                                    Testlar, foydalanuvchilar yoki savollarni topish uchun qidiring
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default SearchPage