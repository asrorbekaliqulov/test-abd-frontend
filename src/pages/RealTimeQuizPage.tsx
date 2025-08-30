"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "react-router-dom"
import { useWebSocket } from "../hooks/useWebSocket"
import { authAPI } from "../utils/api"
import { Users, Check, X, Square, Play, ChevronRight, Clock, ChevronLeft, AlertCircle } from "lucide-react"

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
  correct_answer_id?: string // Added correct answer tracking
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
  "/abstract-gradient-blue-purple.png",
  "/geometric-teal-orange.png",
  "/modern-gradient-pink-blue.png",
  "/abstract-waves-purple-green.png",
  "/digital-pattern-blue-cyan.png",
]

export default function RealTimeQuizPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [userError, setUserError] = useState<string | null>(null)

  const params = useParams<{ quiz_id: string }>()
  const quiz_id = params?.quiz_id || "demo-quiz" // Added fallback for demo purposes

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

  const [answerResult, setAnswerResult] = useState<{
    isCorrect: boolean
    correctAnswerId: string
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
  const [quizTimeLeft, setQuizTimeLeft] = useState<number>(0)

  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set())
  const [showAnsweredWarning, setShowAnsweredWarning] = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoNext, setCanGoNext] = useState(false)
  const [isResultsPanelCollapsed, setIsResultsPanelCollapsed] = useState(false)
  const [autoNextTimer, setAutoNextTimer] = useState<NodeJS.Timeout | null>(null)

  const WS_BASE_URL = "wss://backend.testabd.uz"
  const wsUrl = quiz_id ? `${WS_BASE_URL}/ws/quiz/${quiz_id}/` : null

  const { isConnected, sendMessage, lastMessage, error } = useWebSocket(wsUrl)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isNavigating, setIsNavigating] = useState(false)

  const isCreator = user && quizSession && user.id === quizSession.creator_id

  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null)

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

  const handleSubmitAnswer = useCallback(
    (answerId: string) => {
      if (hasAnswered || !quizSession?.current_question || !user || isSubmittingAnswer) return

      console.log("[v0] Submitting answer:", answerId)
      setSelectedAnswer(answerId)
      setHasAnswered(true)
      setIsSubmittingAnswer(true)

      setAnsweredQuestions((prev) => new Set([...prev, quizSession.current_question!.id]))

      if (isConnected) {
        sendMessage({
          action: "submit_answer",
          question_id: quizSession.current_question.id,
          answer_id: answerId,
          user_id: user.id,
          response_time: quizSession?.mode === "timed" ? quizSession.time_per_question - timeLeft : 0,
        })
      } else {
        console.error("[v0] Cannot submit answer - WebSocket not connected")
        setHasAnswered(false)
        setIsSubmittingAnswer(false)
      }
    },
    [hasAnswered, quizSession, user, isConnected, sendMessage, isSubmittingAnswer, timeLeft],
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

  const handleNextQuestion = useCallback(() => {
    if (!isConnected || !user) return

    console.log("[v0] Requesting next question")
    setCanMoveToNext(false)
    setShowingResults(false)
    setCanGoNext(false)

    sendMessage({
      action: "next_question",
      user_id: user.id,
    })
  }, [isConnected, user, sendMessage])

  const handlePreviousQuestion = useCallback(() => {
    if (isNavigating || currentQuestionIndex <= 0) return

    const currentQuestionId = quizSession?.current_question?.id

    if (currentQuestionId && answeredQuestions.has(currentQuestionId)) {
      setShowAnsweredWarning(true)
      setTimeout(() => setShowAnsweredWarning(false), 3000)
      return
    }

    setIsNavigating(true)
    setCurrentQuestionIndex((prev) => prev - 1)

    setTimeout(() => {
      setIsNavigating(false)
    }, 300)
  }, [currentQuestionIndex, isNavigating, quizSession?.current_question?.id, answeredQuestions])

  useEffect(() => {
    return () => {
      if (startQuizTimeoutRef.current) {
        clearTimeout(startQuizTimeoutRef.current)
      }
    }
  }, [])

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
              onClick={() => !isDisabled && handleSubmitAnswer(option.id)}
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
    setCanGoBack(currentQuestionIndex > 0)
    setCanGoNext(hasAnswered || (quizSession?.mode === "timed" && timeLeft === 0))
  }, [currentQuestionIndex, hasAnswered, quizSession?.mode, timeLeft])

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage)
        console.log("[v0] Received WebSocket message:", data)

        switch (data.type) {
          case "quiz_state":
            console.log("[v0] Setting quiz session:", data.quiz_session)
            setQuizSession(data.quiz_session)
            if (data.quiz_session?.end_time) {
              setQuizEndTime(new Date(data.quiz_session.end_time))
            }
            if (data.quiz_session?.is_active) {
              setQuizStarted(true)
              questionStartTimeRef.current = Date.now()
            }
            if (data.participants) {
              setParticipants(data.participants)
            }
            setIsStartingQuiz(false)
            setIsEndingQuiz(false)
            break

          case "quiz_started":
            console.log("[v0] Quiz started:", data)
            setQuizStarted(true)
            setIsStartingQuiz(false)
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
              setAnswerResult(null)
              setShowingResults(false)
              setIsSubmittingAnswer(false)
              setCanMoveToNext(false)
              questionStartTimeRef.current = Date.now()

              setTimeout(() => {
                questionContainerRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                })
              }, 100)

              if (data.mode === "timed" || data.quiz_session?.mode === "timed") {
                setTimeLeft(data.quiz_session?.time_per_question || 15)
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
            break

          case "answer_result":
            console.log("[v0] Answer result:", data)
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
              // For timed mode, auto-advance will be handled by useEffect
              // For free mode, user can manually proceed
              if (quizSession?.mode === "free") {
                // Show next button for 3 seconds, then allow manual advance
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
            console.error("[v0] Backend error:", data.message)
            setIsStartingQuiz(false)
            setIsEndingQuiz(false)
            setIsSubmittingAnswer(false)
            break

          default:
            console.log("[v0] Unknown message type:", data.type)
        }
      } catch (err) {
        console.error("[v0] Error parsing WebSocket message:", err)
      }
    }
  }, [lastMessage, quizSession, user, sendMessage])

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

  const handleAnswerSubmit = async (answerId: string) => {
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

  const handleRestartQuiz = () => {
    if (!user || !isCreator) return

    sendMessage({
      action: "restart_quiz",
      user_id: user.id,
    })
  }

  const getUserResults = () => {
    if (!user) return

    sendMessage({
      action: "get_user_results",
      user_id: user.id,
    })
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading user data...</div>
      </div>
    )
  }

  if (userError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400">Error: {userError}</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Please log in to access this quiz</div>
      </div>
    )
  }

  const currentQuestion = quizSession?.current_question

  const renderQuestionOptions = (question: any) => {
    if (!question) return null

    const isTimeExpired = quizSession?.mode === "timed" && timeLeft === 0
    const isDisabled = hasAnswered || isTimeExpired || isQuizEnded || showingResults || isSubmittingAnswer

    return (
      <div className="grid gap-3 md:gap-4">
        {question.options.map((option: any, index: number) => {
          const isSelected = selectedAnswer === option.id
          const isCorrect = answerResult?.correctAnswerId === option.id
          const isWrong = isSelected && answerResult && !answerResult.isCorrect

          let buttonClass =
            "p-3 md:p-4 rounded-xl text-left transition-all duration-300 backdrop-blur-sm border border-white/20 relative overflow-hidden"

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
            buttonClass += " bg-white/20 cursor-pointer active:scale-[0.98]"
          }

          if (isSelected && !showingResults) {
            buttonClass += " ring-2 ring-blue-400 bg-blue-500/20"
          }

          return (
            <button
              key={option.id}
              onClick={() => !isDisabled && handleSubmitAnswer(option.id)}
              disabled={isDisabled}
              className={buttonClass}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base ${
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
                      <Check className="w-3 h-3 md:w-4 md:h-4" />
                    ) : isWrong ? (
                      <X className="w-3 h-3 md:w-4 md:h-4" />
                    ) : (
                      String.fromCharCode(65 + index)
                    )
                  ) : (
                    String.fromCharCode(65 + index)
                  )}
                </div>
                <span className="text-white font-medium text-sm md:text-base">{option.text}</span>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-black relative overflow-x-hidden">
      <style>{`
        .glass-morphism {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .liquid-glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border-radius: 16px;
        }
        
        .liquid-glass-button {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }
        
        .liquid-glass-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Enhanced responsive design */
        @media (max-width: 1024px) {
          .desktop-sidebar {
            display: none;
          }
        }
        
        @media (max-width: 768px) {
          .mobile-layout {
            padding: 0.75rem;
          }
          
          .mobile-question-card {
            margin-top: 5rem;
            margin-bottom: 8rem;
          }
          
          .mobile-controls {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 50;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(20px);
            padding: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .mobile-stats-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 40;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(20px);
            padding: 0.75rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
        }
        
        @media (max-width: 640px) {
          .question-options {
            gap: 0.5rem;
          }
          
          .option-button {
            padding: 0.75rem;
            font-size: 0.875rem;
          }
        }
        
        /* Warning notification styles */
        .warning-notification {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 100;
          background: rgba(239, 68, 68, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(239, 68, 68, 0.5);
          border-radius: 12px;
          padding: 1rem 1.5rem;
          color: white;
          font-weight: 600;
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -60%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>

      {showAnsweredWarning && (
        <div className="warning-notification">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <span>Siz allaqachon javob bergansiz! Faqat bir marta javob bera olasiz.</span>
          </div>
        </div>
      )}

      {/* Background Image */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      <div className="mobile-stats-header md:fixed md:top-4 md:left-4 md:right-4 md:z-40 md:bg-transparent md:backdrop-filter-none md:border-none md:p-0">
        <div className="flex justify-between items-center md:justify-start md:gap-4">
          <div className="liquid-glass rounded-xl px-3 py-2 text-white text-sm">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Users size={14} />
                {totalStats.totalUsers}
              </span>
              <span className="text-green-400 flex items-center gap-1">
                <Check size={14} />
                {totalStats.totalCorrect}
              </span>
              <span className="text-red-400 flex items-center gap-1">
                <X size={14} />
                {totalStats.totalWrong}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {quizEndTime && (
              <div className="liquid-glass rounded-xl px-3 py-2 text-white text-sm flex items-center gap-1">
                <Clock size={14} />
                {timeUntilEnd}
              </div>
            )}

            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="liquid-glass rounded-full p-2 text-white hover:bg-white/20 transition-colors md:hidden"
            >
              📊
            </button>
          </div>
        </div>
      </div>

      <div className="desktop-sidebar fixed top-20 right-4 bottom-4 w-80 liquid-glass rounded-xl p-4 z-40 overflow-y-auto scrollbar-hide hidden lg:block">
        <div className="text-white">
          <h3 className="text-lg font-bold mb-4">Quiz Statistics</h3>

          {/* User's own stats */}
          {user && (
            <div className="mb-6 p-3 bg-blue-500/20 rounded-lg">
              <h4 className="font-semibold mb-2">Your Results</h4>
              <div className="space-y-1 text-sm">
                {userResults ? (
                  <>
                    <div>
                      Rank: #{userResults.rank} of {userResults.total_participants}
                    </div>
                    <div>Score: {userResults.score} points</div>
                    <div className="text-green-400">Correct: {userResults.correct}</div>
                    <div className="text-red-400">Wrong: {userResults.wrong}</div>
                    <div>Avg Time: {userResults.avg_time}s</div>
                  </>
                ) : (
                  <>
                    <div className="text-green-400">
                      Correct: {participants.find((p) => p.username === user.username)?.correct_answers || 0}
                    </div>
                    <div className="text-red-400">
                      Wrong: {participants.find((p) => p.username === user.username)?.wrong_answers || 0}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* All participants stats */}
          <div className="space-y-2">
            <h4 className="font-semibold">All Participants ({participants.length})</h4>
            {participants.map((participant, index) => (
              <div key={participant.id} className="flex justify-between items-center p-2 bg-white/10 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{participant.username}</span>
                  {participant.username === user?.username && (
                    <span className="text-xs bg-blue-500/30 px-1 rounded">You</span>
                  )}
                </div>
                <div className="text-xs text-gray-300 flex items-center gap-2">
                  <span className="text-green-400">{participant.correct_answers}✓</span>
                  <span className="text-red-400">{participant.wrong_answers}✗</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`mobile-sidebar ${showSidebar ? "show" : ""} lg:hidden`}>
        <div className="liquid-glass rounded-l-xl p-4 h-full overflow-y-auto scrollbar-hide">
          <div className="text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Statistics</h3>
              <button
                onClick={() => setShowSidebar(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* User's own stats */}
            {user && (
              <div className="mb-4 p-3 bg-blue-500/20 rounded-lg">
                <h4 className="font-semibold mb-2 text-sm">Your Results</h4>
                <div className="space-y-1 text-xs">
                  {userResults ? (
                    <>
                      <div>
                        Rank: #{userResults.rank}/{userResults.total_participants}
                      </div>
                      <div>Score: {userResults.score} pts</div>
                      <div className="text-green-400">Correct: {userResults.correct}</div>
                      <div className="text-red-400">Wrong: {userResults.wrong}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-green-400">
                        Correct: {participants.find((p) => p.username === user.username)?.correct_answers || 0}
                      </div>
                      <div className="text-red-400">
                        Wrong: {participants.find((p) => p.username === user.username)?.wrong_answers || 0}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* All participants */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Participants ({participants.length})</h4>
              {participants.map((participant) => (
                <div key={participant.id} className="flex justify-between items-center p-2 bg-white/10 rounded text-xs">
                  <div className="flex items-center gap-1">
                    <span>{participant.username}</span>
                    {participant.username === user?.username && (
                      <span className="bg-blue-500/30 px-1 rounded text-[10px]">You</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-green-400">{participant.correct_answers}✓</span>
                    <span className="text-red-400">{participant.wrong_answers}✗</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowSidebar(false)} />
      )}

      {/* Main content */}
      <div className="mobile-layout px-4 md:px-6 pt-16 md:pt-24 pb-20 md:pb-20 lg:pr-96">
        <div
          ref={questionContainerRef}
          className="mobile-question-card glass-morphism rounded-xl p-4 md:p-6 shadow-lg max-w-4xl mx-auto lg:max-w-none"
        >
          {!quizStarted && !isQuizEnded ? (
            <div className="text-center py-6 md:py-8">
              <div className="text-white text-lg md:text-xl font-bold mb-4">
                {connectionStatus === "connected" ? "Quiz Ready" : "Connecting..."}
              </div>
              <div className="text-white/70 mb-6">
                {participants.length} participant{participants.length !== 1 ? "s" : ""} joined
              </div>
              {isCreator && (
                <button
                  onClick={handleStartQuiz}
                  disabled={isStartingQuiz || connectionStatus !== "connected"}
                  className="liquid-glass rounded-full px-6 md:px-8 py-3 text-white font-bold hover:bg-white/20 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto text-sm md:text-base"
                >
                  {isStartingQuiz ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Start Quiz
                    </>
                  )}
                </button>
              )}
            </div>
          ) : isQuizEnded ? (
            <div className="text-center py-6 md:py-8">
              <div className="text-white text-lg md:text-xl font-bold mb-4">Quiz Ended</div>
              <div className="text-white/70 mb-6">Thank you for participating!</div>

              {isCreator && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button
                    onClick={() => {
                      setShowResultsModal(true)
                      if (user) getUserResults()
                    }}
                    className="liquid-glass text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-colors"
                  >
                    📊 View Results
                  </button>
                  <button
                    onClick={handleRestartQuiz}
                    className="liquid-glass text-white px-6 py-3 rounded-xl hover:bg-blue-500/20 transition-colors"
                  >
                    🔄 Restart Quiz
                  </button>
                </div>
              )}
            </div>
          ) : currentQuestion ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-base md:text-lg font-bold text-white bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Question {quizSession?.current_question_index + 1 || 1} of {quizSession?.total_questions || "?"}
                </div>
                {quizSession?.mode === "timed" && timeLeft > 0 && !hasAnswered && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full border border-red-500/30">
                    <Clock size={14} />
                    <span className="text-white font-mono text-sm">{timeLeft}s</span>
                  </div>
                )}
                {!hasAnswered && quizSession?.mode === "free" && (
                  <div className="flex items-center gap-2 px-2 md:px-3 py-1 bg-black/30 rounded-full border border-white/20">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-white/80 text-xs md:text-sm">Live</span>
                  </div>
                )}
              </div>

              <div className="text-white text-base md:text-lg mb-6 leading-relaxed">{currentQuestion.text}</div>

              {currentQuestion.image && (
                <div className="mb-6">
                  <img
                    src={currentQuestion.image || "/placeholder.svg"}
                    alt="Question"
                    className="w-full max-h-48 md:max-h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="question-options grid gap-3 md:gap-4">
                {currentQuestion.options?.map((option, index) => {
                  const isSelected = selectedAnswer === option.id
                  const isCorrect = answerResult?.correctAnswerId === option.id
                  const isWrong = isSelected && answerResult && !answerResult.isCorrect

                  let buttonClass =
                    "option-button p-3 md:p-4 rounded-xl text-left transition-all duration-300 backdrop-blur-sm border border-white/20 w-full"

                  if (showingResults) {
                    if (isCorrect) {
                      buttonClass += " bg-green-500/30 border-green-400 ring-2 ring-green-400"
                    } else if (isWrong) {
                      buttonClass += " bg-red-500/30 border-red-400 ring-2 ring-red-400"
                    } else {
                      buttonClass += " bg-white/10 opacity-60"
                    }
                  } else if (hasAnswered || isSubmittingAnswer || (quizSession?.mode === "timed" && timeLeft === 0)) {
                    buttonClass += " bg-white/10 cursor-not-allowed opacity-60"
                  } else {
                    buttonClass +=
                      " bg-white/20 hover:bg-white/30 hover:scale-[1.02] cursor-pointer active:scale-[0.98]"
                  }

                  if (isSelected && !showingResults) {
                    buttonClass += " ring-2 ring-blue-400 bg-blue-500/20"
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() =>
                        !hasAnswered &&
                        !isSubmittingAnswer &&
                        !(quizSession?.mode === "timed" && timeLeft === 0) &&
                        handleSubmitAnswer(option.id)
                      }
                      disabled={hasAnswered || isSubmittingAnswer || (quizSession?.mode === "timed" && timeLeft === 0)}
                      className={buttonClass}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base ${
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
                              <Check className="w-3 h-3 md:w-4 md:h-4" />
                            ) : isWrong ? (
                              <X className="w-3 h-3 md:w-4 md:h-4" />
                            ) : (
                              String.fromCharCode(65 + index)
                            )
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
                        </div>
                        <span className="text-white font-medium text-sm md:text-base">{option.text}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 md:py-8">
              <div className="text-white/60">Loading question...</div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden mobile-layout">
        {/* Mobile header with stats */}
        <div className="mobile-stats-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-white font-bold text-lg">
                {currentQuestionIndex + 1}/{quizSession?.total_questions || 0}
              </div>
              {quizSession?.mode === "timed" && (
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-white" />
                  <span className="text-white font-mono">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsResultsPanelCollapsed(!isResultsPanelCollapsed)}
              className="liquid-glass-button rounded-full p-2 text-white"
            >
              <Users size={16} />
            </button>
          </div>
        </div>

        {/* Mobile question content */}
        <div className="mobile-question-card">
          {currentQuestion && (
            <div className="liquid-glass rounded-2xl p-4 md:p-6 mb-6">
              <h2 className="text-white text-lg md:text-xl font-bold mb-4 text-balance">{currentQuestion.text}</h2>
              {renderQuestionOptions(currentQuestion)}
            </div>
          )}
        </div>

        <div className="mobile-controls">
          <div className="flex items-center justify-between gap-4">
            {/* Back button */}
            <button
              onClick={handlePreviousQuestion}
              disabled={!canGoBack}
              className={`liquid-glass-button rounded-full px-4 py-2 text-white flex items-center gap-2 ${
                !canGoBack ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <ChevronLeft size={16} />
              <span className="text-sm">Orqaga</span>
            </button>

            {/* Center info */}
            <div className="flex items-center gap-2 text-white text-sm">
              <span>
                {currentQuestionIndex + 1} / {quizSession?.total_questions || 0}
              </span>
            </div>

            {/* Next button */}
            <button
              onClick={handleNextQuestion}
              disabled={!canGoNext}
              className={`liquid-glass-button rounded-full px-4 py-2 text-white flex items-center gap-2 ${
                !canGoNext ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <span className="text-sm">Keyingi</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {isCreator && (quizStarted || isQuizEnded) && (
            <div className="mt-3 flex justify-center">
              <button
                onClick={handleEndQuiz}
                disabled={isEndingQuiz}
                className="liquid-glass-button rounded-full px-6 py-2 text-white font-bold hover:bg-red-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isEndingQuiz ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Tugatilmoqda...
                  </>
                ) : (
                  <>
                    <Square size={16} />
                    Testni Tugatish
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block">
        {/* Main content area */}
        <div className={`transition-all duration-300 ${isResultsPanelCollapsed ? "mr-0" : "mr-80"}`}>
          <div className="flex items-center justify-center min-h-screen p-6">
            {currentQuestion && (
              <div className="liquid-glass rounded-3xl p-8 max-w-4xl w-full">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-white/60 text-sm">
                      Savol {currentQuestionIndex + 1} / {quizSession?.total_questions || 0}
                    </div>
                    {quizSession?.mode === "timed" && (
                      <div className="flex items-center gap-2 liquid-glass rounded-full px-4 py-2">
                        <Clock size={16} className="text-white" />
                        <span className="text-white font-mono text-lg">
                          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                        </span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-white text-2xl md:text-3xl font-bold mb-8 text-balance">
                    {currentQuestion.text}
                  </h2>
                </div>
                {renderQuestionOptions(currentQuestion)}
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-6 left-6 flex items-center gap-4 z-10">
          {/* Back button */}
          <button
            onClick={handlePreviousQuestion}
            disabled={!canGoBack}
            className={`liquid-glass-button rounded-full px-6 py-3 text-white flex items-center gap-2 ${
              !canGoBack ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <ChevronLeft size={18} />
            <span>Orqaga</span>
          </button>

          {/* Next button */}
          <button
            onClick={handleNextQuestion}
            disabled={!canGoNext}
            className={`liquid-glass-button rounded-full px-6 py-3 text-white flex items-center gap-2 ${
              !canGoNext ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <span>Keyingi Savol</span>
            <ChevronRight size={18} />
          </button>

          {isCreator && (quizStarted || isQuizEnded) && (
            <button
              onClick={handleEndQuiz}
              disabled={isEndingQuiz}
              className="liquid-glass-button rounded-full px-6 py-3 text-white font-bold hover:bg-red-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isEndingQuiz ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Tugatilmoqda...
                </>
              ) : (
                <>
                  <Square size={16} />
                  Testni Tugatish
                </>
              )}
            </button>
          )}
        </div>

        <div
          className={`fixed top-0 right-0 h-full w-80 bg-black/50 backdrop-blur-xl border-l border-white/10 transition-transform duration-300 z-30 ${
            isResultsPanelCollapsed ? "translate-x-full" : "translate-x-0"
          }`}
        >
          {/* Panel header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-bold">Natijalar</h3>
            <button
              onClick={() => setIsResultsPanelCollapsed(true)}
              className="liquid-glass-button rounded-full p-2 text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Results content */}
          <div className="p-4 overflow-y-auto h-full scrollbar-hide">{/* Existing results content */}</div>
        </div>

        {/* Toggle button for collapsed panel */}
        {isResultsPanelCollapsed && (
          <button
            onClick={() => setIsResultsPanelCollapsed(false)}
            className="fixed top-4 right-4 liquid-glass-button rounded-full p-3 text-white z-40"
          >
            <Users size={18} />
          </button>
        )}
      </div>

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

      {/* Participants Modal */}
      {showParticipantsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-morphism rounded-xl p-4 md:p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-base md:text-lg">Participants ({participants.length})</h3>
              <button
                onClick={() => setShowParticipantsModal(false)}
                className="text-white/60 hover:text-white transition-colors"
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
