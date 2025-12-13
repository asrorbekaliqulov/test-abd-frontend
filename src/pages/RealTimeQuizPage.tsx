"use client"
import { useState, useEffect, useCallback, useRef } from "react"
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

const backgroundImages = [
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1920&h=1080&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&h=1080&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&h=1080&fit=crop&crop=center",
]

export default function RealTimeQuizPage({ quiz_id }: { quiz_id?: number | string }) {
    // state
    const [user, setUser] = useState<UserData | null>(null)
    const [userLoading, setUserLoading] = useState(true)
    const [userError, setUserError] = useState<string | null>(null)

    // quiz id state (initially null)
    const [quizId, setQuizId] = useState<number | null>(null);
    const [session, setSession] = useState<UserData | null>(null)

    // --------------------------
// QUIZ ID — URL orqali fallback
// --------------------------
    useEffect(() => {
        const deriveQuizId = (): number | null => {

            // 1) Props orqali
            if (quiz_id !== undefined && quiz_id !== null) {
                const id = Number(quiz_id);
                if (!isNaN(id)) return id;
            }

            // 2) Query params orqali
            const params = new URLSearchParams(window.location.search);
            const qp = params.get("id") || params.get("quiz_id");
            if (qp) {
                const id = Number(qp);
                if (!isNaN(id)) return id;
            }

            // 3) Path orqali (universal regex)
            const path = window.location.pathname;

            const patterns = [
                /live-quiz\/(\d+)/i,
                /quiz(?:zes)?\/(\d+)/i,
                /quiz\/start\/(\d+)/i,
                /start\/quiz\/(\d+)/i,
                /\/(\d+)(?:\/)?$/i,
            ];

            for (const rx of patterns) {
                const m = path.match(rx);
                if (m?.[1]) {
                    const id = Number(m[1]);
                    if (!isNaN(id)) return id;
                }
            }

            return null;
        };

        const derived = deriveQuizId();

        if (derived !== null && quizId === null) {
            setQuizId(derived);
        }
    }, [quiz_id]); // QUIZ ID URL fallback


// --------------------------
// TOKEN
// --------------------------
    const accessToken =
        typeof window !== "undefined"
            ? localStorage.getItem("access_token")
            : null;

// --------------------------
// UNIVERSAL WS URL
// --------------------------
    const WS_BASE_URL = "wss://backend.testabd.uz";
    const wsUrl = accessToken
        ? `${WS_BASE_URL}/ws/quiz/all/?token=${accessToken}`
        : null;

// debug WS URL
    useEffect(() => {
        console.log("token exists:", !!accessToken);
        console.log("wsUrl:", wsUrl);
    }, [accessToken, wsUrl]);


// --------------------------
// WEBSOCKET HOOK
// --------------------------
    const { isConnected, sendMessage, lastMessage, error } = useWebSocket(wsUrl ?? "", {
        shouldReconnect: () => true,
    });


// --------------------------
// WS — QUIZ ID OLIB BERADI
// --------------------------
    useEffect(() => {
        if (!lastMessage) return;

        let raw = lastMessage;

        if (typeof raw === "object" && "data" in raw) {
            raw = raw.data;
        }

        let msg: any;
        try {
            msg = typeof raw === "string" ? JSON.parse(raw) : raw;
        } catch (err) {
            console.warn("WS JSON parse error:", err);
            return;
        }

        console.log("WS MESSAGE:", msg);

        // 👉 PRIORITY: WS orqali kelgan quiz_id
        if (msg.quiz_id !== undefined && msg.quiz_id !== null) {
            const parsed = Number(msg.quiz_id);
            if (!isNaN(parsed)) {
                console.log("WS → QUIZ ID OLINDI:", parsed);
                setQuizId(parsed);
            }
        }

        // agar WS session yuborsa → update
        if (msg.session) {
            setSession(prev => ({
                ...(prev ?? {}),
                ...msg.session
            }));
        }
    }, [lastMessage]);


// --------------------------
// DEBUG
// --------------------------
    useEffect(() => {
        console.log("quizId:", quizId);
        console.log("wsUrl:", wsUrl);
        console.log("isConnected:", isConnected);
        console.log("session:", session);
        console.log("PATH =", window.location.pathname);
        console.log("SEARCH =", window.location.search);
        console.log("FULL URL =", window.location.href);
    }, [quizId, wsUrl, session]);

    const [quizSession, setQuizSession] = useState<QuizSession | null>(null)
    const [participants, setParticipants] = useState<Participant[]>([])
    const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null)
    const [timeLeft, setTimeLeft] = useState<number>(15)
    const [hasAnswered, setHasAnswered] = useState(false)
    const [isQuizEnded, setIsQuizEnded] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
    const [hasJoined, setHasJoined] = useState(false)
    const [quizStarted, setQuizStarted] = useState(false)
    const [backgroundImage] = useState(() => backgroundImages[Math.floor(Math.random() * backgroundImages.length)])

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
    const [canMoveToNext, setCanMoveToNext] = useState(false)

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
    const [autoNextTimer, setAutoNextTimer] = useState<number | null>(null)

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

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const currentQuestion = allQuestions[currentQuestionIndex] || null

    // load saved localStorage (browser-only)
    useEffect(() => {
        if (typeof window === "undefined") return
        try {
            const savedQuestions = localStorage.getItem(`quiz_${quizId}_questions`)
            const savedIndex = localStorage.getItem(`quiz_${quizId}_current_index`)
            const savedHistory = localStorage.getItem(`quiz_${quizId}_answer_history`)
            if (savedQuestions) setAllQuestions(JSON.parse(savedQuestions))
            if (savedIndex) setCurrentQuestionIndex(parseInt(savedIndex, 10))
            if (savedHistory) setUserAnswerHistory(JSON.parse(savedHistory))
        } catch {
            localStorage.removeItem(`quiz_${quizId}_questions`)
            localStorage.removeItem(`quiz_${quizId}_current_index`)
            localStorage.removeItem(`quiz_${quizId}_answer_history`)
        }
    }, [quizId])

    useEffect(() => {
        if (typeof window === "undefined") return
        try {
            localStorage.setItem(`quiz_${quizId}_questions`, JSON.stringify(allQuestions))
        } catch {}
    }, [allQuestions, quizId])

    useEffect(() => {
        if (typeof window === "undefined") return
        try {
            localStorage.setItem(`quiz_${quizId}_current_index`, currentQuestionIndex.toString())
        } catch {}
    }, [currentQuestionIndex, quizId])

    useEffect(() => {
        if (typeof window === "undefined") return
        try {
            localStorage.setItem(`quiz_${quizId}_answer_history`, JSON.stringify(userAnswerHistory))
        } catch {}
    }, [userAnswerHistory, quizId])

    // load current user
    useEffect(() => {
        const loadUserData = async () => {
            try {
                setUserLoading(true)
                const userData = await authAPI.getCurrentUser()
                setUser(userData)
                setUserError(null)
            } catch (err) {
                setUserError(err instanceof Error ? err.message : "Failed to load user data")
            } finally {
                setUserLoading(false)
            }
        }
        loadUserData()
    }, [])

    // connection status & auto-join
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

    // answer submit
    const handleAnswerSubmit = (answerId: number | string) => {
        if (hasAnswered || !currentQuestion || !user || isSubmittingAnswer) return;

        // Darhol tanlangan javobni set qilamiz
        setSelectedAnswer(answerId);
        setHasAnswered(true);
        setIsSubmittingAnswer(true);

        const responseTime = (Date.now() - questionStartTimeRef.current) / 1000;

        // Websocket yuborish
        sendMessage({
            action: "submit_answer",
            user_id: user.id,
            question_id: currentQuestion.id,
            answer_id: answerId,
            response_time: responseTime,
        });

        // UI qotib qolmasligi uchun kichik delay bilan isSubmittingAnswer-ni false qilamiz
        setTimeout(() => {
            setIsSubmittingAnswer(false);
        }, 150); // 150ms yetarli
    };

    // define handleEndQuiz before other callbacks that reference it to avoid TDZ
    const handleEndQuiz = useCallback(() => {
        if (!isConnected || !user || !quizSession || user.id !== quizSession.creator_id || isEndingQuiz) return

        if (typeof window !== "undefined" && window.confirm("Are you sure you want to end this quiz for all participants?")) {
            setIsEndingQuiz(true)
            sendMessage({
                action: "end_quiz",
                user_id: user.id,
            })
        }
    }, [isConnected, user, quizSession, isEndingQuiz, sendMessage])

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
    }, [currentQuestionIndex, allQuestions.length, quizSession?.mode, isConnected, user, sendMessage, handleEndQuiz])

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
        if (typeof window !== "undefined") window.history.back()
    }, [isConnected, user, sendMessage])

    const handleStartQuiz = useCallback(() => {
        if (!isConnected || !user || !quizSession || user.id !== quizSession.creator_id || isStartingQuiz) return

        setIsStartingQuiz(true)
        sendMessage({
            action: "start_quiz",
            user_id: user.id,
        })
    }, [isConnected, user, quizSession, isStartingQuiz, sendMessage])

    const handleNextQuestionManual = useCallback(() => {
        if (!isConnected || !user) return
        sendMessage({
            action: "next_question",
            user_id: user.id,
        })
    }, [isConnected, user, sendMessage])

    const handleRefresh = useCallback(() => {
        setQuestionLoadError(false)
        if (user && hasJoined) {
            sendMessage({
                action: "join_quiz",
                user_id: user.id,
                username: user.username,
            })
        }
    }, [user, hasJoined, sendMessage])

    const handleKickParticipant = useCallback((participantId: number | string) => {
        if (!user || !quizSession) return
        if (user.id !== quizSession.creator_id) return
        if (!isConnected) return

        sendMessage({
            action: "kick_participant",
            admin_id: user.id,
            user_id: participantId,
        })
    }, [isConnected, user, quizSession, sendMessage])

    const handleRestartQuiz = useCallback(() => {
        if (!user || !quizSession) return
        if (user.id !== quizSession.creator_id) return
        if (!isConnected) return

        sendMessage({
            action: "restart_quiz",
            user_id: user.id,
        })

        if (typeof window !== "undefined") {
            localStorage.removeItem(`quiz_${quizId}_questions`)
            localStorage.removeItem(`quiz_${quizId}_current_index`)
            localStorage.removeItem(`quiz_${quizId}_answer_history`)
        }
        setCurrentQuestionIndex(0)
        setAllQuestions([])
        setUserAnswerHistory({})
    }, [isConnected, user, quizSession, sendMessage, quizId])

    // incoming websocket messages
    useEffect(() => {
        if (!lastMessage) return;

        let data: any;
        try {
            data = JSON.parse(lastMessage); // lastMessage string
        } catch (err) {
            console.error("Failed to parse WS message:", lastMessage, err);
            setQuestionLoadError(true);
            return;
        }

        switch (data.type) {
            case "all_questions_loaded":
            case "quiz_state":
                if (Array.isArray(data.questions)) {
                    setAllQuestions(data.questions);
                    if (typeof window !== "undefined") {
                        localStorage.setItem(`quiz_${quizId}_questions`, JSON.stringify(data.questions));
                    }
                }
                if (data.quiz_session) setQuizSession(data.quiz_session);
                if (data.participants) setParticipants(data.participants);
                setIsStartingQuiz(false);
                setIsEndingQuiz(false);
                break;

            case "quiz_started":
                setQuizStarted(true);
                if (data.quiz_session) setQuizSession(data.quiz_session);
                if (Array.isArray(data.all_questions)) {
                    setAllQuestions(data.all_questions);
                    if (typeof window !== "undefined") {
                        localStorage.setItem(`quiz_${quizId}_questions`, JSON.stringify(data.all_questions));
                    }
                }
                break;

            case "timed_question_change":
                if (typeof data.question_index === "number") {
                    setCurrentQuestionIndex(data.question_index);
                    setHasAnswered(false);
                    setSelectedAnswer(null);
                    setAnswerResult(null);
                    setShowingResults(false);
                    questionStartTimeRef.current = Date.now();
                }
                break;

            case "new_question":
                if (data.question) {
                    setQuizSession((prev) => {
                        const prevIndex = prev?.current_question_index ?? -1;
                        const computedIndex = typeof data.question_index === "number" ? data.question_index : prevIndex + 1;
                        return {
                            ...prev,
                            current_question: data.question,
                            current_question_index: computedIndex,
                            time_per_question: data.time_per_question ?? prev?.time_per_question ?? 15,
                            is_active: data.is_active ?? prev?.is_active ?? true,
                            total_questions: data.total_questions ?? prev?.total_questions ?? (Array.isArray(data.all_questions) ? data.all_questions.length : 0),
                        } as QuizSession;
                    });

                    setHasAnswered(false);
                    setSelectedAnswer(null);
                    setAnswerResult(null);
                    setShowingResults(false);
                    setIsSubmittingAnswer(false);
                    setCanMoveToNext(false);
                    questionStartTimeRef.current = Date.now();

                    if (typeof data.time_per_question === "number") setTimeLeft(data.time_per_question);
                    if (Array.isArray(data.all_questions)) {
                        setAllQuestions(data.all_questions);
                        if (typeof window !== "undefined") {
                            localStorage.setItem(`quiz_${quizId}_questions`, JSON.stringify(data.all_questions));
                        }
                    }
                }
                break;

            case "answer_result":
                if (quizSession?.current_question) {
                    setUserAnswerHistory((prev) => ({
                        ...prev,
                        [quizSession.current_question.id]: {
                            answerId: selectedAnswer ? String(selectedAnswer) : "",
                            isCorrect: data.is_correct,
                        },
                    }));
                }
                setAnswerResult({
                    isCorrect: data.is_correct,
                    correctAnswerId: data.correct_answer_id ?? null,
                    explanation: data.explanation,
                    responseTime: data.response_time,
                });
                setShowingResults(true);
                setIsSubmittingAnswer(false);
                setCanMoveToNext(Boolean(data.has_next_question));

                if (!data.has_next_question) {
                    setTimeout(() => {
                        setIsQuizEnded(true);
                        setQuizStarted(false);
                        sendMessage({ action: "get_final_results" });
                    }, 3000);
                }
                break;

            case "stats_update":
                setTotalStats({
                    totalUsers: data.stats?.total_participants ?? 0,
                    totalAnswered: data.stats?.total_attempts ?? 0,
                    totalCorrect: data.stats?.correct_attempts ?? 0,
                    totalWrong: data.stats?.wrong_attempts ?? 0,
                });
                break;

            case "final_results":
                setFinalResults(data.results ?? []);
                setShowResultsModal(true);
                break;

            case "user_results":
                setUserResults(data.results);
                break;

            case "quiz_restarted":
                setIsQuizEnded(false);
                setQuizStarted(false);
                setHasAnswered(false);
                setSelectedAnswer(null);
                setAnswerResult(null);
                setShowingResults(false);
                setFinalResults([]);
                setUserResults(null);
                setShowResultsModal(false);
                setCurrentQuestionIndex(0);
                setAllQuestions([]);
                setUserAnswerHistory({});
                if (typeof window !== "undefined") {
                    localStorage.removeItem(`quiz_${quizId}_questions`);
                    localStorage.removeItem(`quiz_${quizId}_current_index`);
                    localStorage.removeItem(`quiz_${quizId}_answer_history`);
                }
                break;

            case "participants_update":
                setParticipants(data.participants ?? []);
                break;

            case "quiz_ended":
                setIsQuizEnded(true);
                setQuizStarted(false);
                setIsEndingQuiz(false);
                setCanMoveToNext(false);
                sendMessage({ action: "get_final_results" });
                if (user) sendMessage({ action: "get_user_results", user_id: user.id });
                break;

            case "time_update":
                if (typeof data.time_left === "number" && quizSession?.mode === "timed") {
                    setTimeLeft(data.time_left);
                }
                break;

            case "error":
                setQuestionLoadError(true);
                break;

            default:
                break;
        }
    }, [lastMessage, quizId, quizSession?.mode, quizSession, selectedAnswer, sendMessage, user]);

    // keep user stats from participants in sync
    useEffect(() => {
        if (!user || participants.length === 0) return
        const userParticipant = participants.find((p) => p.id === user.id)
        if (!userParticipant) return
        const total = userParticipant.correct_answers + userParticipant.wrong_answers
        const accuracy = total > 0 ? Math.round((userParticipant.correct_answers / total) * 100) : 0
        setUserStatsFromParticipants({
            correctAnswers: userParticipant.correct_answers,
            wrongAnswers: userParticipant.wrong_answers,
            totalAnswered: total,
            accuracy,
        })
    }, [user, participants])

    useEffect(() => {
        if (quizSession?.mode === "free") {
            setCanGoBack(currentQuestionIndex > 0)
            setCanGoNext(currentQuestionIndex < allQuestions.length - 1)
        } else {
            setCanGoBack(false)
            setCanGoNext(false)
        }
    }, [currentQuestionIndex, allQuestions.length, quizSession?.mode])

    useEffect(() => {
        if (quizSession?.mode === "timed" && timeLeft === 0 && !hasAnswered && quizStarted && !isQuizEnded) {
            setHasAnswered(true)
            const timerId = window.setTimeout(() => {
                if (isConnected && user) {
                    sendMessage({ action: "next_question", user_id: user.id })
                }
            }, 2000)
            setAutoNextTimer(timerId)
        }
        return () => {
            if (autoNextTimer) window.clearTimeout(autoNextTimer)
        }
    }, [timeLeft, hasAnswered, quizStarted, quizSession?.mode, isQuizEnded, isConnected, user, sendMessage, autoNextTimer])

    useEffect(() => {
        if (quizSession?.mode === "timed" && timeLeft > 0 && !hasAnswered && quizStarted && !isQuizEnded) {
            const t = window.setTimeout(() => setTimeLeft((s) => s - 1), 1000)
            return () => clearTimeout(t)
        }
    }, [timeLeft, hasAnswered, quizStarted, quizSession?.mode, isQuizEnded])

    const renderQuestionContent = (question: Question | null) => {
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
                    } else if (isDisabled) buttonClass += " bg-white/10 cursor-not-allowed opacity-60"
                    else buttonClass += " bg-white/20 hover:bg-white/30 hover:scale-[1.02] cursor-pointer"
                    if (isSelected && !showingResults) buttonClass += " ring-2 ring-blue-400 bg-blue-500/20"

                    return (
                        <button
                            key={String(option.id)}
                            onClick={() => !isDisabled && handleAnswerSubmit(option.id)}
                            disabled={isDisabled}
                            className={buttonClass}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                        showingResults ? (isCorrect ? "bg-green-500" : isWrong ? "bg-red-500" : "bg-white/20") : isSelected ? "bg-blue-500" : "bg-white/20"
                                    }`}
                                >
                                    {showingResults ? (isCorrect ? <Check className="w-4 h-4" /> : isWrong ? <X className="w-4 h-4" /> : String.fromCharCode(65 + index)) : String.fromCharCode(65 + index)}
                                </div>
                                <span className="text-white font-medium">{option.text}</span>
                            </div>
                        </button>
                    )
                })}
            </div>
        )
    }

    // UI rendering (kept largely the same as original)
    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImage})` }}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

            <div className="fixed top-0 left-0 right-0 z-40 liquid-glass border-b border-white/10">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowSidebar(!showSidebar)} className="liquid-glass-button rounded-full p-2 text-white hover:bg-white/20 transition-colors">
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
                        {user && quizSession && user.id === quizSession.creator_id && (
                            <button onClick={() => setShowAdminPanel(true)} className="liquid-glass-button rounded-full p-2 text-yellow-400 hover:bg-yellow-500/20 transition-colors" title="Admin Panel">
                                <Crown size={20} />
                            </button>
                        )}
                        <button onClick={handleLeaveQuiz} className="liquid-glass-button rounded-full p-2 text-red-400 hover:bg-red-500/20 transition-colors" title="Exit Quiz">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className={`fixed top-0 left-0 h-full w-80 z-50 liquid-glass-sidebar transform transition-transform duration-300 ${showSidebar ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:w-64`}>
                <div className="p-4">
                    <div className="flex items-center justify-between">
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
                                .slice()
                                .sort((a, b) => b.correct_answers - a.correct_answers)
                                .map((participant, index) => (
                                    <div key={String(participant.id)} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white/60 text-xs">#{index + 1}</span>
                                            <span className="text-white text-sm font-medium">{participant.username}</span>
                                            {participant.id === quizSession?.creator_id && <Crown size={12} className="text-yellow-400" />}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-green-400">{participant.correct_answers}</span>
                                            <span className="text-red-400">{participant.wrong_answers}</span>
                                            {user && quizSession && user.id === quizSession.creator_id && participant.id !== user.id && (
                                                <button onClick={() => handleKickParticipant(participant.id)} className="text-red-400 hover:text-red-300 ml-2" title="Kick participant">
                                                    <UserX size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <button onClick={handleLeaveQuiz} className="w-full liquid-glass-button rounded-lg p-3 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
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
                                    {currentQuestion.image && <img src={currentQuestion.image} alt="Question" className="w-full max-h-64 object-cover rounded-lg" loading="lazy" />}
                                </div>

                                {renderQuestionContent(currentQuestion)}

                                {quizSession?.mode === "free" && (
                                    <div className="flex justify-between mt-6">
                                        <button onClick={handlePreviousQuestion} disabled={!canGoBack} className="liquid-glass-button px-6 py-3 rounded-xl text-white flex items-center gap-2 disabled:opacity-50">
                                            <ChevronLeft size={16} />
                                            Previous
                                        </button>
                                        <button onClick={handleNextQuestion} disabled={!canGoNext} className="liquid-glass-button px-6 py-3 rounded-xl text-white flex items-center gap-2 disabled:opacity-50">
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

            {showAdminPanel && user && quizSession && user.id === quizSession.creator_id && (
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
                            <button onClick={handleEndQuiz} className="w-full liquid-glass-button rounded-lg p-3 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                                <Square size={16} />
                                End Quiz
                            </button>

                            <button onClick={handleRestartQuiz} className="w-full liquid-glass-button rounded-lg p-3 text-green-400 hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2">
                                <RotateCcw size={16} />
                                Restart Quiz
                            </button>

                            <button onClick={() => setShowResultsModal(true)} className="w-full liquid-glass-button rounded-lg p-3 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2">
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
                                    <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${index === 0 ? "bg-yellow-500/20" : index === 1 ? "bg-gray-400/20" : index === 2 ? "bg-orange-600/20" : "bg-white/10"}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}</span>
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

                            <button onClick={() => setShowResultsModal(false)} className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}