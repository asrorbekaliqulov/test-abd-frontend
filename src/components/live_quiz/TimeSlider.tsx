import React, { useState, useRef, useEffect } from 'react'
import { Timer, Clock } from 'lucide-react'

interface TimeSliderProps {
  theme: string
  value: number
  onChange: (value: number) => void
}

export const TimeSlider: React.FC<TimeSliderProps> = ({ theme, value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  const min = 3
  const max = 60

  const getPercentage = () => {
    return ((value - min) / (max - min)) * 100
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setShowTooltip(true)
    updateValue(e)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      updateValue(e)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setShowTooltip(false)
  }

  const updateValue = (e: MouseEvent | React.MouseEvent) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const newValue = Math.round(min + (percentage / 100) * (max - min))
    onChange(newValue)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])

  const getTimeColor = () => {
    if (value <= 10) return 'text-red-500'
    if (value <= 30) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getSliderColor = () => {
    if (value <= 10) return 'from-red-500 to-red-600'
    if (value <= 30) return 'from-yellow-500 to-yellow-600'
    return 'from-green-500 to-green-600'
  }

  return (
    <div className={`rounded-2xl p-6 border shadow-lg ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Timer size={24} className="text-white" />
        </div>
        <div>
          <h3 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Har bir savol uchun vaqt
          </h3>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            3 dan 60 sekundgacha tanlang
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Time Display */}
        <div className="text-center">
          <div className={`inline-flex items-center space-x-2 px-6 py-3 rounded-xl border-2 ${
            theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <Clock size={24} className={getTimeColor()} />
            <span className={`text-3xl font-bold ${getTimeColor()}`}>
              {value}
            </span>
            <span className={`text-lg font-medium ${getTimeColor()}`}>
              soniya
            </span>
          </div>
        </div>

        {/* Custom Slider */}
        <div className="relative px-4">
          <div
            ref={sliderRef}
            className={`relative h-6 rounded-full cursor-pointer transition-all duration-200 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            } ${isDragging ? 'scale-y-125' : ''}`}
            onMouseDown={handleMouseDown}
          >
            {/* Progress Track */}
            <div
              className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${getSliderColor()} transition-all duration-200`}
              style={{ width: `${getPercentage()}%` }}
            />
            
            {/* Thumb */}
            <div
              className={`absolute top-1/2 w-8 h-8 -mt-4 -ml-4 rounded-full shadow-lg cursor-grab transition-all duration-200 transform ${
                isDragging ? 'scale-125 cursor-grabbing' : 'hover:scale-110'
              } bg-gradient-to-br ${getSliderColor()}`}
              style={{ left: `${getPercentage()}%` }}
            >
              <div className="w-full h-full rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>

            {/* Tooltip */}
            {showTooltip && (
              <div
                className={`absolute -top-12 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform -translate-x-1/2 ${
                  theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white'
                } shadow-lg animate-fadeIn`}
                style={{ left: `${getPercentage()}%` }}
              >
                {value}s
                <div className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${
                  theme === 'dark' ? 'border-t-gray-700' : 'border-t-gray-900'
                }`} />
              </div>
            )}
          </div>

          {/* Scale Markers */}
          <div className="flex justify-between mt-4 text-xs font-medium">
            {[3, 10, 20, 30, 40, 50, 60].map((time) => (
              <button
                key={time}
                onClick={() => onChange(time)}
                className={`px-2 py-1 rounded transition-all duration-200 hover:scale-110 transform ${
                  value === time
                    ? theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {time}s
              </button>
            ))}
          </div>
        </div>

        {/* Time Categories */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className={`text-center p-3 rounded-xl border-2 transition-all duration-200 ${
            value <= 10
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : theme === 'dark'
                ? 'border-gray-600 bg-gray-700'
                : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="text-red-500 font-semibold">Tez</div>
            <div className="text-xs text-gray-500">3-10 soniya</div>
          </div>
          <div className={`text-center p-3 rounded-xl border-2 transition-all duration-200 ${
            value > 10 && value <= 30
              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
              : theme === 'dark'
                ? 'border-gray-600 bg-gray-700'
                : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="text-yellow-500 font-semibold">O'rta</div>
            <div className="text-xs text-gray-500">11-30 soniya</div>
          </div>
          <div className={`text-center p-3 rounded-xl border-2 transition-all duration-200 ${
            value > 30
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : theme === 'dark'
                ? 'border-gray-600 bg-gray-700'
                : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="text-green-500 font-semibold">Sekin</div>
            <div className="text-xs text-gray-500">31-60 soniya</div>
          </div>
        </div>
      </div>
    </div>
  )
}