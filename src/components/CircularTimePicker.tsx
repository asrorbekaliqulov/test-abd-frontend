"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"

interface CircularTimePickerProps {
  value: { hours: number; minutes: number }
  onChange: (time: { hours: number; minutes: number }) => void
  theme: string
  className?: string
}

const CircularTimePicker: React.FC<CircularTimePickerProps> = ({ value, onChange, theme, className = "" }) => {
  const [isDragging, setIsDragging] = useState<"hours" | "minutes" | null>(null)
  const hoursRef = useRef<HTMLDivElement>(null)
  const minutesRef = useRef<HTMLDivElement>(null)

  const playTickSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      // Fallback for browsers that don't support Web Audio API
      console.log("tick")
    }
  }, [])

  const handleWheel = useCallback(
    (e: WheelEvent, type: "hours" | "minutes") => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 1 : -1

      if (type === "hours") {
        const newHours = (value.hours + delta + 24) % 24
        onChange({ ...value, hours: newHours })
      } else {
        const newMinutes = (value.minutes + delta + 60) % 60
        onChange({ ...value, minutes: newMinutes })
      }

      playTickSound()
    },
    [value, onChange, playTickSound],
  )

  useEffect(() => {
    const hoursElement = hoursRef.current
    const minutesElement = minutesRef.current

    if (hoursElement) {
      const hoursWheelHandler = (e: WheelEvent) => handleWheel(e, "hours")
      hoursElement.addEventListener("wheel", hoursWheelHandler, { passive: false })
      return () => hoursElement.removeEventListener("wheel", hoursWheelHandler)
    }
  }, [handleWheel])

  useEffect(() => {
    const minutesElement = minutesRef.current
    if (minutesElement) {
      const minutesWheelHandler = (e: WheelEvent) => handleWheel(e, "minutes")
      minutesElement.addEventListener("wheel", minutesWheelHandler, { passive: false })
      return () => minutesElement.removeEventListener("wheel", minutesWheelHandler)
    }
  }, [handleWheel])

  const generateCircularNumbers = (max: number, current: number, type: "hours" | "minutes") => {
    const numbers = []
    const radius = 80
    const centerX = 120
    const centerY = 120

    for (let i = 0; i < max; i++) {
      const angle = ((i * 360) / max - 90) * (Math.PI / 180)
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)

      const isCurrent = i === current
      const isAdjacent =
        Math.abs(i - current) <= 1 || (current === 0 && i === max - 1) || (current === max - 1 && i === 0)

      numbers.push(
        <div
          key={i}
          className={`absolute text-center transition-all duration-300 cursor-pointer select-none ${
            isCurrent
              ? `text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} scale-125`
              : isAdjacent
                ? `text-lg ${theme === "dark" ? "text-gray-300" : "text-gray-600"} scale-110`
                : `text-sm ${theme === "dark" ? "text-gray-500" : "text-gray-400"} scale-90`
          }`}
          style={{
            left: x - 12,
            top: y - 12,
            width: 24,
            height: 24,
            lineHeight: "24px",
          }}
          onClick={() => {
            if (type === "hours") {
              onChange({ ...value, hours: i })
            } else {
              onChange({ ...value, minutes: i })
            }
            playTickSound()
          }}
        >
          {String(i).padStart(2, "0")}
        </div>,
      )
    }
    return numbers
  }

  return (
    <div className={`flex gap-8 items-center justify-center ${className}`}>
      {/* Hours Picker */}
      <div className="flex flex-col items-center gap-4">
        <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Soat</h3>
        <div
          ref={hoursRef}
          className={`relative w-60 h-60 rounded-full border-2 ${
            theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"
          } cursor-pointer transition-all duration-300 hover:scale-105`}
        >
          {generateCircularNumbers(24, value.hours, "hours")}

          {/* Center dot */}
          <div
            className={`absolute w-3 h-3 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
              theme === "dark" ? "bg-blue-400" : "bg-blue-600"
            }`}
          />

          {/* Hour hand */}
          <div
            className={`absolute w-0.5 origin-bottom ${
              theme === "dark" ? "bg-blue-400" : "bg-blue-600"
            } transition-transform duration-300`}
            style={{
              height: "60px",
              left: "50%",
              top: "50%",
              transform: `translateX(-50%) translateY(-100%) rotate(${value.hours * 15 - 90}deg)`,
              transformOrigin: "bottom center",
            }}
          />
        </div>
        <div className={`text-2xl font-mono ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
          {String(value.hours).padStart(2, "0")}
        </div>
      </div>

      {/* Separator */}
      <div className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>:</div>

      {/* Minutes Picker */}
      <div className="flex flex-col items-center gap-4">
        <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Daqiqa</h3>
        <div
          ref={minutesRef}
          className={`relative w-60 h-60 rounded-full border-2 ${
            theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"
          } cursor-pointer transition-all duration-300 hover:scale-105`}
        >
          {generateCircularNumbers(60, value.minutes, "minutes")}

          {/* Center dot */}
          <div
            className={`absolute w-3 h-3 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
              theme === "dark" ? "bg-green-400" : "bg-green-600"
            }`}
          />

          {/* Minute hand */}
          <div
            className={`absolute w-0.5 origin-bottom ${
              theme === "dark" ? "bg-green-400" : "bg-green-600"
            } transition-transform duration-300`}
            style={{
              height: "70px",
              left: "50%",
              top: "50%",
              transform: `translateX(-50%) translateY(-100%) rotate(${value.minutes * 6 - 90}deg)`,
              transformOrigin: "bottom center",
            }}
          />
        </div>
        <div className={`text-2xl font-mono ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
          {String(value.minutes).padStart(2, "0")}
        </div>
      </div>
    </div>
  )
}

export default CircularTimePicker
