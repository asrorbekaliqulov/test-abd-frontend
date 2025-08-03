"use client"

import type React from "react"
import { useState, useEffect, type SetStateAction } from "react"
import {
  Settings,
  Shield,
  Crown,
  Calendar,
  UserPlus,
  Cog,
  UserMinus,
  User,
  Coins,
  BarChart3,
  Edit,
  Upload,
  Moon,
  ExternalLink,
  Sun,
  Sparkles,
  Zap,
  Bot,
  X,
  ChevronRight,
  Bookmark,
  FileText,
  HelpCircle,
  Users,
  Gift,
  Copy,
  Share2,
  TrendingUp,
  Award,
  Target,
  Activity,
} from "lucide-react"
import { LogOut } from "lucide-react"
import { quizAPI, authAPI, accountsAPI, updateProfileImage } from "../utils/api"
import { href } from "react-router-dom"

// Types (keeping the existing ones)
export interface Country {
  id: number
  name: string
  code: string
}

export interface Region {
  id: number
  name: string
  country_id: number
}

export interface District {
  id: number
  name: string
  region_id: number
}

export interface Settlement {
  id: number
  name: string
  district_id: number
}

export interface UserType {
  id: number
  username: string
  profile_image: string | null
  is_following?: boolean
}

interface UserData {
  id: number
  last_login: string
  is_superuser: boolean
  username: string
  first_name: string
  last_name: string
  email: string
  is_staff: boolean
  date_joined: string
  profile_image: string
  bio: string
  phone_number: string
  created_at: string
  is_active: boolean
  role: string
  is_premium: boolean
  is_badged: boolean
  join_date: string
  level: string
  tests_solved: number
  correct_count: number
  wrong_count: number
  average_time: number
  country: number
  region: number
  district: number
  settlement: number
  streak_day: number
  streak_days: number
  coin_percentage: number
  coins: number
  weekly_test_count: {
    Dush: number
    Sesh: number
    Chor: number
    Pay: number
    Jum: number
    Shan: number
    Yak: number
  }
  groups: number[]
  user_permissions: number[]
  categories_of_interest: number[]
}

interface UserFollowData {
  followers: UserType[]
  following: UserType[]
}

interface UserSettings {
  country: number
  region: number
  district: number
  settlement: number
  language: string
  theme: string
  notifications: {
    push: boolean
    email: boolean
    sound: boolean
  }
  privacy: {
    publicProfile: boolean
    showOnlineStatus: boolean
  }
  monetization: boolean
}

interface MyTests {
  id: number
  title: string
  description: string
  total_questions: number
  completions: number
  rating: number
  visibility: "public" | "unlisted" | "draft"
  created_at: string
  updated_at: string
  is_public: boolean
  time_limit: number
  category: {
    id: number
    title: string
    slug: string
    emoji: string
  }
}

export interface RecentQuestion {
  id: number
  question: string
  test_title: string
  type: string
  difficulty: string
  category: null
  answers: number
  correctRate: number
  created_at: string
  updated_at: string
  is_active: boolean
}

interface SavedTest {
  id: number
  title: string
  description: string
  total_questions: number
  rating: number
  category: {
    id: number
    title: string
    emoji: string
  }
  user: {
    username: string
    profile_image: string | null
  }
  created_at: string
}

interface SavedQuestion {
  id: number;
  question_detail: {
    id: number;
    question_text: string;
    question_type: string;
    difficulty_percentage: number;
    created_at: string;
    test_title: string;
    category: {
      id: number;
      title: string;
      emoji: string;
    } | null;
    user: {
      username: string;
      profile_image: string | null;
    };
  };
  user: {
    username: string;
    profile_image: string | null;
  };
  created_at: string;
}


// Enhanced Activity Chart Component
const EnhancedActivityChart = ({ weeklyData }: { weeklyData: any }) => {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)
  const [animationPhase, setAnimationPhase] = useState(0)
  const [selectedMetric, setSelectedMetric] = useState<"tests" | "time" | "accuracy">("tests")

  const [promocodeData, setPromocodeData] = useState<{
    code: string
    description: string
    discount: string
    expiresAt: string
    isVisible: boolean
    progress: number
  } | null>(null)
  const [showPromocodeAnimation, setShowPromocodeAnimation] = useState(false)
  const [dailyTestCount, setDailyTestCount] = useState(0)

  // Add this function to simulate backend request for promocode
  const fetchPromocode = async () => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock promocode data
    const mockPromocode = {
      code: "DAILY350",
      description: "Kunlik 350 test uchun maxsus chegirma!",
      discount: "25%",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      isVisible: false,
      progress: 0,
    }

    setPromocodeData(mockPromocode)
  }

  // Add this useEffect to monitor daily test count and trigger promocode
  useEffect(() => {
    // Calculate today's test count from weekly data
    const today = new Date().getDay()
    const todayIndex = today === 0 ? 6 : today - 1 // Convert Sunday=0 to Saturday=6
    const todayCount = currentData[todayIndex] || 0
    setDailyTestCount(todayCount)

    // Trigger promocode fetch when reaching 345 tests
    if (todayCount >= 345 && !promocodeData) {
      fetchPromocode()
    }

    // Update promocode visibility and progress
    if (promocodeData && todayCount >= 345) {
      const progress = Math.min((todayCount - 345) / 5, 1) // Progress from 345 to 350
      const isVisible = todayCount >= 350

      setPromocodeData((prev) =>
        prev
          ? {
            ...prev,
            progress,
            isVisible,
          }
          : null,
      )

      if (isVisible && !showPromocodeAnimation) {
        setShowPromocodeAnimation(true)
      }
    }
  }, [weeklyData, promocodeData, showPromocodeAnimation, dailyTestCount])

  // Add the Promocode component before the return statement:
  const PromocodeComponent = () => {
    if (!promocodeData || dailyTestCount < 345) return null

    const handleCopyPromocode = () => {
      navigator.clipboard.writeText(promocodeData.code)
      // You can add a toast notification here
    }

    const handleClaimPromocode = () => {
      // This will be connected to your backend later
    }

    return (
      <div className="mb-6 relative overflow-hidden">
        <div
          className={`bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-1 transition-all duration-1000 ${promocodeData.isVisible ? "opacity-100 scale-100" : "opacity-70 scale-95"
            }`}
          style={{
            transform: `translateY(${promocodeData.isVisible ? "0" : "10px"})`,
            filter: `blur(${promocodeData.isVisible ? "0" : "2"}px)`,
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 relative">
            {/* Progress overlay for partial visibility */}
            {!promocodeData.isVisible && (
              <div
                className="absolute inset-0 bg-white dark:bg-gray-800 rounded-xl transition-all duration-500"
                style={{
                  clipPath: `inset(0 ${(1 - promocodeData.progress) * 100}% 0 0)`,
                }}
              />
            )}

            {/* Sparkle animation */}
            {promocodeData.isVisible && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                    style={{
                      top: `${Math.random() * 80 + 10}%`,
                      left: `${Math.random() * 80 + 10}%`,
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: "2s",
                    }}
                  />
                ))}
              </div>
            )}

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">🎉 Tabriklaymiz!</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Siz kunlik maqsadga yetdingiz!</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">{promocodeData.discount}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">chegirma</div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Promocod:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-white dark:bg-gray-800 px-3 py-1 rounded-md font-mono text-lg font-bold text-blue-600 border border-gray-200 dark:border-gray-600">
                      {promocodeData.code}
                    </code>
                    <button
                      onClick={handleCopyPromocode}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                      title="Nusxalash"
                    >
                      <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{promocodeData.description}</p>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Amal qilish muddati: {new Date(promocodeData.expiresAt).toLocaleDateString("uz-UZ")}</span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {dailyTestCount}/350 test
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClaimPromocode}
                  className={`flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 ${promocodeData.isVisible
                      ? "hover:from-orange-600 hover:to-red-600 transform hover:scale-105"
                      : "opacity-50 cursor-not-allowed"
                    }`}
                  disabled={!promocodeData.isVisible}
                >
                  {promocodeData.isVisible ? (
                    <>
                      <Gift className="w-4 h-4 inline mr-2" />
                      Promokodni ishlatish
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 inline mr-2" />
                      {350 - dailyTestCount} test qoldi
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyPromocode}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Progress indicator */}
              {!promocodeData.isVisible && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Promocod ochilmoqda...</span>
                    <span>{Math.round(promocodeData.progress * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${promocodeData.progress * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Celebration animation when fully visible */}
        {promocodeData.isVisible && showPromocodeAnimation && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="text-6xl animate-bounce">🎊</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const days = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"]
  const dayNames = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"]
  const activityData = Object.values(weeklyData || {}) as number[]
  const maxValue = Math.max(...activityData, 1)

  // Mock data for different metrics
  const mockTimeData = [2.5, 3.2, 1.8, 4.1, 2.9, 3.7, 5.2]
  const mockAccuracyData = [85, 92, 78, 88, 95, 82, 91]

  const getCurrentData = () => {
    switch (selectedMetric) {
      case "tests":
        return activityData
      case "time":
        return mockTimeData
      case "accuracy":
        return mockAccuracyData
      default:
        return activityData
    }
  }

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case "tests":
        return "Testlar"
      case "time":
        return "Soat"
      case "accuracy":
        return "Aniqlik %"
      default:
        return "Testlar"
    }
  }

  const currentData = getCurrentData()
  const currentMax = Math.max(...currentData, 1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationPhase(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const getBarColor = (value: number, index: number) => {
    const intensity = value / currentMax
    const today = new Date().getDay()
    const isToday = index === (today === 0 ? 6 : today - 1)

    if (isToday) {
      return `linear-gradient(45deg, #3b82f6 0%, #1d4ed8 100%)`
    }

    return `linear-gradient(45deg, 
      rgba(59, 130, 246, ${0.3 + intensity * 0.7}) 0%, 
      rgba(29, 78, 216, ${0.3 + intensity * 0.7}) 100%)`
  }

  const getWeeklyStats = () => {
    const total = currentData.reduce((sum, val) => sum + val, 0)
    const average = total / currentData.length
    const trend = currentData[currentData.length - 1] - currentData[0]

    return { total, average, trend }
  }

  const stats = getWeeklyStats()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Add the Promocode component here */}
      <PromocodeComponent />

      {/* Rest of the existing component remains the same */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Haftalik Faollik</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">So'nggi 7 kun</p>
          </div>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(["tests", "time", "accuracy"] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${selectedMetric === metric
                  ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              {metric === "tests" ? "Testlar" : metric === "time" ? "Vaqt" : "Aniqlik"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {selectedMetric === "accuracy" ? `${stats.total.toFixed(1)}%` : stats.total.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Jami</div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {selectedMetric === "accuracy" ? `${stats.average.toFixed(1)}%` : stats.average.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">O'rtacha</div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div
            className={`text-2xl font-bold flex items-center justify-center gap-1 ${stats.trend >= 0 ? "text-green-600" : "text-red-600"
              }`}
          >
            <TrendingUp className={`w-5 h-5 ${stats.trend < 0 ? "rotate-180" : ""}`} />
            {stats.trend >= 0 ? "+" : ""}
            {stats.trend.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Tendentsiya</div>
        </div>
      </div>

      {/* Interactive Chart */}
      <div className="relative">
        <div className="flex items-end justify-between h-48 gap-3 mb-4">
          {currentData.map((value, index) => {
            const height = (value / currentMax) * 100
            const isHovered = hoveredDay === days[index]
            const today = new Date().getDay()
            const isToday = index === (today === 0 ? 6 : today - 1)

            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group cursor-pointer"
                onMouseEnter={() => setHoveredDay(days[index])}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <div className="relative w-full flex justify-center mb-2">
                  {isHovered && (
                    <div className="absolute -top-12 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg z-10">
                      {dayNames[index]}: {value}
                      {getMetricLabel() !== "Testlar" && getMetricLabel() !== "Soat" ? "%" : ""}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  )}
                </div>

                <div className="w-full relative">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-1000 ease-out relative overflow-hidden ${isToday ? "ring-2 ring-blue-400 ring-opacity-60" : ""
                      }`}
                    style={{
                      height: animationPhase ? `${height}%` : "0%",
                      minHeight: "6px",
                      background: getBarColor(value, index),
                      transform: isHovered ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    {/* Animated shine effect */}
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse"
                      style={{
                        animation: isHovered ? "shimmer 1.5s infinite" : "none",
                      }}
                    />

                    {/* Value indicator */}
                    {isHovered && (
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg">
                        <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping"></div>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={`text-sm mt-3 transition-all duration-300 ${isHovered ? "text-blue-600 font-semibold scale-110" : "text-gray-500 dark:text-gray-400"
                    } ${isToday ? "text-blue-600 font-semibold" : ""}`}
                >
                  {days[index]}
                </div>

                {isToday && <div className="text-xs text-blue-500 font-medium mt-1">Bugun</div>}
              </div>
            )
          })}
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {hoveredDay
              ? `${dayNames[days.indexOf(hoveredDay)]} ma'lumotlari`
              : "Batafsil ma'lumot uchun ustiga bosing"}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
      `}</style>
    </div>
  )
}

// Referral Section Component
const ReferralSection = () => {
  const [referralCode, setReferralCode] = useState("REF123456")
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    thisMonth: 0,
    earnings: 0,
    pending: 0,
  })
  const getTelegramBotUrl = () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    return `https://t.me/TestAbdUzBot?start=access_token=${accessToken}&refresh_token=${refreshToken}`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode)
    // You can add a toast notification here
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "TestAbd-ga qo'shiling!",
        text: "Mening referral kodim bilan TestAbd-da ro'yxatdan o'ting va bonuslar oling!",
        url: `https://testabd.uz/register?ref=${referralCode}`,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Bot size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">🚀 Telegram Bot orqali boshqaring!</h3>
                <p className="text-blue-100 text-sm">Referral malumotlaringizni yanada qulay boshqaring</p>
              </div>
            </div>
            <div className="flex space-x-1">
              <Sparkles size={20} className="text-yellow-300 animate-pulse" />
              <Zap size={20} className="text-yellow-300 animate-bounce" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
            <h4 className="font-semibold mb-2 flex items-center">
              <span className="mr-2">✨</span>
              Telegram botimizning afzalliklari:
            </h4>
            <ul className="text-sm space-y-1 text-blue-100">
              <li className="flex items-center"><span className="mr-2">🔥</span>Referral cod yaratish</li>
              <li className="flex items-center"><span className="mr-2">📱</span>Tushunarli interfeys</li>
              <li className="flex items-center"><span className="mr-2">🔔</span>Taklif qilgan do'stlaringiz ro'yxati</li>
              <li className="flex items-center"><span className="mr-2">⚡</span>Bir necha sekundda sozlash</li>
            </ul>
          </div>

          <a
            href={getTelegramBotUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Bot size={20} className="mr-2" />
            <span className="mr-2">@TestAbdUzBot</span>
            <ExternalLink size={16} />
          </a>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2 dark:text-white">Referral Dasturi</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Do'stlaringizni taklif qiling va har bir muvaffaqiyatli ro'yxatdan o'tish uchun bonus oling!
        </p>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Jami</span>
          </div>
          <div className="text-2xl font-bold">{referralStats.totalReferrals}</div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Bu oy</span>
          </div>
          <div className="text-2xl font-bold">{referralStats.thisMonth}</div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5" />
            <span className="text-sm font-medium">Daromad</span>
          </div>
          <div className="text-2xl font-bold">{referralStats.earnings} so'm</div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5" />
            <span className="text-sm font-medium">Kutilmoqda</span>
          </div>
          <div className="text-2xl font-bold">{referralStats.pending} so'm</div>
        </div>
      </div>

      {/* Referral Code Section */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
        <h4 className="text-lg font-semibold mb-4 dark:text-white">Sizning Referral Kodingiz</h4>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 font-mono text-lg text-center">
            {referralCode}
          </div>
          <button
            onClick={handleCopyCode}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-4 rounded-lg transition-colors"
          >
            <Copy className="w-5 h-5" />
          </button>
          <button
            onClick={handleShare}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-4 rounded-lg transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="font-medium text-yellow-800 dark:text-yellow-200">Coming Soon!</span>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Referral kod olish funksiyasi tez orada ishga tushiriladi. Hozircha bu demo versiyasi.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-semibold mb-4 dark:text-white">Qanday ishlaydi?</h4>

        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
              1
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 dark:text-white">Kod ulashing</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Referral kodingizni do'stlaringiz bilan ulashing
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
              2
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 dark:text-white">Ro'yxatdan o'tish</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ular sizning kodingiz bilan ro'yxatdan o'tishadi
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-bold text-sm">
              3
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 dark:text-white">Bonus oling</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Har bir muvaffaqiyatli referral uchun bonus oling
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-semibold mb-4 dark:text-white">Referral Tarixi</h4>

        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Hozircha referrallar yo'q</h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Birinchi referralingiz ro'yxatdan o'tganidan keyin bu yerda ko'rinadi
          </p>
        </div>
      </div>
    </div>
  )
}

// Toast Component
const Toast = ({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed top-8 right-4 z-50 p-4 rounded-lg shadow-lg ${type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        } animate-slide-in`}
    >
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

const ProfilePage = () => {
  const [mestats, setMestats] = useState<UserData | null>(null)
  const [myTests, setMyTests] = useState<MyTests[]>([])
  const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>([])
  const [savedTests, setSavedTests] = useState<SavedTest[]>([])
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([])
  const [settings, setSettings] = useState<UserSettings>({
    country: 0,
    region: 0,
    district: 0,
    settlement: 0,
    language: "uz",
    theme: "light",
    notifications: {
      push: true,
      email: true,
      sound: true,
    },
    privacy: {
      publicProfile: true,
      showOnlineStatus: true,
    },
    monetization: false,
  })
  const [follow, setFollow] = useState<UserFollowData | null>(null)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)

  // Location data states
  const [countries, setCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])

  const [loadingFollowData, setLoadingFollowData] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)

  // Modal states
  const [selectedTest, setSelectedTest] = useState<MyTests | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<RecentQuestion | null>(null)
  const [editingTest, setEditingTest] = useState<MyTests | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<RecentQuestion | null>(null)
  const [showTestAnalytics, setShowTestAnalytics] = useState(false)
  const [showQuestionAnalytics, setShowQuestionAnalytics] = useState(false)

  // New modal states for saved content
  const [showAllSavedTests, setShowAllSavedTests] = useState(false)
  const [showAllSavedQuestions, setShowAllSavedQuestions] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    const shouldBeDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark)

    setIsDarkMode(shouldBeDark)
    document.documentElement.setAttribute("data-theme", shouldBeDark ? "dark" : "light")
    setSettings((prev) => ({ ...prev, theme: shouldBeDark ? "dark" : "light" }))
  }, [])

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    const theme = newMode ? "dark" : "light"

    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("theme", theme)
    setSettings((prev) => ({ ...prev, theme }))
  }

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
  }

  // All the existing useEffect hooks and functions remain the same...
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getMe()
        setMestats(res.data)
        setSettings((prev) => ({
          ...prev,
          country: res.data.country || 0,
          region: res.data.region || 0,
          district: res.data.district || 0,
          settlement: res.data.settlement || 0,
        }))
      } catch (err) {
        console.error("Profil ma'lumotlarini olishda xatolik:", err)
        showToast("Profil ma'lumotlarini olishda xatolik yuz berdi", "error")
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await quizAPI.fetchMyTest()
        setMyTests(res.data)
      } catch (err) {
        console.error("MyTests olishda xatolik:", err)
      }
    }
    fetchTests()
  }, [])

  useEffect(() => {
    const fetchSavedContent = async () => {
      try {
        quizAPI.getBookmarksTest().then((res) => {
          setSavedTests(res.data.results)
        })

        quizAPI.getBookmarks().then((res) => {
          setSavedQuestions(res.data.results)
        })

      } catch (err) {
        console.error("Saqlangan kontentni olishda xatolik:", err)
      }
    }
    fetchSavedContent()
  }, [])

  useEffect(() => {
    const fetchFollowData = async () => {
      if (mestats?.id) {
        setLoadingFollowData(true)
        try {
          const res = await accountsAPI.getUserFollowData(mestats.id)
          setFollow({
            followers: res.data.followers,
            following: res.data.following,
          })
        } catch (error) {
          console.error("Follow data olishda xatolik:", error)
        } finally {
          setLoadingFollowData(false)
        }
      }
    }
    fetchFollowData()
  }, [mestats?.id])

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await authAPI.getCountry()
        setCountries(res.data)
      } catch (err) {
        console.error("Countries olishda xatolik:", err)
      }
    }
    fetchCountries()
  }, [])

  useEffect(() => {
    if (settings.country > 0) {
      const fetchRegions = async () => {
        try {
          const res = await authAPI.getRegion(settings.country)
          setRegions(res.data)
        } catch (err) {
          console.error("Regions olishda xatolik:", err)
        }
      }
      fetchRegions()
    }
  }, [settings.country])

  useEffect(() => {
    if (settings.region > 0) {
      const fetchDistricts = async () => {
        try {
          const res = await authAPI.getDistrict(settings.region)
          setDistricts(res.data)
        } catch (err) {
          console.error("Districts olishda xatolik:", err)
        }
      }
      fetchDistricts()
    }
  }, [settings.region])

  useEffect(() => {
    if (settings.district > 0) {
      const fetchSettlements = async () => {
        try {
          const res = await authAPI.getSettlement(settings.district)
          setSettlements(res.data)
        } catch (err) {
          console.error("Settlements olishda xatolik:", err)
        }
      }
      fetchSettlements()
    }
  }, [settings.district])

  const handleFollow = async (userId: number) => {
    try {
      await accountsAPI.toggleFollow(userId)
      if (mestats?.id) {
        const res = await accountsAPI.getUserFollowData(mestats.id)
        setFollow({
          followers: res.data.followers,
          following: res.data.following,
        })
      }
    } catch (error) {
      console.error("Follow toggle xatolik:", error)
    }
  }

  const convertToRecentQuestion = (q: any): RecentQuestion => ({
    id: q.id,
    question: q.question_text,
    type: q.question_type,
    test_title: q.test_title || "No Test",
    difficulty: q.difficulty_percentage < 33 ? "Oson" : q.difficulty_percentage < 66 ? "O'rtacha" : "Qiyin",
    category: null,
    answers: q.answers?.length || 0,
    correctRate:
      q.correct_count + q.wrong_count > 0 ? Math.round((q.correct_count / (q.correct_count + q.wrong_count)) * 100) : 0,
    created_at: q.created_at,
    updated_at: q.updated_at,
    is_active: q.is_active,
  })

  useEffect(() => {
    const fetchRecentQuestions = async () => {
      try {
        const res = await quizAPI.fetchRecentQuestions()
        const converted = res.data.map(convertToRecentQuestion)
        setRecentQuestions(converted)
      } catch (err) {
        console.error("So'nggi savollarni olishda xatolik:", err)
      }
    }
    fetchRecentQuestions()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tashkent",
    });
  };
  

  const getLevelBadge = (level: string) => {
    const badges = {
      beginner: { icon: "🔰", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
      intermediate: { icon: "⭐", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
      advanced: { icon: "🏆", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
      expert: { icon: "👑", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
    }
    return badges[level as keyof typeof badges] || badges.beginner
  }

  const handleTabSwitch = (tabId: SetStateAction<string>) => {
    setActiveTab(tabId)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      showToast("Faqat rasm fayllari ruxsat etilgan", "error")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Rasm hajmi 5MB dan kichik bo'lishi kerak", "error")
      return
    }

    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append("profile_image", file)

      const response = await updateProfileImage(formData)
      setMestats((prev) => (prev ? { ...prev, profile_image: response.data.profile_image } : null))
      showToast("Profil rasmi muvaffaqiyatli yangilandi!", "success")
    } catch (error) {
      console.error("Image upload error:", error)
      showToast("Rasm yuklashda xatolik yuz berdi", "error")
    } finally {
      setImageUploading(false)
      event.target.value = ""
    }
  }

  const handleSaveProfile = async () => {
    if (!mestats) return
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("first_name", mestats.first_name)
      formData.append("last_name", mestats.last_name)
      formData.append("username", mestats.username)
      formData.append("bio", mestats.bio)
      formData.append("email", mestats.email)
      formData.append("phone_number", mestats.phone_number)
      formData.append("country_id", String(settings.country))
      formData.append("region_id", String(settings.region))
      formData.append("district_id", String(settings.district))
      formData.append("settlement_id", String(settings.settlement))
      await authAPI.updateProfile(formData)
      showToast("Profil muvaffaqiyatli saqlandi!", "success")
    } catch (error) {
      console.error("Profile update error:", error)
      showToast("Profilni saqlashda xatolik yuz berdi", "error")
    }
    setIsLoading(false)
  }

  const handleSettingChange = (category: keyof UserSettings, key: string, value: string | boolean | number) => {
    setSettings((prev) => {
      const current = prev[category]
      if (typeof current === "object" && current !== null) {
        return {
          ...prev,
          [category]: {
            ...current,
            [key]: value,
          },
        }
      }
      return {
        ...prev,
        [category]: value,
      }
    })
  }

  const handleSaveSettings = async () => {
    setSettingsLoading(true)
    try {
      await authAPI.updateProfile({
        country_id: settings.country,
        region_id: settings.region,
        district_id: settings.district,
        settlement_id: settings.settlement,
      })
      showToast("Sozlamalar muvaffaqiyatli saqlandi!", "success")
    } catch (error) {
      console.error("Settings update error:", error)
      showToast("Sozlamalarni saqlashda xatolik yuz berdi", "error")
    }
    setSettingsLoading(false)
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      window.location.href = "/login"
    }
  }
  const getTelegramBotUrl = () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    return `https://t.me/TestAbdUzBot?start=access_token=${accessToken}&refresh_token=${refreshToken}`;
  };

  const accuracy =
    mestats && mestats.correct_count + mestats.wrong_count > 0
      ? ((mestats.correct_count / (mestats.correct_count + mestats.wrong_count)) * 100).toFixed(2)
      : "0.00"

  // Custom components remain the same...
  const CustomButton = ({
    children,
    onClick,
    variant = "primary",
    size = "md",
    disabled = false,
    className = "",
    ...props
  }: {
    children: React.ReactNode
    onClick?: () => void
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
    size?: "sm" | "md" | "lg"
    disabled?: boolean
    className?: string
    [key: string]: any
  }) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"

    const variants = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
      secondary: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500",
      outline:
        "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
      ghost:
        "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800",
      danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    }

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    }

    const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"

    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )
  }

  const CustomCard = ({
    children,
    className = "",
    ...props
  }: {
    children: React.ReactNode
    className?: string
    [key: string]: any
  }) => {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }

  const CustomModal = ({
    isOpen,
    onClose,
    title,
    children,
    size = "md",
  }: {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    size?: "sm" | "md" | "lg" | "xl"
  }) => {
    if (!isOpen) return null

    const sizes = {
      sm: "max-w-md",
      md: "max-w-2xl",
      lg: "max-w-4xl",
      xl: "max-w-6xl",
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div
          className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-xl ${sizes[size]} w-full max-h-[90vh] overflow-hidden`}
        >
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          )}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
        </div>
      </div>
    )
  }

  const CustomBadge = ({
    children,
    variant = "default",
    className = "",
  }: {
    children: React.ReactNode
    variant?: "default" | "secondary" | "success" | "danger" | "warning"
    className?: string
  }) => {
    const variants = {
      default: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      secondary: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
      >
        {children}
      </span>
    )
  }

  const CustomInput = ({
    label,
    className = "",
    ...props
  }: {
    label?: string
    className?: string
    [key: string]: any
  }) => {
    return (
      <div className="space-y-1">
        {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
        <input
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${className}`}
          {...props}
        />
      </div>
    )
  }

  const CustomTextarea = ({
    label,
    className = "",
    ...props
  }: {
    label?: string
    className?: string
    [key: string]: any
  }) => {
    return (
      <div className="space-y-1">
        {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
        <textarea
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${className}`}
          {...props}
        />
      </div>
    )
  }

  const CustomSelect = ({
    label,
    options,
    className = "",
    ...props
  }: {
    label?: string
    options: { value: string | number; label: string }[]
    className?: string
    [key: string]: any
  }) => {
    return (
      <div className="space-y-1">
        {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
        <select
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  const CustomSwitch = ({
    checked,
    onChange,
    label,
    description,
  }: {
    checked: boolean
    onChange: (checked: boolean) => void
    label?: string
    description?: string
  }) => {
    return (
      <div className="flex items-center justify-between">
        <div>
          {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
          {description && <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>}
        </div>
        <button
          type="button"
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"
            }`}
          onClick={() => onChange(!checked)}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"
              }`}
          />
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 touch-pan-y select-none">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-1" />

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <img
                  src="/logo.jpg"
                  alt="TestAbd logo"
                  className="w-6 h-6"
                  style={{ objectFit: "cover", borderRadius: "0.375rem" }}
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TestAbd
              </span>
            </div>

            <div className="flex-1 flex justify-end items-center space-x-2">
              <CustomButton variant="ghost" onClick={toggleDarkMode} className="rounded-full p-2">
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </CustomButton>
              <CustomButton variant="ghost" onClick={() => setIsSettingsOpen(true)} className="rounded-full p-2">
                <Settings className="h-5 w-5" />
              </CustomButton>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 space-y-8">
        {/* Profile Section */}
        <CustomCard className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32 sm:h-30" />
          <div className="px-6 pb-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 -mt-16 sm:-mt-20">
              <div className="relative">
                <img
                  src={mestats?.profile_image || "https://backend.testabd.uz/media/defaultuseravatar.png"}
                  alt="Profile"
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white object-cover shadow-lg"
                />
                {mestats?.is_badged && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-lg">
                    <Shield size={16} />
                  </div>
                )}
                {mestats?.is_premium && (
                  <div className="absolute top-0 right-0 bg-yellow-500 text-white p-2 rounded-full shadow-lg">
                    <Crown size={16} />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {mestats?.first_name} {mestats?.last_name}
                </h1>
                <p className="text-gray-600 dark:text-white">@{mestats?.username}</p>

                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3">
                  <CustomBadge className={getLevelBadge(mestats?.level || "beginner").color}>
                    {getLevelBadge(mestats?.level || "beginner").icon} {mestats?.level}
                  </CustomBadge>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    <Calendar size={16} className="mr-1" />
                    Qoʻshildi {formatDate(mestats?.join_date || "")}
                  </div>
                  <div className="flex items-center text-orange-500 text-sm">
                    <Coins size={16} className="mr-1" />
                    {mestats?.coins || 0} TestCoin
                  </div>

                  {mestats?.bio && <p className="text-gray-600 dark:text-gray-400 max-w-2xl">{mestats.bio}</p>}
                </div>
              </div>
            </div>
          </div>
        </CustomCard>

        {/* Statistics Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <CustomCard className="p-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Daromaddagi ulushingiz</div>
            <div className="text-2xl font-bold text-orange-600">{mestats?.coin_percentage || 0}%</div>
          </CustomCard>
          <CustomCard className="p-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Testlarda ishtirok etildi</div>
            <div className="text-2xl font-bold text-blue-600">{mestats?.tests_solved || 0}</div>
          </CustomCard>

          <CustomCard className="p-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Savollarga nisbatan aniqlik darajasi
            </div>
            <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
          </CustomCard>

          <CustomCard className="p-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Kunlik chiziq</div>
            <div className="text-2xl font-bold text-orange-600">{mestats?.streak_days || 0}</div>
          </CustomCard>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CustomCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5" />
              <h3 className="text-lg font-semibold dark:text-white">Savollarga javob berildi</h3>
            </div>
            <div className="text-3xl font-bold mb-4 dark:text-white">
              {Number(mestats?.correct_count || 0) + Number(mestats?.wrong_count || 0)}
            </div>
            <div className="flex justify-between">
              <div className="text-center">
                <div className="text-xl font-semibold text-green-600">{mestats?.correct_count || 0}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">To'g'ri</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-red-600">{mestats?.wrong_count || 0}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Xato</div>
              </div>
            </div>
          </CustomCard>

          <CustomCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="h-5 w-5" />
              <h3 className="text-lg font-semibold dark:text-white">Ijtimoiy statistika</h3>
            </div>
            <div className="flex justify-around">
              <CustomButton
                variant="ghost"
                onClick={() => setShowFollowers(true)}
                disabled={loadingFollowData}
                className="flex flex-col items-center p-4"
              >
                <div className="text-2xl font-bold text-blue-600">
                  {loadingFollowData ? "..." : follow?.followers?.length || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Obunachilar</div>
              </CustomButton>
              <CustomButton
                variant="ghost"
                onClick={() => setShowFollowing(true)}
                disabled={loadingFollowData}
                className="flex flex-col items-center p-4"
              >
                <div className="text-2xl font-bold text-blue-600">
                  {loadingFollowData ? "..." : follow?.following?.length || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Kuzatish</div>
              </CustomButton>
            </div>
          </CustomCard>
        </div>

        {/* Enhanced Activity Chart */}
        <EnhancedActivityChart weeklyData={mestats?.weekly_test_count} />

        {/* Rest of the existing content remains the same... */}

        {/* My Tests Section */}
        <CustomCard className="p-6">
          <h3 className="text-lg font-semibold mb-6 dark:text-white">Mening Testlarim</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTests.map((test) => (
              <CustomCard key={test.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <CustomBadge variant="secondary">
                    {test.category?.emoji} {test.category?.title}
                  </CustomBadge>
                  <CustomBadge variant={test.visibility === "public" ? "default" : test.visibility === "unlisted" ? "warning" : "danger"}>
                    {test.visibility === "public" ? "Ommaviy" : test.visibility === "unlisted" ? "Maxfiy" : "Qoralama"}
                  </CustomBadge>
                </div>
                <h4 className="text-lg font-semibold mb-2 dark:text-white">{test.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{test.description}</p>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>{test.total_questions} savollar</span>
                  {test.rating > 0 && <span>⭐ {test.rating}</span>}
                </div>
                <div className="flex gap-2">
                  <CustomButton
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingTest(test)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Tahrirlash
                  </CustomButton>
                  <CustomButton
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedTest(test)
                      setShowTestAnalytics(true)
                    }}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analitika
                  </CustomButton>
                </div>
              </CustomCard>
            ))}
          </div>
        </CustomCard>

        {/* Recent Questions Section */}
        <CustomCard className="p-6">
          <h3 className="text-lg font-semibold mb-6 dark:text-white">So'nggi Savollar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentQuestions.length > 0 ? (
              recentQuestions.map((question, index) => (
                <CustomCard key={`q-${question.id}-${index}`} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <CustomBadge variant="secondary">{question.type}</CustomBadge>
                    <CustomBadge
                      variant={
                        question.difficulty === "Oson"
                          ? "success"
                          : question.difficulty === "O'rtacha"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {question.difficulty}
                    </CustomBadge>
                  </div>
                  <h4 className="text-lg font-semibold mb-2 line-clamp-2 dark:text-white">{question.question}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{question.test_title}</p>
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>{question.answers} variantlar</span>
                    <span>{question.correctRate}% to'g'ri</span>
                  </div>
                  <div className="flex gap-2">
                    <CustomButton
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingQuestion(question)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Tahrirlash
                    </CustomButton>
                    <CustomButton
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedQuestion(question)
                        setShowQuestionAnalytics(true)
                      }}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analitika
                    </CustomButton>
                  </div>
                </CustomCard>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 col-span-full text-center py-8">
                Oxirgi savollar topilmadi.
              </p>
            )}
          </div>
        </CustomCard>

        {/* Saved Tests and Questions Section */}
        <CustomCard className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bookmark className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold dark:text-white">Saqlangan Test va Savollar</h3>
          </div>

          {/* Saved Tests */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <h4 className="text-md font-medium dark:text-white">Saqlangan Testlar</h4>
                <CustomBadge variant="secondary">{savedTests.length}</CustomBadge>
              </div>
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={() => setShowAllSavedTests(true)}
                className="flex items-center gap-1"
              >
                Barchasi
                <ChevronRight size={16} />
              </CustomButton>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {savedTests.slice(0, 5).map((test) => (
                <div
                  key={test.id}
                  className="flex-shrink-0 w-72 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <CustomBadge variant="secondary">
                      {test.test_detail.category.emoji} {test.test_detail.category.title}
                    </CustomBadge>
                    <div className="flex items-center text-yellow-500 text-sm">⭐ {test.test_detail.difficulty_percentage.toFixed(1) || 0}%</div>
                  </div>
                  <h5 className="font-semibold mb-2 dark:text-white line-clamp-2">{test.test_detail.title}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{test.test_detail.description}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span>{test.test_detail.total_questions} savollar</span>
                    <span>@{test.user.username}</span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">Saqlangan: {formatDate(test.created_at)}</div>
                </div>
              ))}
              {savedTests.length === 0 && (
                <div className="flex-shrink-0 w-72 bg-gray-50 dark:bg-gray-700 rounded-lg p-8 border border-gray-200 dark:border-gray-600 text-center">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hozircha saqlangan testlar yo'q</p>
                </div>
              )}
            </div>
          </div>

          {/* Saved Questions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <h4 className="text-md font-medium dark:text-white">Saqlangan Savollar</h4>
                <CustomBadge variant="secondary">{savedQuestions.length}</CustomBadge>
              </div>
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={() => setShowAllSavedQuestions(true)}
                className="flex items-center gap-1"
              >
                Barchasi
                <ChevronRight size={16} />
              </CustomButton>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {savedQuestions.slice(0, 5).map((question) => (
                <div
                  key={question.id}
                  className="flex-shrink-0 w-72 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <CustomBadge variant="secondary">{question.question_detail.question_type}</CustomBadge>
                    <CustomBadge
                      variant={
                        question.question_detail.difficulty_percentage <= 35
                          ? "success"
                          : question.question_detail.difficulty_percentage >= 36 && question.question_detail.difficulty_percentage <= 70
                            ? "warning"
                            : "danger"
                      }
                    >
                      {question.question_detail.difficulty_percentage.toFixed(1) || 0}%
                    </CustomBadge>
                  </div>
                  <h5 className="font-semibold mb-2 dark:text-white line-clamp-2">{question.question_detail.question_text}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{question.question_detail.test_title}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {/* <span>
                      {question.category?.emoji} {question.category?.title || "Kategoriyasiz"}
                    </span> */}
                    <span>@{question.user.username}</span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Saqlangan: {formatDate(question.created_at)}
                  </div>
                </div>
              ))}
              {savedQuestions.length === 0 && (
                <div className="flex-shrink-0 w-72 bg-gray-50 dark:bg-gray-700 rounded-lg p-8 border border-gray-200 dark:border-gray-600 text-center">
                  <HelpCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hozircha saqlangan savollar yo'q</p>
                </div>
              )}
            </div>
          </div>
        </CustomCard>
      </main>

      {/* Settings Modal */}
      <CustomModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} size="xl">
        <div className="flex flex-col md:flex-row h-full">
          {/* Mobile Top Navigation */}
          <div className="md:hidden border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex space-x-2 overflow-x-auto">
              {[
                { id: "profile", icon: User, text: "Profile" },
                { id: "preferences", icon: Cog, text: "Afzalliklar" },
                { id: "referral", icon: Users, text: "Referral" },
                { id: "logout", icon: LogOut, text: "Chiqish" },
              ].map((item) => (
                <CustomButton
                  key={item.id}
                  variant={activeTab === item.id ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => handleTabSwitch(item.id)}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <item.icon size={16} />
                  <span className="text-xs">{item.text}</span>
                </CustomButton>
              ))}
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden md:block w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-2 dark:text-white">Sozlamalar</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Hisobingiz va afzalliklaringizni boshqaring</p>

              <nav className="space-y-2">
                {[
                  { id: "profile", icon: User, text: "Profil" },
                  { id: "preferences", icon: Cog, text: "Afzalliklar" },
                  { id: "referral", icon: Users, text: "Referral" },
                  { id: "logout", icon: LogOut, text: "Chiqish" },
                ].map((item) => (
                  <CustomButton
                    key={item.id}
                    variant={activeTab === item.id ? "primary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleTabSwitch(item.id)}
                  >
                    <item.icon size={20} className="mr-3" />
                    {item.text}
                  </CustomButton>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === "profile" && (
              <div className="space-y-6">
                {/* Telegram Bot Integration Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-6 text-white shadow-xl">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Bot size={28} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-1">🚀 Telegram Bot orqali boshqaring!</h3>
                          <p className="text-blue-100 text-sm">Profil ma'lumotlaringizni yanada qulay boshqaring</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Sparkles size={20} className="text-yellow-300 animate-pulse" />
                        <Zap size={20} className="text-yellow-300 animate-bounce" />
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                      <h4 className="font-semibold mb-2 flex items-center">
                        <span className="mr-2">✨</span>
                        Telegram botimizning afzalliklari:
                      </h4>
                      <ul className="text-sm space-y-1 text-blue-100">
                        <li className="flex items-center"><span className="mr-2">🔥</span>Tezkor profil yangilash</li>
                        <li className="flex items-center"><span className="mr-2">📱</span>Mobil qurilmada qulay foydalanish</li>
                        <li className="flex items-center"><span className="mr-2">🔔</span>Real vaqtda bildirishnomalar</li>
                        <li className="flex items-center"><span className="mr-2">⚡</span>Bir necha sekundda sozlash</li>
                      </ul>
                    </div>

                    <a
                      href={getTelegramBotUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Bot size={20} className="mr-2" />
                      <span className="mr-2">@TestAbdUzBot</span>
                      <ExternalLink size={16} />
                    </a>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                  <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 dark:text-white">Profil Sozlamalari</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Shaxsiy ma'lumotlaringizni va profil rasmingizni yangilang
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    <img
                      src={mestats?.profile_image || "https://backend.testabd.uz/media/defaultuseravatar.png"}
                      alt="Current Avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                    />
                    {imageUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h5 className="font-medium mb-2 dark:text-white">Profil rasmini o'zgartirish</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Yangi profil rasmini yuklang. Tavsiya etilgan o'lcham: 400x400px, maksimal hajm: 5MB
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={imageUploading}
                      />
                      <CustomButton variant="outline" disabled={imageUploading}>
                        {imageUploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Yuklanmoqda...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Yangi rasm yuklash
                          </>
                        )}
                      </CustomButton>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomInput
                    label="Ism"
                    value={mestats?.first_name || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMestats((prev) => (prev ? { ...prev, first_name: e.target.value } : null))
                    }
                    placeholder="Ismingizni kiriting"
                  />
                  <CustomInput
                    label="Familiya"
                    value={mestats?.last_name || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMestats((prev) => (prev ? { ...prev, last_name: e.target.value } : null))
                    }
                    placeholder="Familyangizni kiriting"
                  />
                </div>

                <CustomInput
                  label="Email"
                  type="email"
                  value={mestats?.email || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMestats((prev) => (prev ? { ...prev, email: e.target.value } : null))
                  }
                  placeholder="Emailingizni kiriting"
                />

                <CustomInput
                  label="Telefon raqami"
                  value={mestats?.phone_number || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMestats((prev) => (prev ? { ...prev, phone_number: e.target.value } : null))
                  }
                  placeholder="Telefon raqamingizni kiriting"
                />

                <CustomTextarea
                  label="Bio"
                  placeholder="O'zingiz haqingizda ma'lumot bering..."
                  rows={4}
                  value={mestats?.bio || ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setMestats((prev) => (prev ? { ...prev, bio: e.target.value } : null))
                  }
                />
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="space-y-6">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-6 text-white shadow-xl">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Bot size={28} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-1">🚀 Telegram Bot orqali boshqaring!</h3>
                          <p className="text-blue-100 text-sm">Profil ma'lumotlaringizni yanada qulay boshqaring</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Sparkles size={20} className="text-yellow-300 animate-pulse" />
                        <Zap size={20} className="text-yellow-300 animate-bounce" />
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                      <h4 className="font-semibold mb-2 flex items-center">
                        <span className="mr-2">✨</span>
                        Telegram botimizning afzalliklari:
                      </h4>
                      <ul className="text-sm space-y-1 text-blue-100">
                        <li className="flex items-center"><span className="mr-2">🔥</span>Profile malumotlaridan qulay xabardor bo'lish</li>
                        <li className="flex items-center"><span className="mr-2">📱</span>Bir necha bosish bilan malumotlaringizni ko'ring</li>
                        <li className="flex items-center"><span className="mr-2">⚡</span>Bir necha sekundda sozlash</li>
                      </ul>
                    </div>

                    <a
                      href={getTelegramBotUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Bot size={20} className="mr-2" />
                      <span className="mr-2">@TestAbdUzBot</span>
                      <ExternalLink size={16} />
                    </a>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                  <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 dark:text-white">Afzalliklar</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Tajribangiz va ilova sozlamalaringizni moslashtiring
                  </p>
                </div>

                <div className="space-y-4">
                  <CustomSelect
                    label="Davlat"
                    value={settings.country || 0}
                    onChange={(e) =>
                      handleSettingChange(
                        "country",
                        null,
                        countries.find((country) => country.id === Number(e.target.value)) || 0
                      )
                    }
                    options={[
                      { value: 0, label: "Davlatni tanlash" },
                      ...countries.map((country) => ({ value: country.id, label: country.name })),
                    ]}
                  />

                  <CustomSelect
                    label="Viloyat"
                    value={settings.region}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      handleSettingChange("region", "", Number(e.target.value))
                    }
                    disabled={!settings.country}
                    options={[
                      { value: 0, label: "Mintaqani tanlash" },
                      ...regions.map((region) => ({ value: region.id, label: region.name })),
                    ]}
                  />

                  <CustomSelect
                    label="Tuman"
                    value={settings.district}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      handleSettingChange("district", "", Number(e.target.value))
                    }
                    disabled={!settings.region}
                    options={[
                      { value: 0, label: "Tumanni tanlash" },
                      ...districts.map((district) => ({ value: district.id, label: district.name })),
                    ]}
                  />

                  <CustomSelect
                    label="Mahalla"
                    value={settings.settlement}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      handleSettingChange("settlement", "", Number(e.target.value))
                    }
                    disabled={!settings.district}
                    options={[
                      { value: 0, label: "Selni tanlash" },
                      ...settlements.map((settlement) => ({ value: settlement.id, label: settlement.name })),
                    ]}
                  />
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div>
                  <div className="text-base font-medium mb-4 dark:text-white">Mavzu</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { code: "light", icon: "☀️", name: "Yorug'" },
                      { code: "dark", icon: "🌙", name: "Qorong'u" },
                    ].map((theme) => (
                      <CustomButton
                        key={theme.code}
                        variant={settings.theme === theme.code ? "primary" : "outline"}
                        onClick={() => {
                          handleSettingChange("theme", "", theme.code)
                          if (theme.code === "dark") {
                            setIsDarkMode(true)
                            document.documentElement.setAttribute("data-theme", "dark")
                            localStorage.setItem("theme", "dark")
                          } else if (theme.code === "light") {
                            setIsDarkMode(false)
                            document.documentElement.setAttribute("data-theme", "light")
                            localStorage.setItem("theme", "light")
                          }
                        }}
                        className="justify-start"
                      >
                        <span className="mr-2">{theme.icon}</span>
                        {theme.name}
                      </CustomButton>
                    ))}
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div className="flex justify-end gap-4">
                  <CustomButton variant="outline">Qayta tiklash</CustomButton>
                  <CustomButton onClick={handleSaveSettings} disabled={settingsLoading}>
                    {settingsLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saqlanmoqda...
                      </>
                    ) : (
                      "Save Preferences"
                    )}
                  </CustomButton>
                </div>
              </div>
            )}

            {activeTab === "referral" && <ReferralSection />}

            {activeTab === "logout" && (
              <div className="flex items-center justify-center min-h-[400px]">
                <CustomCard className="max-w-md w-full p-6 text-center">
                  <h3 className="text-xl font-semibold mb-3 dark:text-white">Rostdan ham dasturdan chiqmoqchimisiz?</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Agar "Ha" tugmasini bossangiz, siz tizimdan chiqarilasiz.
                  </p>
                  <div className="flex justify-center gap-4">
                    <CustomButton variant="danger" onClick={handleLogout}>
                      Ha, chiqaman
                    </CustomButton>
                    <CustomButton variant="outline" onClick={() => setIsSettingsOpen(false)}>
                      Yo'q, qolaman
                    </CustomButton>
                  </div>
                </CustomCard>
              </div>
            )}
          </div>
        </div>
      </CustomModal>

      {/* All existing modals remain the same... */}
      {/* All Saved Tests Modal */}
      <CustomModal
        isOpen={showAllSavedTests}
        onClose={() => setShowAllSavedTests(false)}
        title="Barcha Saqlangan Testlar"
        size="lg"
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedTests.map((test) => (
              <CustomCard key={test.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <CustomBadge variant="secondary">
                    {test.test_detail.category.emoji} {test.test_detail.category.title}
                  </CustomBadge>
                  <div className="flex items-center text-yellow-500 text-sm">⭐ {test.test_detail.difficulty_percentage.toFixed(1)}%</div>
                </div>
                <h4 className="text-lg font-semibold mb-2 dark:text-white">{test.test_detail.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{test.test_detail.description}</p>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>{test.test_detail.total_questions} savollar</span>
                  <span>@{test.user.username}</span>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                  Saqlangan: {formatDate(test.created_at)}
                </div>
                <div className="flex gap-2">
                  <CustomButton size="sm" className="flex-1" onClick={() => {
                    window.location.href = `/tests/${test.test_detail.id}`
                  }}>
                    Testni boshlash
                  </CustomButton>
                  <CustomButton variant="outline" size="sm">
                    <Bookmark className="h-4 w-4" />
                  </CustomButton>
                </div>
              </CustomCard>
            ))}
          </div>
          {savedTests.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Saqlangan testlar yo'q</h3>
              <p className="text-gray-500 dark:text-gray-400">Siz hali hech qanday testni saqlamagansiz.</p>
            </div>
          )}
        </div>
      </CustomModal>

      {/* All Saved Questions Modal */}
      <CustomModal
        isOpen={showAllSavedQuestions}
        onClose={() => setShowAllSavedQuestions(false)}
        title="Barcha Saqlangan Savollar"
        size="lg"
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedQuestions.map((question) => (
              <CustomCard key={question.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <CustomBadge variant="secondary">{question.question_detail.question_type}</CustomBadge>
                  <CustomBadge
                    variant={
                      question.question_detail.difficulty_percentage <= 35
                        ? "success"
                        : question.question_detail.difficulty_percentage >= 36 && question.question_detail.difficulty_percentage <= 70
                          ? "warning"
                          : "danger"
                    }
                  >
                    {question.question_detail.difficulty_percentage.toFixed(1)}%
                  </CustomBadge>
                </div>
                <h4 className="text-lg font-semibold mb-2 line-clamp-2 dark:text-white">{question.question_detail.question_text}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{question.question_detail.test_title}</p>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {/* <span>
                    {question.category?.emoji} {question.category?.title || "Kategoriyasiz"}
                  </span> */}
                  <span>@{question.user.username}</span>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                  Saqlangan: {formatDate(question.question_detail.created_at)}
                </div>
                <div className="flex gap-2">
                  <CustomButton size="sm" className="flex-1" onClick={() => {
                    window.location.href = `/questions/${question.question_detail.id}`
                  }}>
                    Savolni ko'rish
                  </CustomButton>
                  <CustomButton variant="outline" size="sm">
                    <Bookmark className="h-4 w-4" />
                  </CustomButton>
                </div>
              </CustomCard>
            ))}
          </div>
          {savedQuestions.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Saqlangan savollar yo'q</h3>
              <p className="text-gray-500 dark:text-gray-400">Siz hali hech qanday savolni saqlamagansiz.</p>
            </div>
          )}
        </div>
      </CustomModal>
      {/* Test Analytics Modal */}
      <CustomModal
        isOpen={showTestAnalytics && selectedTest !== null}
        onClose={() => {
          setShowTestAnalytics(false)
          setSelectedTest(null)
        }}
        title={`${selectedTest?.title} - Analitika`}
        size="lg"
      >
        {selectedTest && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CustomCard className="p-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Jami Tugallanganlar</div>
                <div className="text-2xl font-bold dark:text-white">{selectedTest.completions}</div>
              </CustomCard>
              <CustomCard className="p-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Reyting</div>
                <div className="text-2xl font-bold dark:text-white">{selectedTest.rating}/5</div>
              </CustomCard>
              <CustomCard className="p-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Savollar Soni</div>
                <div className="text-2xl font-bold dark:text-white">{selectedTest.total_questions}</div>
              </CustomCard>
            </div>

            <CustomCard className="p-6">
              <h4 className="text-lg font-semibold mb-4 dark:text-white">Test Ma'lumotlari</h4>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategoriya</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedTest.category?.emoji} {selectedTest.category?.title}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tavsif</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTest.description}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</div>
                  <CustomBadge variant={selectedTest.status === "published" ? "default" : "secondary"}>
                    {selectedTest.status}
                  </CustomBadge>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yaratilgan sana</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(selectedTest.created_at)}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vaqt chegarasi</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTest.time_limit} daqiqa</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ommaviy</div>
                  <CustomBadge variant={selectedTest.is_public ? "default" : "secondary"}>
                    {selectedTest.is_public ? "Ha" : "Yo'q"}
                  </CustomBadge>
                </div>
              </div>
            </CustomCard>
          </div>
        )}
      </CustomModal>
      {/* Test Edit Modal */}
      <CustomModal
        isOpen={editingTest !== null}
        onClose={() => setEditingTest(null)}
        title="Testni Tahrirlash"
        size="md"
      >
        {editingTest && (
          <div className="p-6 space-y-4">
            <CustomInput
              label="Test Nomi"
              value={editingTest.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditingTest((prev) => (prev ? { ...prev, title: e.target.value } : null))
              }
            />
            <CustomTextarea
              label="Tavsif"
              value={editingTest.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setEditingTest((prev) => (prev ? { ...prev, description: e.target.value } : null))
              }
              rows={4}
            />
            <CustomInput
              label="Vaqt chegarasi (daqiqa)"
              type="number"
              value={editingTest.time_limit}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditingTest((prev) => (prev ? { ...prev, time_limit: Number(e.target.value) } : null))
              }
            />
            <CustomSelect
              label="Status"
              value={editingTest.status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setEditingTest((prev) => (prev ? { ...prev, status: e.target.value as "published" | "draft" } : null))
              }
              options={[
                { value: "draft", label: "Qoralama" },
                { value: "published", label: "Chop etilgan" },
              ]}
            />
            <div className="flex items-center space-x-2">
              <CustomSwitch
                checked={editingTest.is_public}
                onChange={(checked) => setEditingTest((prev) => (prev ? { ...prev, is_public: checked } : null))}
                label="Ommaviy test"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <CustomButton variant="outline" onClick={() => setEditingTest(null)}>
                Bekor qilish
              </CustomButton>
              <CustomButton
                onClick={() => {
                  showToast("Test muvaffaqiyatli yangilandi!", "success")
                  setEditingTest(null)
                }}
              >
                Saqlash
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>
      {/* Question Analytics Modal */}
      <CustomModal
        isOpen={showQuestionAnalytics && selectedQuestion !== null}
        onClose={() => {
          setShowQuestionAnalytics(false)
          setSelectedQuestion(null)
        }}
        title="Savol Analitikasi"
        size="lg"
      >
        {selectedQuestion && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CustomCard className="p-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Javoblar Soni</div>
                <div className="text-2xl font-bold dark:text-white">{selectedQuestion.answers}</div>
              </CustomCard>
              <CustomCard className="p-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">To'g'ri Javob %</div>
                <div className="text-2xl font-bold dark:text-white">{selectedQuestion.correctRate}%</div>
              </CustomCard>
              <CustomCard className="p-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Qiyinlik Darajasi</div>
                <CustomBadge
                  variant={
                    selectedQuestion.difficulty === "Oson"
                      ? "success"
                      : selectedQuestion.difficulty === "O'rtacha"
                        ? "warning"
                        : "danger"
                  }
                >
                  {selectedQuestion.difficulty}
                </CustomBadge>
              </CustomCard>
            </div>

            <CustomCard className="p-6">
              <h4 className="text-lg font-semibold mb-4 dark:text-white">Savol Ma'lumotlari</h4>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Savol</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedQuestion.question}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedQuestion.test_title}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Turi</div>
                  <CustomBadge variant="secondary">{selectedQuestion.type}</CustomBadge>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yaratilgan sana</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(selectedQuestion.created_at)}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Holati</div>
                  <CustomBadge variant={selectedQuestion.is_active ? "default" : "secondary"}>
                    {selectedQuestion.is_active ? "Faol" : "Nofaol"}
                  </CustomBadge>
                </div>
              </div>
            </CustomCard>
          </div>
        )}
      </CustomModal>
      {/* Question Edit Modal */}
      <CustomModal
        isOpen={editingQuestion !== null}
        onClose={() => setEditingQuestion(null)}
        title="Savolni Tahrirlash"
        size="md"
      >
        {editingQuestion && (
          <div className="p-6 space-y-4">
            <CustomTextarea
              label="Savol"
              value={editingQuestion.question}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setEditingQuestion((prev) => (prev ? { ...prev, question: e.target.value } : null))
              }
              rows={3}
            />
            <CustomInput
              label="Turi"
              value={editingQuestion.type}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditingQuestion((prev) => (prev ? { ...prev, type: e.target.value } : null))
              }
            />
            <CustomSelect
              label="Qiyinlik Darajasi"
              value={editingQuestion.difficulty}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setEditingQuestion((prev) => (prev ? { ...prev, difficulty: e.target.value } : null))
              }
              options={[
                { value: "Oson", label: "Oson" },
                { value: "O'rtacha", label: "O'rtacha" },
                { value: "Qiyin", label: "Qiyin" },
              ]}
            />
            <div className="flex items-center space-x-2">
              <CustomSwitch
                checked={editingQuestion.is_active}
                onChange={(checked) => setEditingQuestion((prev) => (prev ? { ...prev, is_active: checked } : null))}
                label="Faol savol"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <CustomButton variant="outline" onClick={() => setEditingQuestion(null)}>
                Bekor qilish
              </CustomButton>
              <CustomButton
                onClick={() => {
                  showToast("Savol muvaffaqiyatli yangilandi!", "success")
                  setEditingQuestion(null)
                }}
              >
                Saqlash
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>
      {/* Followers Modal */}
      <CustomModal
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        title={`Obunachilar (${(Array.isArray(follow?.followers) && follow.followers.length) || 0})`}
        size="sm"
      >
        <div className="p-6">
          <div className="max-h-96 overflow-y-auto space-y-4">
            {Array.isArray(follow?.following) && follow.following.length > 0 ? (
              follow.followers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <img
                    src={`https://backend.testabd.uz${user.profile_image || "/media/defaultuseravatar.png"}`}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold dark:text-white">@{user.username}</h4>
                  </div>
                  <CustomButton
                    size="sm"
                    variant={user.is_following ? "outline" : "primary"}
                    onClick={() => handleFollow(user.id)}
                  >
                    {user.is_following ? (
                      <>
                        <UserMinus size={16} className="mr-1" />
                        Kuzatmaslik
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} className="mr-1" />
                        Kuzatish
                      </>
                    )}
                  </CustomButton>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Hozircha hech kimni kuzatmayapsiz</p>
            )}
          </div>
        </div>
      </CustomModal>

      {/* Following Modal */}
      <CustomModal
        isOpen={showFollowing}
        onClose={() => setShowFollowing(false)}
        title={`Following (${Array.isArray(follow?.following) ? follow.following.length : 0})`}
        size="sm"
      >
        <div className="p-6">
          <div className="max-h-96 overflow-y-auto space-y-4">
            {Array.isArray(follow?.following) && follow.following.length > 0 ? (
              follow.following.map((user) => (
                <div key={user.id} className="flex items-center space-x-4 p-3 rounded-lg border border-gray-200">
                  <img
                    src={user.profile_image || "/media/defaultuseravatar.png"}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{user.username}</h4>
                  </div>
                  <CustomButton size="sm" variant="outline" onClick={() => handleFollow(user.id)}>
                    <UserMinus size={16} className="mr-1" />
                    Unfollow
                  </CustomButton>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">Hozircha hech kimni kuzatmayapsiz</p>
            )}
          </div>
        </div>
      </CustomModal>

      <style>{`
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

export default ProfilePage
