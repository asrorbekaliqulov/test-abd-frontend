"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { authAPI } from "../utils/api"
import {
    Users,
    Check,
    X,
    Square,
    ChevronRight,
    Clock,
    ChevronLeft,
    Trophy,
    LogOut,
    Crown,
    UserX,
    AlertCircle,
    RefreshCw,
    Home,
    ArrowLeft,
} from "lucide-react"

// Interfaces
interface QuizSession {
    id: number | string
    title: string
    description: string
    mode: "timed" | "free"
    current_question: Question | null
    is_active: boolean
    creator_id: number | string
    creator_username?: string
    creator_avatar?: string | null
    participants_count: number
    time_per_question: number
    current_question_index: number
    total_questions: number
    start_time?: string | null
    end_time?: string | null
}

interface Question {
    id: number | string
    text: string
    image?: string | null
    options: Answer[]
    correct_answer_id?: string | number | null
}

interface Answer {
    id: number | string
    text: string
}

interface Participant {
    id: number | string
    username: string
    answered: boolean
    correct_answers: number
    wrong_answers: number
    total_answered: number
    avatar?: string | null
    is_online?: boolean
}

interface UserData {
    id: number | string
    username: string
    email: string
    profile_image?: string | null
    first_name?: string | null
    last_name?: string | null
}

interface LeaderboardItem {
    id: number | string
    username: string
    score: number
    correct: number
    wrong: number
    avg_time: number
    rank: number
}

interface ApiResponse {
    success: boolean
    data?: any
    message?: string
    error?: string
}

// API configuration - COMPONENT ICHIDA BO'LISHI KERAK
const API_BASE_URL = typeof window !== 'undefined'
    ? window.location.hostname === 'localhost'
        ? 'http://localhost:8000'
        : 'https://backend.testabd.uz'
    : 'https://backend.testabd.uz'

// ==================== API FUNCTIONS - COMPONENT ICHIDA BO'LISHI KERAK ====================
const createLiveQuizApi = () => ({
    // GET /quiz/live-quiz/${id}/
    getLiveQuiz: async (id: number | string) => {
        try {
            const token = localStorage.getItem("access_token")
            console.log("📞 Calling API:", `${API_BASE_URL}/quiz/live-quiz/${id}/`)
            const response = await fetch(`${API_BASE_URL}/quiz/live-quiz/${id}/`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            })
            if (!response.ok) {
                const errorText = await response.text()
                console.error("API Error Response:", errorText)
                throw new Error(`Failed to fetch live quiz: ${response.status} ${response.statusText}`)
            }
            return await response.json()
        } catch (error) {
            console.error("Error fetching live quiz:", error)
            throw error
        }
    },

    // POST /quiz/live-quiz/{quiz_id}/join/
    joinLiveQuiz: async (quizId: number | string, userId: number | string, username: string) => {
        try {
            const token = localStorage.getItem("access_token")
            const response = await fetch(`${API_BASE_URL}/quiz/live-quiz/${quizId}/join/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: userId,
                    username: username
                })
            })
            if (!response.ok) throw new Error("Failed to join live quiz")
            return await response.json()
        } catch (error) {
            console.error("Error joining live quiz:", error)
            throw error
        }
    },

    // POST /quiz/live-quiz/{quiz_id}/leave/
    leaveLiveQuiz: async (quizId: number | string, userId: number | string) => {
        try {
            const token = localStorage.getItem("access_token")
            const response = await fetch(`${API_BASE_URL}/quiz/live-quiz/${quizId}/leave/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: userId
                })
            })
            if (!response.ok) throw new Error("Failed to leave live quiz")
            return await response.json()
        } catch (error) {
            console.error("Error leaving live quiz:", error)
            throw error
        }
    },

    // POST /quiz/live-quiz/{quiz_id}/end/
    endLiveQuiz: async (quizId: number | string, userId: number | string) => {
        try {
            const token = localStorage.getItem("access_token")
            const response = await fetch(`${API_BASE_URL}/quiz/live-quiz/${quizId}/end/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: userId
                })
            })
            if (!response.ok) throw new Error("Failed to end live quiz")
            return await response.json()
        } catch (error) {
            console.error("Error ending live quiz:", error)
            throw error
        }
    },

    // POST /quiz/live-quiz/{quiz_id}/question/{question_id}/answer/
    submitAnswer: async (quizId: number | string, questionId: number | string, answerId: number | string, userId: number | string) => {
        try {
            const token = localStorage.getItem("access_token")
            const response = await fetch(
                `${API_BASE_URL}/quiz/live-quiz/${quizId}/question/${questionId}/answer/`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        answer_id: answerId
                    })
                }
            )
            if (!response.ok) throw new Error("Failed to submit answer")
            return await response.json()
        } catch (error) {
            console.error("Error submitting answer:", error)
            throw error
        }
    },

    // GET /quiz/live-quiz/{quiz_id}/leaderboard/
    getLeaderboard: async (quizId: number | string) => {
        try {
            const token = localStorage.getItem("access_token")
            const response = await fetch(`${API_BASE_URL}/quiz/live-quiz/${quizId}/leaderboard/`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            })
            if (!response.ok) throw new Error("Failed to fetch leaderboard")
            return await response.json()
        } catch (error) {
            console.error("Error fetching leaderboard:", error)
            throw error
        }
    },

    // GET /quiz/participations/
    getParticipations: async () => {
        try {
            const token = localStorage.getItem("access_token")
            const response = await fetch(`${API_BASE_URL}/quiz/participations/`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            })
            if (!response.ok) throw new Error("Failed to fetch participations")
            return await response.json()
        } catch (error) {
            console.error("Error fetching participations:", error)
            throw error
        }
    }
})

export default function RealTimeQuizPage({ quiz_id }: { quiz_id?: number | string }) {
    // ==================== STATE DEFINITIONS ====================
    const [user, setUser] = useState<UserData | null>(null)
    const [userLoading, setUserLoading] = useState(true)
    const [quizId, setQuizId] = useState<number | string | null>(null)
    const [session, setSession] = useState<QuizSession | null>(null)
    const [participants, setParticipants] = useState<Participant[]>([])
    const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null)
    const [timeLeft, setTimeLeft] = useState<number>(15)
    const [hasAnswered, setHasAnswered] = useState(false)
    const [isQuizEnded, setIsQuizEnded] = useState(false)
    const [hasJoined, setHasJoined] = useState(false)
    const [quizStarted, setQuizStarted] = useState(false)
    const [answerResult, setAnswerResult] = useState<{
        isCorrect: boolean
        correctAnswerId: number | string | null
        explanation?: string
        responseTime?: number
    } | null>(null)
    const [showingResults, setShowingResults] = useState(false)
    const [isStartingQuiz, setIsStartingQuiz] = useState(false)
    const [isEndingQuiz, setIsEndingQuiz] = useState(false)
    const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)
    const questionStartTimeRef = useRef<number>(0)
    const [finalResults, setFinalResults] = useState<LeaderboardItem[]>([])
    const [showResultsModal, setShowResultsModal] = useState(false)
    const [showSidebar, setShowSidebar] = useState(false)
    const [autoNextTimer, setAutoNextTimer] = useState<number | null>(null)
    const [userAnswerHistory, setUserAnswerHistory] = useState<{[questionId: string]: { answerId: string; isCorrect: boolean }}>({})
    const [questionLoadError, setQuestionLoadError] = useState(false)
    const [allQuestions, setAllQuestions] = useState<Question[]>([])
    const [showAdminPanel, setShowAdminPanel] = useState(false)
    const [userStats, setUserStats] = useState({
        correctAnswers: 0,
        wrongAnswers: 0,
        totalAnswered: 0,
        accuracy: 0
    })
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const currentQuestion = allQuestions[currentQuestionIndex] || null
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [toast, setToast] = useState<{message: string, type: "success" | "error" | "info"} | null>(null)
    const [quizLoaded, setQuizLoaded] = useState(false)
    const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
    const [isPolling, setIsPolling] = useState(false)
    const [urlChecked, setUrlChecked] = useState(false)

    // API functions instance
    const [liveQuizApi] = useState(() => createLiveQuizApi())

    // ==================== HELPER FUNCTIONS ====================
    const showToast = (message: string, type: "success" | "error" | "info") => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    // ==================== QUIZ ID EXTRACTION ====================
    useEffect(() => {
        console.log("=== QUIZ ID EXTRACTION START ===")
        console.log("quiz_id prop:", quiz_id)

        if (typeof window === 'undefined') {
            console.log("Window is not available (SSR)")
            return
        }

        const deriveQuizId = (): number | string | null => {
            // 1. Props dan tekshirish - agar 0 bo'lsa, noto'g'ri deb hisoblash
            if (quiz_id !== undefined && quiz_id !== null && quiz_id !== 0 && quiz_id !== "0") {
                const id = quiz_id.toString()
                console.log("✅ Using quiz_id from props:", id)
                return id
            }

            // 2. URL manzilini butunligicha ko'rsatish
            const fullUrl = window.location.href
            console.log("Full URL:", fullUrl)

            // 3. Query parametrlarni tekshirish
            const params = new URLSearchParams(window.location.search)
            console.log("Query params:", Object.fromEntries(params.entries()))

            const queryParams = [
                params.get("id"),
                params.get("quiz_id"),
                params.get("quiz"),
                params.get("quizId"),
                params.get("live_quiz_id"),
                params.get("liveQuizId")
            ].filter(Boolean)

            if (queryParams.length > 0) {
                console.log("✅ Found in query params:", queryParams[0])
                return queryParams[0]
            }

            // 4. URL path'ni tekshirish
            const path = window.location.pathname
            console.log("Current path:", path)

            // Turli URL patternlar
            const patterns = [
                /\/live-quiz\/(\d+)/i,
                /\/quiz\/live\/(\d+)/i,
                /\/quiz\/start\/(\d+)/i,
                /\/quiz\/play\/(\d+)/i,
                /\/quiz\/(\d+)/i,
                /\/quizzes\/(\d+)/i,
                /\/start\/(\d+)/i,
                /\/play\/(\d+)/i,
                /\/join\/(\d+)/i,
                /\/live\/(\d+)/i,
                /\/(\d+)\/?$/i,
            ]

            for (const pattern of patterns) {
                const match = path.match(pattern)
                if (match && match[1]) {
                    console.log(`✅ Matched pattern ${pattern}:`, match[1])
                    return match[1]
                }
            }

            // 5. Hash fragment'ni tekshirish
            const hash = window.location.hash
            console.log("Hash fragment:", hash)
            if (hash) {
                const hashMatch = hash.match(/\/(\d+)/)
                if (hashMatch && hashMatch[1]) {
                    console.log("✅ Found in hash:", hashMatch[1])
                    return hashMatch[1]
                }
            }

            console.log("❌ No quiz ID found in any location")
            return null
        }

        const derivedId = deriveQuizId()
        console.log("Final derived quiz ID:", derivedId)

        if (derivedId) {
            setQuizId(derivedId)
            console.log("✅ Quiz ID set to:", derivedId)
        } else {
            console.log("❌ No quiz ID found")
        }

        setUrlChecked(true)
    }, [quiz_id])

    // ==================== REST API FUNCTIONS ====================

    // GET Quiz Details - /quiz/live-quiz/{id}/
    const fetchQuizDetails = useCallback(async (): Promise<QuizSession | null> => {
        if (!quizId || quizId === "0") {
            console.log("❌ fetchQuizDetails: quizId is null or 0")
            return null
        }

        console.log("🔄 Fetching quiz details for ID:", quizId)

        try {
            setIsLoading(true)
            setError(null)

            const token = localStorage.getItem("access_token")
            if (!token) {
                throw new Error("Authentication token not found")
            }

            console.log("📞 Calling API:", `${API_BASE_URL}/quiz/live-quiz/${quizId}/`)

            const response = await fetch(`${API_BASE_URL}/quiz/live-quiz/${quizId}/`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            })

            console.log("API Response status:", response.status)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("API Error Response:", errorText)
                throw new Error(`Failed to fetch quiz: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("API Response data:", data)

            if (data.success && data.data) {
                const quizData = data.data as QuizSession
                console.log("✅ Quiz data loaded successfully:", {
                    id: quizData.id,
                    title: quizData.title,
                    is_active: quizData.is_active,
                    total_questions: quizData.total_questions
                })

                setSession(quizData)

                // Check if quiz has started
                if (quizData.is_active) {
                    console.log("✅ Quiz is active, marking as started")
                    setQuizStarted(true)
                }

                // Check if quiz has ended
                if (quizData.end_time) {
                    console.log("✅ Quiz has end_time, marking as ended")
                    setIsQuizEnded(true)
                }

                setQuizLoaded(true)
                return quizData
            } else {
                throw new Error(data.message || "Failed to load quiz data")
            }
        } catch (err) {
            console.error("❌ Error in fetchQuizDetails:", err)
            const errorMessage = err instanceof Error ? err.message : "Failed to load quiz"
            setError(errorMessage)
            showToast(errorMessage, "error")
            return null
        } finally {
            setIsLoading(false)
        }
    }, [quizId])

    // Fetch participants data
    const fetchParticipants = useCallback(async () => {
        if (!quizId || !user || quizId === "0") {
            console.log("❌ fetchParticipants: quizId or user missing or quizId is 0")
            return
        }

        try {
            console.log("🔄 Fetching participants for quiz:", quizId)
            const response = await liveQuizApi.getParticipations()

            if (response.success && response.data) {
                console.log("✅ Participants data received:", response.data)

                // Filter participations for this quiz
                const quizParticipants = response.data.filter((participation: any) => {
                    return participation.quiz_id == quizId || participation.quiz == quizId
                })

                console.log("Filtered participants:", quizParticipants)

                if (quizParticipants.length > 0) {
                    const mappedParticipants: Participant[] = quizParticipants.map((participation: any) => ({
                        id: participation.user_id || participation.user?.id,
                        username: participation.username || participation.user?.username || `User ${participation.user_id}`,
                        answered: participation.has_answered || false,
                        correct_answers: participation.correct_answers || 0,
                        wrong_answers: participation.wrong_answers || 0,
                        total_answered: participation.total_answered || 0,
                        avatar: participation.avatar || participation.user?.profile_image || null
                    }))

                    setParticipants(mappedParticipants)

                    // Update user stats
                    const userParticipation = quizParticipants.find((p: any) =>
                        p.user_id == user.id || p.user?.id == user.id
                    )

                    if (userParticipation) {
                        console.log("✅ User participation found:", userParticipation)
                        const totalAnswered = userParticipation.total_answered || 0
                        const correctAnswers = userParticipation.correct_answers || 0
                        const accuracy = totalAnswered > 0
                            ? Math.round((correctAnswers / totalAnswered) * 100)
                            : 0

                        setUserStats({
                            correctAnswers,
                            wrongAnswers: userParticipation.wrong_answers || 0,
                            totalAnswered,
                            accuracy
                        })
                    }
                } else {
                    console.log("⚠️ No participants found for this quiz")
                }
            } else {
                console.log("⚠️ No participants data in response")
            }
        } catch (err) {
            console.error("❌ Error fetching participants:", err)
        }
    }, [quizId, user, liveQuizApi])

    // POST Join Quiz - /quiz/live-quiz/{quiz_id}/join/
    const joinQuizApi = useCallback(async (): Promise<boolean> => {
        if (!quizId || !user || quizId === "0") {
            console.log("❌ joinQuizApi: quizId or user missing or quizId is 0")
            return false
        }

        console.log("🔄 Joining quiz:", quizId)

        try {
            const response = await liveQuizApi.joinLiveQuiz(quizId, user.id, user.username)
            console.log("Join response:", response)

            if (response.success) {
                showToast("Successfully joined quiz!", "success")
                setHasJoined(true)

                // Fetch participants after joining
                fetchParticipants()

                return true
            } else {
                throw new Error(response.message || "Failed to join quiz")
            }
        } catch (err) {
            console.error("❌ Error joining quiz:", err)
            const errorMessage = err instanceof Error ? err.message : "Failed to join quiz"

            // If 400 error, user might already be joined
            if (errorMessage.includes("400")) {
                console.log("⚠️ User might already be joined, continuing...")
                setHasJoined(true)
                return true
            }

            showToast(errorMessage, "error")
            return false
        }
    }, [quizId, user, fetchParticipants, liveQuizApi])

    // POST Leave Quiz - /quiz/live-quiz/{quiz_id}/leave/
    const leaveQuizApi = useCallback(async (): Promise<boolean> => {
        if (!quizId || !user || quizId === "0") {
            console.log("❌ leaveQuizApi: quizId or user missing or quizId is 0")
            return false
        }

        try {
            const response = await liveQuizApi.leaveLiveQuiz(quizId, user.id)

            if (response.success) {
                showToast("Left quiz successfully", "success")
                setHasJoined(false)
                return true
            } else {
                throw new Error(response.message || "Failed to leave quiz")
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to leave quiz"
            showToast(errorMessage, "error")
            return false
        }
    }, [quizId, user, liveQuizApi])

    // POST Submit Answer - /quiz/live-quiz/{quiz_id}/question/{question_id}/answer/
    const submitAnswerApi = useCallback(async (
        questionId: number | string,
        answerId: number | string
    ): Promise<ApiResponse> => {
        if (!quizId || !user || quizId === "0") {
            console.log("❌ submitAnswerApi: quizId or user missing or quizId is 0")
            return { success: false, error: "User or quiz not found" }
        }

        try {
            setIsSubmittingAnswer(true)
            console.log("🔄 Submitting answer:", { questionId, answerId })

            const response = await liveQuizApi.submitAnswer(quizId, questionId, answerId, user.id)
            console.log("Submit answer response:", response)

            if (response.success) {
                showToast("Answer submitted successfully!", "success")

                // Update answer result
                setAnswerResult({
                    isCorrect: response.data?.is_correct || false,
                    correctAnswerId: response.data?.correct_answer_id || null,
                    explanation: response.data?.explanation,
                    responseTime: response.data?.response_time
                })
                setShowingResults(true)

                // Update participants data
                fetchParticipants()

                return response
            } else {
                throw new Error(response.message || "Failed to submit answer")
            }
        } catch (err) {
            console.error("❌ Error submitting answer:", err)
            const errorMessage = err instanceof Error ? err.message : "Failed to submit answer"
            showToast(errorMessage, "error")
            return { success: false, error: errorMessage }
        } finally {
            setIsSubmittingAnswer(false)
        }
    }, [quizId, user, fetchParticipants, liveQuizApi])

    // POST Start Quiz - Custom function
    const startQuizApi = useCallback(async (): Promise<boolean> => {
        if (!quizId || !user || quizId === "0") {
            console.log("❌ startQuizApi: quizId or user missing or quizId is 0")
            return false
        }

        try {
            setIsStartingQuiz(true)

            console.log("🔄 Starting quiz:", quizId)

            showToast("Quiz started!", "success")
            setQuizStarted(true)

            // Start polling
            startPolling()

            return true
        } catch (err) {
            console.error("❌ Error starting quiz:", err)
            const errorMessage = err instanceof Error ? err.message : "Failed to start quiz"
            showToast(errorMessage, "error")
            return false
        } finally {
            setIsStartingQuiz(false)
        }
    }, [quizId, user])

    // POST End Quiz - /quiz/live-quiz/{quiz_id}/end/
    const endQuizApi = useCallback(async (): Promise<boolean> => {
        if (!quizId || !user || quizId === "0") {
            console.log("❌ endQuizApi: quizId or user missing or quizId is 0")
            return false
        }

        try {
            setIsEndingQuiz(true)
            console.log("🔄 Ending quiz:", quizId)

            const response = await liveQuizApi.endLiveQuiz(quizId, user.id)
            console.log("End quiz response:", response)

            if (response.success) {
                showToast("Quiz ended successfully!", "success")
                setIsQuizEnded(true)
                setQuizStarted(false)

                // Fetch leaderboard
                const leaderboard = await fetchLeaderboard()
                setFinalResults(leaderboard)
                setShowResultsModal(true)

                return true
            } else {
                throw new Error(response.message || "Failed to end quiz")
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to end quiz"
            showToast(errorMessage, "error")
            return false
        } finally {
            setIsEndingQuiz(false)
        }
    }, [quizId, user, liveQuizApi])

    // GET Leaderboard - /quiz/live-quiz/{quiz_id}/leaderboard/
    const fetchLeaderboard = useCallback(async (): Promise<LeaderboardItem[]> => {
        if (!quizId || quizId === "0") {
            console.log("❌ fetchLeaderboard: quizId missing or is 0")
            return []
        }

        try {
            console.log("🔄 Fetching leaderboard for quiz:", quizId)
            const response = await liveQuizApi.getLeaderboard(quizId)

            if (response.success && Array.isArray(response.data)) {
                console.log("✅ Leaderboard data received:", response.data.length, "items")
                return response.data as LeaderboardItem[]
            } else {
                throw new Error(response.message || "Failed to load leaderboard")
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load leaderboard"
            console.error("❌ Error fetching leaderboard:", err)
            return []
        }
    }, [quizId, liveQuizApi])

    // Polling function to get updates
    const startPolling = useCallback(() => {
        if (!quizId || !quizStarted || isQuizEnded || quizId === "0") {
            console.log("❌ startPolling: Conditions not met", { quizId, quizStarted, isQuizEnded })
            return () => {}
        }

        console.log("🔄 Starting polling for quiz updates...")
        setIsPolling(true)

        const interval = setInterval(async () => {
            console.log("📡 Polling for updates...")

            try {
                // Fetch quiz updates
                await fetchQuizDetails()

                // Fetch participants updates
                await fetchParticipants()

            } catch (err) {
                console.error("❌ Error during polling:", err)
            }
        }, 5000) // Poll every 5 seconds

        setPollingInterval(interval)

        return () => {
            console.log("🧹 Cleaning up polling...")
            if (interval) {
                clearInterval(interval)
            }
            setIsPolling(false)
        }
    }, [quizId, quizStarted, isQuizEnded, fetchQuizDetails, fetchParticipants])

    // ==================== INITIAL LOAD ====================
    useEffect(() => {
        const loadUserData = async () => {
            try {
                setUserLoading(true)
                console.log("🔄 Loading user data...")
                const userData = await authAPI.getCurrentUser()
                console.log("✅ User data loaded:", { id: userData.id, username: userData.username })
                setUser(userData)
            } catch (err) {
                console.error("❌ Error loading user data:", err)
                const errorMessage = err instanceof Error ? err.message : "Failed to load user data"
                showToast(errorMessage, "error")
            } finally {
                setUserLoading(false)
            }
        }
        loadUserData()
    }, [])

    // Load quiz when quizId and user are ready
    useEffect(() => {
        console.log("useEffect - quizId:", quizId, "user:", user, "quizLoaded:", quizLoaded, "urlChecked:", urlChecked)

        if (quizId && user && !quizLoaded && urlChecked && quizId !== "0") {
            console.log("🔄 Triggering quiz load...")
            fetchQuizDetails()
            fetchParticipants()
        }
    }, [quizId, user, quizLoaded, urlChecked, fetchQuizDetails, fetchParticipants])

    // Auto-join quiz when loaded
    useEffect(() => {
        if (session && user && !hasJoined) {
            console.log("🔄 Auto-joining quiz...")
            joinQuizApi()
        }
    }, [session, user, hasJoined, joinQuizApi])

    // Start polling when quiz starts
    useEffect(() => {
        if (quizStarted && !isQuizEnded) {
            console.log("🔄 Starting polling...")
            const cleanup = startPolling()
            return cleanup
        }

        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval)
                setPollingInterval(null)
            }
        }
    }, [quizStarted, isQuizEnded])

    // ==================== ANSWER SUBMISSION ====================
    const handleAnswerSubmit = async (answerId: number | string) => {
        if (hasAnswered || !session?.current_question || !user || isSubmittingAnswer) {
            console.log("❌ Cannot submit answer:", { hasAnswered, currentQuestion: session?.current_question, user, isSubmittingAnswer })
            return
        }

        console.log("✅ Submitting answer:", answerId)

        setSelectedAnswer(answerId)
        setHasAnswered(true)
        setIsSubmittingAnswer(true)

        const responseTime = (Date.now() - questionStartTimeRef.current) / 1000

        try {
            const apiResult = await submitAnswerApi(session.current_question.id, answerId)

            if (apiResult.success) {
                setUserAnswerHistory(prev => ({
                    ...prev,
                    [session.current_question!.id]: {
                        answerId: String(answerId),
                        isCorrect: apiResult.data?.is_correct || false
                    }
                }))

                // If timed mode, wait then fetch next question
                if (session?.mode === "timed") {
                    setTimeout(() => {
                        fetchQuizDetails()
                    }, 3000)
                }
            }
        } catch (error) {
            console.error("❌ Error in answer submission:", error)
            setHasAnswered(false)
            setSelectedAnswer(null)
        }
    }

    // ==================== QUIZ CONTROL FUNCTIONS ====================
    const handleStartQuiz = useCallback(async () => {
        if (!user || !session || user.id !== session.creator_id || isStartingQuiz) {
            console.log("❌ Cannot start quiz:", { user, session, isStartingQuiz })
            return
        }

        console.log("✅ Starting quiz")
        await startQuizApi()
    }, [user, session, isStartingQuiz, startQuizApi])

    const handleEndQuiz = useCallback(async () => {
        if (!user || !session || user.id !== session.creator_id || isEndingQuiz) {
            console.log("❌ Cannot end quiz:", { user, session, isEndingQuiz })
            return
        }

        if (window.confirm("Are you sure you want to end this quiz for all participants?")) {
            await endQuizApi()
        }
    }, [user, session, isEndingQuiz, endQuizApi])

    const handleLeaveQuiz = useCallback(async () => {
        if (window.confirm("Are you sure you want to leave the quiz?")) {
            try {
                await leaveQuizApi()
                window.history.back()
            } catch (error) {
                console.error("❌ Error leaving quiz:", error)
            }
        }
    }, [leaveQuizApi])

    // Refresh function - BU MUHIM, YO'Q EDI
    const handleRefresh = useCallback(() => {
        console.log("🔄 Refreshing quiz data...")
        setQuizLoaded(false)
        setSession(null)
        setParticipants([])

        if (quizId && user && quizId !== "0") {
            fetchQuizDetails()
            fetchParticipants()
        }
    }, [quizId, user, fetchQuizDetails, fetchParticipants])

    const handleManualQuizId = () => {
        const manualId = prompt("Please enter the Quiz ID:")
        if (manualId && manualId.trim() && manualId !== "0") {
            console.log("✅ Manual quiz ID entered:", manualId)
            setQuizId(manualId.trim())
            setQuizLoaded(false)
            setSession(null)
            setParticipants([])
        } else if (manualId === "0") {
            showToast("Quiz ID cannot be 0", "error")
        }
    }

    // ==================== DEBUG INFO ====================
    useEffect(() => {
        console.log("=== CURRENT STATE ===", {
            quizId,
            user: user ? { id: user.id, username: user.username } : null,
            session: session ? { id: session.id, title: session.title, is_active: session.is_active } : null,
            quizLoaded,
            isLoading,
            error,
            hasJoined,
            participantsCount: participants.length,
            urlChecked
        })
    }, [quizId, user, session, quizLoaded, isLoading, error, hasJoined, participants, urlChecked])

    // ==================== UI COMPONENTS ====================

    // Loading state
    if (userLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading user data...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                <div className="text-center p-8 max-w-md">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                    <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
                    <p className="text-gray-400 mb-6">Please log in to join the quiz</p>
                    <button
                        onClick={() => window.location.href = "/login"}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        )
    }

    // Quiz ID not found state - IMPROVED VERSION
    if ((!quizId || quizId === "0") && !isLoading && urlChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
                <div className="text-center p-8 max-w-2xl w-full">
                    <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
                        <AlertCircle className="w-20 h-20 mx-auto mb-6 text-yellow-400" />
                        <h1 className="text-3xl font-bold text-white mb-4">Quiz ID Not Found</h1>

                        <div className="text-left mb-8 space-y-4">
                            <div className="bg-gray-900/50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-white mb-2">Current URL Analysis</h3>
                                <div className="space-y-2 text-sm text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Full URL:</span>
                                        <code className="bg-gray-900 px-2 py-1 rounded text-blue-300 break-all">
                                            {typeof window !== 'undefined' ? window.location.href : 'Loading...'}
                                        </code>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Path:</span>
                                        <code className="bg-gray-900 px-2 py-1 rounded text-green-300">
                                            {typeof window !== 'undefined' ? window.location.pathname : 'Loading...'}
                                        </code>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Query Params:</span>
                                        <code className="bg-gray-900 px-2 py-1 rounded text-purple-300">
                                            {typeof window !== 'undefined' ? window.location.search || '(none)' : 'Loading...'}
                                        </code>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-900/50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-white mb-2">How to Fix</h3>
                                <ul className="space-y-2 text-gray-300">
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-400">✓</span>
                                        <span>Check if the URL contains a quiz ID (like <code className="bg-gray-800 px-1 rounded">/live-quiz/123</code>)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-400">✓</span>
                                        <span>Make sure you're using a valid quiz link</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-400">✓</span>
                                        <span>Try entering the quiz ID manually below</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gray-900/50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-white mb-2">Common URL Patterns</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                                    <code className="bg-gray-800 px-2 py-1 rounded">/live-quiz/123</code>
                                    <code className="bg-gray-800 px-2 py-1 rounded">/quiz/123</code>
                                    <code className="bg-gray-800 px-2 py-1 rounded">/quiz/start/123</code>
                                    <code className="bg-gray-800 px-2 py-1 rounded">?id=123</code>
                                    <code className="bg-gray-800 px-2 py-1 rounded">?quiz_id=123</code>
                                    <code className="bg-gray-800 px-2 py-1 rounded">/123</code>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => window.location.href = "/"}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                <Home size={20} />
                                Go Home
                            </button>

                            <button
                                onClick={() => window.location.reload()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={20} />
                                Retry
                            </button>

                            <button
                                onClick={handleManualQuizId}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={20} />
                                Enter Quiz ID
                            </button>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-700">
                            <p className="text-gray-500 text-sm">
                                If you continue to have issues, please contact support or check your quiz link.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Main quiz UI
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
            {/* Debug console (development only) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 left-4 z-50 bg-black/90 p-3 rounded-lg text-xs max-w-xs border border-gray-700">
                    <div className="font-bold mb-1 text-blue-400">Debug Info:</div>
                    <div className="space-y-1">
                        <div>Quiz ID: <span className={quizId && quizId !== "0" ? "text-green-400" : "text-red-400"}>{quizId || 'Not found'}</span></div>
                        <div>Status: <span className={hasJoined ? "text-green-400" : "text-yellow-400"}>{hasJoined ? 'Joined' : 'Joining...'}</span></div>
                        <div>Loaded: <span className={quizLoaded ? "text-green-400" : "text-yellow-400"}>{quizLoaded ? 'Yes' : 'No'}</span></div>
                        <div>Participants: <span className="text-blue-400">{participants.length}</span></div>
                        <div>Polling: <span className={isPolling ? "text-green-400" : "text-gray-400"}>{isPolling ? 'Active' : 'Inactive'}</span></div>
                    </div>
                </div>
            )}

            {/* Toast notifications */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
                    toast.type === "success" ? "bg-green-600 text-white" :
                        toast.type === "error" ? "bg-red-600 text-white" :
                            "bg-blue-600 text-white"
                }`}>
                    {toast.type === "success" ? <Check size={16} /> :
                        toast.type === "error" ? <X size={16} /> :
                            <AlertCircle size={16} />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Top navigation bar */}
            <div className="fixed top-0 left-0 right-0 z-40 bg-gray-800/90 backdrop-blur-md border-b border-gray-700">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <Users size={20} />
                        </button>

                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                                hasJoined ? "bg-green-500 animate-pulse" : "bg-yellow-500 animate-pulse"
                            }`} />
                            <span className="text-sm text-gray-300">
                                {hasJoined ? "Joined" : "Joining..."}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {quizId && quizId !== "0" && (
                            <div className="hidden md:flex items-center gap-2 bg-gray-900/50 px-3 py-1 rounded-full">
                                <span className="text-xs text-gray-400">Quiz ID:</span>
                                <span className="text-sm font-mono text-blue-300">{quizId}</span>
                            </div>
                        )}
                        <span className="text-sm font-medium text-gray-300">
                            {session?.current_question ? `${session.current_question_index + 1} / ${session.total_questions}` : 'Loading...'}
                        </span>
                        {session?.mode === "timed" && quizStarted && !isQuizEnded && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-red-500/20 rounded-full">
                                <Clock size={14} />
                                <span className="text-sm font-mono">{timeLeft}s</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {user && session && user.id === session.creator_id && (
                            <button
                                onClick={() => setShowAdminPanel(true)}
                                className="p-2 hover:bg-yellow-500/20 rounded-lg transition-colors"
                                title="Admin Panel"
                            >
                                <Crown size={20} className="text-yellow-400" />
                            </button>
                        )}
                        <button
                            onClick={handleLeaveQuiz}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Exit Quiz"
                        >
                            <LogOut size={20} className="text-red-400" />
                        </button>
                        <button
                            onClick={handleRefresh}
                            className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={20} className="text-blue-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className={`fixed top-0 left-0 h-full w-80 z-50 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ${
                showSidebar ? "translate-x-0" : "-translate-x-full"
            } md:translate-x-0 md:w-72`}>
                <div className="p-4 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg">Quiz Info</h3>
                        <button
                            onClick={() => setShowSidebar(false)}
                            className="text-gray-400 hover:text-white md:hidden"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {session ? (
                        <>
                            <div className="mb-6">
                                <h2 className="text-xl font-bold mb-2">{session.title}</h2>
                                <p className="text-gray-400 text-sm">{session.description}</p>
                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                    <span>Mode: {session.mode}</span>
                                    <span>•</span>
                                    <span>Questions: {session.total_questions}</span>
                                </div>
                            </div>

                            {/* User stats */}
                            <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
                                <h4 className="font-semibold mb-3">Your Performance</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-400">{userStats.correctAnswers}</div>
                                        <div className="text-xs text-gray-400">Correct</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-red-400">{userStats.wrongAnswers}</div>
                                        <div className="text-xs text-gray-400">Wrong</div>
                                    </div>
                                    <div className="text-center col-span-2">
                                        <div className="text-2xl font-bold text-blue-400">{userStats.accuracy}%</div>
                                        <div className="text-xs text-gray-400">Accuracy</div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-8 h-8 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-400">Loading quiz info...</p>
                        </div>
                    )}

                    {/* Participants list */}
                    <div className="bg-gray-800/50 rounded-xl p-4 mb-4 flex-1">
                        <h4 className="font-semibold mb-3">Participants ({participants.length})</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {participants.length > 0 ? (
                                participants
                                    .slice()
                                    .sort((a, b) => b.correct_answers - a.correct_answers)
                                    .map((participant, index) => (
                                        <div
                                            key={String(participant.id)}
                                            className={`flex items-center justify-between p-2 rounded-lg ${
                                                participant.id === user.id ? "bg-blue-500/20" : "bg-gray-700/30"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400 text-xs">#{index + 1}</span>
                                                <span className="font-medium">
                                                    {participant.username}
                                                    {participant.id === user.id && " (You)"}
                                                </span>
                                                {participant.id === session?.creator_id && (
                                                    <Crown size={12} className="text-yellow-400" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="text-green-400">{participant.correct_answers}</span>
                                                <span className="text-red-400">{participant.wrong_answers}</span>
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <div className="text-center py-4 text-gray-400 text-sm">
                                    No participants yet
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleLeaveQuiz}
                        className="w-full bg-red-600 hover:bg-red-700 rounded-xl p-3 font-semibold transition-colors flex items-center justify-center gap-2 mt-auto"
                    >
                        <LogOut size={16} />
                        Exit Quiz
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className={`transition-all duration-300 pt-16 ${showSidebar ? "ml-80" : "ml-0"} md:ml-72`}>
                <div className="px-4 py-8 min-h-screen">
                    <div className="max-w-2xl mx-auto">
                        {isLoading && !session ? (
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-700">
                                <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                                <h2 className="text-xl font-bold mb-2">Loading Quiz...</h2>
                                <p className="text-gray-400 mb-4">Please wait while we load the quiz details</p>
                                <div className="bg-gray-900/50 p-3 rounded-lg">
                                    <p className="text-sm text-gray-500">Quiz ID: <span className="text-blue-300 font-mono">{quizId}</span></p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-700">
                                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                                <h2 className="text-2xl font-bold mb-2">Error Loading Quiz</h2>
                                <p className="text-gray-400 mb-4">{error}</p>
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={handleRefresh}
                                        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
                                    >
                                        <RefreshCw size={16} />
                                        Try Again
                                    </button>
                                    <button
                                        onClick={() => window.location.href = "/"}
                                        className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-xl font-semibold transition-colors"
                                    >
                                        Go Home
                                    </button>
                                </div>
                            </div>
                        ) : !quizStarted && !isQuizEnded ? (
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-700">
                                <h1 className="text-3xl font-bold mb-4">Waiting for Quiz to Start</h1>
                                <p className="text-gray-400 mb-6">
                                    {session?.creator_id === user?.id
                                        ? "You are the host. Start the quiz when ready."
                                        : "The host will start the quiz soon."}
                                </p>

                                {session?.creator_id === user?.id && (
                                    <button
                                        onClick={handleStartQuiz}
                                        disabled={isStartingQuiz}
                                        className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
                                    >
                                        {isStartingQuiz ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                                Starting...
                                            </>
                                        ) : (
                                            <>
                                                <ChevronRight size={20} />
                                                Start Quiz
                                            </>
                                        )}
                                    </button>
                                )}

                                <div className="mt-8 flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-gray-400 text-sm">
                                            Connected participants: {participants.length}
                                        </span>
                                    </div>
                                    <div className="text-gray-500 text-sm">
                                        Quiz ID: {quizId}
                                    </div>
                                </div>
                            </div>
                        ) : quizStarted && !isQuizEnded ? (
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                                {/* Question header */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-gray-400 text-sm">
                                            Question {session.current_question_index + 1} of {session.total_questions}
                                        </div>
                                        {session?.mode === "timed" && (
                                            <div className="flex items-center gap-1 px-3 py-1 bg-red-500/20 rounded-full">
                                                <Clock size={16} />
                                                <span className="font-mono font-semibold">{timeLeft}s</span>
                                            </div>
                                        )}
                                    </div>

                                    {session.current_question ? (
                                        <>
                                            <h2 className="text-2xl font-bold mb-4">
                                                {session.current_question.text}
                                            </h2>
                                            {session.current_question.image && (
                                                <img
                                                    src={session.current_question.image}
                                                    alt="Question"
                                                    className="w-full max-h-64 object-cover rounded-lg mb-4"
                                                    loading="lazy"
                                                />
                                            )}

                                            {/* Answer options */}
                                            <div className="grid gap-3">
                                                {session.current_question.options.map((option, index) => {
                                                    const isSelected = selectedAnswer === option.id
                                                    const isCorrect = answerResult?.correctAnswerId === option.id
                                                    const isWrong = isSelected && answerResult && !answerResult.isCorrect

                                                    let buttonClass = "p-4 rounded-xl text-left transition-all duration-300 border"

                                                    if (showingResults) {
                                                        if (isCorrect) {
                                                            buttonClass += " bg-green-500/10 border-green-500/30 text-green-400"
                                                        } else if (isWrong) {
                                                            buttonClass += " bg-red-500/10 border-red-500/30 text-red-400"
                                                        } else {
                                                            buttonClass += " bg-gray-800/50 border-gray-700 text-gray-400"
                                                        }
                                                    } else if (hasAnswered || isQuizEnded || showingResults || isSubmittingAnswer) {
                                                        buttonClass += " bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                                                    } else {
                                                        buttonClass += " bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600 text-white cursor-pointer"
                                                    }

                                                    if (isSelected && !showingResults) {
                                                        buttonClass += " bg-blue-500/10 border-blue-500 text-blue-400"
                                                    }

                                                    return (
                                                        <button
                                                            key={String(option.id)}
                                                            onClick={() => !hasAnswered && !isQuizEnded && !showingResults && !isSubmittingAnswer && handleAnswerSubmit(option.id)}
                                                            disabled={hasAnswered || isQuizEnded || showingResults || isSubmittingAnswer}
                                                            className={buttonClass}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                                                        showingResults
                                                                            ? (isCorrect ? "bg-green-500 text-white" : isWrong ? "bg-red-500 text-white" : "bg-gray-700 text-gray-400")
                                                                            : isSelected ? "bg-blue-500 text-white" : "bg-gray-700 text-white"
                                                                    }`}
                                                                >
                                                                    {showingResults
                                                                        ? (isCorrect ? <Check className="w-4 h-4" /> : isWrong ? <X className="w-4 h-4" /> : String.fromCharCode(65 + index))
                                                                        : String.fromCharCode(65 + index)
                                                                    }
                                                                </div>
                                                                <span className="font-medium">{option.text}</span>
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="text-gray-400">No current question available</div>
                                            <button
                                                onClick={handleRefresh}
                                                className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors"
                                            >
                                                <RefreshCw size={16} />
                                                Refresh
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Answer result */}
                                {answerResult && showingResults && (
                                    <div className={`mt-6 p-4 rounded-lg ${
                                        answerResult.isCorrect
                                            ? "bg-green-500/10 border border-green-500/30"
                                            : "bg-red-500/10 border border-red-500/30"
                                    }`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            {answerResult.isCorrect ? (
                                                <>
                                                    <Check className="text-green-400" />
                                                    <span className="text-green-400 font-semibold">Correct!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <X className="text-red-400" />
                                                    <span className="text-red-400 font-semibold">Incorrect</span>
                                                </>
                                            )}
                                        </div>
                                        {answerResult.explanation && (
                                            <p className="text-gray-300 text-sm">{answerResult.explanation}</p>
                                        )}
                                        {answerResult.responseTime && (
                                            <p className="text-gray-400 text-sm mt-2">
                                                Response time: {answerResult.responseTime.toFixed(2)}s
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : isQuizEnded ? (
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-700">
                                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                                <h1 className="text-3xl font-bold mb-4">Quiz Completed!</h1>
                                <p className="text-gray-400 mb-6">
                                    Thank you for participating in the quiz.
                                </p>

                                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
                                    <div className="bg-gray-800/50 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-green-400">{userStats.correctAnswers}</div>
                                        <div className="text-gray-400 text-sm">Correct Answers</div>
                                    </div>
                                    <div className="bg-gray-800/50 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-red-400">{userStats.wrongAnswers}</div>
                                        <div className="text-gray-400 text-sm">Wrong Answers</div>
                                    </div>
                                </div>

                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={handleShowLeaderboard}
                                        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
                                    >
                                        <Trophy size={16} />
                                        View Leaderboard
                                    </button>
                                    <button
                                        onClick={handleLeaveQuiz}
                                        className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-semibold transition-colors"
                                    >
                                        Exit Quiz
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}