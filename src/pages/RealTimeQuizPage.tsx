"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom"
import { useWebSocket } from "../hooks/useWebSocket"
import { authAPI } from "../utils/api.ts"
import {
  Users,
  Trophy,
  Clock,
  Send,
  Crown,
  Zap,
  Timer,
  Play,
  Pause,
  X,
  Check,
  Loader2,
  Share2,
  Square,
} from "lucide-react"

interface QuizSession {
  id: string
  title: string
  description: string
  mode: "timed" | "first_answer" | "admin_controlled" | "free"
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
  id: string
  text: string
  image?: string
  options: Answer[]
}

interface Answer {
  id: string
  text: string
}

interface Participant {
  id: string
  username: string
  answered: boolean
  correct_answers: number
  wrong_answers: number
  total_answered: number
  avatar?: string
  is_online?: boolean
}

interface LeaderboardEntry {
  username: string
  score: number
  correct: number
  wrong: number
  avg_time?: number
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
  "/abstract-digital-gradient-purple-blue.png",
  "/cosmic-purple-nebula.png",
  "/liquid-glass-blue-gradient.png",
  "/geometric-patterns-dark.png",
  "/flowing-waves-purple-blue-gradient.png",
]

const RealTimeQuizPage: React.FC = () => {
  const { quiz_id } = useParams<{ quiz_id: string }>()

  const [user, setUser] = useState<UserData | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [userError, setUserError] = useState<string | null>(null)

  // State management
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isQuizEnded, setIsQuizEnded] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [hasJoined, setHasJoined] = useState(false)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [showTimerInfo, setShowTimerInfo] = useState(false)
  const [backgroundImage] = useState(() => backgroundImages[Math.floor(Math.random() * backgroundImages.length)])

  // UI State
  const [showParticipantsModal, setShowParticipantsModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [selectedUserProfile, setSelectedUserProfile] = useState<string | null>(null)

  // Statistics
  const [userStats, setUserStats] = useState({
    correct: 0,
    wrong: 0,
    answered: 0,
  })

  const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/quiz"
  const wsUrl = quiz_id && user ? `${WS_BASE_URL}/${quiz_id}/` : null

  console.log("[Quiz] Quiz ID from React Router:", quiz_id)
  console.log("[Quiz] User:", user)
  console.log("[Quiz] WebSocket URL:", wsUrl)

  const { isConnected, sendMessage, lastMessage } = useWebSocket(wsUrl)

  // Check if current user is admin
  const isAdmin = user && quizSession && user.id === quizSession.creator_id

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setUserLoading(true)
        setUserError(null)
        const response = await authAPI.getMe()
        setUser(response.data)
        console.log("[Quiz] User data fetched:", response.data)
      } catch (error: any) {
        console.error("[Quiz] Error fetching user:", error)
        setUserError("Failed to load user data")
        if (error.response?.status === 401) {
          window.location.href = "/login"
        }
      } finally {
        setUserLoading(false)
      }
    }

    fetchUser()
  }, [])

  // Update connection status
  useEffect(() => {
    setConnectionStatus(isConnected ? "connected" : "disconnected")
  }, [isConnected])

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return

    try {
      const data = JSON.parse(lastMessage)
      console.log("[Quiz] Received message:", data)

      switch (data.type) {
        case "quiz_state":
          setQuizSession(data.quiz_session)
          if (data.participants && Array.isArray(data.participants)) {
            setParticipants(data.participants)
          }
          if (data.current_question) {
            setHasAnswered(false)
            setSelectedAnswer(null)
            setShowResults(false)
          }
          setQuizStarted(data.quiz_session?.is_active || false)
          break

        case "quiz_started":
          setQuizSession(data.quiz_session)
          setQuizStarted(true)
          if (data.current_question) {
            setHasAnswered(false)
            setSelectedAnswer(null)
            setShowResults(false)
          }
          if (data.quiz_session?.mode === "timed") {
            setTimeLeft(data.quiz_session.time_per_question)
            setIsTimerActive(true)
          }
          break

        case "user_joined":
          if (data.participants && Array.isArray(data.participants)) {
            setParticipants(data.participants)
          }
          break

        case "user_left":
          if (data.participants && Array.isArray(data.participants)) {
            setParticipants(data.participants)
          }
          break

        case "next_question":
          setQuizSession((prev) => (prev ? { ...prev, current_question: data.question } : null))
          setHasAnswered(false)
          setSelectedAnswer(null)
          setShowResults(false)
          if (quizSession?.mode === "timed") {
            setTimeLeft(quizSession.time_per_question)
            setIsTimerActive(true)
          }
          break

        case "answer_result":
          setShowResults(true)
          if (data.is_correct) {
            setUserStats((prev) => ({ ...prev, correct: prev.correct + 1, answered: prev.answered + 1 }))
          } else {
            setUserStats((prev) => ({ ...prev, wrong: prev.wrong + 1, answered: prev.answered + 1 }))
          }
          break

        case "participants_update":
          if (data.participants && Array.isArray(data.participants)) {
            setParticipants(data.participants)
          }
          break

        case "timer_started":
          setTimeLeft(data.time_limit)
          setIsTimerActive(true)
          break

        case "time_up":
          setIsTimerActive(false)
          setShowResults(true)
          break

        case "quiz_paused":
          setIsTimerActive(false)
          break

        case "quiz_resumed":
          if (quizSession?.mode === "timed") {
            setIsTimerActive(true)
          }
          break

        case "leaderboard":
          setLeaderboard(data.data || [])
          break

        case "quiz_ended":
          setIsQuizEnded(true)
          setIsTimerActive(false)
          setLeaderboard(data.results || data.leaderboard || [])
          break

        case "error":
          console.error("[Quiz] Error:", data.message)
          break

        default:
          console.log("[Quiz] Unknown message type:", data.type)
      }
    } catch (error) {
      console.error("[Quiz] Error parsing message:", error)
    }
  }, [lastMessage, quizSession?.mode, quizSession?.time_per_question])

  // Timer countdown for timed mode
  useEffect(() => {
    if (isTimerActive && timeLeft > 0 && !hasAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && isTimerActive) {
      setIsTimerActive(false)
    }
  }, [timeLeft, isTimerActive, hasAnswered])

  // Join quiz when connected
  useEffect(() => {
    if (isConnected && quiz_id && user && !hasJoined) {
      console.log("[Quiz] Joining quiz:", quiz_id, "as user:", user.username)
      sendMessage({
        action: "join_quiz",
        quiz_id: quiz_id,
        user_id: user.id,
        username: user.username,
      })
      setHasJoined(true)
    }
  }, [isConnected, quiz_id, user, hasJoined, sendMessage])

  useEffect(() => {
    if (showTimerInfo) {
      const timer = setTimeout(() => setShowTimerInfo(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showTimerInfo])

  const handleSubmitAnswer = useCallback(
    (answerId: string) => {
      if (hasAnswered || !quizSession?.current_question || !user) return

      setSelectedAnswer(answerId)
      setHasAnswered(true)

      sendMessage({
        action: "submit_answer",
        quiz_id: quiz_id,
        question_id: quizSession.current_question.id,
        answer: { answer_id: answerId },
        user_id: user.id,
        response_time: quizSession.mode === "timed" ? quizSession.time_per_question - timeLeft : 0,
      })
    },
    [hasAnswered, quizSession, user, quiz_id, sendMessage, timeLeft],
  )

  const handleProfileClick = (username: string) => {
    setSelectedUserProfile(username)
    setShowLeaveModal(true)
  }

  const handleLeaveQuiz = () => {
    if (selectedUserProfile) {
      window.location.href = `/profile/${selectedUserProfile}`
    }
  }

  const handleExitQuiz = () => {
    window.location.href = "/"
  }

  const handleStartQuiz = useCallback(() => {
    if (!user || !isAdmin) return
    sendMessage({
      action: "start_quiz",
      user_id: user.id,
    })
  }, [user, isAdmin, sendMessage])

  const handleNextQuestion = useCallback(() => {
    if (!user) return

    // Check permissions based on quiz mode
    if (quizSession?.mode === "admin_controlled" && !isAdmin) {
      return
    }

    sendMessage({
      action: "next_question",
      user_id: user.id,
    })
  }, [user, quizSession?.mode, isAdmin, sendMessage])

  const handleEndQuiz = useCallback(() => {
    if (!user || !isAdmin) return
    sendMessage({
      action: "end_quiz",
      user_id: user.id,
    })
  }, [user, isAdmin, sendMessage])

  const handlePauseQuiz = useCallback(() => {
    if (!user || !isAdmin) return
    sendMessage({
      action: "pause_quiz",
      user_id: user.id,
    })
  }, [user, isAdmin, sendMessage])

  const handleResumeQuiz = useCallback(() => {
    if (!user || !isAdmin) return
    sendMessage({
      action: "resume_quiz",
      user_id: user.id,
    })
  }, [user, isAdmin, sendMessage])

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: quizSession?.title || "Live Quiz",
        text: "Join this live quiz!",
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }, [quizSession])

  const getQuizModeInfo = () => {
    if (!quizSession) return { name: "", description: "", color: "blue", icon: Clock }

    switch (quizSession.mode) {
      case "timed":
        return {
          name: "Timed Mode",
          description: "Questions progress automatically after time limit",
          color: "orange",
          icon: Timer,
        }
      case "first_answer":
        return {
          name: "First Answer Mode",
          description: "Next question appears when someone answers",
          color: "green",
          icon: Zap,
        }
      case "admin_controlled":
        return {
          name: "Admin Controlled",
          description: "Quiz creator controls question progression",
          color: "purple",
          icon: Crown,
        }
      case "free":
        return {
          name: "Free Mode",
          description: "Anyone can move to next question",
          color: "blue",
          icon: Users,
        }
      default:
        return { name: "Quiz Mode", description: "", color: "blue", icon: Clock }
    }
  }

  const canMoveToNext = () => {
    if (!quizSession || !user) return false

    switch (quizSession.mode) {
      case "admin_controlled":
        return isAdmin
      case "free":
        return hasAnswered
      case "timed":
      case "first_answer":
        return isAdmin // Only admin can manually control in these modes
      default:
        return false
    }
  }

  const getParticipantReadiness = () => {
    if (quizSession?.mode !== "free") return null

    const answeredCount = participants.filter((p) => p.answered).length
    const totalCount = participants.length

    return { answered: answeredCount, total: totalCount }
  }

  const renderQuestionContent = (question: Question) => {
    if (!question.options || question.options.length === 0) {
      return (
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-2 text-white">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Loading options...</span>
          </div>
        </div>
      )
    }

    return (
      <div className="grid gap-3">
        {question.options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSubmitAnswer(option.id)}
            disabled={hasAnswered}
            className={`p-4 rounded-2xl text-left transition-all hover-lift ${
              hasAnswered ? "glass-morphism-light cursor-not-allowed opacity-60" : "glass-morphism hover:bg-white/20"
            }`}
          >
            <span className="text-white font-medium">{option.text}</span>
          </button>
        ))}
      </div>
    )
  }

  if (userLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading user data...</p>
        </div>
      </div>
    )
  }

  if (userError || !user) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl mb-4">{userError || "Authentication required"}</p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (!quiz_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Invalid quiz URL</div>
      </div>
    )
  }

  if (connectionStatus === "connecting") {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Connecting to quiz...</p>
          <p className="text-sm text-white/70 mt-2">Welcome, {user.username}!</p>
        </div>
      </div>
    )
  }

  if (connectionStatus === "disconnected") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl mb-4">Connection lost</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Reconnect
          </button>
        </div>
      </div>
    )
  }

  const modeInfo = getQuizModeInfo()
  const ModeIcon = modeInfo.icon

  return (
    <div className="fixed inset-0 bg-gray-900 overflow-hidden">
      <style>{`
        .glass-morphism {
          background: rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .glass-morphism-light {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        @keyframes slideIn {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        .animate-slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        
        .animate-pulse-custom {
          animation: pulse 2s infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .hover-lift {
          transition: all 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }
      `}</style>

      {/* Background with random image and gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/50 to-indigo-900/60"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>
      </div>

      {/* Main Content Area - Left Side */}
      <div className="flex h-full">
        <div className="flex-1 relative p-4 pr-0">
          {/* Top Statistics Bar */}
          <div className="glass-morphism rounded-2xl p-3 mb-4 hover-lift">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 bg-green-500/80 rounded-full flex items-center justify-center mb-1">
                  <Check size={12} className="text-white" />
                </div>
                <span className="text-white text-sm font-bold">{userStats.correct}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center mb-1">
                  <X size={12} className="text-white" />
                </div>
                <span className="text-white text-sm font-bold">{userStats.wrong}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 bg-blue-500/80 rounded-full flex items-center justify-center mb-1">
                  <Users size={12} className="text-white" />
                </div>
                <span className="text-white text-sm font-bold">{participants.length}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 bg-purple-500/80 rounded-full flex items-center justify-center mb-1">
                  <Trophy size={12} className="text-white" />
                </div>
                <span className="text-white text-sm font-bold">
                  {quizSession?.current_question_index || 0}/{quizSession?.total_questions || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Quiz Mode Indicator */}
          <div className="glass-morphism rounded-2xl p-3 mb-4 hover-lift">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg glass-morphism-light`}>
                <ModeIcon className={`w-4 h-4 text-${modeInfo.color}-400`} />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium text-sm">{modeInfo.name}</h3>
                <p className="text-white/60 text-xs">{modeInfo.description}</p>
              </div>
            </div>
          </div>

          {/* Main Question Area */}
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            {quizSession?.current_question ? (
              <div className="w-full max-w-2xl">
                <div className="glass-morphism rounded-3xl p-8 text-center hover-lift">
                  <h2 className="text-2xl font-bold text-white mb-6">{quizSession.current_question.text}</h2>

                  {quizSession.current_question.image && (
                    <img
                      src={quizSession.current_question.image || "/placeholder.svg"}
                      alt="Question"
                      className="w-full max-w-md mx-auto rounded-2xl mb-6"
                    />
                  )}

                  {renderQuestionContent(quizSession.current_question)}
                </div>
              </div>
            ) : (
              <div className="glass-morphism rounded-2xl p-8 text-center animate-float">
                <div className="animate-pulse mb-4">
                  <div className="w-16 h-16 glass-morphism-light rounded-full mx-auto mb-4 flex items-center justify-center">
                    <ModeIcon className="w-8 h-8 text-white/60" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Waiting for Next Question</h2>
                <p className="text-white/70">
                  {quizSession?.mode === "first_answer"
                    ? "Moving to next question..."
                    : "The next question will appear shortly..."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-16 p-4 flex flex-col items-center gap-3">
          {/* Timer - Top Right */}
          {quizSession?.mode === "timed" && timeLeft > 0 && (
            <div className="relative">
              <button
                onMouseEnter={() => setShowTimerInfo(true)}
                onMouseLeave={() => setShowTimerInfo(false)}
                className="glass-morphism rounded-full w-12 h-12 flex items-center justify-center hover-lift"
              >
                <Clock className="w-5 h-5 text-white" />
                <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {timeLeft}
                </span>
              </button>

              {showTimerInfo && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 glass-morphism rounded-lg p-2 text-xs text-white whitespace-nowrap z-50">
                  Timed Mode: {timeLeft}s remaining
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <>
              {!quizStarted && (
                <button
                  onClick={handleStartQuiz}
                  className="glass-morphism rounded-full w-12 h-12 flex items-center justify-center hover:bg-green-600/50 transition-all hover-lift"
                  title="Start Quiz"
                >
                  <Play className="w-5 h-5 text-white" />
                </button>
              )}

              <button
                onClick={handleNextQuestion}
                className="glass-morphism rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-600/50 transition-all hover-lift"
                title="Next Question"
              >
                <Send className="w-5 h-5 text-white" />
              </button>

              <button
                onClick={handlePauseQuiz}
                className="glass-morphism rounded-full w-12 h-12 flex items-center justify-center hover:bg-yellow-600/50 transition-all hover-lift"
                title="Pause Quiz"
              >
                <Pause className="w-5 h-5 text-white" />
              </button>

              <button
                onClick={handleEndQuiz}
                className="glass-morphism rounded-full w-12 h-12 flex items-center justify-center hover:bg-red-600/50 transition-all hover-lift"
                title="End Quiz"
              >
                <Square className="w-5 h-5 text-white" />
              </button>
            </>
          )}

          {/* Share Button - Bottom */}
          <div className="flex-1"></div>
          <button
            onClick={handleShare}
            className="glass-morphism rounded-full w-12 h-12 flex items-center justify-center hover:bg-purple-600/50 transition-all hover-lift"
            title="Share Quiz"
          >
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {quizSession && (
        <div className="absolute bottom-4 left-4 glass-morphism rounded-2xl p-3 hover-lift max-w-xs">
          <div className="flex items-center gap-3">
            <img
              src={quizSession.creator_avatar || "/placeholder.svg?height=24&width=24&query=creator+avatar"}
              alt="Creator"
              className="w-6 h-6 rounded-full border border-white/30"
            />
            <div className="flex-1">
              <span className="text-white font-medium text-xs">@{quizSession.creator_username}</span>
              <div className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-yellow-400" />
                <span className="text-white/60 text-xs">Quiz Master</span>
              </div>
            </div>
          </div>
          {quizSession.description && (
            <p className="text-white/70 text-xs mt-2 line-clamp-2">{quizSession.description}</p>
          )}
        </div>
      )}

      {/* Participants Modal */}
      {showParticipantsModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 animate-fade-in"
            onClick={() => setShowParticipantsModal(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 rounded-t-2xl p-6 z-50 animate-slide-in max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Participants ({participants.length})</h3>
              <button
                onClick={() => setShowParticipantsModal(false)}
                className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition-all"
                >
                  <button
                    onClick={() => handleProfileClick(participant.username)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <img
                      src={participant.avatar || "/placeholder.svg?height=40&width=40&query=user+avatar"}
                      alt={participant.username}
                      className="w-10 h-10 rounded-full border border-gray-600 object-cover"
                    />
                    <div>
                      <span className="text-white font-medium">{participant.username}</span>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>{participant.correct_answers}✓</span>
                        <span>{participant.wrong_answers}✗</span>
                        {participant.is_online && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                      </div>
                    </div>
                  </button>
                  {participant.answered && (
                    <div className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">Answered</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Leave Quiz Confirmation Modal */}
      {showLeaveModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 animate-fade-in"
            onClick={() => setShowLeaveModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border border-gray-700 rounded-2xl p-6 z-50 animate-slide-in max-w-sm w-full mx-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-4">Leave Quiz?</h3>
              <p className="text-gray-300 mb-6">
                Do you want to leave the quiz and visit {selectedUserProfile}'s profile?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveQuiz}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Leave Quiz
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default RealTimeQuizPage
