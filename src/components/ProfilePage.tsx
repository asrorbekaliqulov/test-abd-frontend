"use client"

import type React from "react"

import { useState, useEffect, type SetStateAction } from "react"
import { Settings, Shield, Crown, Calendar, UserPlus, Cog, UserMinus, User, Zap, BarChart3, Edit, Upload, Moon, Sun, X } from 'lucide-react'
import { LogOut } from 'lucide-react'
import { quizAPI, authAPI, accountsAPI } from "../utils/api"

// Types
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
  following?: boolean
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
  status: "published" | "draft"
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

// Toast Component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${type === 'success'
        ? 'bg-green-500 text-white'
        : 'bg-red-500 text-white'
      } animate-slide-in`}>
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

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    const shouldBeDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark)

    setIsDarkMode(shouldBeDark)
    document.documentElement.setAttribute("data-theme", shouldBeDark ? "dark" : "light")
    setSettings(prev => ({ ...prev, theme: shouldBeDark ? "dark" : "light" }))
  }, [])

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    const theme = newMode ? "dark" : "light"

    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("theme", theme)
    setSettings(prev => ({ ...prev, theme }))
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }

  // PROFILE MALUMOTLARINI OLISH
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

  // MY TESTS OLISH
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

  // FOLLOW DATA OLISH
  useEffect(() => {
    const fetchFollowData = async () => {
      if (mestats?.id) {
        setLoadingFollowData(true)
        try {
          const res = await accountsAPI.getUserFollowData(mestats.id)
          setFollow({
            followers: res.followers,
            following: res.following,
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

  // LOCATION DATA OLISH
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

  const activityData: number[] = Object.values(mestats?.weekly_test_count || {}) as number[]

  const handleFollow = async (userId: number) => {
    try {
      await accountsAPI.toggleFollow(userId)
      if (mestats?.id) {
        const res = await accountsAPI.getUserFollowData(mestats.id)
        setFollow({
          followers: res.followers,
          following: res.following,
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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

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

    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append("profile_image", file)

      // Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate upload

      showToast("Profil rasmi muvaffaqiyatli yangilandi!", "success")
    } catch (error) {
      showToast("Rasm yuklashda xatolik yuz berdi", "error")
    } finally {
      setImageUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!mestats) return
    setIsLoading(true)
    try {
      await authAPI.updateProfile({
        first_name: mestats.first_name,
        last_name: mestats.last_name,
        username: mestats.username,
        bio: mestats.bio,
        email: mestats.email,
        phone_number: mestats.phone_number,
        country: settings.country,
        region: settings.region,
        district: settings.district,
        settlement: settings.settlement,
      })
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
        country: settings.country,
        region: settings.region,
        district: settings.district,
        settlement: settings.settlement,
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

  const accuracy =
    mestats && mestats.correct_count + mestats.wrong_count > 0
      ? ((mestats.correct_count / (mestats.correct_count + mestats.wrong_count)) * 100).toFixed(2)
      : "0.00"

  // Custom Button Component
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
      outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
      ghost: "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800",
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

  // Custom Card Component
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
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`} {...props}>
        {children}
      </div>
    )
  }

  // Custom Modal Component
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
        <div className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-xl ${sizes[size]} w-full max-h-[90vh] overflow-hidden`}>
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
          )}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
        </div>
      </div>
    )
  }

  // Custom Badge Component
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

  // Custom Input Component
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

  // Custom Textarea Component
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

  // Custom Select Component
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

  // Custom Switch Component
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
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
            }`}
          onClick={() => onChange(!checked)}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
              }`}
          />
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 touch-pan-y select-none">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-1" />

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <img src="/logo.jpg" alt="TestAbd logo" className="w-6 h-6" style={{ objectFit: "cover", borderRadius: "0.375rem" }} />
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
                    <Zap size={16} className="mr-1" />
                    {mestats?.streak_day || 0} kunlik chiziq
                  </div>
                </div>

                {mestats?.bio && <p className="text-gray-600 dark:text-gray-400 max-w-2xl">{mestats.bio}</p>}
              </div>
            </div>
          </div>
        </CustomCard>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CustomCard className="p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Testlar tugallandi</div>
            <div className="text-2xl font-bold text-blue-600">{mestats?.tests_solved || 0}</div>
          </CustomCard>

          <CustomCard className="p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Aniqlik darajasi</div>
            <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
          </CustomCard>

          <CustomCard className="p-6">
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

        {/* Activity Chart */}
        <CustomCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Haftalik Faollik</h3>
          <div className="flex items-end justify-between h-32 gap-2">
            {activityData.map((value, index) => {
              const maxValue = Math.max(...activityData)
              const height = maxValue ? (value / maxValue) * 100 : 0
              const days = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"]

              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-purple-600 rounded-t transition-all duration-1000 ease-out"
                    style={{ height: `${height}%`, minHeight: "4px" }}
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{days[index]}</div>
                </div>
              )
            })}
          </div>
        </CustomCard>

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
                  <CustomBadge variant={test.status === "published" ? "default" : "secondary"}>
                    {test.status}
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
              <h2 className="text-lg font-semibold mb-2 dark:text-white">Settings</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Manage your account and preferences</p>

              <nav className="space-y-2">
                {[
                  { id: "profile", icon: User, text: "Profile" },
                  { id: "preferences", icon: Cog, text: "Afzalliklar" },
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
                <div>
                  <h3 className="text-lg font-semibold mb-2 dark:text-white">Profile Settings</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Update your personal information and profile picture
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <img
                    src={mestats?.profile_image || "/placeholder.svg?height=100&width=100&text=User"}
                    alt="Current Avatar"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <h5 className="font-medium mb-2 dark:text-white">Change Profile Picture</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Upload a new profile picture. Recommended size: 400x400px
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
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                            Yuklanmoqda...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload New Photo
                          </>
                        )}
                      </CustomButton>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomInput
                    label="First Name"
                    value={mestats?.first_name || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMestats((prev) => (prev ? { ...prev, first_name: e.target.value } : null))
                    }
                    placeholder="Enter your first name"
                  />
                  <CustomInput
                    label="Last Name"
                    value={mestats?.last_name || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMestats((prev) => (prev ? { ...prev, last_name: e.target.value } : null))
                    }
                    placeholder="Enter your last name"
                  />
                </div>

                <CustomInput
                  label="Username"
                  value={mestats?.username || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMestats((prev) => (prev ? { ...prev, username: e.target.value } : null))
                  }
                  placeholder="Choose a unique username"
                />

                <CustomInput
                  label="Email"
                  type="email"
                  value={mestats?.email || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMestats((prev) => (prev ? { ...prev, email: e.target.value } : null))
                  }
                  placeholder="Enter your email"
                />

                <CustomInput
                  label="Phone Number"
                  value={mestats?.phone_number || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMestats((prev) => (prev ? { ...prev, phone_number: e.target.value } : null))
                  }
                  placeholder="Enter your phone number"
                />

                <CustomTextarea
                  label="Bio"
                  placeholder="Tell us about yourself..."
                  rows={4}
                  value={mestats?.bio || ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setMestats((prev) => (prev ? { ...prev, bio: e.target.value } : null))
                  }
                />

                <div className="flex gap-4">
                  <CustomButton onClick={handleSaveProfile} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saqlanmoqda...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </CustomButton>
                  <CustomButton variant="outline">Reset</CustomButton>
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 dark:text-white">Preferences</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Customize your experience and app settings
                  </p>
                </div>

                <div className="space-y-4">
                  <CustomSelect
                    label="Country"
                    value={settings.country}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      handleSettingChange("country", "", Number(e.target.value))
                    }
                    options={[
                      { value: 0, label: "Select Country" },
                      ...countries.map((country) => ({ value: country.id, label: country.name })),
                    ]}
                  />

                  <CustomSelect
                    label="Region/State"
                    value={settings.region}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      handleSettingChange("region", "", Number(e.target.value))
                    }
                    disabled={!settings.country}
                    options={[
                      { value: 0, label: "Select Region" },
                      ...regions.map((region) => ({ value: region.id, label: region.name })),
                    ]}
                  />

                  <CustomSelect
                    label="District"
                    value={settings.district}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      handleSettingChange("district", "", Number(e.target.value))
                    }
                    disabled={!settings.region}
                    options={[
                      { value: 0, label: "Select District" },
                      ...districts.map((district) => ({ value: district.id, label: district.name })),
                    ]}
                  />

                  <CustomSelect
                    label="Settlement"
                    value={settings.settlement}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      handleSettingChange("settlement", "", Number(e.target.value))
                    }
                    disabled={!settings.district}
                    options={[
                      { value: 0, label: "Select Settlement" },
                      ...settlements.map((settlement) => ({ value: settlement.id, label: settlement.name })),
                    ]}
                  />
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div>
                  <div className="text-base font-medium mb-4 dark:text-white">Language</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { code: "uz", flag: "🇺🇿", name: "O'zbek" },
                      { code: "en", flag: "🇺🇸", name: "English" },
                      { code: "ru", flag: "🇷🇺", name: "Русский" },
                    ].map((lang) => (
                      <CustomButton
                        key={lang.code}
                        variant={settings.language === lang.code ? "primary" : "outline"}
                        onClick={() => handleSettingChange("language", "", lang.code)}
                        className="justify-start"
                      >
                        <span className="mr-2">{lang.flag}</span>
                        {lang.name}
                      </CustomButton>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-base font-medium mb-4 dark:text-white">Theme</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { code: "light", icon: "☀️", name: "Light" },
                      { code: "dark", icon: "🌙", name: "Dark" },
                      { code: "auto", icon: "🔄", name: "Auto" },
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

                <div>
                  <div className="text-base font-medium mb-4 dark:text-white">Notifications</div>
                  <div className="space-y-4">
                    <CustomSwitch
                      checked={settings.notifications.push}
                      onChange={(checked) => handleSettingChange("notifications", "push", checked)}
                      label="Push Notifications"
                      description="Receive push notifications"
                    />
                    <CustomSwitch
                      checked={settings.notifications.email}
                      onChange={(checked) => handleSettingChange("notifications", "email", checked)}
                      label="Email Notifications"
                      description="Receive email notifications"
                    />
                    <CustomSwitch
                      checked={settings.notifications.sound}
                      onChange={(checked) => handleSettingChange("notifications", "sound", checked)}
                      label="Sound Notifications"
                      description="Play sound for notifications"
                    />
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div>
                  <div className="text-base font-medium mb-4 dark:text-white">Privacy</div>
                  <div className="space-y-4">
                    <CustomSwitch
                      checked={settings.privacy.publicProfile}
                      onChange={(checked) => handleSettingChange("privacy", "publicProfile", checked)}
                      label="Public Profile"
                      description="Make your profile visible to everyone"
                    />
                    <CustomSwitch
                      checked={settings.privacy.showOnlineStatus}
                      onChange={(checked) => handleSettingChange("privacy", "showOnlineStatus", checked)}
                      label="Show Online Status"
                      description="Let others see when you're online"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <CustomButton variant="outline">Reset</CustomButton>
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
                  console.log("Updating test:", editingTest)
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
                  console.log("Updating question:", editingQuestion)
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
        title={`Followers (${(Array.isArray(follow?.followers) && follow.followers.length) || 0})`}
        size="sm"
      >
        <div className="p-6">
          <div className="max-h-96 overflow-y-auto space-y-4">
            {Array.isArray(follow?.following) && follow.following.length > 0 ? (
              follow.following.map((user) => (
                <div key={user.id} className="flex items-center space-x-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <img
                    src={user.profile_image || "/placeholder.svg?height=48&width=48&text=User"}
                    alt={user.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold dark:text-white">@{user.username}</h4>
                </div>
                <CustomButton
                  size="sm"
                  variant={user.following ? "outline" : "primary"}
                  onClick={() => handleFollow(user.id)}
                >
                  {user.following ? (
                    <>
                      <UserMinus size={16} className="mr-1" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} className="mr-1" />
                      Follow
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
                    src={user.profile_image || "/placeholder.svg?height=48&width=48&text=User"}
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
      `}</style>
    </div>
  )
}

export default ProfilePage
