"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { cn } from "../lib/utils"

interface CircularTimePickerProps {
  value: { hours: number; minutes: number }
  onChange: (time: { hours: number; minutes: number }) => void
  theme: string
  className?: string
}

const CircularTimePicker: React.FC<CircularTimePickerProps> = ({ value, onChange, theme, className }) => {
  const [isDragging, setIsDragging] = useState<"hours" | "minutes" | null>(null)
  const hoursRef = useRef<HTMLDivElement>(null)
  const minutesRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Create tick sound effect
  useEffect(() => {
    audioRef.current = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYE",
    )
  }, [])

  const playTickSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.volume = 0.1
      audioRef.current.play().catch(() => {}) // Ignore errors if audio can't play
    }
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent, type: "hours" | "minutes") => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -1 : 1

      if (type === "hours") {
        const newHours = Math.max(0, Math.min(23, value.hours + delta))
        if (newHours !== value.hours) {
          onChange({ ...value, hours: newHours })
          playTickSound()
        }
      } else {
        const newMinutes = Math.max(0, Math.min(59, value.minutes + delta))
        if (newMinutes !== value.minutes) {
          onChange({ ...value, minutes: newMinutes })
          playTickSound()
        }
      }
    },
    [value, onChange, playTickSound],
  )

  const handleMouseDown = useCallback((e: React.MouseEvent, type: "hours" | "minutes") => {
    e.preventDefault()
    setIsDragging(type)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      const rect =
        isDragging === "hours" ? hoursRef.current?.getBoundingClientRect() : minutesRef.current?.getBoundingClientRect()

      if (!rect) return

      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
      const normalizedAngle = (angle + Math.PI * 2.5) % (Math.PI * 2)

      if (isDragging === "hours") {
        const newHours = Math.round((normalizedAngle / (Math.PI * 2)) * 24) % 24
        if (newHours !== value.hours) {
          onChange({ ...value, hours: newHours })
          playTickSound()
        }
      } else {
        const newMinutes = Math.round((normalizedAngle / (Math.PI * 2)) * 60) % 60
        if (newMinutes !== value.minutes) {
          onChange({ ...value, minutes: newMinutes })
          playTickSound()
        }
      }
    },
    [isDragging, value, onChange, playTickSound],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const renderTimeWheel = (type: "hours" | "minutes", currentValue: number, maxValue: number) => {
    const numbers = Array.from({ length: maxValue }, (_, i) => i)
    const radius = 80
    const centerIndex = currentValue

    return (
      <div
        ref={type === "hours" ? hoursRef : minutesRef}
        className={cn(
          "relative w-40 h-40 rounded-full flex items-center justify-center cursor-pointer select-none",
          theme === "dark" ? "bg-gray-800/50" : "bg-white/50",
          "backdrop-blur-sm border-2",
          theme === "dark" ? "border-gray-600" : "border-gray-300",
        )}
        onWheel={(e) => handleWheel(e, type)}
        onMouseDown={(e) => handleMouseDown(e, type)}
      >
        {/* Center display */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center z-10",
            "text-4xl font-bold",
            theme === "dark" ? "text-white" : "text-gray-900",
          )}
        >
          {String(currentValue).padStart(2, "0")}
        </div>

        {/* Number wheel */}
        {numbers.map((num) => {
          const angle = (num / maxValue) * 2 * Math.PI - Math.PI / 2
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          const distance = Math.abs(num - centerIndex)
          const normalizedDistance = Math.min(distance, maxValue - distance) / (maxValue / 2)
          const opacity = Math.max(0.1, 1 - normalizedDistance * 0.8)
          const scale = Math.max(0.6, 1 - normalizedDistance * 0.4)

          return (
            <div
              key={num}
              className={cn(
                "absolute text-2xl font-semibold transition-all duration-200",
                theme === "dark" ? "text-gray-300" : "text-gray-600",
              )}
              style={{
                transform: `translate(${x}px, ${y}px) scale(${scale})`,
                opacity,
                left: "50%",
                top: "50%",
                marginLeft: "-12px",
                marginTop: "-12px",
              }}
            >
              {String(num).padStart(2, "0")}
            </div>
          )
        })}

        {/* Selection indicator */}
        <div
          className={cn(
            "absolute w-2 h-2 rounded-full",
            "bg-blue-500 shadow-lg",
            "top-4 left-1/2 transform -translate-x-1/2",
          )}
        />
      </div>
    )
  }

  return (
    <div className={cn("flex items-center justify-center space-x-8 p-8", className)}>
      <div className="text-center">
        <div className={cn("text-sm font-medium mb-2", theme === "dark" ? "text-gray-300" : "text-gray-600")}>Soat</div>
        {renderTimeWheel("hours", value.hours, 24)}
      </div>

      <div className={cn("text-6xl font-bold", theme === "dark" ? "text-gray-400" : "text-gray-500")}>:</div>

      <div className="text-center">
        <div className={cn("text-sm font-medium mb-2", theme === "dark" ? "text-gray-300" : "text-gray-600")}>
          Daqiqa
        </div>
        {renderTimeWheel("minutes", value.minutes, 60)}
      </div>
    </div>
  )
}

export default CircularTimePicker
