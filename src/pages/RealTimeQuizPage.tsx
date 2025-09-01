// RealTimeQuizPage.tsx (Fixed with responsive design, collapsible sidebar, localStorage handling, free mode navigation, admin controls)
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
  const quizId = params?.quiz_id || quiz_id

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
  const accessToken = localStorage.getItem('access_token') // Assume token is stored
  const wsUrl = quizId ? `${WS_BASE_URL}/ws/quiz/${quizId}/?token=${accessToken}` : null

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
    const loadSavedData = () => {
      const savedQuestions = localStorage.getItem(`quiz_${quizId}_questions`)
      const savedIndex = localStorage.getItem(`quiz_${quizId}_current_index`)
      const savedHistory = localStorage.getItem(`quiz_${quizId}_answer_history`)

      if (savedQuestions) {
        setAllQuestions(JSON.parse(savedQuestions))
      }
      if (savedIndex) {
        setCurrentQuestionIndex(parseInt(savedIndex, 10))
      }
      if (savedHistory) {
        setUserAnswerHistory(JSON.parse(savedHistory))
      }
    }

    loadSavedData()
  }, [quizId])

  useEffect(() => {
    localStorage.setItem(`quiz_${quizId}_questions`, JSON.stringify(allQuestions))
  }, [allQuestions, quizId])

  useEffect(() => {
    localStorage.setItem(`quiz_${quizId}_current_index`, currentQuestionIndex.toString())
  }, [currentQuestionIndex, quizId])

  useEffect(() => {
    localStorage.setItem(`quiz_${quizId}_answer_history`, JSON.stringify(userAnswerHistory))
  }, [userAnswerHistory, quizId])

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setUserLoading(true)
        const userData = await authAPI.getCurrentUser()
        setUser(userData)
        setUserError(null)
      } catch (err) {
        console.error("Failed to load user data:", err)
        setUserError(err instanceof Error ? err.message : "Failed to load user data")
      } finally {
        setUserLoading(false)
      }
    }

    loadUserData()
  }, [])

  useEffect(() => {
    if (error) {
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

  const handleNextQuestion = useCallback(() => {
    if (quizSession?.mode === "timed") return

    if (currentQuestionIndex < allQuestions.length - 1) {
      const newIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(newIndex)
      setHasAnswered(false)
      setSelectedAnswer(null)
      setAnswerResult(null)
      setShowingResults(false)

      if (isConnected && user) {
        sendMessage({
          action: "user_navigate",
          user_id: user.id,
          question_index: newIndex,
        })
      }
    } else {
      // End quiz if no more questions
      handleEndQuiz()
    }
  }, [currentQuestionIndex, allQuestions.length, quizSession?.mode, isConnected, user, sendMessage])

  const handlePreviousQuestion = useCallback(() => {
    if (quizSession?.mode === "timed") return

    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1
      setCurrentQuestionIndex(newIndex)
      setHasAnswered(false)
      setSelectedAnswer(null)
      setAnswerResult(null)
      setShowingResults(false)

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
    window.history.back()
  }, [isConnected, user, sendMessage])

  const handleStartQuiz = useCallback(() => {
    if (!isConnected || !user || !quizSession || user.id !== quizSession.creator_id || isStartingQuiz) return

    setIsStartingQuiz(true)
    sendMessage({
      action: "start_quiz",
      user_id: user.id,
    })
  }, [isConnected, user, quizSession, isStartingQuiz, sendMessage])

  const handleEndQuiz = useCallback(() => {
    if (!isConnected || !user || !quizSession || user.id !== quizSession.creator_id || isEndingQuiz) return

    if (window.confirm("Are you sure you want to end this quiz for all participants?")) {
      setIsEndingQuiz(true)
      sendMessage({
        action: "end_quiz",
        user_id: user.id,
      })
    }
  }, [isConnected, user, quizSession, isEndingQuiz, sendMessage])

  const handleNextQuestionManual = useCallback(() => {
    if (isNavigating) return

    setIsNavigating(true)

    if (isConnected && user) {
      sendMessage({
        action: "next_question",
        user_id: user.id,
      })
    }

    setTimeout(() => setIsNavigating(false), 300)
  }, [isConnected, user, sendMessage, isNavigating])

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

  const handleKickParticipant = useCallback((participantId: number) => {
    if (!isCreator || !isConnected) return

    sendMessage({
      action: "kick_participant",
      admin_id: user?.id,
      user_id: participantId,
    })
  }, [isCreator, isConnected, user?.id, sendMessage])

  const handleRestartQuiz = useCallback(() => {
    if (!isCreator || !isConnected) return

    sendMessage({
      action: "restart_quiz",
      user_id: user?.id,
    })

    localStorage.removeItem(`quiz_${quizId}_questions`)
    localStorage.removeItem(`quiz_${quizId}_current_index`)
    localStorage.removeItem(`quiz_${quizId}_answer_history`)
    setCurrentQuestionIndex(0)
    setAllQuestions([])
    setUserAnswerHistory({})
  }, [isCreator, isConnected, user?.id, sendMessage, quizId])

  const currentQuestion = allQuestions[currentQuestionIndex] || null

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data)

        switch (data.type) {
          case "all_questions_loaded":
            setAllQuestions(data.questions)
            localStorage.setItem(`quiz_${quizId}_questions`, JSON.dumps(data.questions))
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
            setQuizSession(data.quiz_session)
            if (data.quiz_session?.current_question && data.quiz_session.is_active) {
              setQuizStarted(true)
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
            if (data.question && data.question.id !== quizSession?.current_question?.id) {
              setQuizSession((prev) =>
                prev
                  ? {
                      ...prev,
                      current_question: data.question,
                      current_question_index: data.question_index || (prev.current_question_index + 1),
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

              if (quizSession?.mode === "timed") {
                setTimeLeft(data.time_per_question || 15)
              }
            }
            break

          case "answer_result":
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

            if (data.has_next_question && quizSession?.mode === "free") {
              setCanMoveToNext(true)
            } else if (!data.has_next_question) {
              setTimeout(() => {
                setIsQuizEnded(true)
                setQuizStarted(false)
                sendMessage({ action: "get_final_results" })
              }, 3000)
            }
            break

          case "stats_update":
            setTotalStats({
              totalUsers: data.stats.total_participants || 0,
              totalAnswered: data.stats.total_attempts || 0,
              totalCorrect: data.stats.correct_attempts || 0,
              totalWrong: data.stats.wrong_attempts || 0,
            })
            break

          case "final_results":
            setFinalResults(data.results)
            setShowResultsModal(true)
            break

          case "user_results":
            setUserResults(data.results)
            break

          case "quiz_restarted":
            setIsQuizEnded(false)
            setQuizStarted(false)
            setHasAnswered(false)
            setSelectedAnswer(null)
            setAnswerResult(null)
            setShowingResults(false)
            setFinalResults([])
            setUserResults(null)
            setShowResultsModal(false)
            setCurrentQuestionIndex(0)
            setAllQuestions([])
            setUserAnswerHistory({})
            localStorage.removeItem(`quiz_${quizId}_questions`)
            localStorage.removeItem(`quiz_${quizId}_current_index`)
            localStorage.removeItem(`quiz_${quizId}_answer_history`)
            break

          case "participants_update":
            setParticipants(data.participants || [])
            break

          case "quiz_ended":
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
            setShowRefreshButton(true)
            setQuestionLoadError(true)
            break

          default:
            break
        }
      } catch (error) {
        setShowRefreshButton(true)
        setQuestionLoadError(true)
      }
    }
  }, [lastMessage, quizId, quizSession?.mode, quizSession, selectedAnswer])

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

  useEffect(() => {
    if (quizSession?.mode === "free") {
      setCanGoBack(currentQuestionIndex > 0)
      setCanGoNext(currentQuestionIndex < allQuestions.length - 1)
    } else if (quizSession?.mode === "timed") {
      setCanGoBack(false)
      setCanGoNext(false)
    }
  }, [currentQuestionIndex, allQuestions.length, quizSession?.mode])

  useEffect(() => {
    if (quizSession?.mode === "timed" && timeLeft === 0 && !hasAnswered && quizStarted && !isQuizEnded) {
      setHasAnswered(true)

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
      if (autoNextTimer) clearTimeout(autoNextTimer)
    }
  }, [timeLeft, hasAnswered, quizStarted, quizSession?.mode, isQuizEnded, isConnected, user, sendMessage])

  useEffect(() => {
    if (quizSession?.mode === "timed" && timeLeft > 0 && !hasAnswered && quizStarted && !isQuizEnded) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, hasAnswered, quizStarted, quizSession?.mode, isQuizEnded])

  const renderQuestionContent = (question: Question) => {
    if (!question) return <div className="text-white/60">No question available</div>

    const isTimeExpired = quizSession?.mode === "timed" && timeLeft === 0
    const isDisabled = hasAnswered || isTimeExpired || isQuizEnded || showingResults || isSubmittingAnswer

    return (
      <div className="grid gap-4">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option.id
          const isCorrect = answerResult?.correctAnswerId === option.id
          const isWrong = isSelected && answerResult && !answerResult.isCorrect

          let buttonClass = "p-4 rounded-xl text-left transition-all duration-300 backdrop-blur-sm border border-white/20"

          if (showingResults) {
            if (isCorrect) buttonClass += " bg-green-500/30 border-green-400 ring-2 ring-green-400"
            else if (isWrong) buttonClass += " bg-red-500/30 border-red-400 ring-2 ring-red-400"
            else buttonClass += " bg-white/10 opacity-60"
          } else if (isDisabled) {
            buttonClass += " bg-white/10 cursor-not-allowed opacity-60"
          } else {
            buttonClass += " bg-white/20 hover:bg-white/30 hover:scale-[1.02] cursor-pointer"
          }

          if (isSelected && !showingResults) buttonClass += " ring-2 ring-blue-400 bg-blue-500/20"

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
                      ? isCorrect ? "bg-green-500" : isWrong ? "bg-red-500" : "bg-white/20"
                      : isSelected ? "bg-blue-500" : "bg-white/20"
                  }`}
                >
                  {showingResults ? (
                    isCorrect ? <Check className="w-4 h-4" /> : isWrong ? <X className="w-4 h-4" /> : String.fromCharCode(65 + index)
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

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="fixed top-0 left-0 right-0 z-40 liquid-glass border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="liquid-glass-button rounded-full p-2 text-white hover:bg-white/20 transition-colors"
            >
              <Users size={20} />
            </button>
          </div>

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
              onClick={handleLeaveQuiz}
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
        } md:translate-x-0 md:w-64`}
      >
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-lg">Quiz Stats</h3>
            <button onClick={() => setShowSidebar(false)} className="text-white/60 hover:text-white md:hidden">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="liquid-glass rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">Your Performance</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">{userStatsFromParticipants.correctAnswers}</div>
                <div className="text-xs text-white/70">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-400">{userStatsFromParticipants.wrongAnswers}</div>
                <div className="text-xs text-white/70">Wrong</div>
              </div>
              <div className="text-center col-span-2">
                <div className="text-xl font-bold text-blue-400">{userStatsFromParticipants.accuracy}%</div>
                <div className="text-xs text-white/70">Accuracy</div>
              </div>
            </div>
          </div>

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

          <button
            onClick={handleLeaveQuiz}
            className="w-full liquid-glass-button rounded-lg p-3 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Exit Quiz
          </button>
        </div>
      </div>

      <div className={`transition-all duration-300 ${showSidebar ? "ml-80" : "ml-0"} md:ml-64`}>
        <div className="px-4 pt-20 pb-8 min-h-screen">
          <div className="max-w-4xl mx-auto">
            {currentQuestion ? (
              <div className="liquid-glass rounded-2xl p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-white text-xl md:text-2xl font-bold mb-4 text-balance">{currentQuestion.text}</h2>
                  {currentQuestion.image && (
                    <img
                      src={currentQuestion.image}
                      alt="Question"
                      className="w-full max-h-64 object-cover rounded-lg"
                      loading="lazy"
                    />
                  )}
                </div>

                {renderQuestionContent(currentQuestion)}

                {quizSession?.mode === "free" && (
                  <div className="flex justify-between mt-6">
                    <button
                      onClick={handlePreviousQuestion}
                      disabled={!canGoBack}
                      className="liquid-glass-button px-6 py-3 rounded-xl text-white flex items-center gap-2 disabled:opacity-50"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <button
                      onClick={handleNextQuestion}
                      disabled={!canGoNext}
                      className="liquid-glass-button px-6 py-3 rounded-xl text-white flex items-center gap-2 disabled:opacity-50"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
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
                      index === 0 ? "bg-yellow-500/20" : index === 1 ? "bg-gray-400/20" : index === 2 ? "bg-orange-600/20" : "bg-white/10"
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

              <button
                onClick={() => setShowResultsModal(false)}
                className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}