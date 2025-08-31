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
  correct_answer_id?: string // Added correct answer tracking
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

export default function RealTimeQuizPage({ quiz_id }: { quiz_id: number }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [userError, setUserError] = useState<string | null>(null)

  const params = useParams<{ quiz_id: number }>()
  const quizId = params?.quiz_id || quiz_id  // Added fallback for demo purposes

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

  useEffect(() => {
    if (quizSession?.current_question) {
      const savedQuestions = JSON.parse(localStorage.getItem(`quiz_${quizId}_questions`) || "{}")
      savedQuestions[quizSession.current_question_index || 0] = quizSession.current_question
      localStorage.setItem(`quiz_${quizId}_questions`, JSON.stringify(savedQuestions))
    }
  }, [quizSession?.current_question, quizId])

  useEffect(() => {
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
  }, [quizId])

  useEffect(() => {
    if (allQuestions.length > 0) {
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
    if (quizSession?.mode === "free" && quizSession?.current_question) {
      const newHistory = { ...questionHistory }
      newHistory[currentQuestionIndex] = quizSession.current_question
      setQuestionHistory(newHistory)
      localStorage.setItem(`quiz_${quizId}_history`, JSON.stringify(newHistory))
    }
  }, [quizSession?.current_question, currentQuestionIndex, quizSession?.mode, quizId, questionHistory])

  const handleAnswerSubmit = async (answerId: number) => {
    if (hasAnswered || !quizSession?.current_question || !user) return

    setIsSubmittingAnswer(true)
    setSelectedAnswer(answerId)
    setHasAnswered(true)

    const responseTime = (Date.now() - questionStartTimeRef.current) / 1000

    sendMessage({
      action: "submit_answer",
      user_id: user.id,
      question_id: quizSession.current_question.id,
      answer_id: answerId,
      response_time: responseTime,
    })
  }

  const handleNextQuestion = useCallback(() => {
    if (quizSession?.mode === "timed") return // No manual navigation in timed mode

    if (currentQuestionIndex < allQuestions.length - 1) {
      const newIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(newIndex)
      setHasAnswered(false)
      setSelectedAnswer(null)
      setAnswerResult(null)
      setShowingResults(false)

      // Notify server about navigation
      if (isConnected && user) {
        sendMessage({
          action: "user_navigate",
          user_id: user.id,
          question_index: newIndex,
        })
      }
    }
  }, [currentQuestionIndex, allQuestions.length, quizSession?.mode, isConnected, user, sendMessage])

  const handlePreviousQuestion = useCallback(() => {
    if (quizSession?.mode === "timed") return // No manual navigation in timed mode

    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1
      setCurrentQuestionIndex(newIndex)
      setHasAnswered(false)
      setSelectedAnswer(null)
      setAnswerResult(null)
      setShowingResults(false)

      // Notify server about navigation
      if (isConnected && user) {
        sendMessage({
          action: "user_navigate",
          user_id: user.id,
          question_index: newIndex,
        })
      }
    }
  }, [currentQuestionIndex, quizSession?.mode, isConnected, user, sendMessage])

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

  const handleStartQuiz = useCallback(() => {
    if (!isConnected || !user || !quizSession || user.id !== quizSession.creator_id || isStartingQuiz) {
      return
    }

    if (startQuizTimeoutRef.current) {
      clearTimeout(startQuizTimeoutRef.current)
    }

    setIsStartingQuiz(true)

    startQuizTimeoutRef.current = setTimeout(() => {
      if (isConnected && user && quizSession && user.id === quizSession.creator_id) {
        sendMessage({
          action: "start_quiz",
          user_id: user.id,
        })
      }
    }, 300)
  }, [isConnected, user, quizSession, sendMessage, isStartingQuiz])

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

  const handleNextQuestionManual = useCallback(() => {
    if (isNavigating) return

    setIsNavigating(true)

    if (isConnected && user) {
      sendMessage({
        action: "next_question",
        user_id: user.id,
      })
    }

    setTimeout(() => {
      setIsNavigating(false)
    }, 300)
  }, [isConnected, user, sendMessage, isNavigating])

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
    const isDisabled = hasAnswered || isTimeExpired || isQuizEnded || showingResults || isSubmittingAnswer

    return (
      <div className="grid gap-4">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option.id
          const isCorrect = answerResult?.correctAnswerId === option.id
          const isWrong = isSelected && answerResult && !answerResult.isCorrect

          let buttonClass =
            "p-4 rounded-xl text-left transition-all duration-300 backdrop-blur-sm border border-white/20"

          if (showingResults) {
            if (isCorrect) {
              buttonClass += " bg-green-500/30 border-green-400 ring-2 ring-green-400"
            } else if (isWrong) {
              buttonClass += " bg-red-500/30 border-red-400 ring-2 ring-red-400"
            } else {
              buttonClass += " bg-white/10 opacity-60"
            }
          } else if (isDisabled) {
            buttonClass += " bg-white/10 cursor-not-allowed opacity-60"
          } else {
            buttonClass += " bg-white/20 hover:bg-white/30 hover:scale-[1.02] cursor-pointer"
          }

          if (isSelected && !showingResults) {
            buttonClass += " ring-2 ring-blue-400 bg-blue-500/20"
          }

          return (
            <button
              key={option.id}
              onClick={() => !isDisabled && handleAnswerSubmit(option.id)}
              disabled={isDisabled}
              className={buttonClass}
            >
              <div className="flex items-center gap-3">
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
    )
  }

  useEffect(() => {
    if (quizSession?.mode === "timed" && showingResults && canMoveToNext) {
      const timeToWait = quizSession.time_per_question * 1000 // Convert to milliseconds

      const timer = setTimeout(
        () => {
          handleNextQuestion()
        },
        Math.min(timeToWait, 5000),
      ) // Max 5 seconds wait

      setAutoAdvanceTimer(timer)

      return () => {
        if (timer) clearTimeout(timer)
      }
    }
  }, [showingResults, canMoveToNext, quizSession?.mode, quizSession?.time_per_question, handleNextQuestion])

  useEffect(() => {
    if (quizSession?.mode === "timed" && timeLeft === 0 && !hasAnswered && quizStarted && !isQuizEnded) {
      console.log("[v0] Time expired, auto-advancing to next question")
      setHasAnswered(true)

      // Auto advance after 2 seconds
      const timer = setTimeout(() => {
        if (isConnected && user) {
          sendMessage({
            action: "next_question",
            user_id: user.id,
          })
        }
      }, 2000)

      setAutoNextTimer(timer)
    }

    return () => {
      if (autoNextTimer) {
        clearTimeout(autoNextTimer)
      }
    }
  }, [timeLeft, hasAnswered, quizStarted, quizSession?.mode, isQuizEnded, isConnected, user, sendMessage])

  useEffect(() => {
    if (quizSession?.mode === "free") {
      // In free mode, users can always navigate
      setCanGoBack(currentQuestionIndex > 0)
      setCanGoNext(true) // Always allow next in free mode
    } else if (quizSession?.mode === "timed") {
      // In timed mode, no manual navigation
      setCanGoBack(false)
      setCanGoNext(false)
    }
  }, [currentQuestionIndex, quizSession?.mode])

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data)
        console.log("Received WebSocket message:", data)

        switch (data.type) {
          case "all_questions_loaded":
            setAllQuestions(data.questions)
            localStorage.setItem(`quiz_${quizId}_questions`, JSON.stringify(data.questions))
            break

          case "quiz_started":
            setQuizStarted(true)
            setQuizSession(data.quiz_session)
            if (data.all_questions) {
              setAllQuestions(data.all_questions)
              localStorage.setItem(`quiz_${quizId}_questions`, JSON.stringify(data.all_questions))
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

          case "new_question":
            console.log("[v0] New question received:", data.question)
            if (data.question && data.question.id !== quizSession?.current_question?.id) {
              setQuizSession((prev) =>
                prev
                  ? {
                      ...prev,
                      current_question: data.question,
                      current_question_index: data.question_index || prev.current_question_index + 1,
                    }
                  : null,
              )
              setHasAnswered(false)
              setSelectedAnswer(null)
              setAnswerResult(null)
              setShowingResults(false)
              setIsSubmittingAnswer(false)
              setCanMoveToNext(false)
              setQuestionLoadError(false)
              questionStartTimeRef.current = Date.now()

              setTimeout(() => {
                questionContainerRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                })
              }, 100)

              if (quizSession?.mode === "timed") {
                setTimeLeft(data.time_per_question || 15)
              }
            }
            break

          case "answer_result":
            console.log("[v0] Answer result:", data)
            if (quizSession?.current_question) {
              setUserAnswerHistory((prev) => ({
                ...prev,
                [quizSession.current_question.id]: {
                  answerId: selectedAnswer || "",
                  isCorrect: data.is_correct,
                },
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

            if (data.has_next_question) {
              if (quizSession?.mode === "free") {
                setTimeout(() => {
                  setCanMoveToNext(true)
                }, 1000)
              }
            } else if (!data.has_next_question) {
              setTimeout(() => {
                setIsQuizEnded(true)
                setQuizStarted(false)
                sendMessage({ action: "get_final_results" })
              }, 3000)
            }
            break

          case "stats_update":
            console.log("[v0] Stats update:", data.stats)
            setTotalStats({
              totalUsers: data.stats.total_participants || 0,
              totalAnswered: data.stats.total_attempts || 0,
              totalCorrect: data.stats.correct_attempts || 0,
              totalWrong: data.stats.wrong_attempts || 0,
            })
            break

          case "final_results":
            console.log("[v0] Final results:", data.results)
            setFinalResults(data.results)
            setShowResultsModal(true)
            break

          case "user_results":
            console.log("[v0] User results:", data.results)
            setUserResults(data.results)
            break

          case "quiz_restarted":
            console.log("[v0] Quiz restarted")
            // Reset all states for new quiz
            setIsQuizEnded(false)
            setQuizStarted(false)
            setHasAnswered(false)
            setSelectedAnswer(null)
            setAnswerResult(null)
            setShowingResults(false)
            setFinalResults([])
            setUserResults(null)
            setShowResultsModal(false)
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

          case "time_update":
            if (data.time_left !== undefined && quizSession?.mode === "timed") {
              setTimeLeft(data.time_left)
            }
            break

          case "error":
            console.log("[v0] Backend error:", data.message)
            setShowRefreshButton(true)
            setQuestionLoadError(true)
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
  }, [lastMessage, quizId, quizSession?.mode, quizSession, selectedAnswer])

  const handleRefresh = useCallback(() => {
    setShowRefreshButton(false)
    setQuestionLoadError(false)
    if (user && hasJoined) {
      sendMessage({
        action: "join_quiz",
        user_id: user.id,
        username: user.username,
      })
    }
  }, [user, hasJoined, sendMessage])

  useEffect(() => {
    if (user && participants.length > 0) {
      const userParticipant = participants.find((p) => p.id === user.id)
      if (userParticipant) {
        const total = userParticipant.correct_answers + userParticipant.wrong_answers
        const accuracy = total > 0 ? Math.round((userParticipant.correct_answers / total) * 100) : 0

        setUserStatsFromParticipants({
          correctAnswers: userParticipant.correct_answers,
          wrongAnswers: userParticipant.wrong_answers,
          totalAnswered: total,
          accuracy,
        })
      }
    }
  }, [user, participants])

  const userStats = {
    totalAnswered: Object.keys(userAnswerHistory).length,
    correctAnswers: Object.values(userAnswerHistory).filter((answer) => answer.isCorrect).length,
    wrongAnswers: Object.values(userAnswerHistory).filter((answer) => !answer.isCorrect).length,
    accuracy:
      Object.keys(userAnswerHistory).length > 0
        ? Math.round(
            (Object.values(userAnswerHistory).filter((answer) => answer.isCorrect).length /
              Object.keys(userAnswerHistory).length) *
              100,
          )
        : 0,
  }

  const handleShare = useCallback(() => {
    const shareData = {
      title: `${quizSession?.title} - Live Quiz`,
      text: `Join me in this live quiz: ${quizSession?.title}`,
      url: window.location.href,
    }

    if (navigator.share) {
      navigator.share(shareData)
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("Quiz link copied to clipboard!")
    }
  }, [quizSession?.title])

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

  const getUserResults = () => {
    if (!user) return

    sendMessage({
      action: "get_user_results",
      user_id: user.id,
    })
  }

  useEffect(() => {
    if (quizSession?.mode === "free") {
      const savedHistory = localStorage.getItem(`quiz_${quizId}_history`)
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory)
          setQuestionHistory(parsed)
        } catch (error) {
          console.error("Failed to parse question history:", error)
        }
      }
    }
  }, [quizId, quizSession?.mode])

  const handleCloseParticipantsModal = useCallback(() => {
    setShowParticipantsModal(false)
  }, [])

  const handleCloseResultsPanel = useCallback(() => {
    setIsResultsPanelCollapsed(true)
  }, [])

  const handleExitQuiz = useCallback(() => {
    if (confirm("Are you sure you want to exit the quiz?")) {
      window.location.href = "/dashboard" // or wherever users should go
    }
  }, [])

  const handleShareQuiz = useCallback(() => {
    const shareUrl = `${window.location.origin}/quiz/${quizId}`
    if (navigator.share) {
      navigator.share({
        title: "Join this quiz!",
        url: shareUrl,
      })
    } else {
      navigator.clipboard.writeText(shareUrl)
      alert("Quiz link copied to clipboard!")
    }
  }, [quizId])

  const handleSubmitAnswer = (answerId: number) => {
    handleAnswerSubmit(answerId)
  }

  const handleKickParticipant = useCallback(
    (participantId: number) => {
      if (!isCreator || !isConnected) return

      sendMessage({
        action: "kick_participant",
        user_id: user?.id,
        participant_id: participantId,
      })
    },
    [isCreator, isConnected, user?.id, sendMessage],
  )

  const handleRestartQuiz = useCallback(() => {
    if (!isCreator || !isConnected) return

    sendMessage({
      action: "restart_quiz",
      user_id: user?.id,
    })

    // Clear localStorage
    localStorage.removeItem(`quiz_${quizId}_questions`)
    localStorage.removeItem(`quiz_${quizId}_current_index`)
    setCurrentQuestionIndex(0)
    setAllQuestions([])
  }, [isCreator, isConnected, user?.id, sendMessage, quizId])

  const currentQuestion = allQuestions[currentQuestionIndex] || null

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
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>

      <div className="fixed top-0 left-0 right-0 z-40 liquid-glass border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Participants and stats */}
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

          {/* Center: Question progress */}
          <div className="flex items-center gap-2 text-white">
            <span className="text-sm font-medium">
              {currentQuestionIndex + 1} / {allQuestions.length}
            </span>
            {quizSession?.mode === "timed" && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full">
                <Clock size={14} />
                <span className="text-sm font-mono">{timeLeft}s</span>
              </div>
            )}
          </div>

          {/* Right: Admin controls and exit */}
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
        className={`fixed top-0 left-0 h-full w-80 z-50 liquid-glass-sidebar transform transition-transform duration-300 ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:w-64`}
      >
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-lg">Quiz Stats</h3>
            <button onClick={() => setShowSidebar(false)} className="text-white/60 hover:text-white lg:hidden">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* User Stats */}
          <div className="liquid-glass rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">Your Performance</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">{userStats.correctAnswers}</div>
                <div className="text-xs text-white/70">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-400">{userStats.wrongAnswers}</div>
                <div className="text-xs text-white/70">Wrong</div>
              </div>
              <div className="text-center col-span-2">
                <div className="text-xl font-bold text-blue-400">{userStats.accuracy}%</div>
                <div className="text-xs text-white/70">Accuracy</div>
              </div>
            </div>
          </div>

          {/* Participants List */}
          <div className="liquid-glass rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">Participants ({participants.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {participants
                .sort((a, b) => b.correct_answers - a.correct_answers)
                .map((participant, index) => (
                  <div key={participant.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-xs">#{index + 1}</span>
                      <span className="text-white text-sm font-medium">{participant.username}</span>
                      {participant.id === quizSession?.creator_id && <Crown size={12} className="text-yellow-400" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-400">{participant.correct_answers}</span>
                      <span className="text-red-400">{participant.wrong_answers}</span>
                      {isCreator && participant.id !== user?.id && (
                        <button
                          onClick={() => handleKickParticipant(participant.id)}
                          className="text-red-400 hover:text-red-300 ml-2"
                          title="Kick participant"
                        >
                          <UserX size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Share Section */}
          <div className="liquid-glass rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">Share Quiz</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={window.location.href}
                readOnly
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-xs"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  // Show toast notification
                }}
                className="liquid-glass-button px-3 py-2 rounded-lg text-white text-xs"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Exit Button */}
          <button
            onClick={() => window.history.back()}
            className="w-full liquid-glass-button rounded-lg p-3 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Exit Quiz
          </button>
        </div>
      </div>

      <div className={`transition-all duration-300 ${showSidebar ? "lg:ml-64" : "lg:ml-64"}`}>
        <div className="px-4 pt-20 pb-8 min-h-screen">
          <div className="max-w-4xl mx-auto">
            {!quizStarted && !isQuizEnded ? (
              // Waiting room
              <div className="liquid-glass rounded-2xl p-8 text-center">
                <div className="text-white text-2xl font-bold mb-4">
                  {connectionStatus === "connected" ? "Quiz Ready" : "Connecting..."}
                </div>
                <div className="text-white/70 mb-8">
                  {participants.length} participant{participants.length !== 1 ? "s" : ""} joined
                </div>
                {isCreator && (
                  <button
                    onClick={handleStartQuiz}
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
                <div className="text-white text-2xl font-bold mb-4">Quiz Completed!</div>
                <div className="text-white/70 mb-8">Thank you for participating!</div>

                <div className="flex flex-wrap gap-4 justify-center">
                  <button
                    onClick={() => setShowResultsModal(true)}
                    className="liquid-glass-button px-6 py-3 rounded-xl text-white hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                  >
                    <Trophy size={16} />
                    View Results
                  </button>

                  {isCreator && (
                    <button
                      onClick={handleRestartQuiz}
                      className="liquid-glass-button px-6 py-3 rounded-xl text-white hover:bg-green-500/20 transition-colors flex items-center gap-2"
                    >
                      <RotateCcw size={16} />
                      Restart Quiz
                    </button>
                  )}
                </div>
              </div>
            ) : currentQuestion ? (
              // Active quiz
              <div className="liquid-glass rounded-2xl p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-white text-xl md:text-2xl font-bold mb-4 text-balance">{currentQuestion.text}</h2>

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

                {/* Navigation for free mode */}
                {quizSession?.mode === "free" && (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="liquid-glass-button rounded-full px-6 py-3 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>

                    <div className="text-white/60 text-sm">Free Mode - Navigate at your own pace</div>

                    <button
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex >= allQuestions.length - 1}
                      className="liquid-glass-button rounded-full px-6 py-3 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="text-white/60 mb-4">Loading question...</div>
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              </div>
            )}
          </div>
        </div>
      </div>

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
                onClick={handleEndQuiz}
                className="w-full liquid-glass-button rounded-lg p-3 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <Square size={16} />
                End Quiz
              </button>

              <button
                onClick={handleRestartQuiz}
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

      {/* Overlay for mobile sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowSidebar(false)} />
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
                    onClick={handleRestartQuiz}
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

      {showParticipantsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="liquid-glass rounded-xl p-4 md:p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-base md:text-lg">Participants ({participants.length})</h3>
              <button
                onClick={handleCloseParticipantsModal}
                className="text-white/60 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img
                      src={participant.avatar || "/placeholder.svg?height=32&width=32&query=user avatar"}
                      alt={participant.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="text-white font-medium text-sm">{participant.username}</div>
                      <div className="text-white/60 text-xs">
                        {participant.correct_answers}✓ {participant.wrong_answers}✗
                      </div>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${participant.is_online ? "bg-green-500" : "bg-gray-500"}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
