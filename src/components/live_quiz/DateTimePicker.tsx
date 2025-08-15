import React, { useState } from 'react'
import { Calendar, Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'

interface Test {
  id: number
  title: string
  question_count: number
}

interface LiveQuizSettings {
  mode: 'immediate' | 'scheduled'
  selectedTest: Test | null
  timePerQuestion: number
  progressionType: 'admin' | 'first_answer'
  adminTimeout: number
}

interface DateTimePickerProps {
  theme: string
  selectedTest: Test
  onComplete: (startDate: Date, endDate: Date) => void
  settings: LiveQuizSettings
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  theme,
  selectedTest,
  onComplete,
  settings
}) => {
  const [startDate, setStartDate] = useState<Date>(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    return tomorrow
  })
  
  const [endDate, setEndDate] = useState<Date>(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(11, 0, 0, 0)
    return tomorrow
  })
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [showStartTimePicker, setShowStartTimePicker] = useState(false)
  const [showEndTimePicker, setShowEndTimePicker] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const isValidDateTime = () => {
    const now = new Date()
    const timeDifference = endDate.getTime() - startDate.getTime()
    const minDuration = 5 * 60 * 1000 // 5 minutes
    const estimatedDuration = selectedTest.question_count * settings.timePerQuestion * 1000

    return (
      startDate > now &&
      endDate > startDate &&
      timeDifference >= minDuration &&
      timeDifference >= estimatedDuration
    )
  }

  const getEstimatedDuration = () => {
    return Math.ceil((selectedTest.question_count * settings.timePerQuestion) / 60)
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('uz-UZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const generateTimeOptions = () => {
    const times = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        times.push({
          hour,
          minute,
          display: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        })
      }
    }
    return times
  }

  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      days.push(day)
    }
    return days
  }

  const DatePickerModal = ({ 
    isOpen, 
    onClose, 
    selectedDate, 
    onDateSelect, 
    title 
  }: {
    isOpen: boolean
    onClose: () => void
    selectedDate: Date
    onDateSelect: (date: Date) => void
    title: string
  }) => {
    if (!isOpen) return null

    const days = generateCalendarDays(currentMonth)
    const monthNames = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ]
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className={`rounded-2xl p-6 max-w-md w-full mx-4 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border shadow-2xl`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {title}
            </h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              ×
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <span className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map(day => (
                <div key={day} className={`text-center text-sm font-medium py-2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                const isSelected = day.toDateString() === selectedDate.toDateString()
                const isPast = day < today
                const isToday = day.toDateString() === today.toDateString()

                return (
                  <button
                    key={index}
                    onClick={() => !isPast && onDateSelect(day)}
                    disabled={isPast}
                    className={`h-10 w-full rounded-lg text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : isPast
                          ? 'text-gray-300 cursor-not-allowed'
                          : isCurrentMonth
                            ? theme === 'dark'
                              ? 'text-white hover:bg-gray-700'
                              : 'text-gray-900 hover:bg-gray-100'
                            : theme === 'dark'
                              ? 'text-gray-600 hover:bg-gray-700'
                              : 'text-gray-400 hover:bg-gray-100'
                    } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    {day.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Bekor qilish
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Tanlash
            </button>
          </div>
        </div>
      </div>
    )
  }

  const TimePickerModal = ({ 
    isOpen, 
    onClose, 
    selectedDate, 
    onTimeSelect, 
    title 
  }: {
    isOpen: boolean
    onClose: () => void
    selectedDate: Date
    onTimeSelect: (hour: number, minute: number) => void
    title: string
  }) => {
    if (!isOpen) return null

    const timeOptions = generateTimeOptions()

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className={`rounded-2xl p-6 max-w-md w-full mx-4 max-h-96 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border shadow-2xl`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {title}
            </h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              ×
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto">
            <div className="grid grid-cols-4 gap-2">
              {timeOptions.map(time => (
                <button
                  key={time.display}
                  onClick={() => {
                    onTimeSelect(time.hour, time.minute)
                    onClose()
                  }}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedDate.getHours() === time.hour && selectedDate.getMinutes() === time.minute
                      ? 'bg-blue-500 text-white'
                      : theme === 'dark'
                        ? 'text-white hover:bg-gray-700'
                        : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {time.display}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className={`text-2xl sm:text-3xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Vaqtni rejalashtirish
        </h2>
        <p className={`text-base ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          <strong>{selectedTest.title}</strong> uchun boshlanish va tugash vaqtini tanlang
        </p>
      </div>

      {/* Test Info */}
      <div className={`rounded-2xl p-6 border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow-lg`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Test ma'lumotlari
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {selectedTest.question_count}
            </div>
            <div className={`text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Savollar soni
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`}>
              {settings.timePerQuestion}s
            </div>
            <div className={`text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Har savol uchun
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
            }`}>
              ~{getEstimatedDuration()}min
            </div>
            <div className={`text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Taxminiy davomiyligi
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
            }`}>
              {settings.progressionType === 'admin' ? `${settings.adminTimeout}min` : 'Avtomatik'}
            </div>
            <div className={`text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {settings.progressionType === 'admin' ? 'Admin kutish' : 'Tezkor o\'tish'}
            </div>
          </div>
        </div>
      </div>

      {/* DateTime Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start DateTime */}
        <div className={`rounded-2xl p-6 border shadow-lg ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Calendar size={20} className="text-green-500" />
            </div>
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Boshlanish vaqti
            </h3>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowStartDatePicker(true)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 hover:scale-[1.02] ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 hover:border-green-500 text-white'
                  : 'border-gray-200 bg-gray-50 hover:border-green-500 text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-green-500" />
                <span className="font-medium">
                  {startDate.toLocaleDateString('uz-UZ', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </button>

            <button
              onClick={() => setShowStartTimePicker(true)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 hover:scale-[1.02] ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 hover:border-green-500 text-white'
                  : 'border-gray-200 bg-gray-50 hover:border-green-500 text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock size={16} className="text-green-500" />
                <span className="font-medium">
                  {startDate.toLocaleTimeString('uz-UZ', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* End DateTime */}
        <div className={`rounded-2xl p-6 border shadow-lg ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <Calendar size={20} className="text-red-500" />
            </div>
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Tugash vaqti
            </h3>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowEndDatePicker(true)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 hover:scale-[1.02] ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 hover:border-red-500 text-white'
                  : 'border-gray-200 bg-gray-50 hover:border-red-500 text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-red-500" />
                <span className="font-medium">
                  {endDate.toLocaleDateString('uz-UZ', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </button>

            <button
              onClick={() => setShowEndTimePicker(true)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 hover:scale-[1.02] ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 hover:border-red-500 text-white'
                  : 'border-gray-200 bg-gray-50 hover:border-red-500 text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock size={16} className="text-red-500" />
                <span className="font-medium">
                  {endDate.toLocaleTimeString('uz-UZ', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      {!isValidDateTime() && (
        <div className={`p-4 rounded-xl border-2 border-red-500 ${
          theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
        }`}>
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} className="text-red-500" />
            <h4 className="font-medium text-red-500">Vaqt xatosi</h4>
          </div>
          <ul className={`mt-2 text-sm space-y-1 ${
            theme === 'dark' ? 'text-red-300' : 'text-red-600'
          }`}>
            {startDate <= new Date() && (
              <li>• Boshlanish vaqti kelajakda bo'lishi kerak</li>
            )}
            {endDate <= startDate && (
              <li>• Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak</li>
            )}
            {(endDate.getTime() - startDate.getTime()) < (5 * 60 * 1000) && (
              <li>• Kamida 5 daqiqa davomiyligi bo'lishi kerak</li>
            )}
            {(endDate.getTime() - startDate.getTime()) < (selectedTest.question_count * settings.timePerQuestion * 1000) && (
              <li>• Barcha savollar uchun yetarli vaqt ajratilmagan</li>
            )}
          </ul>
        </div>
      )}

      {/* Summary */}
      {isValidDateTime() && (
        <div className={`p-6 rounded-xl border-2 border-green-500 ${
          theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50'
        }`}>
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle size={20} className="text-green-500" />
            <h4 className="font-medium text-green-500">Rejalashtirish tayyor</h4>
          </div>
          <div className={`text-sm ${
            theme === 'dark' ? 'text-green-300' : 'text-green-600'
          }`}>
            <p><strong>Boshlanadi:</strong> {formatDateTime(startDate)}</p>
            <p><strong>Tugaydi:</strong> {formatDateTime(endDate)}</p>
            <p><strong>Davomiyligi:</strong> {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))} daqiqa</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center pt-6">
        <button
          onClick={() => onComplete(startDate, endDate)}
          disabled={!isValidDateTime()}
          className={`px-8 py-4 font-semibold rounded-xl transition-all duration-200 hover:scale-105 transform flex items-center space-x-2 shadow-lg ${
            isValidDateTime()
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <CheckCircle size={20} />
          <span>Jonli viktorina yaratish</span>
        </button>
      </div>

      {/* Modals */}
      <DatePickerModal
        isOpen={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        selectedDate={startDate}
        onDateSelect={(date) => {
          const newStartDate = new Date(date)
          newStartDate.setHours(startDate.getHours(), startDate.getMinutes())
          setStartDate(newStartDate)
          
          // Auto-adjust end date if needed
          if (newStartDate >= endDate) {
            const newEndDate = new Date(newStartDate)
            newEndDate.setTime(newEndDate.getTime() + 60 * 60 * 1000) // +1 hour
            setEndDate(newEndDate)
          }
        }}
        title="Boshlanish sanasini tanlang"
      />

      <DatePickerModal
        isOpen={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        selectedDate={endDate}
        onDateSelect={(date) => {
          const newEndDate = new Date(date)
          newEndDate.setHours(endDate.getHours(), endDate.getMinutes())
          setEndDate(newEndDate)
        }}
        title="Tugash sanasini tanlang"
      />

      <TimePickerModal
        isOpen={showStartTimePicker}
        onClose={() => setShowStartTimePicker(false)}
        selectedDate={startDate}
        onTimeSelect={(hour, minute) => {
          const newStartDate = new Date(startDate)
          newStartDate.setHours(hour, minute)
          setStartDate(newStartDate)

          // Auto-adjust end date if needed
          if (newStartDate >= endDate) {
            const newEndDate = new Date(newStartDate)
            newEndDate.setTime(newEndDate.getTime() + 60 * 60 * 1000) // +1 hour
            setEndDate(newEndDate)
          }
        }}
        title="Boshlanish vaqtini tanlang"
      />

      <TimePickerModal
        isOpen={showEndTimePicker}
        onClose={() => setShowEndTimePicker(false)}
        selectedDate={endDate}
        onTimeSelect={(hour, minute) => {
          const newEndDate = new Date(endDate)
          newEndDate.setHours(hour, minute)
          setEndDate(newEndDate)
        }}
        title="Tugash vaqtini tanlang"
      />
    </div>
  )
}