"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"

interface VerticalWheelTimePickerProps {
  value: { hours: number; minutes: number }
  onChange: (time: { hours: number; minutes: number }) => void
  onConfirm?: (time: { hours: number; minutes: number }) => void
  theme: string
  className?: string
}

const VerticalWheelTimePicker: React.FC<VerticalWheelTimePickerProps> = ({
  value,
  onChange,
  onConfirm,
  theme,
  className = "",
}) => {
  const [is24Hour, setIs24Hour] = useState(() => {
    try {
      const testDate = new Date()
      const timeString = testDate.toLocaleTimeString()
      return !timeString.toLowerCase().includes("am") && !timeString.toLowerCase().includes("pm")
    } catch {
      return true // Default to 24-hour if detection fails
    }
  })
  const [isAM, setIsAM] = useState(() => {
    if (is24Hour) return true
    return value.hours < 12
  })
  const [isDragging, setIsDragging] = useState<"hours" | "minutes" | null>(null)
  const [startY, setStartY] = useState(0)
  const [startValue, setStartValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState<"hours" | "minutes" | null>(null)
  const [isAMPMAnimating, setIsAMPMAnimating] = useState(false)
  const [touchStartY, setTouchStartY] = useState(0)
  const [touchStartValue, setTouchStartValue] = useState(0)
  const hoursRef = useRef<HTMLDivElement>(null)
  const minutesRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.log("Audio context not supported")
    }
  }, [])

  const playTickSound = useCallback(() => {
    if (!audioContextRef.current) return

    try {
      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)

      oscillator.frequency.setValueAtTime(1200, audioContextRef.current.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContextRef.current.currentTime + 0.05)

      gainNode.gain.setValueAtTime(0.15, audioContextRef.current.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.08)

      oscillator.start(audioContextRef.current.currentTime)
      oscillator.stop(audioContextRef.current.currentTime + 0.08)
    } catch (error) {
      console.log("Could not play tick sound")
    }
  }, [])

  const triggerAnimation = useCallback((type: "hours" | "minutes") => {
    setIsAnimating(type)
    setTimeout(() => setIsAnimating(null), 200)
  }, [])

  const handleWheel = useCallback(
    (e: WheelEvent, type: "hours" | "minutes") => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 1 : -1

      if (type === "hours") {
        const maxHours = is24Hour ? 24 : 12
        let newHours = value.hours + delta

        if (is24Hour) {
          newHours = ((newHours % 24) + 24) % 24
        } else {
          const displayHours = value.hours === 0 ? 12 : value.hours > 12 ? value.hours - 12 : value.hours
          let newDisplayHours = displayHours + delta

          if (newDisplayHours > 12) newDisplayHours = 1
          if (newDisplayHours < 1) newDisplayHours = 12

          if (newDisplayHours === 12) {
            newHours = isAM ? 0 : 12
          } else {
            newHours = isAM ? newDisplayHours : newDisplayHours + 12
          }
        }

        onChange({ ...value, hours: newHours })
      } else {
        let newMinutes = value.minutes + delta
        newMinutes = ((newMinutes % 60) + 60) % 60
        onChange({ ...value, minutes: newMinutes })
      }

      playTickSound()
      triggerAnimation(type)
    },
    [value, onChange, playTickSound, triggerAnimation, is24Hour, isAM],
  )

  const handleNumberClick = useCallback(
    (clickedValue: number, type: "hours" | "minutes") => {
      if (type === "hours") {
        onChange({ ...value, hours: clickedValue })
      } else {
        onChange({ ...value, minutes: clickedValue })
      }
      playTickSound()
      triggerAnimation(type)
    },
    [value, onChange, playTickSound, triggerAnimation],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: "hours" | "minutes") => {
      setIsDragging(type)
      setStartY(e.clientY)
      setStartValue(type === "hours" ? value.hours : value.minutes)
      e.preventDefault()
    },
    [value],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      const deltaY = startY - e.clientY
      const sensitivity = 5
      const delta = Math.floor(deltaY / sensitivity)

      if (isDragging === "hours") {
        const maxHours = is24Hour ? 24 : 12
        let newHours = startValue + delta

        if (is24Hour) {
          newHours = ((newHours % 24) + 24) % 24
        } else {
          const displayHours = startValue === 0 ? 12 : startValue > 12 ? startValue - 12 : startValue
          let newDisplayHours = displayHours + delta

          while (newDisplayHours > 12) newDisplayHours -= 12
          while (newDisplayHours < 1) newDisplayHours += 12

          if (newDisplayHours === 12) {
            newHours = isAM ? 0 : 12
          } else {
            newHours = isAM ? newDisplayHours : newDisplayHours + 12
          }
        }

        if (newHours !== value.hours) {
          onChange({ ...value, hours: newHours })
          playTickSound()
          triggerAnimation("hours")
        }
      } else {
        let newMinutes = startValue + delta
        newMinutes = ((newMinutes % 60) + 60) % 60

        if (newMinutes !== value.minutes) {
          onChange({ ...value, minutes: newMinutes })
          playTickSound()
          triggerAnimation("minutes")
        }
      }
    },
    [isDragging, startY, startValue, value, onChange, playTickSound, triggerAnimation, is24Hour, isAM],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, type: "hours" | "minutes") => {
      const touch = e.touches[0]
      setIsDragging(type)
      setTouchStartY(touch.clientY)
      setTouchStartValue(type === "hours" ? value.hours : value.minutes)
      e.preventDefault()
    },
    [value],
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return
      e.preventDefault()

      const touch = e.touches[0]
      const deltaY = touchStartY - touch.clientY
      const sensitivity = 8
      const delta = Math.floor(deltaY / sensitivity)

      if (isDragging === "hours") {
        const maxHours = is24Hour ? 24 : 12
        let newHours = touchStartValue + delta

        if (is24Hour) {
          newHours = ((newHours % 24) + 24) % 24
        } else {
          const displayHours =
            touchStartValue === 0 ? 12 : touchStartValue > 12 ? touchStartValue - 12 : touchStartValue
          let newDisplayHours = displayHours + delta

          while (newDisplayHours > 12) newDisplayHours -= 12
          while (newDisplayHours < 1) newDisplayHours += 12

          if (newDisplayHours === 12) {
            newHours = isAM ? 0 : 12
          } else {
            newHours = isAM ? newDisplayHours : newDisplayHours + 12
          }
        }

        if (newHours !== value.hours) {
          onChange({ ...value, hours: newHours })
          playTickSound()
          triggerAnimation("hours")
        }
      } else {
        let newMinutes = touchStartValue + delta
        newMinutes = ((newMinutes % 60) + 60) % 60

        if (newMinutes !== value.minutes) {
          onChange({ ...value, minutes: newMinutes })
          playTickSound()
          triggerAnimation("minutes")
        }
      }
    },
    [isDragging, touchStartY, touchStartValue, value, onChange, playTickSound, triggerAnimation, is24Hour, isAM],
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(null)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleTouchEnd)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  useEffect(() => {
    const hoursElement = hoursRef.current

    if (hoursElement) {
      const wheelHandler = (e: WheelEvent) => handleWheel(e, "hours")
      hoursElement.addEventListener("wheel", wheelHandler, { passive: false })
      return () => hoursElement.removeEventListener("wheel", wheelHandler)
    }
  }, [handleWheel])

  useEffect(() => {
    const minutesElement = minutesRef.current

    if (minutesElement) {
      const wheelHandler = (e: WheelEvent) => handleWheel(e, "minutes")
      minutesElement.addEventListener("wheel", wheelHandler, { passive: false })
      return () => minutesElement.removeEventListener("wheel", wheelHandler)
    }
  }, [handleWheel])

  useEffect(() => {
    if (!is24Hour) {
      setIsAM(value.hours < 12)
    }
  }, [value.hours, is24Hour])

  const renderWheel = (type: "hours" | "minutes", currentValue: number, max: number) => {
    const centerIndex = 2
    const visibleItems = 5
    const itemHeight = 48

    const getDisplayValue = (value: number) => {
      if (type === "hours" && !is24Hour) {
        return value === 0 ? 12 : value > 12 ? value - 12 : value
      }
      return value
    }

    const getActualValue = (displayValue: number) => {
      if (type === "hours" && !is24Hour) {
        if (displayValue === 12) {
          return isAM ? 0 : 12
        }
        return isAM ? displayValue : displayValue + 12
      }
      return displayValue
    }

    const displayCurrentValue = type === "hours" && !is24Hour ? getDisplayValue(currentValue) : currentValue
    const transformOffset = 0 // Keep transform at 0 to maintain center position

    return (
      <div
        ref={type === "hours" ? hoursRef : minutesRef}
        className={`relative h-64 w-24 overflow-hidden cursor-grab select-none ${
          isDragging === type ? "cursor-grabbing" : ""
        }`}
        onMouseDown={(e) => handleMouseDown(e, type)}
        onTouchStart={(e) => handleTouchStart(e, type)}
      >
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            transform: `translateY(${transformOffset}px)`,
          }}
        >
          {Array.from({ length: visibleItems }, (_, i) => {
            const offset = i - centerIndex
            let item: number

            if (type === "hours" && !is24Hour) {
              const displayValue = getDisplayValue(currentValue)
              let displayItem = displayValue + offset

              if (displayItem > 12) displayItem = displayItem - 12
              if (displayItem < 1) displayItem = displayItem + 12

              item = getActualValue(displayItem)
            } else {
              item = currentValue + offset
              if (type === "minutes") {
                if (item >= 60) item = item - 60
                if (item < 0) item = item + 60
              } else if (type === "hours" && is24Hour) {
                if (item >= 24) item = item - 24
                if (item < 0) item = item + 24
              }
            }

            const isCenter = offset === 0
            const distance = Math.abs(offset)
            const opacity = isCenter ? 1 : Math.max(0.3, 1 - distance * 0.25)
            const scale = isCenter ? 1.2 : Math.max(0.8, 1 - distance * 0.1)

            const topPosition = (centerIndex + offset) * itemHeight

            return (
              <div
                key={`${item}-${offset}`}
                className={`absolute h-12 w-full flex items-center justify-center text-3xl font-bold transition-all duration-200 cursor-pointer ${
                  isCenter
                    ? `${theme === "dark" ? "text-white" : "text-gray-900"} ${
                        isAnimating === type ? "animate-pulse" : ""
                      }`
                    : theme === "dark"
                      ? "text-gray-500 hover:text-gray-300"
                      : "text-gray-400 hover:text-gray-600"
                }`}
                style={{
                  top: `${topPosition}px`,
                  opacity,
                  transform: `scale(${scale})`,
                  textShadow: isCenter
                    ? isAnimating === type
                      ? theme === "dark"
                        ? "0 0 30px rgba(255, 255, 255, 1), 0 0 60px rgba(59, 130, 246, 0.8), 0 3px 6px rgba(0, 0, 0, 0.5)"
                        : "0 0 25px rgba(37, 99, 235, 1), 0 0 50px rgba(37, 99, 235, 0.6), 0 3px 6px rgba(0, 0, 0, 0.3)"
                      : theme === "dark"
                        ? "0 0 20px rgba(255, 255, 255, 0.9), 0 0 40px rgba(59, 130, 246, 0.6), 0 2px 4px rgba(0, 0, 0, 0.4)"
                        : "0 0 18px rgba(37, 99, 235, 0.8), 0 0 35px rgba(37, 99, 235, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)"
                    : theme === "dark"
                      ? "0 1px 3px rgba(0, 0, 0, 0.6)"
                      : "0 1px 3px rgba(0, 0, 0, 0.2)",
                  backgroundColor: isCenter
                    ? theme === "dark"
                      ? "rgba(59, 130, 246, 0.25)"
                      : "rgba(37, 99, 235, 0.2)"
                    : "transparent",
                  borderRadius: "12px",
                  border: isCenter
                    ? theme === "dark"
                      ? "3px solid rgba(59, 130, 246, 0.7)"
                      : "3px solid rgba(37, 99, 235, 0.6)"
                    : "3px solid transparent",
                  color: isCenter ? (theme === "dark" ? "#ffffff" : "#1f2937") : undefined,
                  fontWeight: isCenter ? "900" : "600",
                }}
                onClick={() => !isCenter && handleNumberClick(item, type)}
              >
                {(type === "hours" && !is24Hour ? getDisplayValue(item) : item).toString().padStart(2, "0")}
              </div>
            )
          })}
        </div>

        <div
          className={`absolute top-1/2 left-0 right-0 h-12 -translate-y-1/2 pointer-events-none transition-all duration-200 ${
            isAnimating === type ? "animate-pulse" : ""
          }`}
          style={{
            background:
              theme === "dark"
                ? isAnimating === type
                  ? "linear-gradient(to right, transparent, rgba(59, 130, 246, 0.4), transparent)"
                  : "linear-gradient(to right, transparent, rgba(59, 130, 246, 0.2), transparent)"
                : isAnimating === type
                  ? "linear-gradient(to right, transparent, rgba(37, 99, 235, 0.3), transparent)"
                  : "linear-gradient(to right, transparent, rgba(37, 99, 235, 0.15), transparent)",
            borderTop: `5px solid ${theme === "dark" ? "#3b82f6" : "#2563eb"}`,
            borderBottom: `5px solid ${theme === "dark" ? "#3b82f6" : "#2563eb"}`,
            boxShadow:
              isAnimating === type
                ? theme === "dark"
                  ? "0 0 30px rgba(59, 130, 246, 0.8)"
                  : "0 0 25px rgba(37, 99, 235, 0.7)"
                : theme === "dark"
                  ? "0 0 20px rgba(59, 130, 246, 0.6)"
                  : "0 0 15px rgba(37, 99, 235, 0.5)",
          }}
        />
      </div>
    )
  }

  const handleAMPMChange = useCallback(
    (newIsAM: boolean) => {
      if (newIsAM === isAM) return // No change needed

      setIsAMPMAnimating(true)
      setTimeout(() => setIsAMPMAnimating(false), 300)

      setIsAM(newIsAM)
      let newHours = value.hours

      if (newIsAM) {
        // Switching to AM
        if (value.hours >= 12) {
          newHours = value.hours === 12 ? 0 : value.hours - 12
        }
      } else {
        // Switching to PM
        if (value.hours < 12) {
          newHours = value.hours === 0 ? 12 : value.hours + 12
        }
      }

      onChange({ ...value, hours: newHours })
      playTickSound()
      triggerAnimation("hours")
    },
    [value, onChange, playTickSound, isAM, triggerAnimation],
  )

  const getFormattedTime = () => {
    if (is24Hour) {
      return `${value.hours.toString().padStart(2, "0")}:${value.minutes.toString().padStart(2, "0")}`
    } else {
      const displayHours = value.hours === 0 ? 12 : value.hours > 12 ? value.hours - 12 : value.hours
      const ampm = value.hours < 12 ? "AM" : "PM"
      return `${displayHours.toString().padStart(2, "0")}:${value.minutes.toString().padStart(2, "0")} ${ampm}`
    }
  }

  return (
    <div className={`flex flex-col items-center space-y-6 ${className}`}>
      <div className="text-center">
        <div className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
          Tanlangan vaqt
        </div>
        <div
          className={`text-3xl font-bold px-6 py-3 rounded-lg transition-all duration-300 ${
            theme === "dark"
              ? "bg-gray-800 text-blue-400 border border-gray-700"
              : "bg-gray-100 text-blue-600 border border-gray-300"
          } ${isAMPMAnimating ? "animate-pulse scale-105" : ""}`}
          style={{
            textShadow: theme === "dark" ? "0 0 10px rgba(59, 130, 246, 0.5)" : "0 0 8px rgba(37, 99, 235, 0.4)",
          }}
        >
          {getFormattedTime()}
        </div>
      </div>

      <div className="flex items-center justify-center space-x-6">
        <div className="text-center">
          <div className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
            Soat
            <button
              onClick={() => setIs24Hour(!is24Hour)}
              className={`ml-2 px-2 py-1 text-xs rounded transition-colors ${
                theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              {is24Hour ? "24h" : "12h"}
            </button>
          </div>
          {renderWheel("hours", value.hours, is24Hour ? 24 : 12)}
        </div>

        <div
          className={`text-4xl font-bold transition-all duration-200 ${
            theme === "dark" ? "text-blue-400" : "text-blue-600"
          } ${isAMPMAnimating ? "animate-pulse" : ""}`}
          style={{
            textShadow: theme === "dark" ? "0 0 10px rgba(59, 130, 246, 0.5)" : "0 0 8px rgba(37, 99, 235, 0.4)",
          }}
        >
          :
        </div>

        <div className="text-center">
          <div className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
            Daqiqa
          </div>
          {renderWheel("minutes", value.minutes, 60)}
        </div>

        {!is24Hour && (
          <div className="text-center">
            <div className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              &nbsp;
            </div>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => handleAMPMChange(true)}
                className={`px-4 py-3 rounded-xl text-base font-bold transition-all duration-300 transform hover:scale-105 ${
                  isAM
                    ? theme === "dark"
                      ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg shadow-orange-500/30"
                      : "bg-gradient-to-r from-orange-400 to-yellow-400 text-white shadow-lg shadow-orange-400/30"
                    : theme === "dark"
                      ? "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-300"
                      : "bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-600"
                } ${isAMPMAnimating && isAM ? "animate-bounce" : ""}`}
                style={{
                  textShadow: isAM ? "0 0 10px rgba(255, 255, 255, 0.5)" : "none",
                  boxShadow: isAM
                    ? theme === "dark"
                      ? "0 0 20px rgba(251, 146, 60, 0.4), 0 4px 15px rgba(0, 0, 0, 0.3)"
                      : "0 0 15px rgba(251, 146, 60, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)"
                    : "none",
                }}
              >
                🌅 AM
              </button>
              <button
                onClick={() => handleAMPMChange(false)}
                className={`px-4 py-3 rounded-xl text-base font-bold transition-all duration-300 transform hover:scale-105 ${
                  !isAM
                    ? theme === "dark"
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/30"
                      : "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30"
                    : theme === "dark"
                      ? "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-300"
                      : "bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-600"
                } ${isAMPMAnimating && !isAM ? "animate-bounce" : ""}`}
                style={{
                  textShadow: !isAM ? "0 0 10px rgba(255, 255, 255, 0.5)" : "none",
                  boxShadow: !isAM
                    ? theme === "dark"
                      ? "0 0 20px rgba(147, 51, 234, 0.4), 0 4px 15px rgba(0, 0, 0, 0.3)"
                      : "0 0 15px rgba(147, 51, 234, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)"
                    : "none",
                }}
              >
                🌙 PM
              </button>
            </div>
          </div>
        )}
      </div>

      {onConfirm && (
        <button
          onClick={() => onConfirm(value)}
          className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 ${
            theme === "dark"
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
              : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl"
          }`}
        >
          Tanlash
        </button>
      )}
    </div>
  )
}

export default VerticalWheelTimePicker
