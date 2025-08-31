"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import { useWebSocket } from "../hooks/useWebSocket"
import { authAPI } from "../utils/api"
import {
  Users,
  Check,
  X,
  Square,
  Play,
  ChevronRight,
  Clock,
  ChevronLeft,
  Trophy,
  LogOut,
  Crown,
  UserX,
  RotateCcw,
  Share2,
  Timer,
  Target,
  Zap,
} from "lucide-react"

interface QuizSession {
  id: number
  title: string
  description: string
  mode: "timed" | "free"
  current_question: Question | null
  is_active: boolean
  creator_id: number
  creator_username?: string
  creator_avatar?: string
  participants_count: number
  time_per_question: number
  current_question_index: number
  total_questions: number
  start_time?: string
  end_time?: string
}

interface Question {
  id: number
  text: string
  image?: string
  options: Answer[]
  correct_answer_id?: string
}

interface Answer {
  id: number
  text: string
}

interface Participant {
  id: number
  username: string
  answered: boolean
  correct_answers: number
  wrong_answers: number
  total_answered: number
  avatar?: string
  is_online?: boolean
}

interface UserData {
  id: number
  username: string
  email: string
  profile_image?: string
  first_name?: string
  last_name?: string
}

const backgroundImages = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1920&h=1080&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&h=1080&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&h=1080&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&h=1080&fit=crop&crop=center",
]

export default function RealTimeQuizPage({ quiz_id }: { quiz_id: string }) {
  const params = useParams<{ quiz_id: string }>()
  const quizId = params?.quiz_id || quiz_id || "demo-quiz"

  const [user, setUser] = useState<UserData | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [userError, setUserError] = useState<string | null>(null)
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(15)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [isQuizEnded, setIsQuizEnded] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [hasJoined, setHasJoined] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [backgroundImage] = useState(() => backgroundImages[Math.floor(Math.random() * backgroundImages.length)])

  const [answerResult, setAnswerResult] = useState<{
    isCorrect: boolean
    correctAnswerId: number
    explanation?: string
    responseTime?: number
  } | null>(null)
  const [showingResults, setShowingResults] = useState(false)

  const [showParticipantsModal, setShowParticipantsModal] = useState(false)
  const [quizEndTime, setQuizEndTime] = useState<Date | null>(null)
  const [timeUntilEnd, setTimeUntilEnd] = useState<string>("")

  const [isStartingQuiz, setIsStartingQuiz] = useState(false)
  const [isEndingQuiz, setIsEndingQuiz] = useState(false)
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)

  const [canMoveToNext, setCanMoveToNext] = useState(false)

  const questionContainerRef = useRef<HTMLDivElement>(null)
  const startQuizTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const questionStartTimeRef = useRef<number>(0)

  const [totalStats, setTotalStats] = useState({
    totalUsers: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    totalWrong: 0,
  })

  const [finalResults, setFinalResults] = useState<any[]>([])
  const [userResults, setUserResults] = useState<any>(null)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)

  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoNext, setCanGoNext] = useState(false)
  const [isResultsPanelCollapsed, setIsResultsPanelCollapsed] = useState(false)
  const [autoNextTimer, setAutoNextTimer] = useState<NodeJS.Timeout | null>(null)

  const [questionHistory, setQuestionHistory] = useState<{ [key: number]: Question }>({})

  const WS_BASE_URL = "wss://backend.testabd.uz"
  const wsUrl = quizId ? `${WS_BASE_URL}/ws/quiz/${quizId}/` : null

  const { isConnected, sendMessage, lastMessage, error } = useWebSocket(wsUrl)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isNavigating, setIsNavigating] = useState(false)

  const isCreator = user && quizSession && user.id === quizSession.creator_id

  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null)

  const [showRefreshButton, setShowRefreshButton] = useState(false)
  const [userAnswerHistory, setUserAnswerHistory] = useState<{
    [questionId: string]: { answerId: string; isCorrect: boolean }
  }>({})
  const [questionLoadError, setQuestionLoadError] = useState(false)

  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [userStatsFromParticipants, setUserStatsFromParticipants] = useState({
    correctAnswers: 0,
    wrongAnswers: 0,
    totalAnswered: 0,
    accuracy: 0,
  })

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [questionAnswerStatus, setQuestionAnswerStatus] = useState<{
    [key: number]: "correct" | "incorrect" | "timeout" | "unanswered"
  }>({})

  const currentQuestion = allQuestions[currentQuestionIndex] || null

  useEffect(() => {
    if (typeof window !== "undefined" && quizSession?.current_question) {
      const savedQuestions = JSON.parse(localStorage.getItem(`quiz_${quizId}_questions`) || "{}")
      savedQuestions[quizSession.current_question_index || 0] = quizSession.current_question
      localStorage.setItem(`quiz_${quizId}_questions`, JSON.stringify(savedQuestions))
    }
  }, [quizSession?.current_question, quizId])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedQuestions = localStorage.getItem(`quiz_${quizId}_questions`)
      const savedIndex = localStorage.getItem(`quiz_${quizId}_current_index`)

      if (savedQuestions) {
        try {
          const questions = JSON.parse(savedQuestions)
          setAllQuestions(questions)
          if (savedIndex) {
            setCurrentQuestionIndex(Number.parseInt(savedIndex))
          }
        } catch (error) {
          console.error("Error loading saved questions:", error)
        }
      }
    }
  }, [quizId])

  useEffect(() => {
    if (typeof window !== "undefined" && allQuestions.length > 0) {
      localStorage.setItem(`quiz_${quizId}_current_index`, currentQuestionIndex.toString())
    }
  }, [currentQuestionIndex, quizId, allQuestions.length])

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setUserLoading(true)
        const userData = await authAPI.getCurrentUser()
        setUser(userData)
        setUserError(null)
      } catch (err) {
        console.error("[v0] Failed to load user data:", err)
        setUserError(err instanceof Error ? err.message : "Failed to load user data")
      } finally {
        setUserLoading(false)
      }
    }

    loadUserData()
  }, [])

  useEffect(() => {
    if (error) {
      console.log("[v0] WebSocket error:", error)
      setConnectionStatus("disconnected")
    } else if (isConnected) {
      setConnectionStatus("connected")
      if (!hasJoined && user) {
        console.log("[v0] Auto-joining quiz for user:", user.username)
        sendMessage({
          action: "join_quiz",
          user_id: user.id,
          username: user.username,
        })
        setHasJoined(true)

        setTimeout(() => {
          sendMessage({
            action: "load_all_questions",
            user_id: user.id,
          })
        }, 500)
      }
    } else {
      setConnectionStatus("connecting")
    }
  }, [isConnected, error, user, hasJoined, sendMessage])

  useEffect(() => {
    if (user && participants.length > 0) {
      const currentUser = participants.find((p) => p.id === user.id)
      if (currentUser) {
        setUserStatsFromParticipants({
          correctAnswers: currentUser.correct_answers || 0,
          wrongAnswers: currentUser.wrong_answers || 0,
          totalAnswered: currentUser.total_answered || 0,
          accuracy:
            currentUser.total_answered > 0
              ? Math.round((currentUser.correct_answers / currentUser.total_answered) * 100)
              : 0,
        })
      }
    }
  }, [participants, user])

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data)
        console.log("Received WebSocket message:", data)

        switch (data.type) {
          case "all_questions_loaded":
            console.log("[v0] All questions loaded:", data.questions.length)
            setAllQuestions(data.questions)
            if (typeof window !== "undefined") {
              localStorage.setItem(`quiz_${quizId}_questions`, JSON.stringify(data.questions))
            }
            break

          case "quiz_started":
            setQuizStarted(true)
            setQuizSession(data.quiz_session)
            if (data.all_questions) {
              setAllQuestions(data.all_questions)
              if (typeof window !== "undefined") {
                localStorage.setItem(`quiz_${quizId}_questions`, JSON.stringify(data.all_questions))
              }
            }
            break

          case "timed_question_change":
            if (quizSession?.mode === "timed") {
              setCurrentQuestionIndex(data.question_index)
              setHasAnswered(false)
              setSelectedAnswer(null)
              setAnswerResult(null)
              setShowingResults(false)
              questionStartTimeRef.current = Date.now()
            }
            break

          case "quiz_state":
            console.log("[v0] Setting quiz session:", data.quiz_session)
            setQuizSession(data.quiz_session)
            if (data.quiz_session?.current_question && data.quiz_session.is_active) {
              setQuizStarted(true)
              setQuestionLoadError(false)
              questionStartTimeRef.current = Date.now()
            }
            if (data.quiz_session?.end_time) {
              setQuizEndTime(new Date(data.quiz_session.end_time))
            }
            if (data.participants) {
              setParticipants(data.participants)
            }
            setIsStartingQuiz(false)
            setIsEndingQuiz(false)
            break

          case "answer_result":
            console.log("[v0] Answer result:", data)
            if (currentQuestion) {
              setUserAnswerHistory((prev) => ({
                ...prev,
                [currentQuestion.id]: {
                  answerId: selectedAnswer?.toString() || "",
                  isCorrect: data.is_correct,
                },
              }))

              setQuestionAnswerStatus((prev) => ({
                ...prev,
                [currentQuestionIndex]: data.is_correct ? "correct" : "incorrect",
              }))
            }

            setAnswerResult({
              isCorrect: data.is_correct,
              correctAnswerId: data.correct_answer_id,
              explanation: data.explanation,
              responseTime: data.response_time,
            })
            setShowingResults(true)
            setIsSubmittingAnswer(false)
            setCanMoveToNext(data.has_next_question || false)
            break

          case "participants_update":
            console.log("[v0] Participants updated:", data.participants)
            setParticipants(data.participants || [])
            break

          case "quiz_ended":
            console.log("[v0] Quiz ended")
            setIsQuizEnded(true)
            setQuizStarted(false)
            setIsEndingQuiz(false)
            setCanMoveToNext(false)
            sendMessage({ action: "get_final_results" })
            if (user) {
              sendMessage({ action: "get_user_results", user_id: user.id })
            }
            break

          case "final_results":
            console.log("[v0] Final results:", data.results)
            setFinalResults(data.results)
            setShowResultsModal(true)
            break

          case "time_update":
            if (data.time_left !== undefined && quizSession?.mode === "timed") {
              setTimeLeft(data.time_left)
            }
            break

          default:
            console.log("[v0] Unknown message type:", data.type)
            break
        }
      } catch (error) {
        console.error("[v0] Error parsing WebSocket message:", error)
        setShowRefreshButton(true)
        setQuestionLoadError(true)
      }
    }
  }, [
    lastMessage,
    quizId,
    quizSession?.mode,
    quizSession,
    selectedAnswer,
    currentQuestion,
    currentQuestionIndex,
    user,
    sendMessage,
  ])

  const handleKickParticipant = useCallback((participantId: string) => {
    // Placeholder for kicking participant logic
    console.log(`Kicking participant with ID: ${participantId}`)
  }, [])

  const handleStartQuiz = useCallback(() => {
    setIsStartingQuiz(true)
    sendMessage({
      action: "start_quiz",
      quiz_id: quizId,
    })
    setTimeout(() => {
      setIsStartingQuiz(false)
      setQuizStarted(true)
    }, 2000) // Simulate quiz start delay
  }, [quizId, sendMessage])

  const handleEndQuiz = useCallback(() => {
    if (!isConnected || !user || !quizSession || user.id !== quizSession.creator_id || isEndingQuiz) {
      return
    }

    const confirmEnd = window.confirm("Are you sure you want to end this quiz for all participants?")
    if (confirmEnd) {
      setIsEndingQuiz(true)
      sendMessage({
        action: "end_quiz",
        user_id: user.id,
      })
    }
  }, [isConnected, user, quizSession, sendMessage, isEndingQuiz])

  const handleRestartQuiz = useCallback(() => {
    if (!isCreator || !isConnected) return

    sendMessage({
      action: "restart_quiz",
      user_id: user?.id,
    })

    if (typeof window !== "undefined") {
      localStorage.removeItem(`quiz_${quizId}_questions`)
      localStorage.removeItem(`quiz_${quizId}_current_index`)
    }
    setCurrentQuestionIndex(0)
    setAllQuestions([])
    setIsQuizEnded(false)
    setQuizStarted(false)
  }, [isCreator, isConnected, user?.id, sendMessage, quizId])

  const handleAnswerSubmit = async (answerId: number) => {
    if (hasAnswered || !currentQuestion || !user) return

    setIsSubmittingAnswer(true)
    setSelectedAnswer(answerId)
    setHasAnswered(true)

    const responseTime = (Date.now() - questionStartTimeRef.current) / 1000

    sendMessage({
      action: "submit_answer",
      user_id: user.id,
      question_id: currentQuestion.id,
      answer_id: answerId,
      response_time: responseTime,
    })
  }

  const handleNavigateQuestion = useCallback(
    (direction: "next" | "prev") => {
      if (quizSession?.mode !== "free") return

      const newIndex =
        direction === "next"
          ? Math.min(currentQuestionIndex + 1, allQuestions.length - 1)
          : Math.max(currentQuestionIndex - 1, 0)

      if (newIndex !== currentQuestionIndex) {
        setCurrentQuestionIndex(newIndex)
        setSelectedAnswer(null)
        setHasAnswered(false)
        setShowingResults(false)
        setAnswerResult(null)
        questionStartTimeRef.current = Date.now()

        if (typeof window !== "undefined") {
          localStorage.setItem(`quiz_${quizId}_current_index`, newIndex.toString())
        }

        if (user) {
          sendMessage({
            action: "user_navigate",
            user_id: user.id,
            question_index: newIndex,
          })
        }
      }
    },
    [currentQuestionIndex, allQuestions.length, quizSession?.mode, quizId, user, sendMessage],
  )

  const handleShare = async () => {
    const shareData = {
      title: `Quiz Results - ${quizSession?.title || "Live Quiz"}`,
      text: `I scored ${userStatsFromParticipants.correctAnswers} correct answers out of ${userStatsFromParticipants.totalAnswered} questions! (${userStatsFromParticipants.accuracy}% accuracy)`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log("[v0] Share cancelled or failed:", error)
      }
    } else {
      // Fallback: copy to clipboard
      const text = `${shareData.text}\n${shareData.url}`
      await navigator.clipboard.writeText(text)
      alert("Results copied to clipboard!")
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (userError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="text-white text-xl">Please log in to join the quiz</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <style>{`
        .liquid-glass {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          border-radius: 16px;
        }
        
        .liquid-glass-button {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }
        
        .liquid-glass-button:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        }
        
        .liquid-glass-sidebar {
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }

        .question-indicator {
          width: 4px;
          height: 24px;
          border-radius: 2px;
          transition: all 0.3s ease;
        }
        
        .question-indicator.correct {
          background: linear-gradient(135deg, #10b981, #059669);
        }
        
        .question-indicator.incorrect {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }
        
        .question-indicator.timeout {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }
        
        .question-indicator.unanswered {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .question-indicator.current {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
        }
      `}</style>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 liquid-glass border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(true)}
              className="liquid-glass-button rounded-full p-2 text-white hover:bg-white/20 transition-colors lg:hidden"
            >
              <Users size={20} />
            </button>

            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <Users size={16} />
                <span className="text-sm font-medium">{participants.length} participants</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-400">{userStatsFromParticipants.correctAnswers}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-400">{userStatsFromParticipants.wrongAnswers}</span>
                </div>
                <div className="text-white/60">{userStatsFromParticipants.accuracy}% accuracy</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-white">
            <span className="text-sm font-medium">
              {currentQuestionIndex + 1} / {allQuestions.length || 1}
            </span>
            {quizSession?.mode === "timed" && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full">
                <Clock size={14} />
                <span className="text-sm font-mono">{timeLeft}s</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isCreator && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="liquid-glass-button rounded-full p-2 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                title="Admin Panel"
              >
                <Crown size={20} />
              </button>
            )}

            <button
              onClick={() => window.history.back()}
              className="liquid-glass-button rounded-full p-2 text-red-400 hover:bg-red-500/20 transition-colors"
              title="Exit Quiz"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`fixed top-0 left-0 h-full z-50 liquid-glass-sidebar transform transition-all duration-300 ${
          showSidebar ? (sidebarCollapsed ? "translate-x-0 w-20" : "translate-x-0 w-80") : "-translate-x-full w-80"
        } lg:translate-x-0 ${sidebarCollapsed ? "lg:w-20" : "lg:w-80"}`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {!sidebarCollapsed && <h3 className="text-white font-bold text-lg">Live Quiz</h3>}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <button
              onClick={() => setShowSidebar(false)}
              className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors lg:hidden"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={`${sidebarCollapsed ? "p-2" : "p-4"} space-y-4 overflow-y-auto h-full pb-20`}>
          <div className="liquid-glass rounded-xl p-4">
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold">Your Stats</h4>
                <button
                  onClick={async () => {
                    const shareData = {
                      title: `Quiz Results - ${quizSession?.title || "Live Quiz"}`,
                      text: `I scored ${userStatsFromParticipants.correctAnswers} correct answers out of ${userStatsFromParticipants.totalAnswered} questions! (${userStatsFromParticipants.accuracy}% accuracy)`,
                      url: window.location.href,
                    }

                    if (navigator.share) {
                      try {
                        await navigator.share(shareData)
                      } catch (error) {
                        console.log("[v0] Share cancelled or failed:", error)
                      }
                    } else {
                      const text = `${shareData.text}\n${shareData.url}`
                      await navigator.clipboard.writeText(text)
                      alert("Results copied to clipboard!")
                    }
                  }}
                  className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                  title="Share Results"
                >
                  <Share2 size={16} />
                </button>
              </div>
            )}

            <div className={`grid ${sidebarCollapsed ? "grid-cols-1 gap-2" : "grid-cols-2 gap-3"}`}>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{userStatsFromParticipants.correctAnswers}</div>
                {!sidebarCollapsed && <div className="text-xs text-white/70">Correct</div>}
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{userStatsFromParticipants.wrongAnswers}</div>
                {!sidebarCollapsed && <div className="text-xs text-white/70">Wrong</div>}
              </div>
              {!sidebarCollapsed && (
                <>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-400">{userStatsFromParticipants.accuracy}%</div>
                    <div className="text-xs text-white/70">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-400">{userStatsFromParticipants.totalAnswered}</div>
                    <div className="text-xs text-white/70">Answered</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {!sidebarCollapsed && allQuestions.length > 0 && (
            <div className="liquid-glass rounded-xl p-4">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Target size={16} />
                Progress ({currentQuestionIndex + 1}/{allQuestions.length})
              </h4>

              <div className="flex flex-wrap gap-1 mb-3">
                {allQuestions.map((_, index) => {
                  const status = questionAnswerStatus[index] || "unanswered"
                  const isCurrent = index === currentQuestionIndex

                  return (
                    <div
                      key={index}
                      className={`question-indicator ${isCurrent ? "current" : status}`}
                      title={`Question ${index + 1}: ${status}`}
                    />
                  )
                })}
              </div>

              <div className="text-xs text-white/60 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Correct ({Object.values(questionAnswerStatus).filter((s) => s === "correct").length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Incorrect ({Object.values(questionAnswerStatus).filter((s) => s === "incorrect").length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Timeout ({Object.values(questionAnswerStatus).filter((s) => s === "timeout").length})</span>
                </div>
              </div>
            </div>
          )}

          <div className="liquid-glass rounded-xl p-4">
            {!sidebarCollapsed && (
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Users size={16} />
                Live ({participants.length})
              </h4>
            )}

            <div className={`space-y-2 ${sidebarCollapsed ? "max-h-40" : "max-h-60"} overflow-y-auto`}>
              {participants
                .sort((a, b) => b.correct_answers - a.correct_answers)
                .map((participant, index) => (
                  <div
                    key={participant.id}
                    className={`flex items-center ${sidebarCollapsed ? "justify-center" : "justify-between"} p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors ${
                      participant.id === user?.id ? "ring-1 ring-blue-400/50" : ""
                    }`}
                  >
                    {sidebarCollapsed ? (
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold relative">
                          {participant.username.charAt(0).toUpperCase()}
                          {index < 3 && (
                            <div className="absolute -top-1 -right-1 text-xs">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-green-400 mt-1 font-bold">{participant.correct_answers}</div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {participant.username.charAt(0).toUpperCase()}
                            </div>
                            {index < 3 && (
                              <div className="absolute -top-1 -right-1 text-sm">
                                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm font-medium">{participant.username}</span>
                              {participant.id === quizSession?.creator_id && (
                                <Crown size={12} className="text-yellow-400" />
                              )}
                              {participant.id === user?.id && (
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-white/60">
                              #{index + 1} • {participant.total_answered || 0} answered
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-green-400 font-bold">{participant.correct_answers}</span>
                              <span className="text-red-400">{participant.wrong_answers}</span>
                            </div>
                            <div className="text-xs text-white/60">
                              {participant.total_answered > 0
                                ? Math.round((participant.correct_answers / participant.total_answered) * 100)
                                : 0}
                              % acc
                            </div>
                          </div>
                          {isCreator && participant.id !== user?.id && (
                            <button
                              onClick={() => {
                                if (isConnected) {
                                  sendMessage({
                                    action: "kick_participant",
                                    user_id: user?.id,
                                    participant_id: participant.id,
                                  })
                                }
                              }}
                              className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/20 transition-colors"
                              title="Remove participant"
                            >
                              <UserX size={14} />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {quizSession?.mode === "free" && allQuestions.length > 0 && !sidebarCollapsed && (
            <div className="liquid-glass rounded-xl p-4">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Zap size={16} />
                Navigation
              </h4>

              <div className="flex gap-2">
                <button
                  onClick={() => handleNavigateQuestion("prev")}
                  disabled={currentQuestionIndex === 0}
                  className="flex-1 liquid-glass-button rounded-lg p-2 text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <ChevronLeft size={16} />
                  Prev
                </button>
                <button
                  onClick={() => handleNavigateQuestion("next")}
                  disabled={currentQuestionIndex >= allQuestions.length - 1}
                  className="flex-1 liquid-glass-button rounded-lg p-2 text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Exit Button */}
          <button
            onClick={() => window.history.back()}
            className={`w-full liquid-glass-button rounded-xl p-3 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 ${
              sidebarCollapsed ? "px-2" : ""
            }`}
            title="Exit Quiz"
          >
            <LogOut size={16} />
            {!sidebarCollapsed && "Exit Quiz"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${showSidebar ? (sidebarCollapsed ? "lg:ml-20" : "lg:ml-80") : sidebarCollapsed ? "lg:ml-20" : "lg:ml-80"}`}
      >
        <div className="px-4 pt-20 pb-8 min-h-screen">
          <div className="max-w-4xl mx-auto">
            {!quizStarted && !isQuizEnded ? (
              // Waiting room
              <div className="liquid-glass rounded-2xl p-8 text-center">
                <div className="text-white text-2xl font-bold mb-4">
                  {connectionStatus === "connected" ? "Quiz Ready" : "Connecting..."}
                </div>
                <div className="text-white/70 mb-4">
                  {participants.length} participant{participants.length !== 1 ? "s" : ""} joined
                </div>
                {allQuestions.length > 0 && (
                  <div className="text-white/60 mb-8">{allQuestions.length} questions loaded</div>
                )}
                {isCreator && (
                  <button
                    onClick={() => {
                      setIsStartingQuiz(true)
                      sendMessage({
                        action: "start_quiz",
                        user_id: user?.id,
                      })
                    }}
                    disabled={isStartingQuiz || connectionStatus !== "connected"}
                    className="liquid-glass-button rounded-full px-8 py-4 text-white font-bold hover:bg-green-500/20 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    {isStartingQuiz ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play size={20} />
                        Start Quiz
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : isQuizEnded ? (
              // Quiz ended
              <div className="liquid-glass rounded-2xl p-8 text-center">
                <div className="text-white text-3xl font-bold mb-4">🏆 Quiz Completed!</div>
                <div className="text-white/70 mb-6">Thank you for participating!</div>

                <div className="liquid-glass rounded-xl p-6 mb-6">
                  <h3 className="text-white font-bold text-xl mb-4">Your Final Score</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {userStatsFromParticipants.correctAnswers}
                      </div>
                      <div className="text-sm text-white/70">Correct</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{userStatsFromParticipants.wrongAnswers}</div>
                      <div className="text-sm text-white/70">Wrong</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{userStatsFromParticipants.accuracy}%</div>
                      <div className="text-sm text-white/70">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {userStatsFromParticipants.totalAnswered}
                      </div>
                      <div className="text-sm text-white/70">Total</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 justify-center">
                  <button
                    onClick={() => setShowResultsModal(true)}
                    className="liquid-glass-button px-6 py-3 rounded-xl text-white hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                  >
                    <Trophy size={16} />
                    View Leaderboard
                  </button>

                  {isCreator && (
                    <button
                      onClick={() => {
                        if (isConnected) {
                          sendMessage({
                            action: "restart_quiz",
                            user_id: user?.id,
                          })

                          if (typeof window !== "undefined") {
                            localStorage.removeItem(`quiz_${quizId}_questions`)
                            localStorage.removeItem(`quiz_${quizId}_current_index`)
                          }
                          setCurrentQuestionIndex(0)
                          setAllQuestions([])
                          setIsQuizEnded(false)
                          setQuizStarted(false)
                        }
                      }}
                      className="liquid-glass-button px-6 py-3 rounded-xl text-white hover:bg-green-500/20 transition-colors flex items-center gap-2"
                    >
                      <RotateCcw size={16} />
                      Restart Quiz
                    </button>
                  )}

                  <button
                    onClick={() => window.history.back()}
                    className="liquid-glass-button px-6 py-3 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut size={16} />
                    Exit
                  </button>
                </div>
              </div>
            ) : currentQuestion ? (
              // Active quiz
              <div className="liquid-glass rounded-2xl p-6 md:p-8">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white text-xl md:text-2xl font-bold text-balance flex-1">
                      {currentQuestion.text}
                    </h2>
                    {quizSession?.mode === "timed" && (
                      <div className="flex items-center gap-2 ml-4">
                        <Timer size={16} className="text-orange-400" />
                        <span className="text-orange-400 font-mono text-sm">{timeLeft}s</span>
                      </div>
                    )}
                  </div>

                  {currentQuestion.image && (
                    <div className="mb-6">
                      <img
                        src={currentQuestion.image || "/placeholder.svg"}
                        alt="Question"
                        className="w-full max-h-64 object-cover rounded-lg"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>

                {/* Question Options */}
                <div className="grid gap-4 mb-6">
                  {currentQuestion.options?.map((option, index) => {
                    const isSelected = selectedAnswer === option.id
                    const isCorrect = answerResult?.correctAnswerId === option.id
                    const isWrong = isSelected && answerResult && !answerResult.isCorrect

                    let buttonClass = "liquid-glass-button p-4 rounded-xl text-left transition-all duration-300 w-full"

                    if (showingResults) {
                      if (isCorrect) {
                        buttonClass += " bg-green-500/30 border-green-400 ring-2 ring-green-400"
                      } else if (isWrong) {
                        buttonClass += " bg-red-500/30 border-red-400 ring-2 ring-red-400"
                      } else {
                        buttonClass += " opacity-60"
                      }
                    } else if (hasAnswered || isSubmittingAnswer) {
                      buttonClass += " opacity-60 cursor-not-allowed"
                    } else {
                      buttonClass += " hover:bg-white/20 hover:scale-[1.02] cursor-pointer active:scale-[0.98]"
                    }

                    if (isSelected && !showingResults) {
                      buttonClass += " ring-2 ring-blue-400 bg-blue-500/20"
                    }

                    return (
                      <button
                        key={option.id}
                        onClick={() => !hasAnswered && !isSubmittingAnswer && handleAnswerSubmit(option.id)}
                        disabled={hasAnswered || isSubmittingAnswer}
                        className={buttonClass}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              showingResults
                                ? isCorrect
                                  ? "bg-green-500"
                                  : isWrong
                                    ? "bg-red-500"
                                    : "bg-white/20"
                                : isSelected
                                  ? "bg-blue-500"
                                  : "bg-white/20"
                            }`}
                          >
                            {showingResults ? (
                              isCorrect ? (
                                <Check className="w-4 h-4" />
                              ) : isWrong ? (
                                <X className="w-4 h-4" />
                              ) : (
                                String.fromCharCode(65 + index)
                              )
                            ) : (
                              String.fromCharCode(65 + index)
                            )}
                          </div>
                          <span className="text-white font-medium">{option.text}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {quizSession?.mode === "free" && (
                  <div className="flex justify-between items-center mt-6">
                    <button
                      onClick={() => handleNavigateQuestion("prev")}
                      disabled={currentQuestionIndex === 0}
                      className="liquid-glass-button rounded-lg px-4 py-2 text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>

                    <span className="text-white/60 text-sm">Free Mode - Navigate at your own pace</span>

                    <button
                      onClick={() => handleNavigateQuestion("next")}
                      disabled={currentQuestionIndex >= allQuestions.length - 1}
                      className="liquid-glass-button rounded-lg px-4 py-2 text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Loading question
              <div className="liquid-glass rounded-2xl p-8 text-center">
                <div className="text-white/60 mb-4">
                  {allQuestions.length === 0 ? "Loading questions..." : "Preparing quiz..."}
                </div>
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                {connectionStatus !== "connected" && (
                  <div className="text-red-400 text-sm mt-4">
                    Connection issue. Please check your internet connection.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Panel Modal */}
      {showAdminPanel && isCreator && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="liquid-glass rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-xl flex items-center gap-2">
                <Crown className="text-yellow-400" size={24} />
                Admin Panel
              </h3>
              <button onClick={() => setShowAdminPanel(false)} className="text-white/60 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  if (!isConnected || !user || !quizSession || user.id !== quizSession.creator_id || isEndingQuiz) {
                    return
                  }

                  const confirmEnd = window.confirm("Are you sure you want to end this quiz for all participants?")
                  if (confirmEnd) {
                    setIsEndingQuiz(true)
                    sendMessage({
                      action: "end_quiz",
                      user_id: user.id,
                    })
                  }
                }}
                className="w-full liquid-glass-button rounded-lg p-3 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <Square size={16} />
                End Quiz
              </button>

              <button
                onClick={() => {
                  if (isConnected) {
                    sendMessage({
                      action: "restart_quiz",
                      user_id: user?.id,
                    })

                    if (typeof window !== "undefined") {
                      localStorage.removeItem(`quiz_${quizId}_questions`)
                      localStorage.removeItem(`quiz_${quizId}_current_index`)
                    }
                    setCurrentQuestionIndex(0)
                    setAllQuestions([])
                    setIsQuizEnded(false)
                    setQuizStarted(false)
                  }
                }}
                className="w-full liquid-glass-button rounded-lg p-3 text-green-400 hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Restart Quiz
              </button>

              <button
                onClick={() => setShowResultsModal(true)}
                className="w-full liquid-glass-button rounded-lg p-3 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <Trophy size={16} />
                View Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && finalResults.length > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="liquid-glass rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="text-white">
              <h2 className="text-2xl font-bold mb-6 text-center">🏆 Quiz Results</h2>

              <div className="space-y-3">
                {finalResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      index === 0
                        ? "bg-yellow-500/20 border border-yellow-500/50"
                        : index === 1
                          ? "bg-gray-400/20 border border-gray-400/50"
                          : index === 2
                            ? "bg-orange-600/20 border border-orange-600/50"
                            : "bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                      </span>
                      <div>
                        <div className="font-semibold">{result.username}</div>
                        <div className="text-sm text-gray-300">
                          {result.correct} correct, {result.wrong} wrong
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{result.score} pts</div>
                      <div className="text-sm text-gray-300">{result.avg_time}s avg</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg transition-colors"
                >
                  Close
                </button>
                {isCreator && (
                  <button
                    onClick={() => {
                      if (isConnected) {
                        sendMessage({
                          action: "restart_quiz",
                          user_id: user?.id,
                        })

                        if (typeof window !== "undefined") {
                          localStorage.removeItem(`quiz_${quizId}_questions`)
                          localStorage.removeItem(`quiz_${quizId}_current_index`)
                        }
                        setCurrentQuestionIndex(0)
                        setAllQuestions([])
                        setIsQuizEnded(false)
                        setQuizStarted(false)
                        setShowResultsModal(false)
                      }
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-colors"
                  >
                    🔄 Restart Quiz
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for mobile sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowSidebar(false)} />
      )}
    </div>
  )
}
