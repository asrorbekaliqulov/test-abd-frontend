"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom" // Import useParams from react-router-dom instead of Next.js
import { useWebSocket } from "../hooks/useWebSocket"
import { authAPI } from "../utils/api"
import { Users, Trophy, Clock, Check, X, Timer, Eye, LogOut, Square } from "lucide-react"

interface QuizSession {
  id: string
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
  "/dark-geometric-patterns.png",
  "/flowing-waves-purple-blue-gradient.png",
]

const mockUser: UserData = {
  id: 1,
  username: "demo_user",
  email: "demo@example.com",
  first_name: "Demo",
  last_name: "User",
}

const mockQuizSession: QuizSession = {
  id: "1",
  title: "JavaScript Fundamentals Quiz",
  description: "Test your knowledge of JavaScript basics",
  mode: "timed",
  current_question: {
    id: "q1",
    text: "What is the correct way to declare a variable in JavaScript?",
    options: [
      { id: "a1", text: "var myVariable = 'hello';" },
      { id: "a2", text: "variable myVariable = 'hello';" },
      { id: "a3", text: "v myVariable = 'hello';" },
      { id: "a4", text: "declare myVariable = 'hello';" },
    ],
  },
  is_active: true,
  creator_id: 2,
  creator_username: "quiz_master",
  participants_count: 5,
  time_per_question: 15,
  current_question_index: 1,
  total_questions: 10,
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
}

const mockParticipants: Participant[] = [
  {
    id: "1",
    username: "demo_user",
    answered: false,
    correct_answers: 3,
    wrong_answers: 1,
    total_answered: 4,
    is_online: true,
  },
  {
    id: "2",
    username: "alice_coder",
    answered: true,
    correct_answers: 4,
    wrong_answers: 0,
    total_answered: 4,
    is_online: true,
  },
  {
    id: "3",
    username: "bob_dev",
    answered: true,
    correct_answers: 2,
    wrong_answers: 2,
    total_answered: 4,
    is_online: true,
  },
  {
    id: "4",
    username: "charlie_js",
    answered: false,
    correct_answers: 3,
    wrong_answers: 1,
    total_answered: 4,
    is_online: false,
  },
  {
    id: "5",
    username: "diana_react",
    answered: true,
    correct_answers: 4,
    wrong_answers: 0,
    total_answered: 4,
    is_online: true,
  },
]

const RealTimeQuizPage: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [userError, setUserError] = useState<string | null>(null)

  const params = useParams<{ quiz_id: string }>()
  const quiz_id = params?.quiz_id

  const [quizSession, setQuizSession] = useState<QuizSession | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(15)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [isQuizEnded, setIsQuizEnded] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [hasJoined, setHasJoined] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [backgroundImage] = useState(() => backgroundImages[Math.floor(Math.random() * backgroundImages.length)])

  const [showParticipantsModal, setShowParticipantsModal] = useState(false)
  const [quizEndTime, setQuizEndTime] = useState<Date | null>(null)
  const [timeUntilEnd, setTimeUntilEnd] = useState<string>("")

  const [totalStats, setTotalStats] = useState({
    totalUsers: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    totalWrong: 0,
  })

  const WS_BASE_URL = "ws://backend.testabd.uz"
  const wsUrl = quiz_id ? `${WS_BASE_URL}/ws/quiz/${quiz_id}/` : null

  const { isConnected, sendMessage, lastMessage, error } = useWebSocket(wsUrl)

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
        sendMessage({
          action: "join_quiz",
          user_id: user.id,
          username: user.username,
        })
        setHasJoined(true)
      }
    } else {
      setConnectionStatus("connecting")
    }
  }, [isConnected, error, user, hasJoined, sendMessage])

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage)
        console.log("[v0] Received WebSocket message:", data)

        switch (data.type) {
          case "quiz_state":
            console.log("[v0] Setting quiz session:", data.quiz_session)
            console.log("[v0] Current question in quiz_state:", data.quiz_session?.current_question)
            setQuizSession(data.quiz_session)
            if (data.quiz_session?.end_time) {
              setQuizEndTime(new Date(data.quiz_session.end_time))
            }
            if (data.quiz_session?.is_active) {
              setQuizStarted(true)
            }
            if (data.participants) {
              setParticipants(data.participants)
            }
            break

          case "user_joined":
            console.log("[v0] User joined:", data.username)
            if (data.participants) {
              setParticipants(data.participants)
            }
            break

          case "quiz_started":
            console.log("[v0] Quiz started:", data)
            setQuizStarted(true)
            if (data.quiz_session) {
              setQuizSession(data.quiz_session)
            }
            if (data.current_question || data.quiz_session?.current_question) {
              const currentQuestion = data.current_question || data.quiz_session.current_question
              console.log("[v0] Setting current question from quiz_started:", currentQuestion)
              setQuizSession((prev) =>
                prev
                  ? {
                      ...prev,
                      current_question: currentQuestion,
                    }
                  : null,
              )
              setHasAnswered(false)
              setSelectedAnswer(null)
              if (data.mode === "timed" || data.quiz_session?.mode === "timed") {
                setTimeLeft(currentQuestion.time_per_question || 15)
              }
            }
            break

          case "new_question":
            console.log("[v0] New question received:", data.question)
            setQuizSession((prev) =>
              prev
                ? {
                    ...prev,
                    current_question: data.question,
                    current_question_index: data.question_index || prev.current_question_index,
                  }
                : null,
            )
            setHasAnswered(false)
            setSelectedAnswer(null)
            if (quizSession?.mode === "timed") {
              setTimeLeft(data.time_per_question || 15)
            }
            break

          case "participants_update":
            console.log("[v0] Participants updated:", data.participants)
            setParticipants(data.participants || [])
            break

          case "leaderboard":
            console.log("[v0] Leaderboard received:", data.data)
            // Handle leaderboard data if needed
            break

          case "participants_list":
            console.log("[v0] Participants list received:", data.data)
            if (data.data) {
              setParticipants(data.data)
            }
            break

          case "quiz_ended":
            console.log("[v0] Quiz ended")
            setIsQuizEnded(true)
            setQuizStarted(false)
            break

          case "answer_result":
            console.log("[v0] Answer result:", data)
            break

          case "time_update":
            if (data.time_left !== undefined && quizSession?.mode === "timed") {
              setTimeLeft(data.time_left)
            }
            break

          case "error":
            console.error("[v0] Backend error:", data.message)
            // You can show error notifications here if needed
            break

          default:
            console.log("[v0] Unknown message type:", data.type)
        }
      } catch (err) {
        console.error("[v0] Error parsing WebSocket message:", err)
      }
    }
  }, [lastMessage, quizSession])

  useEffect(() => {
    const stats = participants.reduce(
      (acc, participant) => ({
        totalUsers: acc.totalUsers + 1,
        totalAnswered: acc.totalAnswered + participant.total_answered,
        totalCorrect: acc.totalCorrect + participant.correct_answers,
        totalWrong: acc.totalWrong + participant.wrong_answers,
      }),
      { totalUsers: 0, totalAnswered: 0, totalCorrect: 0, totalWrong: 0 },
    )
    setTotalStats(stats)
  }, [participants])

  useEffect(() => {
    if (quizSession?.mode === "timed" && timeLeft > 0 && !hasAnswered && quizStarted && !isQuizEnded) {
      const timer = setTimeout(() => {
        const newTimeLeft = timeLeft - 1
        setTimeLeft(newTimeLeft)

        if (newTimeLeft === 0 && !hasAnswered) {
          console.log("[v0] Time expired, auto-submitting")
          setHasAnswered(true)
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, hasAnswered, quizStarted, quizSession?.mode, isQuizEnded])

  const handleSubmitAnswer = useCallback(
    (answerId: string) => {
      if (hasAnswered || !quizSession?.current_question || !user) return

      console.log("[v0] Submitting answer:", answerId)
      setSelectedAnswer(answerId)
      setHasAnswered(true)

      if (isConnected) {
        sendMessage({
          action: "submit_answer",
          question_id: quizSession.current_question.id,
          answer_id: answerId,
          user_id: user.id,
        })
      } else {
        console.error("[v0] Cannot submit answer - WebSocket not connected")
      }
    },
    [hasAnswered, quizSession, user, isConnected, sendMessage],
  )

  const handleLeaveQuiz = useCallback(() => {
    if (isConnected && user) {
      sendMessage({
        action: "leave_quiz",
        user_id: user.id,
      })
    }
    // Navigate back or to home page
    window.history.back()
  }, [isConnected, user, sendMessage])

  const handleEndQuiz = useCallback(() => {
    if (isConnected && user && quizSession && user.id === quizSession.creator_id) {
      const confirmEnd = window.confirm("Are you sure you want to end this quiz for all participants?")
      if (confirmEnd) {
        sendMessage({
          action: "end_quiz",
          user_id: user.id,
        })
      }
    }
  }, [isConnected, user, quizSession, sendMessage])

  const renderQuestionContent = (question: Question) => {
    if (!question) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-white/60">No question available</div>
        </div>
      )
    }

    if (!question.options || question.options.length === 0) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-white/60">Loading question options...</div>
        </div>
      )
    }

    const isTimeExpired = quizSession?.mode === "timed" && timeLeft === 0
    const isDisabled = hasAnswered || isTimeExpired || isQuizEnded

    return (
      <div className="grid gap-4">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option.id

          return (
            <button
              key={option.id}
              onClick={() => !isDisabled && handleSubmitAnswer(option.id)}
              disabled={isDisabled}
              className={`p-4 rounded-xl text-left transition-all duration-300 ${
                isDisabled
                  ? "bg-white/10 cursor-not-allowed opacity-60"
                  : "bg-white/20 hover:bg-white/30 hover:scale-[1.02] cursor-pointer"
              } ${isSelected ? "ring-2 ring-blue-400 bg-blue-500/20" : ""} backdrop-blur-sm border border-white/20`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    isSelected ? "bg-blue-500" : "bg-white/20"
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="text-white font-medium">{option.text}</span>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  useEffect(() => {
    if (!quizEndTime) return

    const updateTimeUntilEnd = () => {
      const now = new Date()
      const timeDiff = quizEndTime.getTime() - now.getTime()

      if (timeDiff <= 0) {
        setTimeUntilEnd("Quiz Ended")
        setIsQuizEnded(true)
        return
      }

      const hours = Math.floor(timeDiff / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)

      if (hours > 0) {
        setTimeUntilEnd(`${hours}h ${minutes}m ${seconds}s`)
      } else if (minutes > 0) {
        setTimeUntilEnd(`${minutes}m ${seconds}s`)
      } else {
        setTimeUntilEnd(`${seconds}s`)
      }
    }

    updateTimeUntilEnd()
    const interval = setInterval(updateTimeUntilEnd, 1000)
    return () => clearInterval(interval)
  }, [quizEndTime])

  if (userLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Setting up anonymous user...</p>
        </div>
      </div>
    )
  }

  if (connectionStatus === "connecting") {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Connecting to quiz...</p>
        </div>
      </div>
    )
  }

  if (connectionStatus === "disconnected") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl mb-4">Connection failed</p>
          <p className="text-sm mb-4 text-white/70">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!quiz_id) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl mb-4">Invalid Quiz URL</p>
          <p className="text-sm mb-4 text-white/70">Quiz ID not found in URL</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900 overflow-hidden">
      <style>{`
        .glass-morphism {
          background: rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

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

      {quizEndTime && (
        <div className="absolute top-4 right-4 z-50">
          <div className="glass-morphism rounded-xl px-4 py-2">
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {timeUntilEnd === "Quiz Ended" ? (
                  <span className="text-red-400">Quiz Ended</span>
                ) : (
                  <span>Ends in {timeUntilEnd}</span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-full">
        <div className="flex-1 relative p-6">
          <div className="glass-morphism rounded-xl p-4 mb-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="flex flex-col items-center">
                <Users className="w-5 h-5 text-blue-400 mb-1" />
                <span className="text-white text-lg font-bold">{totalStats.totalUsers}</span>
                <span className="text-white/60 text-xs">Users</span>
              </div>
              <div className="flex flex-col items-center">
                <Trophy className="w-5 h-5 text-purple-400 mb-1" />
                <span className="text-white text-lg font-bold">{totalStats.totalAnswered}</span>
                <span className="text-white/60 text-xs">Answered</span>
              </div>
              <div className="flex flex-col items-center">
                <Check className="w-5 h-5 text-green-400 mb-1" />
                <span className="text-white text-lg font-bold">{totalStats.totalCorrect}</span>
                <span className="text-white/60 text-xs">Correct</span>
              </div>
              <div className="flex flex-col items-center">
                <X className="w-5 h-5 text-red-400 mb-1" />
                <span className="text-white text-lg font-bold">{totalStats.totalWrong}</span>
                <span className="text-white/60 text-xs">Wrong</span>
              </div>
            </div>
          </div>

          <div className="glass-morphism rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {quizSession?.mode === "timed" ? (
                  <Timer className="w-5 h-5 text-orange-400" />
                ) : (
                  <Clock className="w-5 h-5 text-blue-400" />
                )}
                <div>
                  <h3 className="text-white font-medium">
                    {quizSession?.mode === "timed" ? "Timed Mode" : "Free Mode"}
                  </h3>
                  <p className="text-white/60 text-sm">
                    {quizSession?.mode === "timed" ? "15 seconds per question" : "Answer at your own pace"}
                  </p>
                </div>
              </div>

              {quizSession?.mode === "timed" && timeLeft > 0 && (
                <div className="flex items-center gap-2">
                  <div className="text-white font-bold text-lg">{timeLeft}</div>
                  <div className="w-12 h-12 rounded-full border-4 border-white/20 relative">
                    <div
                      className="absolute inset-0 rounded-full border-4 border-orange-400 transition-all duration-1000"
                      style={{
                        clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((2 * Math.PI * (15 - timeLeft)) / 15 - Math.PI / 2)}% ${50 + 50 * Math.sin((2 * Math.PI * (15 - timeLeft)) / 15 - Math.PI / 2)}%, 50% 50%)`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            {quizSession?.current_question ? (
              <div className="w-full max-w-3xl">
                <div className="glass-morphism rounded-2xl p-8">
                  <div className="text-center mb-8">
                    <div className="text-white/60 text-sm mb-2">
                      Question {quizSession.current_question_index} of {quizSession.total_questions}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">{quizSession.current_question.text}</h2>

                    {quizSession.current_question.image && (
                      <img
                        src={quizSession.current_question.image || "/placeholder.svg"}
                        alt="Question"
                        className="w-full max-w-md mx-auto rounded-xl mb-6"
                      />
                    )}
                  </div>

                  {renderQuestionContent(quizSession.current_question)}

                  {hasAnswered && (
                    <div className="mt-6 text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-full">
                        <Check className="w-4 h-4" />
                        <span>
                          {quizSession.mode === "timed" && timeLeft === 0 && !selectedAnswer
                            ? "Time expired!"
                            : "Answer submitted!"}
                        </span>
                      </div>
                    </div>
                  )}

                  {quizSession.mode === "timed" && timeLeft === 0 && !hasAnswered && (
                    <div className="mt-6 text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-full">
                        <Timer className="w-4 h-4" />
                        <span>Time expired!</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : quizStarted ? (
              <div className="glass-morphism rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-white/60" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Waiting for Next Question</h2>
                <p className="text-white/70">The quiz will continue shortly...</p>
              </div>
            ) : (
              <div className="glass-morphism rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white/60" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Waiting for Quiz to Start</h2>
                <p className="text-white/70">Please wait while the quiz is being prepared...</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-16 p-4 flex flex-col items-center gap-4">
          <button
            onClick={() => setShowParticipantsModal(true)}
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
            title="View Participants"
          >
            <Eye className="w-5 h-5 text-white" />
          </button>

          {user && quizSession && user.id === quizSession.creator_id && (
            <button
              onClick={handleEndQuiz}
              className="w-12 h-12 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-400/20 flex items-center justify-center hover:bg-red-500/30 transition-all"
              title="End Quiz"
            >
              <Square className="w-5 h-5 text-red-400" />
            </button>
          )}

          <div className="flex-1"></div>

          <button
            onClick={handleLeaveQuiz}
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
            title="Leave Quiz"
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {showParticipantsModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowParticipantsModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 z-50">
            <div className="glass-morphism rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Participants ({participants.length})</h3>
                <button
                  onClick={() => setShowParticipantsModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <img
                        src={participant.avatar || "/placeholder.svg?height=32&width=32&query=user+avatar"}
                        alt={participant.username}
                        className="w-8 h-8 rounded-full border border-white/30"
                      />
                      <div>
                        <span className="text-white font-medium text-sm">{participant.username}</span>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <span className="text-green-400">{participant.correct_answers}✓</span>
                          <span className="text-red-400">{participant.wrong_answers}✗</span>
                          <span>({participant.total_answered} total)</span>
                          {participant.is_online && <div className="w-2 h-2 bg-green-400 rounded-full" />}
                        </div>
                      </div>
                    </div>

                    {participant.answered && (
                      <div className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">Answered</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {quizSession && (
        <div className="absolute bottom-4 left-4 glass-morphism rounded-xl p-3 max-w-xs">
          <div className="flex items-center gap-3">
            <img
              src={quizSession.creator_avatar || "/placeholder.svg?height=24&width=24&query=creator+avatar"}
              alt="Creator"
              className="w-6 h-6 rounded-full border border-white/30"
            />
            <div>
              <span className="text-white font-medium text-sm">@{quizSession.creator_username}</span>
              <div className="text-white/60 text-xs">Quiz Creator</div>
            </div>
          </div>
          {quizSession.description && (
            <p className="text-white/70 text-xs mt-2 line-clamp-2">{quizSession.description}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default RealTimeQuizPage
