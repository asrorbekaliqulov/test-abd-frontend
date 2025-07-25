"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface StoryItem {
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

interface StoriesViewerProps {
  stories: StoryItem[]
  initialIndex: number
  onClose: () => void
  theme: string
  onQuestionAnswer?: (questionId: number, answerIds: number[], textAnswer?: string) => void
}

export const StoriesViewer: React.FC<StoriesViewerProps> = ({
  stories,
  initialIndex,
  onClose,
  theme,
  onQuestionAnswer,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [textAnswer, setTextAnswer] = useState("")
  const [isAnswered, setIsAnswered] = useState(false)

  // Reset answer state when story changes
  useEffect(() => {
    setSelectedAnswers([])
    setTextAnswer("")
    setIsAnswered(false)
    setProgress(0)
  }, [currentIndex])

  useEffect(() => {
    if (isAnswered) return // Don't auto-advance if user is answering

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1)
            return 0
          } else {
            onClose()
            return 100
          }
        }
        return prev + 1 // Slower progress for questions
      })
    }, 150)

    return () => clearInterval(timer)
  }, [currentIndex, stories.length, onClose, isAnswered])

  const currentStory = stories[currentIndex]

  const handleQuestionAnswer = () => {
    if (currentStory.type === "question" && onQuestionAnswer) {
      if (currentStory.question_type === "text_input") {
        onQuestionAnswer(currentStory.id, [], textAnswer)
      } else {
        onQuestionAnswer(currentStory.id, selectedAnswers)
      }
      setIsAnswered(true)

      // Auto advance after 2 seconds
      setTimeout(() => {
        if (currentIndex < stories.length - 1) {
          setCurrentIndex(currentIndex + 1)
        } else {
          onClose()
        }
      }, 2000)
    }
  }

  const handleAnswerSelect = (answerId: number) => {
    if (isAnswered) return

    if (currentStory.question_type === "multiple") {
      setSelectedAnswers((prev) =>
        prev.includes(answerId) ? prev.filter((id) => id !== answerId) : [...prev, answerId],
      )
    } else {
      setSelectedAnswers([answerId])
      // Auto submit for single choice
      setTimeout(() => handleQuestionAnswer(), 500)
    }
  }

  const renderStoryContent = () => {
    if (currentStory.type === "test") {
      return (
        <div className="h-full flex flex-col justify-center items-center p-6 text-white">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-4 border-white">
              <img
                src={currentStory.user.profile_image || "/placeholder.svg?height=80&width=80"}
                alt={currentStory.user.username}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-bold text-xl mb-2">{currentStory.user.username}</h3>
            <p className="text-sm text-gray-300 mb-4">Yangi test yaratdi</p>
          </div>

          <div className="bg-black bg-opacity-50 rounded-lg p-6 max-w-sm w-full text-center">
            <h4 className="font-bold text-lg mb-3">{currentStory.title}</h4>
            {currentStory.description && <p className="text-sm text-gray-300 mb-4">{currentStory.description}</p>}
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-medium transition-colors">
              Testni boshlash
            </button>
          </div>
        </div>
      )
    }

    // Question story
    return (
      <div className="h-full flex flex-col justify-between p-4 text-white">
        <div className="text-center mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2 border-white">
            <img
              src={currentStory.user.profile_image || "/placeholder.svg?height=64&width=64"}
              alt={currentStory.user.username}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="font-semibold text-lg">{currentStory.user.username}</h3>
          <p className="text-xs text-gray-300">Yangi savol yaratdi</p>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h4 className="text-lg font-semibold mb-6 text-center leading-relaxed">{currentStory.question_text}</h4>

          {currentStory.question_type === "text_input" ? (
            <div className="space-y-4">
              <input
                type="text"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Javobingizni kiriting..."
                disabled={isAnswered}
                className="w-full px-4 py-3 rounded-lg bg-black bg-opacity-50 border border-gray-400 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              />
              <button
                onClick={handleQuestionAnswer}
                disabled={!textAnswer.trim() || isAnswered}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {isAnswered ? "Yuborildi!" : "Yuborish"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {currentStory.answers?.map((answer) => (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerSelect(answer.id)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${selectedAnswers.includes(answer.id)
                      ? "bg-blue-500 bg-opacity-80 border-2 border-blue-400"
                      : "bg-black bg-opacity-50 border border-gray-400 hover:border-gray-300"
                    } disabled:opacity-60`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${selectedAnswers.includes(answer.id) ? "bg-white text-blue-500" : "bg-gray-600 text-white"
                        }`}
                    >
                      {answer.letter}
                    </div>
                    <span>{answer.answer_text}</span>
                  </div>
                </button>
              ))}

              {currentStory.question_type === "multiple" && selectedAnswers.length > 0 && !isAnswered && (
                <button
                  onClick={handleQuestionAnswer}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors mt-4"
                >
                  Javobni yuborish ({selectedAnswers.length} ta)
                </button>
              )}
            </div>
          )}
        </div>

        <div className="text-center text-xs text-gray-400 mt-4">
          {new Date(currentStory.created_at).toLocaleDateString("uz-UZ")}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
      <div className="relative w-full max-w-md h-full max-h-[700px] bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg overflow-hidden">
        {/* Progress bars */}
        <div className="absolute top-4 left-4 right-4 flex space-x-1 z-10">
          {stories.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: index < currentIndex ? "100%" : index === currentIndex ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
        >
          <X size={20} />
        </button>

        {/* Navigation areas */}
        <div className="absolute inset-0 flex">
          <div
            className="flex-1 z-10"
            onClick={() => {
              if (currentIndex > 0) {
                setCurrentIndex(currentIndex - 1)
              }
            }}
          />
          <div
            className="flex-1 z-10"
            onClick={() => {
              if (currentIndex < stories.length - 1) {
                setCurrentIndex(currentIndex + 1)
              } else {
                onClose()
              }
            }}
          />
        </div>

        {/* Story content */}
        {renderStoryContent()}
      </div>
    </div>
  )
}
