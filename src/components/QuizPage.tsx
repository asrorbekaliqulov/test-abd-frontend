"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Share, Bookmark, X, Send, Check, ThumbsUp, ThumbsDown, ExternalLink } from "lucide-react"
import { quizAPI, accountsAPI } from "../utils/api"

interface QuizPageProps {
  theme: string
}

interface Quiz {
  id: number
  question_text: string
  question_type: string
  media: string | null
  answers: Array<{
    id: number
    letter: string
    answer_text: string
    is_correct: boolean
  }>
  correct_count: number
  wrong_count: number
  difficulty_percentage: number
  is_bookmarked?: boolean
  user: {
    id: number
    username: string
    profile_image: string | null
    is_badged?: boolean
    is_premium?: boolean
  }
  is_following?: boolean
  created_at: string
  round_image: string | null
}

const QuizPage: React.FC<QuizPageProps> = ({ theme = "dark" }) => {
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [userInteractions, setUserInteractions] = useState({
    follows: new Set<string>(),
    saves: new Set<number>(),
    selectedAnswers: new Map<number, number[]>(),
    textAnswers: new Map<number, string>(),
  })
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [nextPageUrl, setNextPageUrl] = useState<string | undefined>(undefined)
  const [quizData, setQuizzes] = useState<Quiz[]>([])
  console.log("Quiz data:", quizData)
  const [submittingQuestions, setSubmittingQuestions] = useState<Set<number>>(new Set())
  const [batchIndices, setBatchIndices] = useState<number[]>([])
  const [animateIn, setAnimateIn] = useState(true)
  const [direction, setDirection] = useState<"up" | "down">("up")
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set())

  // Preload images function
  const preloadImages = (startIndex: number, count = 5) => {
    for (let i = startIndex; i < Math.min(startIndex + count, quizData.length); i++) {
      const quiz = quizData[i]
      if (quiz?.round_image && !preloadedImages.has(quiz.round_image)) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          setPreloadedImages((prev) => new Set(prev).add(quiz.round_image!))
        }
        img.onerror = () => {
          console.warn(`Failed to preload image: ${quiz.round_image}`)
        }
        img.src = quiz.round_image
      }

      // Also preload user profile images
      if (quiz?.user.profile_image && !preloadedImages.has(quiz.user.profile_image)) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          setPreloadedImages((prev) => new Set(prev).add(quiz.user.profile_image!))
        }
        img.onerror = () => {
          console.warn(`Failed to preload profile image: ${quiz.user.profile_image}`)
        }
        img.src = quiz.user.profile_image
      }
    }
  }

  const fetchQuizzes = async (url?: string) => {
    setLoading(true)
    try {
      const response = await quizAPI.fetchQuestions(url)
      const data = response.data

      // Add new batch index
      const newBatchStart = quizData.length
      setBatchIndices((prev) => [...prev, newBatchStart])

      setQuizzes((prev) => {
        const newQuizzes = [...prev, ...data.results]
        // Preload images for the new questions
        setTimeout(() => preloadImages(newBatchStart, 10), 100)
        return newQuizzes
      })
      setNextPageUrl(data.next)
      setHasMore(!!data.next)
      setPage((prevPage) => prevPage + 1)
    } catch (error) {
      console.error("Savollarni yuklashda xatolik:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuizzes()
  }, [])

  // Preload images when current index changes
  useEffect(() => {
    if (quizData.length > 0) {
      preloadImages(currentQuizIndex + 1, 3) // Preload next 3 images
    }
  }, [currentQuizIndex, quizData.length])

  const handleScroll = () => {
    if (!containerRef.current || !hasMore || loading) return

    const container = containerRef.current
    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight

    // Calculate current index based on scroll position
    const newIndex = Math.floor(scrollTop / clientHeight)

    // Set scroll direction for animations
    if (newIndex !== currentQuizIndex) {
      setDirection(newIndex > currentQuizIndex ? "up" : "down")
      setAnimateIn(false)
      setTimeout(() => {
        setCurrentQuizIndex(newIndex)
        setAnimateIn(true)
      }, 100)
    }

    // Check if we need to load more questions
    if (newIndex >= 0 && newIndex < quizData.length) {
      // Find which batch the current question belongs to
      const currentBatchIndex = batchIndices.findIndex((startIndex, i) => {
        const endIndex = i < batchIndices.length - 1 ? batchIndices[i + 1] - 1 : quizData.length - 1
        return newIndex >= startIndex && newIndex <= endIndex
      })

      if (currentBatchIndex !== -1) {
        const batchStartIndex = batchIndices[currentBatchIndex]
        const relativeIndex = newIndex - batchStartIndex

        // If we're at the 8th question (index 7) in this batch, load more
        if (relativeIndex === 7 && nextPageUrl) {
          fetchQuizzes(nextPageUrl)
        }
      }
    }
  }

  const selectAnswer = async (quizId: number, answerId: number, duration = 0) => {
    const selectedAnswers = userInteractions.selectedAnswers.get(quizId) || []
    if (selectedAnswers.length > 0) return // Already answered

    setSubmittingQuestions((prev) => new Set(prev).add(quizId))

    try {
      const res = await quizAPI.submitAnswers({
        question: quizId,
        selected_answer_ids: [answerId],
        duration: duration,
      })

      setUserInteractions((prev) => ({
        ...prev,
        selectedAnswers: new Map(prev.selectedAnswers).set(quizId, [answerId]),
      }))
    } catch (err) {
      console.error("Yechim jo'natishda xato:", err)
    } finally {
      setSubmittingQuestions((prev) => {
        const newSet = new Set(prev)
        newSet.delete(quizId)
        return newSet
      })
    }
  }

  const handleMultipleChoice = (quizId: number, answerId: number) => {
    setUserInteractions((prev) => {
      const current = prev.selectedAnswers.get(quizId) || []
      const newAnswers = current.includes(answerId) ? current.filter((id) => id !== answerId) : [...current, answerId]
      const updated = new Map(prev.selectedAnswers)
      updated.set(quizId, newAnswers)
      return {
        ...prev,
        selectedAnswers: updated,
      }
    })
  }

  const submitMultipleChoice = async (quizId: number) => {
    const selected = userInteractions.selectedAnswers.get(quizId) || []
    if (selected.length === 0 || submittingQuestions.has(quizId)) return

    setSubmittingQuestions((prev) => new Set(prev).add(quizId))

    try {
      const response = await quizAPI.submitAnswers({
        question: quizId,
        selected_answer_ids: selected,
        duration: 2,
      })
    } catch (error) {
      console.error("Javobni yuborishda xatolik:", error)
    } finally {
      setSubmittingQuestions((prev) => {
        const newSet = new Set(prev)
        newSet.delete(quizId)
        return newSet
      })
    }
  }

  const handleTextAnswer = async (quizId: number) => {
    const textAnswer = userInteractions.textAnswers.get(quizId)
    if (!textAnswer?.trim() || submittingQuestions.has(quizId)) return

    setSubmittingQuestions((prev) => new Set(prev).add(quizId))

    try {
      const response = await quizAPI.submitTextAnswers({
        question: quizId,
        written_answer: textAnswer.trim(),
        duration: 2,
      })
    } catch (error) {
      console.error("Javobni yuborishda xatolik:", error)
    } finally {
      setSubmittingQuestions((prev) => {
        const newSet = new Set(prev)
        newSet.delete(quizId)
        return newSet
      })
    }
  }

  const shareQuestion = (quizId: number) => {
    const shareUrl = `${window.location.origin}/questions/${quizId}`

    if (navigator.share) {
      // 📱 Agar browser Web Share API'ni qo'llasa (mobil telefonlarda)
      navigator
        .share({
          title: "TestAbd savoli",
          text: "Mana bir qiziqarli savol!",
          url: shareUrl,
        })
        .then(() => {
          console.log("Ulashildi!")
        })
        .catch((err) => {
          console.error("Ulashishda xatolik:", err)
        })
    } else {
      // 💻 Kompyuter brauzerlarida linkni nusxalash
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          alert("Havola nusxalandi: " + shareUrl)
        })
        .catch(() => {
          console.error("Havolani nusxalab bo'lmadi.")
        })
    }
  }

  const handleFollow = async (user_id: number) => {
    try {
      await accountsAPI.toggleFollow(user_id)

      setQuizzes((prev) =>
        prev.map((quiz) =>
          quiz.user.id === user_id
            ? {
              ...quiz,
              user: {
                ...quiz.user,
                is_following: !quiz.is_following,
              },
            }
            : quiz,
        ),
      )
    } catch (error) {
      console.error("Follow toggle failed:", error)
    }
  }

  const handleSave = (quizId: number) => {
    quizAPI
      .bookmarkTest({ question: quizId }) // yoki test: quizId agar TestBookmark bo'lsa
      .then((res) => {
        setQuizzes((prev) =>
          prev.map((quiz) => (quiz.id === quizId ? { ...quiz, is_bookmarked: !quiz.is_bookmarked } : quiz)),
        )
      })
      .catch((err) => {
        console.error("Bookmark toggle xatolik:", err)
      })
  }

  const handleVisitAd = () => {
    // This function will be implemented later
    console.log("Visit Ad clicked")
    // You can add a placeholder alert for now
    alert("Reklama sahifasiga o'tish")
  }

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [currentQuizIndex, quizData.length, hasMore, loading, nextPageUrl, batchIndices])

  const renderQuestionContent = (quiz: Quiz) => {
    const isSubmitting = submittingQuestions.has(quiz.id)
    const selectedAnswers = userInteractions.selectedAnswers.get(quiz.id) || []
    const hasSelected = selectedAnswers.length > 0
    const optionsCount = quiz.answers.length

    // Determine if this is a true/false question
    const isTrueFalse =
      quiz.question_type === "true_false" ||
      (quiz.answers.length === 2 &&
        (quiz.answers[0].answer_text.toLowerCase() === "true" ||
          quiz.answers[0].answer_text.toLowerCase() === "to'g'ri" ||
          quiz.answers[0].answer_text.toLowerCase() === "ha") &&
        (quiz.answers[1].answer_text.toLowerCase() === "false" ||
          quiz.answers[1].answer_text.toLowerCase() === "noto'g'ri" ||
          quiz.answers[1].answer_text.toLowerCase() === "yo'q"))

    if (quiz.question_type === "text_input") {
      return (
        <div className="space-y-3 animate-fade-in">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={userInteractions.textAnswers.get(quiz.id) || ""}
              onChange={(e) =>
                setUserInteractions((prev) => ({
                  ...prev,
                  textAnswers: new Map(prev.textAnswers).set(quiz.id, e.target.value),
                }))
              }
              placeholder="Javobingizni kiriting..."
              disabled={hasSelected}
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4 lg:px-6 lg:py-5 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-all text-sm sm:text-base md:text-lg lg:text-xl`}
            />
            <button
              onClick={() => handleTextAnswer(quiz.id)}
              disabled={!userInteractions.textAnswers.get(quiz.id)?.trim() || hasSelected || isSubmitting}
              className={`self-end px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 lg:px-6 lg:py-3 rounded-xl backdrop-blur-md border border-white/20 text-white font-medium flex items-center gap-2 transition-all text-xs sm:text-sm md:text-base lg:text-lg ${isSubmitting ? "bg-blue-500/30" : "bg-black/30 hover:bg-black/40"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={12} className="sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
              )}
              <span>Yuborish</span>
            </button>
          </div>
        </div>
      )
    }

    if (quiz.question_type === "multiple") {
      // Calculate dynamic padding based on number of options and screen size
      const paddingClass =
        optionsCount <= 3
          ? "p-2 sm:p-3 md:p-4 lg:p-5"
          : optionsCount === 4
            ? "p-2 sm:p-2.5 md:p-3.5 lg:p-4"
            : "p-1.5 sm:p-2 md:p-3 lg:p-3.5"

      return (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in">
          <div className={`grid gap-2 sm:gap-3 md:gap-4`}>
            {quiz.answers.map((option, index) => {
              const isSelected = selectedAnswers.includes(option.id)

              return (
                <button
                  key={option.id}
                  onClick={() => handleMultipleChoice(quiz.id, option.id)}
                  disabled={hasSelected}
                  className={`flex items-center gap-2 sm:gap-3 md:gap-4 ${paddingClass} rounded-xl backdrop-blur-md border transition-all text-left animate-fade-in-up ${isSelected ? "bg-blue-500/20 border-blue-400/50" : "bg-black/20 border-white/20 hover:bg-black/30"
                    } disabled:opacity-70`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div
                    className={`${optionsCount <= 3 ? "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" : "w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5"} rounded flex items-center justify-center transition-all ${isSelected ? "bg-blue-500 text-white" : "bg-white/20 text-white"
                      }`}
                  >
                    {isSelected && (
                      <Check size={optionsCount <= 3 ? 12 : 10} className="sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                    )}
                  </div>
                  <span
                    className={`flex-1 font-medium text-white ${optionsCount <= 3 ? "text-xs sm:text-sm md:text-base lg:text-lg" : "text-xs sm:text-xs md:text-sm lg:text-base"}`}
                  >
                    {option.answer_text}
                  </span>
                </button>
              )
            })}
          </div>

          {selectedAnswers.length > 0 && !hasSelected && (
            <button
              onClick={() => submitMultipleChoice(quiz.id)}
              disabled={isSubmitting}
              className={`w-full py-2 sm:py-2.5 md:py-3 lg:py-4 rounded-xl backdrop-blur-md border border-white/20 text-white font-medium flex items-center justify-center gap-2 transition-all animate-fade-in text-xs sm:text-sm md:text-base lg:text-lg ${isSubmitting ? "bg-blue-500/30" : "bg-black/30 hover:bg-black/40"
                } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={12} className="sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
              )}
              <span>Javobni yuborish ({selectedAnswers.length})</span>
            </button>
          )}
        </div>
      )
    }

    // For true/false questions
    if (isTrueFalse) {
      return (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-5 animate-fade-in">
          {quiz.answers.map((option, index) => {
            const isSelected = selectedAnswers.includes(option.id)
            const isCorrect = option.is_correct
            const isUserCorrect = isSelected && isCorrect
            const isUserWrong = isSelected && !isCorrect
            const showCorrect = hasSelected && isCorrect

            const getButtonClass = () => {
              if (isUserCorrect) return "bg-green-500/20 border-green-400/50"
              if (isUserWrong) return "bg-red-500/20 border-red-400/50"
              if (showCorrect) return "bg-green-500/10 border-green-300/30"
              if (isSelected) return "bg-blue-500/20 border-blue-400/50"
              return "bg-black/20 border-white/20 hover:bg-black/30"
            }

            const isTrue =
              option.answer_text.toLowerCase() === "true" ||
              option.answer_text.toLowerCase() === "to'g'ri" ||
              option.answer_text.toLowerCase() === "ha"

            return (
              <button
                key={option.id}
                onClick={() => selectAnswer(quiz.id, option.id)}
                disabled={hasSelected || isSubmitting}
                className={`flex flex-col items-center justify-center gap-2 py-3 px-2 sm:py-4 sm:px-3 md:py-5 md:px-4 lg:py-6 lg:px-5 rounded-xl backdrop-blur-md border transition-all animate-fade-in-up ${getButtonClass()} disabled:opacity-70`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {isTrue ? (
                  <ThumbsUp size={20} className="text-white sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                ) : (
                  <ThumbsDown size={20} className="text-white sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                )}
                <span className="text-sm sm:text-base md:text-lg lg:text-xl font-medium text-white">
                  {option.answer_text}
                </span>
                {isSubmitting && isSelected && (
                  <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {isUserCorrect && <Check size={16} className="text-green-400 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
                {isUserWrong && <X size={16} className="text-red-400 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
              </button>
            )
          })}
        </div>
      )
    }

    // For single choice questions
    // Calculate dynamic sizing based on number of options and screen size
    const paddingClass =
      optionsCount <= 3
        ? "p-2 sm:p-3 md:p-4 lg:p-5"
        : optionsCount === 4
          ? "p-2 sm:p-2.5 md:p-3.5 lg:p-4"
          : "p-1.5 sm:p-2 md:p-3 lg:p-3.5"

    const circleSize =
      optionsCount <= 3
        ? "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10"
        : optionsCount === 4
          ? "w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8"
          : "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7"

    const fontSize =
      optionsCount <= 3 ? "text-xs sm:text-sm md:text-base lg:text-lg" : "text-xs sm:text-xs md:text-sm lg:text-base"

    const gap = optionsCount <= 3 ? "gap-2 sm:gap-3 md:gap-4" : "gap-1.5 sm:gap-2 md:gap-3"

    return (
      <div className={`grid ${gap} ${optionsCount >= 5 ? "max-h-[45vh] overflow-y-auto pr-1" : ""} animate-fade-in`}>
        {quiz.answers.map((option, index) => {
          const isSelected = selectedAnswers.includes(option.id)
          const isCorrect = option.is_correct
          const isUserCorrect = isSelected && isCorrect
          const isUserWrong = isSelected && !isCorrect
          const showCorrect = hasSelected && isCorrect

          const getButtonClass = () => {
            if (isUserCorrect) return "bg-green-500/20 border-green-400/50"
            if (isUserWrong) return "bg-red-500/20 border-red-400/50"
            if (showCorrect) return "bg-green-500/10 border-green-300/30"
            if (isSelected) return "bg-blue-500/20 border-blue-400/50"
            return "bg-black/20 border-white/20 hover:bg-black/30"
          }

          const getCircleClass = () => {
            if (isUserCorrect) return "bg-green-500 text-white"
            if (isUserWrong) return "bg-red-500 text-white"
            if (showCorrect) return "bg-green-500 text-white"
            if (isSelected) return "bg-blue-500 text-white"
            return "bg-white/20 text-white"
          }

          return (
            <button
              key={option.id}
              onClick={() => selectAnswer(quiz.id, option.id)}
              disabled={hasSelected || isSubmitting}
              className={`flex items-center gap-2 sm:gap-3 md:gap-4 ${paddingClass} rounded-xl backdrop-blur-md border transition-all text-left animate-fade-in-up ${getButtonClass()} disabled:opacity-70`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div
                className={`${circleSize} rounded-full flex items-center justify-center font-medium text-xs sm:text-sm md:text-base lg:text-lg ${getCircleClass()}`}
              >
                {option.letter}
              </div>
              <span className={`flex-1 ${fontSize} font-medium text-white`}>{option.answer_text}</span>
              {isSubmitting && isSelected && (
                <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isUserCorrect && <Check size={14} className="text-green-400 sm:w-4 sm:h-4 md:w-5 md:h-5" />}
              {isUserWrong && <X size={14} className="text-red-400 sm:w-4 sm:h-4 md:w-5 md:h-5" />}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900">
      <style>{`
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeInUp {
    from { 
      opacity: 0;
      transform: translateY(10px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeInDown {
    from { 
      opacity: 0;
      transform: translateY(-10px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes slideIn {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.5s ease-out forwards;
  }
  
  .animate-fade-in-down {
    animation: fadeInDown 0.5s ease-out forwards;
  }
  
  .animate-pulse-custom {
    animation: pulse 2s infinite;
  }
  
  .animate-slide-in {
    animation: slideIn 0.3s ease-out forwards;
  }
`}</style>
      {/* Main Quiz Container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative z-10"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {quizData?.map((quiz, idx) => {
          const selectedAnswers = userInteractions.selectedAnswers.get(quiz.id) || []
          const hasSelected = selectedAnswers.length > 0
          const isSubmitting = submittingQuestions.has(quiz.id)
          const optionsCount = quiz.answers.length
          const isCurrentQuestion = idx === currentQuizIndex

          // Determine if this is a true/false question
          const isTrueFalse =
            quiz.question_type === "true_false" ||
            (quiz.answers.length === 2 &&
              (quiz.answers[0].answer_text.toLowerCase() === "true" ||
                quiz.answers[0].answer_text.toLowerCase() === "to'g'ri" ||
                quiz.answers[0].answer_text.toLowerCase() === "ha") &&
              (quiz.answers[1].answer_text.toLowerCase() === "false" ||
                quiz.answers[1].answer_text.toLowerCase() === "noto'g'ri" ||
                quiz.answers[1].answer_text.toLowerCase() === "yo'q"))

          return (
            <div
              key={`${quiz.id}-${idx}`}
              className="h-screen w-full snap-start flex justify-center items-center relative"
            >
              <div
                className="relative w-full h-full max-w-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden"
                style={{
                  backgroundImage: `url(${quiz.round_image || "/placeholder.svg?height=800&width=400"})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                {/* Background Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70 z-1"></div>

                {/* Visit Ad Button with animation */}
                <button
                  onClick={handleVisitAd}
                  className={`absolute top-3 right-3 sm:top-4 sm:right-4 md:top-5 md:right-5 lg:top-6 lg:right-6 z-20 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 lg:px-5 lg:py-2.5 bg-yellow-500 text-black rounded-full font-bold flex items-center gap-1 shadow-lg hover:bg-yellow-400 transition-colors animate-pulse-custom text-xs sm:text-xs md:text-sm lg:text-base ${isCurrentQuestion && animateIn ? "animate-fade-in" : ""
                    }`}
                >
                  <ExternalLink size={10} className="sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                  <span>Visit Ad</span>
                </button>

                {/* User Info Section - Moved lower with animation */}
                <div
                  className={`absolute top-8 left-3 sm:top-10 sm:left-4 md:top-12 md:left-6 lg:top-14 lg:left-8 flex items-center space-x-2 z-10 ${isCurrentQuestion && animateIn ? "animate-fade-in-down" : ""
                    }`}
                >
                  <a href={`/profile/${quiz.user.username}`} className="flex items-center space-x-2">
                    <img
                      src={quiz.user.profile_image || "https://backend.testabd.uz/media/defaultuseravatar.png"}
                      alt={quiz.user.username}
                      className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full border border-white"
                    />
                    <div className="flex flex-col">
                      <span className="text-white font-medium text-xs sm:text-sm md:text-base lg:text-lg">
                        @{quiz.user.username}
                      </span>
                    </div>
                  </a>
                </div>

                {/* Question Container with animation */}
                <div
                  className={`absolute top-16 left-3 right-3 sm:top-20 sm:left-4 sm:right-4 md:top-24 md:left-6 md:right-6 lg:top-28 lg:left-8 lg:right-8 bg-black/30 backdrop-blur-md border border-white/20 rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 z-5 ${isCurrentQuestion && animateIn ? "animate-fade-in-down" : ""
                    }`}
                >
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold mb-2 text-white bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Savol
                  </div>
                  <div className="text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed text-white text-opacity-95">
                    {quiz.question_text}
                  </div>
                </div>

                {/* Options Container - Adjusted for different question types with animation */}
                <div
                  className={`absolute ${isTrueFalse
                      ? "top-1/3"
                      : optionsCount <= 3
                        ? "top-1/3"
                        : optionsCount === 4
                          ? "top-[30%]"
                          : "top-[28%]"
                    } left-3 right-3 sm:left-4 sm:right-4 md:left-6 md:right-6 lg:left-8 lg:right-8 z-5 ${optionsCount >= 5 ? "max-h-[45vh]" : ""} ${isCurrentQuestion && animateIn ? "animate-fade-in" : ""
                    }`}
                >
                  {isCurrentQuestion && renderQuestionContent(quiz)}
                </div>

                {/* Sidebar with animation */}
                <div
                  className={`absolute right-2 bottom-20 sm:right-3 sm:bottom-24 md:right-4 md:bottom-28 lg:right-6 lg:bottom-32 flex flex-col gap-3 sm:gap-4 md:gap-5 z-10 ${isCurrentQuestion && animateIn ? "animate-fade-in" : ""
                    }`}
                >
                  {/* Profile Section */}
                  <div className="relative flex flex-col items-center">
                    <a href={`/profile/${quiz.user.username}`}>
                      <img
                        src={
                          quiz.user.profile_image ||
                          "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg"
                        }
                        alt="Profile"
                        className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full border-2 border-white cursor-pointer hover:scale-110 transition-transform object-cover shadow-md"
                      />
                    </a>
                    <button
                      onClick={() => handleFollow(quiz.user.id)}
                      className={`absolute -bottom-0.5 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border border-white flex items-center justify-center font-bold transition-all text-xs sm:text-xs md:text-sm ${quiz.is_following ? "bg-green-500" : "bg-red-500"
                        }`}
                    >
                      {quiz.is_following ? "✓" : "+"}
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col items-center gap-1">
                    <button className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center transition-all">
                      <div className="flex items-center text-green-500">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      </div>
                    </button>
                    <span className="text-xs sm:text-xs md:text-sm font-medium text-white text-center">
                      {quiz.correct_count}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <button className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all">
                      <div className="flex items-center text-red-500">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✗</span>
                        </div>
                      </div>
                    </button>
                    <span className="text-xs sm:text-xs md:text-sm font-medium text-white text-center">
                      {quiz.wrong_count}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => shareQuestion(quiz.id)}
                      className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/30 transition-all"
                    >
                      <Share size={12} className="sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleSave(quiz.id)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center transition-all ${quiz.is_bookmarked
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-black/20 text-white hover:bg-black/30"
                        }`}
                    >
                      <Bookmark
                        size={12}
                        className={`sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 ${quiz.is_bookmarked ? "fill-current" : ""}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Loading Indicator with animation */}
        {loading && (
          <div className="h-screen w-full flex justify-center items-center animate-fade-in">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Share Menu with animation */}
      {showShareMenu && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 animate-fade-in"
            onClick={() => setShowShareMenu(false)}
          ></div>
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 rounded-t-2xl p-4 sm:p-6 md:p-8 z-50 animate-slide-in">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white text-center mb-4 sm:mb-6">Ulashish</h3>
            <div className="grid grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {[
                { name: "WhatsApp", color: "bg-green-500", icon: "📱" },
                { name: "Telegram", color: "bg-blue-500", icon: "✈️" },
                { name: "Instagram", color: "bg-pink-500", icon: "📷" },
                { name: "Facebook", color: "bg-blue-600", icon: "👥" },
                { name: "Copy Link", color: "bg-gray-500", icon: "🔗" },
                { name: "Download", color: "bg-green-600", icon: "⬇️" },
                { name: "Report", color: "bg-red-500", icon: "🚩" },
                { name: "Close", color: "bg-gray-600", icon: "✕" },
              ].map((item, index) => (
                <button
                  key={item.name}
                  onClick={() => setShowShareMenu(false)}
                  className="flex flex-col items-center gap-2 p-2 sm:p-3 md:p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${item.color} rounded-full flex items-center justify-center text-white text-sm sm:text-lg md:text-xl`}
                  >
                    {item.icon}
                  </div>
                  <span className="text-xs sm:text-xs md:text-sm text-gray-300 text-center font-medium">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default QuizPage
