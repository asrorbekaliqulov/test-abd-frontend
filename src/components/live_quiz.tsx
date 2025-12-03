"use client"

import type React from "react"
import {useState, useEffect, useCallback} from "react"
import {
    ArrowLeft,
    Clock,
    Calendar,
    Play,
    ChevronRight,
    CheckCircle,
    Loader2,
    Sun,
    Moon,
    Users,
    Trophy,
    Zap,
    List,
    Globe,
    Lock,
    Edit3,
    AlertCircle,
    RefreshCw,
} from "lucide-react"
import VerticalWheelTimePicker from "./VerticalWheelTimePicker"
import {quizAPI, liveQuizAPI, handleApiError, initializeCSRF} from "../utils/api"

interface CreateLiveQuizProps {
    theme: string
    toggleTheme: () => void
}

interface Test {
    id: number
    title: string
    description?: string
    total_questions: number
    user: {
        id: number
        username: string
        profile_image?: string
    }
    created_at: string
    difficulty_percentage?: number
    visibility: "public" | "draft"
    participant_count: number
}

interface LiveQuiz {
    id: number
    test: Test
    creator: {
        id: number
        username: string
    }
    is_active: boolean
    start_time: string
    mode: string
    description: string
}

interface LiveQuizSettings {
    mode: "immediate" | "scheduled"
    selectedTest: Test | null
    quizType: "free" | "timed"
    timePerQuestion: number
    endTime: Date | null
    scheduledStart?: Date
    scheduledEnd?: Date
    startTime: { hours: number; minutes: number }
}

const CreateLiveQuiz: React.FC<CreateLiveQuizProps> = ({theme, toggleTheme}) => {
    const [currentStep, setCurrentStep] = useState<"main" | "test_selection" | "quiz_settings" | "schedule">("main")
    const [settings, setSettings] = useState<LiveQuizSettings>({
        mode: "immediate",
        selectedTest: null,
        quizType: "free",
        timePerQuestion: 30,
        endTime: null,
        startTime: {hours: new Date().getHours(), minutes: new Date().getMinutes()},
    })
    const [loading, setLoading] = useState(false)
    const [tests, setTests] = useState<{
        myTests: Test[]
        publicTests: Test[]
    }>({
        myTests: [],
        publicTests: [],
    })
    const [myQuizzes, setMyQuizzes] = useState<LiveQuiz[]>([])
    const [creating, setCreating] = useState(false)
    const [errors, setErrors] = useState<{
        myTests?: string
        publicTests?: string
        myQuizzes?: string
        creation?: string
    }>({})
    const [demoMode, setDemoMode] = useState(false)

    const demoTests: Test[] = [
        {
            id: 1,
            title: "JavaScript Asoslari",
            description: "JavaScript dasturlash tilining asosiy tushunchalari",
            total_questions: 15,
            user: {id: 1, username: "demo_user"},
            created_at: new Date().toISOString(),
            visibility: "public",
            participant_count: 45,
        },
        {
            id: 2,
            title: "React Hooks",
            description: "React Hooks va ulardan foydalanish",
            total_questions: 20,
            user: {id: 1, username: "demo_user"},
            created_at: new Date().toISOString(),
            visibility: "draft",
            participant_count: 23,
        },
    ]

    const demoQuizzes: LiveQuiz[] = [
        {
            id: 1,
            test: demoTests[0],
            creator: {id: 1, username: "demo_user"},
            is_active: true,
            start_time: new Date().toISOString(),
            mode: "free",
            description: "Demo viktorina",
        },
        {
            id: 2,
            test: demoTests[1],
            creator: {id: 1, username: "demo_user"},
            is_active: false,
            start_time: new Date().toISOString(),
            mode: "timed",
            description: "Demo viktorina 2",
        },
    ]

    const fetchMyTests = useCallback(async () => {
        try {
            const response = await quizAPI.fetchMyTest()
            setErrors((prev) => ({...prev, myTests: undefined}))
            setDemoMode(false)
            return response.data.results || response.data
        } catch (error: any) {
            console.error("Mening testlarimni yuklashda xatolik:", error)
            const errorMessage = handleApiError(error)
            setErrors((prev) => ({...prev, myTests: errorMessage}))
            if (error.response?.status === 403 || error.response?.status === 404) {
                setDemoMode(true)
                return demoTests
            }
            return []
        }
    }, [])

    const fetchPublicTests = useCallback(async () => {
        try {
            const response = await quizAPI.fetchPublicTests()
            setErrors((prev) => ({...prev, publicTests: undefined}))
            return response.data.results || response.data
        } catch (error: any) {
            console.error("Ommaviy testlarni yuklashda xatolik:", error)
            const errorMessage = handleApiError(error)
            setErrors((prev) => ({...prev, publicTests: errorMessage}))
            if (error.response?.status === 403 || error.response?.status === 404) {
                return demoTests
            }
            return []
        }
    }, [])

    const fetchMyQuizzes = useCallback(async () => {
        try {
            const response = await liveQuizAPI.fetchMyLiveQuizzes()
            setErrors((prev) => ({...prev, myQuizzes: undefined}))
            return response.data.results || response.data
        } catch (error: any) {
            console.error("Mening viktorinalarimni yuklashda xatolik:", error)
            const errorMessage = handleApiError(error)
            setErrors((prev) => ({...prev, myQuizzes: errorMessage}))
            if (error.response?.status === 403 || error.response?.status === 404) {
                return demoQuizzes
            }
            return []
        }
    }, [])

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            try {
                await initializeCSRF()

                const [myTestsData, publicTestsData, myQuizzesData] = await Promise.all([
                    fetchMyTests(),
                    fetchPublicTests(),
                    fetchMyQuizzes(),
                ])

                setTests({
                    myTests: myTestsData,
                    publicTests: publicTestsData,
                })
                setMyQuizzes(myQuizzesData)
            } catch (error) {
                console.error("Ma'lumotlarni yuklashda xatolik:", error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [fetchMyTests, fetchPublicTests, fetchMyQuizzes])

    const retryFetch = async (type: "myTests" | "publicTests" | "myQuizzes") => {
        setLoading(true)
        try {
            if (type === "myTests") {
                const data = await fetchMyTests()
                setTests((prev) => ({...prev, myTests: data}))
            } else if (type === "publicTests") {
                const data = await fetchPublicTests()
                setTests((prev) => ({...prev, publicTests: data}))
            } else if (type === "myQuizzes") {
                const data = await fetchMyQuizzes()
                setMyQuizzes(data)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleModeSelect = (mode: "immediate" | "scheduled") => {
        setSettings((prev) => ({...prev, mode}))
        setCurrentStep("test_selection")
    }

    const handleTestSelect = (test: Test) => {
        setSettings((prev) => ({...prev, selectedTest: test}))
        setCurrentStep("quiz_settings")
    }

    const calculateEndTime = () => {
        if (!settings.selectedTest) return null

        const totalMinutes =
            settings.quizType === "timed" ? (settings.selectedTest.total_questions * settings.timePerQuestion) / 60 : 60

        const endTime = new Date()
        endTime.setMinutes(endTime.getMinutes() + totalMinutes)
        return endTime
    }

    const handleCreateLiveQuiz = async () => {
        setCreating(true)
        setErrors((prev) => ({...prev, creation: undefined}))
        try {
            await initializeCSRF()

            const startDateTime = new Date()
            if (settings.mode === "scheduled") {
                startDateTime.setHours(settings.startTime.hours, settings.startTime.minutes, 0, 0)
            }

            const endDateTime = settings.endTime || calculateEndTime()

            const data = {
                test: settings.selectedTest?.id || 0, // ForeignKey field name is 'test', not 'test_id'
                mode: (settings.quizType === "free" ? "free" : "timed") as "timed" | "first_answer" | "admin_controlled" | "free", // matches VIKTORINA_MODE choices
                start_time: startDateTime.toISOString(),
                end_time: endDateTime?.toISOString() || "",
                description: `${settings.selectedTest?.title} uchun jonli viktorina`, // Add description
                is_public: true, // Default to public
                ...(settings.quizType === "timed" && {
                    time_per_question: settings.timePerQuestion, // Only include for timed mode
                }),
            }

            console.log("[v0] Sending LiveQuiz data:", data)

            const response = await liveQuizAPI.createLiveQuiz(data)

            if (response.data) {
                console.log("Viktorina muvaffaqiyatli yaratildi:", response.data)
                setCurrentStep("main")
                const updatedQuizzes = await fetchMyQuizzes()
                setMyQuizzes(updatedQuizzes)
            }
        } catch (error: any) {
            console.error("Viktorina yaratishda xatolik:", error)
            const errorMessage = handleApiError(error)
            setErrors((prev) => ({...prev, creation: errorMessage}))
        } finally {
            setCreating(false)
        }
    }

    const handleBack = () => {
        switch (currentStep) {
            case "test_selection":
                setCurrentStep("main")
                break
            case "quiz_settings":
                setCurrentStep("test_selection")
                break
            case "schedule":
                setCurrentStep("quiz_settings")
                break
            default:
                window.location.href = "/"
        }
    }

    const ErrorDisplay = ({error, onRetry, type}: { error: string; onRetry: () => void; type: string }) => (
        <div
            className={`p-4 rounded-lg border ${
                theme === "dark" ? "bg-red-900/20 border-red-500/30 text-red-300" : "bg-red-50 border-red-200 text-red-700"
            }`}
        >
            <div className="flex items-center space-x-2 mb-2">
                <AlertCircle size={16}/>
                <span className="font-medium">API Xatoligi</span>
            </div>
            <p className="text-sm mb-3">{error}</p>
            {error.includes("403") && (
                <div
                    className="text-xs mb-3 p-2 rounded bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300">
                    <strong>Yechim:</strong> Tizimga kiring yoki NEXT_PUBLIC_API_URL environment variable ni to'g'ri
                    sozlang
                </div>
            )}
            {error.includes("404") && (
                <div
                    className="text-xs mb-3 p-2 rounded bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                    <strong>Yechim:</strong> Backend serverda tegishli endpoint mavjudligini tekshiring
                </div>
            )}
            {error.includes("Tarmoq") && (
                <div
                    className="text-xs mb-3 p-2 rounded bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300">
                    <strong>Yechim:</strong> Internet aloqasini va API URL ni tekshiring
                </div>
            )}
            <div className="flex space-x-2">
                <button
                    onClick={onRetry}
                    className={`flex items-center space-x-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                        theme === "dark" ? "bg-red-800 hover:bg-red-700 text-red-200" : "bg-red-100 hover:bg-red-200 text-red-800"
                    }`}
                >
                    <RefreshCw size={14}/>
                    <span>Qayta urinish</span>
                </button>
                {(type === "myTests" || type === "myQuizzes") && (
                    <button
                        onClick={() => setDemoMode(true)}
                        className={`flex items-center space-x-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                            theme === "dark"
                                ? "bg-blue-800 hover:bg-blue-700 text-blue-200"
                                : "bg-blue-100 hover:bg-blue-200 text-blue-800"
                        }`}
                    >
                        <Play size={14}/>
                        <span>Demo rejimda davom etish</span>
                    </button>
                )}
            </div>
        </div>
    )

    const renderMainSelection = () => (
        <div className="space-y-8">
            {demoMode && (
                <div
                    className={`p-4 rounded-lg border ${
                        theme === "dark"
                            ? "bg-blue-900/20 border-blue-500/30 text-blue-300"
                            : "bg-blue-50 border-blue-200 text-blue-700"
                    }`}
                >
                    <div className="flex items-center space-x-2 mb-2">
                        <Play size={16}/>
                        <span className="font-medium">Demo Rejimi</span>
                    </div>
                    <p className="text-sm">
                        API bilan bog'lanishda muammo. Demo ma'lumotlar bilan ishlayapsiz. Haqiqiy ma'lumotlar uchun
                        NEXT_PUBLIC_API_URL ni sozlang.
                    </p>
                </div>
            )}
            <div className="text-center mb-8">
                <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    Jonli viktorina
                </h2>
                <p className={`text-lg ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    Viktorina yaratish yoki mavjudlarini boshqarish
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <button
                    onClick={() => handleModeSelect("immediate")}
                    className={`p-8 rounded-2xl border-2 transition-all duration-300 hover:scale-105 transform group ${
                        theme === "dark"
                            ? "bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600 hover:border-green-500 hover:shadow-2xl"
                            : "bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-green-500 hover:shadow-2xl"
                    }`}
                >
                    <div className="flex flex-col items-center space-y-4">
                        <div
                            className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center group-hover:animate-pulse">
                            <Zap size={32} className="text-white"/>
                        </div>
                        <h3 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Hozir
                            boshlash</h3>
                        <p className={`text-center text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                            Darhol jonli viktorina yarating va ishtirokchilarni kutib oling
                        </p>
                        <div className="flex items-center space-x-2 mt-4">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span
                                className={`text-sm font-medium ${theme === "dark" ? "text-green-300" : "text-green-600"}`}>
                Tezkor
              </span>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => handleModeSelect("scheduled")}
                    className={`p-8 rounded-2xl border-2 transition-all duration-300 hover:scale-105 transform group ${
                        theme === "dark"
                            ? "bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600 hover:border-blue-500 hover:shadow-2xl"
                            : "bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-blue-500 hover:shadow-2xl"
                    }`}
                >
                    <div className="flex flex-col items-center space-y-4">
                        <div
                            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center group-hover:animate-pulse">
                            <Calendar size={32} className="text-white"/>
                        </div>
                        <h3 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Rejalashtirish</h3>
                        <p className={`text-center text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                            Kelajakdagi sana vaqt uchun viktorina rejalashtiring
                        </p>
                        <div className="flex items-center space-x-2 mt-4">
                            <Clock size={16} className={theme === "dark" ? "text-blue-300" : "text-blue-500"}/>
                            <span
                                className={`text-sm font-medium ${theme === "dark" ? "text-blue-300" : "text-blue-600"}`}>
                Rejalashtirilgan
              </span>
                        </div>
                    </div>
                </button>
            </div>

            <div
                className={`rounded-2xl border p-6 ${
                    theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3
                        className={`text-xl font-bold flex items-center space-x-2 ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                    >
                        <List size={24}/>
                        <span>Mening viktorinalarim</span>
                    </h3>
                </div>

                {errors.myQuizzes ? (
                    <ErrorDisplay error={errors.myQuizzes} onRetry={() => retryFetch("myQuizzes")} type="myQuizzes"/>
                ) : loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 size={32} className="animate-spin text-blue-500"/>
                    </div>
                ) : myQuizzes.length > 0 ? (
                    <div className="space-y-3">
                        {myQuizzes.map((quiz) => (
                            <div
                                key={quiz.id}
                                className={`p-4 rounded-xl border transition-all duration-200 ${
                                    quiz.is_active
                                        ? theme === "dark"
                                            ? "bg-green-900/20 border-green-500/30 shadow-green-500/10 shadow-lg"
                                            : "bg-green-50 border-green-200 shadow-green-200/20 shadow-lg"
                                        : theme === "dark"
                                            ? "bg-gray-700/50 border-gray-600 opacity-60"
                                            : "bg-gray-50 border-gray-200 opacity-60"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className={`w-3 h-3 rounded-full ${
                                                    quiz.is_active ? "bg-green-500 animate-pulse" : "bg-gray-400"
                                                }`}
                                            ></div>
                                            <h4 className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                                {quiz.test.title}
                                            </h4>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    quiz.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                        {quiz.is_active ? "Faol" : "Nofaol"}
                      </span>
                                        </div>
                                        <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                            {quiz.test.total_questions} ta savol • {quiz.mode} rejim
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            className={`p-2 rounded-lg transition-colors ${
                                                theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-100"
                                            }`}
                                        >
                                            <Edit3 size={16}
                                                   className={theme === "dark" ? "text-gray-300" : "text-gray-600"}/>
                                        </button>
                                        <button
                                            className={`p-2 rounded-lg transition-colors ${
                                                theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-100"
                                            }`}
                                            onClick={() => {
                                                window.location.href = `/live-quiz/${quiz.id}`
                                            }}
                                        >
                                            <ChevronRight size={16}
                                                          className={theme === "dark" ? "text-gray-300" : "text-gray-600"}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Trophy size={48}
                                className={`mx-auto mb-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}/>
                        <p className={`text-lg font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                            Hali viktorinalaringiz yo'q
                        </p>
                        <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                            Birinchi viktorinangizni yarating!
                        </p>
                    </div>
                )}
            </div>
        </div>
    )

    const renderTestSelection = () => (
        <div className="space-y-8">
            <div className="text-center mb-8">
                <h2 className={`text-2xl sm:text-3xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    Test tanlang
                </h2>
                <p className={`text-base ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    Jonli viktorina uchun test tanlang
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={48} className="animate-spin text-blue-500"/>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div
                        className={`rounded-2xl border p-6 ${
                            theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                        }`}
                    >
                        <h3
                            className={`text-xl font-bold mb-6 flex items-center space-x-2 ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                            }`}
                        >
                            <Users size={24}/>
                            <span>Mening testlarim</span>
                        </h3>

                        {errors.myTests ? (
                            <ErrorDisplay error={errors.myTests} onRetry={() => retryFetch("myTests")} type="myTests"/>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {tests.myTests.length > 0 ? (
                                    tests.myTests.map((test) => (
                                        <button
                                            key={test.id}
                                            onClick={() => handleTestSelect(test)}
                                            className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02] ${
                                                theme === "dark"
                                                    ? "bg-gray-700 border-gray-600 hover:border-blue-500"
                                                    : "bg-gray-50 border-gray-200 hover:border-blue-500"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className={`font-semibold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                                        {test.title}
                                                    </h4>
                                                    <p className={`text-sm mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                                        {test.description}
                                                    </p>
                                                    <div className="flex items-center space-x-4 text-xs">
                            <span
                                className={`flex items-center space-x-1 ${
                                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                                }`}
                            >
                              <Clock size={12}/>
                              <span>{test.total_questions} savol</span>
                            </span>
                                                        <span
                                                            className={`flex items-center space-x-1 ${
                                                                theme === "dark" ? "text-gray-400" : "text-gray-500"
                                                            }`}
                                                        >
                              <Users size={12}/>
                              <span>{test.participant_count} ishtirokchi</span>
                            </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end space-y-2">
                          <span
                              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                                  test.visibility === "public"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                              }`}
                          >
                            {test.visibility === "public" ? <Globe size={10}/> : <Lock size={10}/>}
                              <span>{test.visibility === "public" ? "Ommaviy" : "Qoralama"}</span>
                          </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Hali
                                            testlaringiz yo'q</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div
                        className={`rounded-2xl border p-6 ${
                            theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                        }`}
                    >
                        <h3
                            className={`text-xl font-bold mb-6 flex items-center space-x-2 ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                            }`}
                        >
                            <Globe size={24}/>
                            <span>Ommaviy testlar</span>
                        </h3>

                        {errors.publicTests ? (
                            <ErrorDisplay error={errors.publicTests} onRetry={() => retryFetch("publicTests")}
                                          type="publicTests"/>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {tests.publicTests.length > 0 ? (
                                    tests.publicTests.map((test) => (
                                        <button
                                            key={test.id}
                                            onClick={() => handleTestSelect(test)}
                                            className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02] ${
                                                theme === "dark"
                                                    ? "bg-gray-700 border-gray-600 hover:border-blue-500"
                                                    : "bg-gray-50 border-gray-200 hover:border-blue-500"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className={`font-semibold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                                        {test.title}
                                                    </h4>
                                                    <p className={`text-sm mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                                        {test.description}
                                                    </p>
                                                    <div className="flex items-center space-x-4 text-xs">
                            <span
                                className={`flex items-center space-x-1 ${
                                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                                }`}
                            >
                              <Clock size={12}/>
                              <span>{test.total_questions} savol</span>
                            </span>
                                                        <span
                                                            className={`flex items-center space-x-1 ${
                                                                theme === "dark" ? "text-gray-400" : "text-gray-500"
                                                            }`}
                                                        >
                              <Users size={12}/>
                              <span>{test.participant_count} ishtirokchi</span>
                            </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end space-y-2">
                          <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                            @{test.user.username}
                          </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                            Ommaviy testlar topilmadi
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )

    const renderQuizSettings = () => {
        if (!settings.selectedTest) return null

        const endTime = calculateEndTime()

        return (
            <div className="space-y-8">
                <div className="text-center mb-8">
                    <h2 className={`text-2xl sm:text-3xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        Viktorina sozlamalari
                    </h2>
                    <p className={`text-base ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                        "{settings.selectedTest.title}" uchun sozlamalarni tanlang
                    </p>
                </div>

                {errors.creation && (
                    <div className="max-w-4xl mx-auto">
                        <ErrorDisplay
                            error={errors.creation}
                            onRetry={() => setErrors((prev) => ({...prev, creation: undefined}))}
                            type="creation"
                        />
                    </div>
                )}

                <div className="max-w-4xl mx-auto space-y-8">
                    <div
                        className={`rounded-2xl border p-6 ${
                            theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                        }`}
                    >
                        <h3 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            Viktorina turi
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => setSettings((prev) => ({...prev, quizType: "free"}))}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                                    settings.quizType === "free"
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                                        : theme === "dark"
                                            ? "border-gray-600 bg-gray-700 hover:border-blue-400"
                                            : "border-gray-200 bg-gray-50 hover:border-blue-400"
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div
                                        className={`w-4 h-4 rounded-full border-2 transition-all ${
                                            settings.quizType === "free" ? "border-blue-500 bg-blue-500" : "border-gray-300"
                                        }`}
                                    >
                                        {settings.quizType === "free" && (
                                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <h4 className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Erkin
                                            rejim</h4>
                                        <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                            Vaqt tugaguncha ishlash
                                        </p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setSettings((prev) => ({...prev, quizType: "timed"}))}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                                    settings.quizType === "timed"
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                                        : theme === "dark"
                                            ? "border-gray-600 bg-gray-700 hover:border-blue-400"
                                            : "border-gray-200 bg-gray-50 hover:border-blue-400"
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div
                                        className={`w-4 h-4 rounded-full border-2 transition-all ${
                                            settings.quizType === "timed" ? "border-blue-500 bg-blue-500" : "border-gray-300"
                                        }`}
                                    >
                                        {settings.quizType === "timed" && (
                                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <h4 className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Vaqtli
                                            rejim</h4>
                                        <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                            Har savol uchun vaqt
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {settings.quizType === "timed" && (
                        <div
                            className={`rounded-2xl border p-6 ${
                                theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                            }`}
                        >
                            <h3 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                Har bir savol uchun vaqt
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="range"
                                        min="10"
                                        max="300"
                                        step="5"
                                        value={settings.timePerQuestion}
                                        onChange={(e) =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                timePerQuestion: Number.parseInt(e.target.value)
                                            }))
                                        }
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                    />
                                    <span
                                        className={`text-lg font-semibold min-w-[80px] ${
                                            theme === "dark" ? "text-white" : "text-gray-900"
                                        }`}
                                    >
                    {settings.timePerQuestion}s
                  </span>
                                </div>

                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>10s</span>
                                    <span>5 daqiqa</span>
                                </div>

                                <div
                                    className={`text-center p-3 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
                                    <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                        Jami
                                        vaqt: {Math.ceil((settings.selectedTest!.total_questions * settings.timePerQuestion) / 60)}{" "}
                                        daqiqa
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {settings.mode === "scheduled" && (
                        <div
                            className={`rounded-2xl border p-6 ${
                                theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                            }`}
                        >
                            <h3 className={`text-lg font-semibold mb-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                Boshlanish vaqti
                            </h3>

                            <VerticalWheelTimePicker
                                value={settings.startTime}
                                onChange={(time) => setSettings((prev) => ({...prev, startTime: time}))}
                                theme={theme}
                                className="mb-6"
                            />
                        </div>
                    )}

                    <div
                        className={`rounded-2xl border p-6 ${
                            theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                        }`}
                    >
                        <h3 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            Tugash vaqti
                        </h3>

                        {settings.endTime ? (
                            <div className="space-y-6">
                                <VerticalWheelTimePicker
                                    value={{
                                        hours: settings.endTime.getHours(),
                                        minutes: settings.endTime.getMinutes(),
                                    }}
                                    onChange={(time) => {
                                        const newEndTime = new Date(settings.endTime!)
                                        newEndTime.setHours(time.hours, time.minutes, 0, 0)
                                        setSettings((prev) => ({...prev, endTime: newEndTime}))
                                    }}
                                    theme={theme}
                                />
                                <div className="text-center">
                                    <button
                                        onClick={() => setSettings((prev) => ({...prev, endTime: null}))}
                                        className={`px-4 py-2 rounded-lg border transition-colors hover:scale-105 transform ${
                                            theme === "dark" ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        Avtomatik hisoblash
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Clock size={20} className="text-blue-500"/>
                                    <span className={`text-lg ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {endTime ? endTime.toLocaleString("uz-UZ") : "Aniqlanmagan"}
                  </span>
                                </div>

                                <button
                                    onClick={() => {
                                        const newEndTime = new Date()
                                        newEndTime.setHours(settings.startTime.hours + 1, settings.startTime.minutes, 0, 0)
                                        setSettings((prev) => ({...prev, endTime: newEndTime}))
                                    }}
                                    className={`px-4 py-2 rounded-lg border transition-colors hover:scale-105 transform ${
                                        theme === "dark" ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    O'zgartirish
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center pt-6">
                        <button
                            onClick={handleCreateLiveQuiz}
                            disabled={creating}
                            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 transform flex items-center space-x-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {creating ? <Loader2 size={20} className="animate-spin"/> : <CheckCircle size={20}/>}
                            <span>{creating ? "Yaratilmoqda..." : "Viktorina yaratish"}</span>
                            {!creating && <ChevronRight size={20}/>}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (creating) {
        return (
            <div
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
                <div
                    className={`rounded-2xl p-8 max-w-md mx-4 text-center ${
                        theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    } border shadow-2xl animate-pulse`}
                >
                    <div className="animate-spin mb-4">
                        <Loader2 size={48} className="text-blue-500 mx-auto"/>
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        Jonli viktorina yaratilmoqda...
                    </h3>
                    <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Iltimos biroz
                        kuting</p>
                </div>
            </div>
        )
    }

    return (
        <div
            className={`min-h-screen transition-all duration-300 ${
                theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
            }`}
        >
            <header
                className={`fixed top-0 left-0 right-0 backdrop-blur-lg border-b z-50 transition-all duration-300 ${
                    theme === "dark" ? "bg-gray-800/80 border-gray-700" : "bg-white/80 border-gray-200"
                }`}
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleBack}
                                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 transform ${
                                    theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"
                                }`}
                            >
                                <ArrowLeft size={20}/>
                            </button>
                            <div className="flex items-center space-x-2">
                                <div
                                    className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <Play size={16} className="text-white"/>
                                </div>
                                <h1 className="text-xl font-bold text-blue-600">TestAbd</h1>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 transform ${
                                    theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"
                                }`}
                            >
                                {theme === "light" ? <Moon size={20}/> : <Sun size={20}/>}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-8">
                {currentStep === "main" && renderMainSelection()}
                {currentStep === "test_selection" && renderTestSelection()}
                {currentStep === "quiz_settings" && renderQuizSettings()}
            </main>
        </div>
    )
}

export default CreateLiveQuiz
