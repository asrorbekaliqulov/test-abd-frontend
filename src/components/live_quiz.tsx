import React, { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Clock,
  Calendar,
  Play,
  ChevronRight,
  CheckCircle,
  Loader2,
  Sun,
  Moon
} from 'lucide-react'
import { TimeSlider } from './live_quiz/TimeSlider'
import { DateTimePicker } from './live_quiz/DateTimePicker'
import { TestSelector } from './live_quiz/TestSelector'
import { ProgressionSettings } from './live_quiz/PerogressionSettings'
// import { quizAPI } from '../utils/api'

interface CreateLiveQuizProps {
  theme: string
  toggleTheme: () => void
}

interface Test {
  id: number
  title: string
  description?: string
  question_count: number
  user: {
    id: number
    username: string
    profile_image?: string
  }
  created_at: string
  difficulty_level?: string
  is_public: boolean
}

interface LiveQuizSettings {
  mode: 'immediate' | 'scheduled'
  selectedTest: Test | null
  timePerQuestion: number
  progressionType: 'admin' | 'first_answer'
  adminTimeout: number // minutes for admin timeout
  scheduledStart?: Date
  scheduledEnd?: Date
}

const CreateLiveQuiz: React.FC<CreateLiveQuizProps> = ({ theme, toggleTheme }) => {
  const [currentStep, setCurrentStep] = useState<'mode' | 'test_selection' | 'settings' | 'schedule'>('mode')
  const [settings, setSettings] = useState<LiveQuizSettings>({
    mode: 'immediate',
    selectedTest: null,
    timePerQuestion: 30,
    progressionType: 'admin',
    adminTimeout: 1
  })
  const [loading, setLoading] = useState(false)
  const [tests, setTests] = useState<{
    myTests: Test[]
    publicTests: Test[]
  }>({
    myTests: [],
    publicTests: []
  })
  const [creating, setCreating] = useState(false)

  const fetchTests = useCallback(async () => {
    setLoading(true)
    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockMyTests: Test[] = [
        {
          id: 1,
          title: "Matematika asoslari",
          description: "Algebra va geometriya savollari",
          question_count: 25,
          user: { id: 1, username: "current_user", profile_image: "/avatar1.jpg" },
          created_at: "2024-01-15T10:00:00Z",
          difficulty_level: "oson",
          is_public: true
        },
        {
          id: 2,
          title: "Tarix bilimi",
          description: "O'zbekiston tarixi savollari",
          question_count: 30,
          user: { id: 1, username: "current_user", profile_image: "/avatar1.jpg" },
          created_at: "2024-01-14T15:30:00Z",
          difficulty_level: "o'rta",
          is_public: false
        }
      ]

      const mockPublicTests: Test[] = [
        {
          id: 3,
          title: "Ingliz tili grammatikasi",
          description: "Elementary seviya",
          question_count: 20,
          user: { id: 2, username: "teacher_john", profile_image: "/avatar2.jpg" },
          created_at: "2024-01-16T09:00:00Z",
          difficulty_level: "oson",
          is_public: true
        },
        {
          id: 4,
          title: "Fizika qonunlari",
          description: "Mexanika va optika",
          question_count: 35,
          user: { id: 3, username: "physics_expert", profile_image: "/avatar3.jpg" },
          created_at: "2024-01-13T14:20:00Z",
          difficulty_level: "qiyin",
          is_public: true
        },
        {
          id: 5,
          title: "Kimyo elementlari",
          description: "Davriy jadval va birikmalar",
          question_count: 28,
          user: { id: 4, username: "chem_master", profile_image: "/avatar4.jpg" },
          created_at: "2024-01-12T11:45:00Z",
          difficulty_level: "o'rta",
          is_public: true
        }
      ]

      setTests({
        myTests: mockMyTests,
        publicTests: mockPublicTests
      })
    } catch (error) {
      console.error('Testlarni yuklashda xatolik:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTests()
  }, [fetchTests])

  const handleModeSelect = (mode: 'immediate' | 'scheduled') => {
    setSettings(prev => ({ ...prev, mode }))
    setCurrentStep('test_selection')
  }

  const handleTestSelect = (test: Test) => {
    setSettings(prev => ({ ...prev, selectedTest: test }))
    setCurrentStep('settings')
  }

  const handleSettingsComplete = () => {
    if (settings.mode === 'scheduled') {
      setCurrentStep('schedule')
    } else {
      handleCreateLiveQuiz()
    }
  }

  const handleScheduleComplete = (startDate: Date, endDate: Date) => {
    setSettings(prev => ({
      ...prev,
      scheduledStart: startDate,
      scheduledEnd: endDate
    }))
    handleCreateLiveQuiz()
  }

  const handleCreateLiveQuiz = async () => {
    setCreating(true)
    try {
      const payload = {
        test_id: settings.selectedTest?.id,
        time_per_question: settings.timePerQuestion,
        progression_type: settings.progressionType,
        admin_timeout: settings.adminTimeout,
        mode: settings.mode,
        ...(settings.mode === 'scheduled' && {
          scheduled_start: settings.scheduledStart?.toISOString(),
          scheduled_end: settings.scheduledEnd?.toISOString()
        })
      }

      console.log('Jonli viktorina yaratilmoqda:', payload)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirect to live quiz room or dashboard
      window.location.href = '/live-quiz-room/123'
    } catch (error) {
      console.error('Jonli viktorina yaratishda xatolik:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleBack = () => {
    switch (currentStep) {
      case 'test_selection':
        setCurrentStep('mode')
        break
      case 'settings':
        setCurrentStep('test_selection')
        break
      case 'schedule':
        setCurrentStep(settings.mode === 'immediate' ? 'settings' : 'test_selection')
        break
      default:
        window.location.href = '/'
    }
  }

  const renderModeSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className={`text-2xl sm:text-3xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Jonli viktorina yaratish
        </h2>
        <p className={`text-base sm:text-lg ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Qanday tarzda viktorina o'tkazishni xohlaysiz?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button
          onClick={() => handleModeSelect('immediate')}
          className={`p-8 rounded-2xl border-2 transition-all duration-300 hover:scale-105 transform group ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600 hover:border-blue-500 hover:shadow-2xl'
              : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-blue-500 hover:shadow-2xl'
          }`}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center group-hover:animate-pulse">
              <Play size={32} className="text-white" />
            </div>
            <h3 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Hozir boshlash
            </h3>
            <p className={`text-center text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Darhol jonli viktorina yarating va ishtirokchilarni kutib oling
            </p>
            <div className="flex items-center space-x-2 mt-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-green-300' : 'text-green-600'
              }`}>
                Tezkor
              </span>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleModeSelect('scheduled')}
          className={`p-8 rounded-2xl border-2 transition-all duration-300 hover:scale-105 transform group ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600 hover:border-blue-500 hover:shadow-2xl'
              : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-blue-500 hover:shadow-2xl'
          }`}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center group-hover:animate-pulse">
              <Calendar size={32} className="text-white" />
            </div>
            <h3 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Rejalashtirish
            </h3>
            <p className={`text-center text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Kelajakdagi sana va vaqt uchun viktorina rejalashtiring
            </p>
            <div className="flex items-center space-x-2 mt-4">
              <Clock size={16} className={theme === 'dark' ? 'text-blue-300' : 'text-blue-500'} />
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
              }`}>
                Rejalashtirilgan
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  )

  if (creating) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className={`rounded-2xl p-8 max-w-md mx-4 text-center ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border shadow-2xl`}>
          <div className="animate-spin mb-4">
            <Loader2 size={48} className="text-blue-500 mx-auto" />
          </div>
          <h3 className={`text-xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Jonli viktorina yaratilmoqda...
          </h3>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Iltimos biroz kuting
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 backdrop-blur-lg border-b z-50 transition-all duration-300 ${
        theme === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 transform ${
                  theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-2">
                <img src="/live-quiz.png" alt="TestAbd" className="h-8 w-8 rounded-full" />
                <h1 className="text-xl font-bold text-blue-600">TestAbd</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 transform ${
                  theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-8">
        {currentStep === 'mode' && renderModeSelection()}

        {currentStep === 'test_selection' && (
          <TestSelector
            theme={theme}
            tests={tests}
            loading={loading}
            onTestSelect={handleTestSelect}
            selectedMode={settings.mode}
          />
        )}

        {currentStep === 'settings' && settings.selectedTest && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className={`text-2xl sm:text-3xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Viktorina sozlamalari
              </h2>
              <p className={`text-base ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {settings.selectedTest.title} uchun sozlamalarni tanlang
              </p>
            </div>

            <div className="space-y-8">
              <TimeSlider
                theme={theme}
                value={settings.timePerQuestion}
                onChange={(value) => setSettings(prev => ({ ...prev, timePerQuestion: value }))}
              />

              <ProgressionSettings
                theme={theme}
                value={settings.progressionType}
                onChange={(value) => setSettings(prev => ({ ...prev, progressionType: value }))}
                adminTimeout={settings.adminTimeout}
                onAdminTimeoutChange={(timeout) => setSettings(prev => ({ ...prev, adminTimeout: timeout }))}
              />

              <div className="flex justify-center pt-6">
                <button
                  onClick={handleSettingsComplete}
                  className="px-8 py-4 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all duration-200 hover:scale-105 transform flex items-center space-x-2 shadow-lg"
                >
                  <CheckCircle size={20} />
                  <span>Davom etish</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'schedule' && settings.selectedTest && (
          <DateTimePicker
            theme={theme}
            selectedTest={settings.selectedTest}
            onComplete={handleScheduleComplete}
            settings={settings}
          />
        )}
      </main>
    </div>
  )
}

export default CreateLiveQuiz