"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    Search,
    TrendingUp,
    Clock,
    Users,
    Loader2,
    Star,
    BookOpen,
    Trophy,
    FlameIcon as Fire,
    Calendar,
} from "lucide-react"
import { quizAPI } from "../utils/api"
import { TestCard } from "./TestCard"

interface TestsPageProps {
    theme: string
}

interface Category {
    id: number
    title: string
    slug: string
    description: string
    emoji: string
    image?: string
}

interface Test {
    id: number
    title: string
    description: string
    category: Category
    visibility: "public" | "private" | "unlisted"
    created_at: string
    total_questions: number
    total_attempts: number
    average_score: number
    average_time: number
    wrong_count: number
    correct_count: number
    difficulty_percentage: number
    user: {
        id: number
        username: string
        profile_image: string | null
        is_badged?: boolean
        is_premium?: boolean
    }
    is_bookmarked: boolean
    thumbnail?: string
}

const TestsPage: React.FC<TestsPageProps> = ({ theme }) => {
    const navigate = useNavigate()
    const [allTests, setAllTests] = useState<Test[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [activeSection, setActiveSection] = useState<"latest" | "popular" | "trending" | "recommended">("recommended")

    const fetchTests = async () => {
        setLoading(true)
        try {
            const [testsResponse, categoriesResponse] = await Promise.all([
                quizAPI.fetchPublicTests(),
                quizAPI.fetchCategories(),
            ])
            console.log("Fetched tests:", testsResponse.data)
            console.log("Fetched categories:", categoriesResponse.data)

            setAllTests(testsResponse.data.results || testsResponse.data || [])
            setCategories(categoriesResponse.data.results || categoriesResponse.data || [])
        } catch (error) {
            console.error("Testlarni yuklashda xatolik:", error)
            // Mock data fallback
            setCategories([
                {
                    id: 1,
                    title: "Dasturlash",
                    slug: "programming",
                    description: "Dasturlash tillari va texnologiyalar",
                    emoji: "💻",
                },
                { id: 2, title: "Matematika", slug: "math", description: "Matematik fanlar", emoji: "🧮" },
                { id: 3, title: "Tarix", slug: "history", description: "Jahon va O'zbekiston tarixi", emoji: "📚" },
                {
                    id: 4,
                    title: "Ingliz tili",
                    slug: "english",
                    description: "Ingliz tili grammatikasi va lug'at",
                    emoji: "🇬🇧",
                },
                { id: 5, title: "Fizika", slug: "physics", description: "Fizika qonunlari va formulalar", emoji: "⚡" },
                { id: 6, title: "Kimyo", slug: "chemistry", description: "Kimyoviy elementlar va reaksiyalar", emoji: "🧪" },
            ])

            setAllTests([
                {
                    id: 1,
                    title: "JavaScript ES6+ Xususiyatlari",
                    description: "Zamonaviy JavaScript xususiyatlari: arrow functions, destructuring, async/await va boshqalar",
                    category: { id: 1, title: "Dasturlash", slug: "programming", description: "Dasturlash tillari", emoji: "💻" },
                    visibility: "public",
                    created_at: "2024-01-20T10:30:00Z",
                    total_questions: 25,
                    total_attempts: 1250,
                    average_score: 78.5,
                    average_time: 1800,
                    wrong_count: 340,
                    correct_count: 910,
                    difficulty_percentage: 65,
                    user: {
                        id: 1,
                        username: "dev_master",
                        profile_image: "/placeholder.svg?height=40&width=40",
                        is_badged: true,
                        is_premium: true,
                    },
                    is_bookmarked: false,
                    thumbnail: "/placeholder.svg?height=200&width=400&text=JavaScript",
                },
                {
                    id: 2,
                    title: "React Hooks va State Management",
                    description: "React hooks, useState, useEffect, useContext va Redux bilan state management",
                    category: { id: 1, title: "Dasturlash", slug: "programming", description: "Dasturlash tillari", emoji: "💻" },
                    visibility: "public",
                    created_at: "2024-01-19T15:20:00Z",
                    total_questions: 30,
                    total_attempts: 890,
                    average_score: 82.3,
                    average_time: 2100,
                    wrong_count: 267,
                    correct_count: 623,
                    difficulty_percentage: 45,
                    user: {
                        id: 2,
                        username: "react_guru",
                        profile_image: "/placeholder.svg?height=40&width=40",
                        is_badged: true,
                        is_premium: false,
                    },
                    is_bookmarked: true,
                    thumbnail: "/placeholder.svg?height=200&width=400&text=React",
                },
                {
                    id: 3,
                    title: "Algebra va Geometriya Asoslari",
                    description: "Matematik analiz, algebra va geometriya bo'yicha fundamental bilimlar",
                    category: { id: 2, title: "Matematika", slug: "math", description: "Matematik fanlar", emoji: "🧮" },
                    visibility: "public",
                    created_at: "2024-01-18T09:45:00Z",
                    total_questions: 40,
                    total_attempts: 2100,
                    average_score: 71.2,
                    average_time: 2700,
                    wrong_count: 630,
                    correct_count: 1470,
                    difficulty_percentage: 75,
                    user: {
                        id: 3,
                        username: "math_teacher",
                        profile_image: "/placeholder.svg?height=40&width=40",
                        is_badged: false,
                        is_premium: true,
                    },
                    is_bookmarked: false,
                    thumbnail: "/placeholder.svg?height=200&width=400&text=Math",
                },
                {
                    id: 4,
                    title: "O'zbekiston Tarixi",
                    description: "O'zbekiston tarixining muhim davrlari va voqealari haqida test",
                    category: { id: 3, title: "Tarix", slug: "history", description: "Jahon va O'zbekiston tarixi", emoji: "📚" },
                    visibility: "public",
                    created_at: "2024-01-17T14:30:00Z",
                    total_questions: 35,
                    total_attempts: 1650,
                    average_score: 68.9,
                    average_time: 2400,
                    wrong_count: 512,
                    correct_count: 1138,
                    difficulty_percentage: 55,
                    user: {
                        id: 4,
                        username: "history_buff",
                        profile_image: "/placeholder.svg?height=40&width=40",
                        is_badged: true,
                        is_premium: false,
                    },
                    is_bookmarked: false,
                    thumbnail: "/placeholder.svg?height=200&width=400&text=History",
                },
                {
                    id: 5,
                    title: "English Grammar Advanced",
                    description: "Advanced English grammar rules, tenses, and sentence structures",
                    category: {
                        id: 4,
                        title: "Ingliz tili",
                        slug: "english",
                        description: "Ingliz tili grammatikasi",
                        emoji: "🇬🇧",
                    },
                    visibility: "public",
                    created_at: "2024-01-16T11:15:00Z",
                    total_questions: 28,
                    total_attempts: 980,
                    average_score: 74.6,
                    average_time: 1980,
                    wrong_count: 294,
                    correct_count: 686,
                    difficulty_percentage: 60,
                    user: {
                        id: 5,
                        username: "english_pro",
                        profile_image: "/placeholder.svg?height=40&width=40",
                        is_badged: true,
                        is_premium: true,
                    },
                    is_bookmarked: true,
                    thumbnail: "/placeholder.svg?height=200&width=400&text=English",
                },
                {
                    id: 6,
                    title: "Fizika: Mexanika va Termodinamika",
                    description: "Klassik mexanika, termodinamika qonunlari va formulalar",
                    category: { id: 5, title: "Fizika", slug: "physics", description: "Fizika qonunlari", emoji: "⚡" },
                    visibility: "public",
                    created_at: "2024-01-15T16:45:00Z",
                    total_questions: 32,
                    total_attempts: 750,
                    average_score: 69.8,
                    average_time: 2250,
                    wrong_count: 225,
                    correct_count: 525,
                    difficulty_percentage: 80,
                    user: {
                        id: 6,
                        username: "physics_master",
                        profile_image: "/placeholder.svg?height=40&width=40",
                        is_badged: false,
                        is_premium: false,
                    },
                    is_bookmarked: false,
                    thumbnail: "/placeholder.svg?height=200&width=400&text=Physics",
                },
            ])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTests()
    }, [])

    const handleStartTest = (testId: number) => {
        navigate(`/tests/${testId}`)
    }

    const handleBookmark = async (testId: number) => {
        try {
            await quizAPI.BlockBookmark({ test: testId })
            setAllTests((prev) =>
                prev.map((test) => (test.id === testId ? { ...test, is_bookmarked: !test.is_bookmarked } : test)),
            )
        } catch (error) {
            console.error("Bookmark xatolik:", error)
        }
    }

    const handleShare = (testId: number) => {
        const shareUrl = `${window.location.origin}/tests/${testId}`
        if (navigator.share) {
            navigator.share({
                title: "TestAbd testi",
                text: "Mana bir qiziqarli test!",
                url: shareUrl,
            })
        } else {
            navigator.clipboard.writeText(shareUrl)
        }
    }

    const filteredTests = allTests.filter((test) => {
        const matchesSearch =
            test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            test.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === "all" || test.category.slug === selectedCategory
        return matchesSearch && matchesCategory
    })

    const getTestsBySection = (section: string) => {
        switch (section) {
            case "latest":
                return [...filteredTests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            case "popular":
                return [...filteredTests].sort((a, b) => b.total_attempts - a.total_attempts)
            case "trending":
                return [...filteredTests].sort((a, b) => b.average_score - a.average_score)
            case "recommended":
                return [...filteredTests].sort(
                    (a, b) =>
                        b.correct_count / (b.correct_count + b.wrong_count) - a.correct_count / (a.correct_count + a.wrong_count),
                )
            default:
                return filteredTests
        }
    }

    const getSectionIcon = (section: string) => {
        switch (section) {
            case "latest":
                return <Calendar size={20} />
            case "popular":
                return <Fire size={20} />
            case "trending":
                return <TrendingUp size={20} />
            case "recommended":
                return <Star size={20} />
            default:
                return <BookOpen size={20} />
        }
    }

    const getSectionTitle = (section: string) => {
        switch (section) {
            case "latest":
                return "Yangi Testlar"
            case "popular":
                return "Mashhur Testlar"
            case "trending":
                return "Trendda"
            case "recommended":
                return "Tavsiya Etilgan"
            default:
                return "Testlar"
        }
    }

    const getSectionDescription = (section: string) => {
        switch (section) {
            case "latest":
                return "Eng so'nggi qo'shilgan testlar"
            case "popular":
                return "Eng ko'p ishtirokchili testlar"
            case "trending":
                return "Yuqori reytingga ega testlar"
            case "recommended":
                return "Siz uchun maxsus tanlangan testlar"
            default:
                return "Barcha testlar"
        }
    }

    const currentTests = getTestsBySection(activeSection)

    return (
        <div
            className={`min-h-screen transition-all duration-300 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
                }`}
        >
            {/* Header */}
            <header
                className={`fixed top-0 left-0 right-0 backdrop-blur-lg border-b z-50 ${theme === "dark" ? "bg-gray-800/80 border-gray-700" : "bg-white/80 border-gray-200"
                    }`}
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <img src="/placeholder.svg?height=32&width=32" alt="TestAbd" className="h-8 w-8 rounded-full" />
                            <h1 className="text-xl font-bold text-blue-600">TestAbd</h1>
                            <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>/ Testlar</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24">
                {/* Hero Section */}
                <div className="mb-8 text-center">
                    <h2 className={`text-4xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        Bilimingizni Sinab Ko'ring
                    </h2>
                    <p className={`text-xl mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                        Minglab testlar orasidan o'zingizga mos keladiganini toping
                    </p>
                </div>

                {/* Search */}
                <div className="mb-8">
                    <div className="relative max-w-2xl mx-auto">
                        <Search
                            size={20}
                            className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                }`}
                        />
                        <input
                            type="text"
                            placeholder="Testlarni qidiring..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all duration-200 text-lg ${theme === "dark"
                                    ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                                    : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="mb-8">
                    <h3 className={`text-2xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        Kategoriyalar
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setSelectedCategory("all")}
                            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-200 ${selectedCategory === "all"
                                    ? "bg-blue-600 text-white shadow-lg scale-105"
                                    : theme === "dark"
                                        ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                                }`}
                        >
                            🌟 Barchasi
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.slug)}
                                className={`px-6 py-3 rounded-2xl font-medium transition-all duration-200 ${selectedCategory === category.slug
                                        ? "bg-blue-600 text-white shadow-lg scale-105"
                                        : theme === "dark"
                                            ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                                    }`}
                            >
                                {category.emoji} {category.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section Navigation */}
                <div className="mb-8">
                    <div className="flex flex-wrap gap-2">
                        {["recommended", "latest", "popular", "trending"].map((section) => (
                            <button
                                key={section}
                                onClick={() => setActiveSection(section as any)}
                                className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-medium transition-all duration-200 ${activeSection === section
                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                                        : theme === "dark"
                                            ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                                    }`}
                            >
                                {getSectionIcon(section)}
                                <span>{getSectionTitle(section)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-blue-900/30" : "bg-blue-100"}`}>
                            {getSectionIcon(activeSection)}
                        </div>
                        <div>
                            <h3 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                {getSectionTitle(activeSection)}
                            </h3>
                            <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                {getSectionDescription(activeSection)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div
                        className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-105 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <BookOpen size={24} className="text-blue-600" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                    {currentTests.length}
                                </p>
                                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Jami testlar</p>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-105 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                <Users size={24} className="text-green-600" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                    {currentTests.reduce((sum, test) => sum + test.total_attempts, 0).toLocaleString()}
                                </p>
                                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Jami ishtirokchilar</p>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-105 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                <Trophy size={24} className="text-purple-600" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                    {Math.round(
                                        currentTests.reduce((sum, test) => sum + test.average_score, 0) / currentTests.length || 0,
                                    )}
                                    %
                                </p>
                                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>O'rtacha ball</p>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-105 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                                <Clock size={24} className="text-orange-600" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                    {Math.round(
                                        currentTests.reduce((sum, test) => sum + test.average_time, 0) / currentTests.length / 60 || 0,
                                    )}
                                </p>
                                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                    O'rtacha vaqt (daqiqa)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tests Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 size={40} className="animate-spin text-blue-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentTests.map((test, index) => (
                            <div
                                key={test.id}
                                className="animate-fade-in-up"
                                style={{
                                    animationDelay: `${index * 100}ms`,
                                }}
                            >
                                <TestCard
                                    test={test}
                                    theme={theme}
                                    onStartTest={handleStartTest}
                                    onBookmark={handleBookmark}
                                    onShare={handleShare}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {currentTests.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <div className="mb-4">
                            <BookOpen size={64} className={`mx-auto ${theme === "dark" ? "text-gray-600" : "text-gray-400"}`} />
                        </div>
                        <h3 className={`text-xl font-semibold mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                            Hech qanday test topilmadi
                        </h3>
                        <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                            Qidiruv shartlarini o'zgartirib ko'ring
                        </p>
                    </div>
                )}
            </main>

            <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
        </div>
    )
}

export default TestsPage
