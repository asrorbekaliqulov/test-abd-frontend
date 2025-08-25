"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "react-router-dom"
import { useWebSocket } from "../hooks/useWebSocket"
import { authAPI } from "../utils/api"
import { Users, Check, X, LogOut, Square, Share, Play, ChevronUp, ChevronDown } from "lucide-react"

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

  const WS_BASE_URL = "wss://backend.testabd.uz"
  const wsUrl = quiz_id ? `${WS_BASE_URL}/ws/quiz/${quiz_id}/` : null

  const { isConnected, sendMessage, lastMessage, error } = useWebSocket(wsUrl)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isNavigating, setIsNavigating] = useState(false)

  const isCreator = user && quizSession && user.id === quizSession.creator_id

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
    if (!isConnected || !user || !canMoveToNext) return

    console.log("[v0] Requesting next question")
    setCanMoveToNext(false)
    setShowingResults(false)

    sendMessage({
      action: "next_question",
      user_id: user.id,
    })
  }, [isConnected, user, canMoveToNext, sendMessage])

  useEffect(() => {
    return () => {
      if (startQuizTimeoutRef.current) {
        clearTimeout(startQuizTimeoutRef.current)
      }
    }
  }, [])

  const handlePreviousQuestion = useCallback(() => {
    if (isNavigating || currentQuestionIndex <= 0) return

    setIsNavigating(true)
    setCurrentQuestionIndex((prev) => prev - 1)

    setTimeout(() => {
      setIsNavigating(false)
    }, 300)
  }, [currentQuestionIndex, isNavigating])

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

            if (data.has_next_question && isCreator) {
              setTimeout(() => {
                handleNextQuestion()
              }, 3000)
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
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Enhanced responsive design */
        @media (max-width: 768px) {
          .mobile-layout {
            padding: 1rem;
          }
          
          .mobile-question-card {
            margin-top: 6rem;
            margin-bottom: 8rem;
          }
          
          .mobile-controls {
            position: fixed;
            bottom: 1rem;
            left: 1rem;
            right: 1rem;
            z-index: 50;
          }
          
          .mobile-stats {
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 40;
          }
        }
        
        @media (max-width: 640px) {
          .mobile-sidebar {
            bottom: 22vh;
          }
          
          .question-options {
            gap: 0.75rem;
          }
          
          .option-button {
            padding: 0.75rem;
            font-size: 0.875rem;
          }
        }
      `}</style>

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

      <div className="fixed top-4 left-4 right-4 z-40 flex justify-between items-center">
        <div className="liquid-glass rounded-xl px-4 py-2 text-white text-sm">
          <div className="flex items-center gap-4">
            <span>👥 {totalStats.totalUsers}</span>
            <span className="text-green-400">✓ {totalStats.totalCorrect}</span>
            <span className="text-red-400">✗ {totalStats.totalWrong}</span>
          </div>
        </div>

        {quizEndTime && <div className="liquid-glass rounded-xl px-4 py-2 text-white text-sm">⏰ {timeUntilEnd}</div>}
      </div>

      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="fixed top-20 right-4 z-50 liquid-glass rounded-full p-3 text-white hover:bg-white/20 transition-colors"
      >
        📊
      </button>

      {showSidebar && (
        <div className="fixed top-32 right-4 bottom-4 w-80 max-w-[90vw] liquid-glass rounded-xl p-4 z-40 overflow-y-auto scrollbar-hide">
          <div className="text-white">
            <h3 className="text-lg font-bold mb-4">Quiz Statistics</h3>

            {/* User's own stats */}
            {userResults && (
              <div className="mb-6 p-3 bg-blue-500/20 rounded-lg">
                <h4 className="font-semibold mb-2">Your Results</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    Rank: #{userResults.rank} of {userResults.total_participants}
                  </div>
                  <div>Score: {userResults.score} points</div>
                  <div className="text-green-400">Correct: {userResults.correct}</div>
                  <div className="text-red-400">Wrong: {userResults.wrong}</div>
                  <div>Avg Time: {userResults.avg_time}s</div>
                </div>
              </div>
            )}

            {/* Participants list */}
            <div className="space-y-2">
              <h4 className="font-semibold">Participants ({participants.length})</h4>
              {participants.map((participant, index) => (
                <div key={participant.id} className="flex justify-between items-center p-2 bg-white/10 rounded">
                  <span className="text-sm">{participant.username}</span>
                  <div className="text-xs text-gray-300">{participant.score || 0} pts</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {isQuizEnded && !showResultsModal && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40">
          <button
            onClick={() => {
              setShowResultsModal(true)
              if (user) getUserResults()
            }}
            className="liquid-glass text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-colors"
          >
            📊 View Results
          </button>
        </div>
      )}

      {/* Rest of existing UI components... */}
      <div className="px-4 md:px-6 pt-24 md:pt-32 pb-32 md:pb-20">
        <div ref={questionContainerRef} className="glass-morphism rounded-xl p-4 md:p-6 shadow-lg max-w-4xl mx-auto">
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
              <div className="text-white/70">Thank you for participating!</div>
            </div>
          ) : currentQuestion ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-base md:text-lg font-bold text-white bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Question
                </div>
                {!hasAnswered && (
                  <div className="flex items-center gap-2 px-2 md:px-3 py-1 bg-black/30 rounded-full border border-white/20">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
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
                  } else if (hasAnswered || isSubmittingAnswer) {
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
                      onClick={() => !hasAnswered && !isSubmittingAnswer && handleAnswerSubmit(option.id)}
                      disabled={hasAnswered || isSubmittingAnswer}
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

              {isCreator && (
                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex <= 0 || isNavigating}
                    className="liquid-glass rounded-full p-2 md:p-3 text-white hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp size={16} className="md:w-5 md:h-5" />
                  </button>

                  <div className="text-white/60 text-xs md:text-sm text-center">
                    {hasAnswered ? "Answered" : "Select an answer"}
                  </div>

                  <button
                    onClick={handleNextQuestionManual}
                    disabled={isNavigating || !canMoveToNext}
                    className="liquid-glass rounded-full p-2 md:p-3 text-white hover:bg-white/20 transition-all disabled:opacity-50"
                  >
                    <ChevronDown size={16} className="md:w-5 md:h-5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 md:py-8">
              <div className="text-white/60">Loading question...</div>
            </div>
          )}
        </div>
      </div>

      {quizSession?.creator_username && (
        <div className="absolute bottom-20 md:bottom-20 left-4 md:left-6 z-10 hidden md:block">
          <div className="glass-morphism rounded-xl p-3 max-w-xs">
            <div className="flex items-center space-x-3">
              <img
                src={quizSession.creator_avatar || "/placeholder.svg?height=40&width=40&query=user avatar"}
                alt="Creator"
                className="w-8 h-8 rounded-full border border-white/30"
              />
              <div>
                <span className="text-white font-medium text-sm">@{quizSession.creator_username}</span>
                <div className="text-white/60 text-xs">Quiz Creator</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mobile-stats md:absolute md:right-6 md:bottom-32 flex md:flex-col items-center gap-3 md:gap-4 z-10">
        <div className="flex md:flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <button className="w-12 h-12 md:w-14 md:h-14 rounded-full glass-morphism flex items-center justify-center">
              <div className="w-6 h-6 md:w-7 md:h-7 bg-green-500 rounded-full flex items-center justify-center">
                <Check size={12} className="text-white md:w-4 md:h-4" />
              </div>
            </button>
            <span className="text-xs font-medium text-white text-center">{totalStats.totalCorrect}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button className="w-12 h-12 md:w-14 md:h-14 rounded-full glass-morphism flex items-center justify-center">
              <div className="w-6 h-6 md:w-7 md:h-7 bg-red-500 rounded-full flex items-center justify-center">
                <X size={12} className="text-white md:w-4 md:h-4" />
              </div>
            </button>
            <span className="text-xs font-medium text-white text-center">{totalStats.totalWrong}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setShowParticipantsModal(true)}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full glass-morphism flex items-center justify-center text-white hover:bg-white/20 transition-all"
            >
              <Users size={14} className="md:w-[18px] md:h-[18px]" />
            </button>
            <span className="text-xs font-medium text-white text-center">{participants.length}</span>
          </div>
        </div>
      </div>

      <div className="mobile-controls md:absolute md:bottom-6 md:right-6 flex justify-center md:flex-col items-center gap-3 z-10">
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: quizSession?.title || "Live Quiz",
                text: "Join this live quiz!",
                url: window.location.href,
              })
            }
          }}
          className="liquid-glass rounded-full p-3 text-white hover:bg-white/20 transition-all"
        >
          <Share size={16} className="md:w-[18px] md:h-[18px]" />
        </button>

        <button
          onClick={handleLeaveQuiz}
          className="liquid-glass rounded-full p-3 text-white hover:bg-red-500/20 transition-all"
        >
          <LogOut size={16} className="md:w-[18px] md:h-[18px]" />
        </button>
      </div>

      {isCreator && quizStarted && !isQuizEnded && (
        <div className="absolute bottom-6 left-4 md:left-6 z-10">
          <button
            onClick={handleEndQuiz}
            disabled={isEndingQuiz}
            className="liquid-glass rounded-full px-4 md:px-6 py-2 md:py-3 text-white font-bold hover:bg-red-500/20 transition-all disabled:opacity-50 flex items-center gap-2 text-sm md:text-base"
          >
            {isEndingQuiz ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Ending...
              </>
            ) : (
              <>
                <Square size={14} className="md:w-4 md:h-4" />
                End Quiz
              </>
            )}
          </button>
        </div>
      )}

      {showParticipantsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-morphism rounded-xl p-4 md:p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-base md:text-lg">Participants ({participants.length})</h3>
              <button
                onClick={() => setShowParticipantsModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={18} className="md:w-5 md:h-5" />
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

export default RealTimeQuizPage
