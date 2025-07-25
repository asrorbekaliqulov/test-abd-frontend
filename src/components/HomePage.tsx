"use client"
import type React from "react"
import { useState, useEffect } from "react"
import {
  Share,
  Bookmark,
  CheckCircle,
  Sun,
  Moon,
  Loader2,
  X,
  Send,
  Check,
  ThumbsUp,
  ThumbsDown,
  Plus,
} from "lucide-react"
import { quizAPI, authAPI } from "../utils/api"
import { StoriesViewer } from "./stories/StoriesViewer"

interface HomePageProps {
  theme: string
  toggleTheme: () => void
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
  user_attempt_count: number
  difficulty_percentage: number
  user: {
    id: number
    username: string
    profile_image: string | null
    is_badged?: boolean
    is_premium?: boolean
  }
  created_at: string
  is_bookmarked: boolean
}

// Update the Story interface
interface Story {
  id: number
  question_text?: string // for questions
  title?: string // for tests
  description?: string // for tests
  question_type?: string
  answers?: Array<{
    id: number
    letter: string
    answer_text: string
    is_correct: boolean
  }>
  user: {
    id: number
    username: string
    profile_image: string | null
  }
  created_at: string
  type: "test" | "question"
}

const HomePage: React.FC<HomePageProps> = ({ theme, toggleTheme }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, number[]>>(new Map())
  const [answerStates, setAnswerStates] = useState<Map<number, "correct" | "incorrect">>(new Map())
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(false)
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null)
  const [submittingQuestions, setSubmittingQuestions] = useState<Set<number>>(new Set())
  const [textAnswers, setTextAnswers] = useState<Map<number, string>>(new Map())

  // Stories state
  const [showStoriesViewer, setShowStoriesViewer] = useState(false)
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0)
  const [stories, setStories] = useState<Story[]>([])

  const fetchQuizzes = async (url?: string) => {
    setLoading(true)
    try {
      const response = await quizAPI.fetchQuestions(url)
      const data = response.data
      setQuizzes((prev) => [...prev, ...data.results])
      setNextPageUrl(data.next)
    } catch (error) {
      console.error("Savollarni yuklashda xatolik:", error)
    } finally {
      setLoading(false)
    }
  }

  // Update the fetchStories function
  const fetchStories = async () => {
    try {
      const response = await authAPI.fetchStories()
      const data = response.data
      console.log("Fetched stories:", data)

      // Combine tests and questions into a single stories array
      const allStories: Story[] = []

      // Add tests
      if (data.tests && Array.isArray(data.tests)) {
        data.tests.forEach((test: any) => {
          allStories.push({
            ...test,
            type: "test",
          })
        })
      }

      // Add questions
      if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach((question: any) => {
          allStories.push({
            ...question,
            type: "question",
          })
        })
      }

      // Sort by creation date (newest first)
      allStories.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setStories(allStories)
    } catch (error) {
      console.error("Stories yuklashda xatolik:", error)
    }
  }

  useEffect(() => {
    fetchQuizzes()
    fetchStories()
  }, [])

  const shareQuestion = (quizId: number) => {
    const shareUrl = `${window.location.origin}/questions/${quizId}`
    if (navigator.share) {
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

  const saveQuiz = (quizId: number) => {
    quizAPI
      .bookmarkTest({ question: quizId })
      .then((res) => {
        setQuizzes((prev) =>
          prev.map((quiz) => (quiz.id === quizId ? { ...quiz, is_bookmarked: !quiz.is_bookmarked } : quiz)),
        )
      })
      .catch((err) => {
        console.error("Bookmark toggle xatolik:", err)
      })
  }

  const handleSingleChoice = async (quizId: number, answerId: number) => {
    if (answerStates.has(quizId) || submittingQuestions.has(quizId)) return

    setSelectedAnswers((prev) => new Map(prev.set(quizId, [answerId])))
    setSubmittingQuestions((prev) => new Set(prev).add(quizId))

    try {
      const response = await quizAPI.submitAnswers({
        question: quizId,
        selected_answer_ids: [answerId],
        duration: 2,
      })
      console.log("Single choice response:", response.data)
      const isCorrect = response.data.is_correct

      setAnswerStates((prev) => new Map(prev.set(quizId, isCorrect ? "correct" : "incorrect")))

      setQuizzes((prev) =>
        prev.map((quiz) =>
          quiz.id === quizId
            ? {
              ...quiz,
              correct_count: isCorrect ? quiz.correct_count + 1 : quiz.correct_count,
              wrong_count: !isCorrect ? quiz.wrong_count + 1 : quiz.wrong_count,
            }
            : quiz,
        ),
      )
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

  const handleMultipleChoice = (quizId: number, answerId: number) => {
    if (answerStates.has(quizId)) return
    console.log(`Multiple choice selected for quiz ${quizId}:`, answerId)

    setSelectedAnswers((prev) => {
      const current = prev.get(quizId) || []
      const newAnswers = current.includes(answerId) ? current.filter((id) => id !== answerId) : [...current, answerId]
      const updated = new Map(prev)
      updated.set(quizId, newAnswers)
      return updated
    })
  }

  const submitMultipleChoice = async (quizId: number) => {
    const selected = selectedAnswers.get(quizId) || []
    if (selected.length === 0 || submittingQuestions.has(quizId)) return

    setSubmittingQuestions((prev) => new Set(prev).add(quizId))

    try {
      const response = await quizAPI.submitAnswers({
        question: quizId,
        selected_answer_ids: selected,
        duration: 2,
      })
      console.log("Multiple choice response:", response.data)

      const isCorrect = response.data.is_correct

      setAnswerStates((prev) => new Map(prev.set(quizId, isCorrect ? "correct" : "incorrect")))

      setQuizzes((prev) =>
        prev.map((quiz) =>
          quiz.id === quizId
            ? {
              ...quiz,
              correct_count: isCorrect ? quiz.correct_count + 1 : quiz.correct_count,
              wrong_count: !isCorrect ? quiz.wrong_count + 1 : quiz.wrong_count,
            }
            : quiz,
        ),
      )
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
    const textAnswer = textAnswers.get(quizId)
    if (!textAnswer?.trim() || submittingQuestions.has(quizId)) return

    setSubmittingQuestions((prev) => new Set(prev).add(quizId))

    try {
      const response = await quizAPI.submitTextAnswers({
        question: quizId,
        written_answer: textAnswer.trim(),
        duration: 2,
      })
      const isCorrect = response.data.is_correct

      setAnswerStates((prev) => new Map(prev.set(quizId, isCorrect ? "correct" : "incorrect")))

      setQuizzes((prev) =>
        prev.map((quiz) =>
          quiz.id === quizId
            ? {
              ...quiz,
              correct_count: isCorrect ? quiz.correct_count + 1 : quiz.correct_count,
              wrong_count: !isCorrect ? quiz.wrong_count + 1 : quiz.wrong_count,
            }
            : quiz,
        ),
      )
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

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "single":
        return "Bir javobli savol"
      case "multiple":
        return "Ko'p javobli savol"
      case "true_false":
        return "To'g'ri/Noto'g'ri savol"
      case "text_input":
        return "Yozma javob savoli"
      default:
        return "Savol"
    }
  }

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case "single":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      case "multiple":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
      case "true_false":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
      case "text_input":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getOptionStatus = (quizId: number, answerId: number, isCorrect: boolean, questionType: string) => {
    const answerState = answerStates.get(quizId)
    const selected = selectedAnswers.get(quizId) || []
    const isSelected = selected.includes(answerId)

    // If not answered yet, return selection state
    if (!answerState) {
      return isSelected ? "selected" : "default"
    }

    // After answering - show correct/incorrect states
    if (questionType === "multiple") {
      if (isCorrect && isSelected) return "correct-selected" // ✅ correct and selected
      if (!isCorrect && isSelected) return "incorrect-selected" // ❌ incorrect and selected
      if (isCorrect && !isSelected) return "correct-unselected" // ✅ correct but not selected
      return "neutral" // ❌ incorrect and not selected
    }

    // Single choice and true/false
    if (isSelected) {
      return isCorrect ? "correct-selected" : "incorrect-selected"
    }

    // Show correct answer if not selected
    if (isCorrect) {
      return "correct-unselected"
    }

    return "neutral"
  }

  const getOptionStyles = (status: string) => {
    const baseStyles =
      "w-full flex items-center justify-between space-x-3 p-4 sm:p-5 rounded-lg border-2 text-left transition-all duration-200"

    switch (status) {
      case "correct-selected":
        return `${baseStyles} bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-400 dark:text-green-300`
      case "incorrect-selected":
        return `${baseStyles} bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-400 dark:text-red-300`
      case "correct-unselected":
        return `${baseStyles} bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-400 dark:text-green-300 opacity-80`
      case "selected":
        return `${baseStyles} ${theme === "dark" ? "bg-blue-900/30 border-blue-400 text-blue-300" : "bg-blue-50 border-blue-400 text-blue-700"
          }`
      case "neutral":
        return `${baseStyles} ${theme === "dark"
            ? "bg-gray-800 border-gray-600 text-gray-400 opacity-60"
            : "bg-gray-50 border-gray-200 text-gray-400 opacity-60"
          }`
      default:
        return `${baseStyles} ${theme === "dark"
            ? "bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-blue-400 text-white"
            : "bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-400 text-gray-900"
          }`
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 33) return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
    if (difficulty < 66) return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
    return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
  }

  // Check if question is true/false type
  const isTrueFalseQuestion = (quiz: Quiz) => {
    return (
      quiz.question_type === "true_false" ||
      (quiz.answers.length === 2 &&
        quiz.answers.some((answer) => ["true", "to'g'ri", "ha", "yes"].includes(answer.answer_text.toLowerCase())) &&
        quiz.answers.some((answer) => ["false", "noto'g'ri", "yo'q", "no"].includes(answer.answer_text.toLowerCase())))
    )
  }

  const renderQuestionContent = (quiz: Quiz) => {
    const isSubmitting = submittingQuestions.has(quiz.id)
    const answerState = answerStates.get(quiz.id)
    const isAnswered = answerState !== undefined
    const selectedForQuestion = selectedAnswers.get(quiz.id) || []

    if (quiz.question_type === "text_input") {
      return (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={textAnswers.get(quiz.id) || ""}
              onChange={(e) => setTextAnswers((prev) => new Map(prev.set(quiz.id, e.target.value)))}
              placeholder="Javobingizni kiriting..."
              disabled={isAnswered}
              className={`flex-1 px-4 py-3 text-base sm:text-lg rounded-lg border-2 transition-all duration-200 ${answerState === "correct"
                  ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : answerState === "incorrect"
                    ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    : theme === "dark"
                      ? "border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      : "border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                } disabled:opacity-60`}
            />
            <button
              onClick={() => handleTextAnswer(quiz.id)}
              disabled={!textAnswers.get(quiz.id)?.trim() || isAnswered || isSubmitting}
              className={`px-6 py-3 text-base sm:text-lg rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 min-w-[140px] ${answerState === "correct"
                  ? "bg-green-500 text-white"
                  : answerState === "incorrect"
                    ? "bg-red-500 text-white"
                    : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : answerState === "correct" ? (
                <CheckCircle size={20} />
              ) : answerState === "incorrect" ? (
                <X size={20} />
              ) : (
                <Send size={20} />
              )}
              <span>
                {isSubmitting
                  ? "Yuborilmoqda..."
                  : answerState
                    ? answerState === "correct"
                      ? "To'g'ri"
                      : "Noto'g'ri"
                    : "Yuborish"}
              </span>
            </button>
          </div>
        </div>
      )
    }

    if (quiz.question_type === "multiple") {
      return (
        <div className="space-y-4">
          <div className="grid gap-3 sm:gap-4">
            {quiz.answers.map((option) => {
              const status = getOptionStatus(quiz.id, option.id, option.is_correct, quiz.question_type)
              const isSelected = selectedForQuestion.includes(option.id)

              const checkboxClass = `
                w-6 h-6 rounded border-2 flex items-center justify-center transition-colors duration-200
                ${status === "correct-selected" || status === "correct-unselected"
                  ? "bg-green-500 border-green-500 text-white"
                  : status === "incorrect-selected"
                    ? "bg-red-500 border-red-500 text-white"
                    : isSelected
                      ? "bg-blue-500 border-blue-500 text-white"
                      : theme === "dark"
                        ? "bg-gray-700 border-gray-500"
                        : "bg-white border-gray-300"
                }
              `

              return (
                <button
                  key={option.id}
                  onClick={() => handleMultipleChoice(quiz.id, option.id)}
                  disabled={isAnswered}
                  className={getOptionStyles(status)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={checkboxClass}>
                      {(isSelected || status === "correct-unselected") && <Check size={16} />}
                    </div>
                    <span className="flex-1 text-base sm:text-lg">{option.answer_text}</span>
                  </div>

                  {status === "correct-selected" && <Check size={22} className="text-green-500" />}
                  {status === "incorrect-selected" && <X size={22} className="text-red-500" />}
                  {status === "correct-unselected" && <Check size={22} className="text-green-500" />}
                </button>
              )
            })}
          </div>

          {selectedForQuestion.length > 0 && !isAnswered && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => submitMultipleChoice(quiz.id)}
                disabled={isSubmitting}
                className="px-8 py-4 text-base sm:text-lg bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Yuborilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Javobni yuborish ({selectedForQuestion.length} ta tanlangan)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )
    }

    // For true/false questions
    if (isTrueFalseQuestion(quiz)) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {quiz.answers.map((option) => {
            const status = getOptionStatus(quiz.id, option.id, option.is_correct, quiz.question_type)
            const isSelected = selectedForQuestion.includes(option.id)

            // Determine if this is the "true" option
            const isTrue = ["true", "to'g'ri", "ha", "yes"].includes(option.answer_text.toLowerCase())

            const buttonClass = `flex flex-col items-center justify-center gap-3 p-6 sm:p-8 rounded-xl border-2 text-center transition-all duration-200 min-h-[120px] ${status === "correct-selected" || status === "correct-unselected"
                ? "bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-400 dark:text-green-300"
                : status === "incorrect-selected"
                  ? "bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-400 dark:text-red-300"
                  : status === "neutral"
                    ? theme === "dark"
                      ? "bg-gray-800 border-gray-600 text-gray-500 opacity-60"
                      : "bg-gray-50 border-gray-200 text-gray-400 opacity-60"
                    : theme === "dark"
                      ? "bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-blue-400 text-white"
                      : "bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-400 text-gray-900"
              } disabled:cursor-not-allowed`

            return (
              <button
                key={option.id}
                onClick={() => handleSingleChoice(quiz.id, option.id)}
                disabled={isAnswered || isSubmitting}
                className={buttonClass}
              >
                {isTrue ? (
                  <ThumbsUp size={32} className="text-green-500" />
                ) : (
                  <ThumbsDown size={32} className="text-red-500" />
                )}
                <span className="text-lg sm:text-xl font-semibold">{option.answer_text}</span>
                {isSubmitting && isSelected && <Loader2 size={20} className="animate-spin text-blue-500" />}
                {status === "correct-selected" && <Check size={24} className="text-green-500" />}
                {status === "incorrect-selected" && <X size={24} className="text-red-500" />}
                {status === "correct-unselected" && <Check size={24} className="text-green-500" />}
              </button>
            )
          })}
        </div>
      )
    }

    // For single choice questions
    return (
      <div className="grid gap-3 sm:gap-4">
        {quiz.answers.map((option) => {
          const status = getOptionStatus(quiz.id, option.id, option.is_correct, quiz.question_type)
          const isSelected = selectedForQuestion.includes(option.id)

          const letterClass = `w-10 h-10 rounded-full flex items-center justify-center text-base font-bold transition-all duration-200 ${status === "correct-selected" || status === "correct-unselected"
              ? "bg-green-500 text-white"
              : status === "incorrect-selected"
                ? "bg-red-500 text-white"
                : status === "neutral"
                  ? theme === "dark"
                    ? "bg-gray-600 text-gray-400"
                    : "bg-gray-200 text-gray-400"
                  : theme === "dark"
                    ? "bg-gray-600 text-gray-200"
                    : "bg-gray-200 text-gray-600"
            }`

          return (
            <button
              key={option.id}
              onClick={() => handleSingleChoice(quiz.id, option.id)}
              disabled={isAnswered || isSubmitting}
              className={getOptionStyles(status)}
            >
              <div className="flex items-center space-x-3">
                <div className={letterClass}>{option.letter}</div>
                <span className="flex-1 text-base sm:text-lg">{option.answer_text}</span>
              </div>
              {isSubmitting && isSelected && <Loader2 size={20} className="animate-spin text-blue-500" />}
              {status === "correct-selected" && <Check size={22} className="text-green-500" />}
              {status === "incorrect-selected" && <X size={22} className="text-red-500" />}
              {status === "correct-unselected" && <Check size={22} className="text-green-500" />}
            </button>
          )
        })}
      </div>
    )
  }

  // Add function to handle story question answers
  const handleStoryQuestionAnswer = async (questionId: number, answerIds: number[], textAnswer?: string) => {
    try {
      if (textAnswer) {
        await quizAPI.submitTextAnswers({
          question: questionId,
          written_answer: textAnswer,
          duration: 2,
        })
      } else {
        await quizAPI.submitAnswers({
          question: questionId,
          selected_answer_ids: answerIds,
          duration: 2,
        })
      }
      console.log("Story question answered successfully")
    } catch (error) {
      console.error("Story question answer error:", error)
    }
  }

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}
    >
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 backdrop-blur-lg border-b z-50 ${theme === "dark" ? "bg-gray-800/80 border-gray-700" : "bg-white/80 border-gray-200"
          }`}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/placeholder.svg?height=32&width=32" alt="TestAbd" className="h-8 w-8 rounded-full" />
              <h1 className="text-xl font-bold text-blue-600">TestAbd</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-200 ${theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"
                  }`}
              >
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stories Section */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pt-20 pb-4">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {/* Add Story Button */}
          <div className="flex-shrink-0">
            <button className="flex flex-col items-center space-y-2">
              <div
                className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center ${theme === "dark" ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-gray-100"
                  }`}
              >
                <Plus size={24} className={theme === "dark" ? "text-gray-400" : "text-gray-500"} />
              </div>
              <span className="text-xs text-center max-w-[70px] truncate">Qo'shish</span>
            </button>
          </div>

          {/* Stories */}
          {stories.map((story, index) => (
            <div key={`${story.type}-${story.id}`} className="flex-shrink-0">
              <button
                onClick={() => {
                  setSelectedStoryIndex(index)
                  setShowStoriesViewer(true)
                }}
                className="flex flex-col items-center space-y-2"
              >
                <div
                  className={`w-16 h-16 rounded-full p-0.5 ${story.type === "test"
                      ? "bg-gradient-to-tr from-blue-400 to-purple-600"
                      : "bg-gradient-to-tr from-green-400 to-blue-500"
                    }`}
                >
                  <div
                    className={`w-full h-full rounded-full overflow-hidden border-2 ${theme === "dark" ? "border-gray-800" : "border-white"
                      }`}
                  >
                    <img
                      src={story.user.profile_image || "/placeholder.svg?height=60&width=60"}
                      alt={story.user.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <span className="text-xs text-center max-w-[70px] truncate">{story.user.username}</span>
                <div
                  className={`text-xs px-2 py-0.5 rounded-full ${story.type === "test"
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                      : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300"
                    }`}
                >
                  {story.type === "test" ? "Test" : "Savol"}
                </div>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Stories Viewer Modal */}
      {showStoriesViewer && (
        <StoriesViewer
          stories={stories}
          initialIndex={selectedStoryIndex}
          onClose={() => setShowStoriesViewer(false)}
          theme={theme}
          onQuestionAnswer={handleStoryQuestionAnswer}
        />
      )}

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pb-24">
        {/* Quizzes */}
        <section className="space-y-6">
          {quizzes.map((quiz, index) => (
            <article
              key={`quiz-${quiz.id}-${index}`}
              className={`rounded-2xl p-4 sm:p-6 shadow-lg border transition-all duration-200 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                        }`}
                    >
                      {quiz.user.profile_image ? (
                        <img
                          src={quiz.user.profile_image || "/placeholder.svg?height=40&width=40"}
                          alt="avatar"
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-lg font-bold text-gray-600">
                          {quiz.user.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-1">
                        <span className={`font-semibold text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                          {quiz.user.username}
                        </span>
                        {quiz.user.is_badged && <CheckCircle size={16} className="text-blue-500" />}
                        {quiz.user.is_premium && (
                          <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
                            PRO
                          </span>
                        )}
                      </div>
                      <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        {new Date(quiz.created_at).toLocaleDateString("uz-UZ")}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                      quiz.difficulty_percentage,
                    )}`}
                  >
                    {quiz.difficulty_percentage.toFixed(1)}% qiyinlik
                  </div>
                </div>
              </div>

              {/* Question Type Badge */}
              <div className="mb-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(quiz.question_type)}`}
                >
                  {getQuestionTypeLabel(quiz.question_type)}
                </span>
              </div>

              {/* Question */}
              <div className="mb-6">
                <h2
                  className={`text-lg sm:text-xl font-semibold mb-6 leading-relaxed ${theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                >
                  {quiz.question_text}
                </h2>
                {renderQuestionContent(quiz)}
              </div>

              {/* Footer */}
              <div
                className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 border-t mb-2 ${theme === "dark" ? "border-gray-700" : "border-gray-200"
                  }`}
              >
                <div className="flex space-x-6">
                  <div className="flex items-center space-x-2 text-green-600">
                    <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <span className="font-semibold text-base">{quiz.correct_count}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-red-600">
                    <div className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✗</span>
                    </div>
                    <span className="font-semibold text-base">{quiz.wrong_count}</span>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    className={`p-3 rounded-full transition-all duration-200 ${theme === "dark" ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                      }`}
                    onClick={() => shareQuestion(quiz.id)}
                  >
                    <Share size={20} />
                  </button>
                  <button
                    onClick={() => saveQuiz(quiz.id)}
                    className={`p-3 rounded-full transition-all duration-200 ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      }`}
                  >
                    <Bookmark
                      size={20}
                      className={
                        quiz.is_bookmarked
                          ? "text-yellow-500 fill-current"
                          : theme === "dark"
                            ? "text-gray-400"
                            : "text-gray-600"
                      }
                    />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {nextPageUrl && (
          <div className="text-center mt-8 mb-8">
            <button
              onClick={() => fetchQuizzes(nextPageUrl)}
              disabled={loading}
              className={`px-8 py-4 text-base sm:text-lg font-semibold rounded-full transition-all duration-200 disabled:opacity-50 ${theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 size={20} className="animate-spin" />
                  <span>Yuklanmoqda...</span>
                </div>
              ) : (
                "Ko'proq yuklash"
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default HomePage
